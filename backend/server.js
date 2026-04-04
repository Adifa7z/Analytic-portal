const express = require('express');
const path    = require('path');
const { Pool } = require('pg');

const app  = express();
const PORT = process.env.PORT || 3000;

const frontendDir = path.join(__dirname, '..', 'frontend');

app.use(express.static(frontendDir));
app.use(express.json());

// ─── PostgreSQL Pool ─────────────────────────────────────────
const pool = new Pool({
  user:     'postgres',
  host:     'localhost',
  database: 'janbros_db',
  password: 'neha*123',
  port:     5432,
});

// ─── HEALTH ──────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'janbros-portal', version: '3.0.0' });
});

// ═══════════════════════════════════════════════════════════════
//  BRANDS API
// ═══════════════════════════════════════════════════════════════

// GET /api/brands  — all brands with product count + total stock
app.get('/api/brands', async (_req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        b.*,
        COUNT(p.id)::int                AS product_count,
        COALESCE(SUM(p.stock), 0)::int  AS total_stock
      FROM brands b
      LEFT JOIN products p ON b.id = p.brand_id
      GROUP BY b.id
      ORDER BY b.id
    `);
    res.json({ data: result.rows });
  } catch (err) {
    console.error('GET /api/brands:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/brands/name/:name  — lookup brand by name
// ⚠️ MUST be defined BEFORE /api/brands/:id
app.get('/api/brands/name/:name', async (req, res) => {
  try {
    const name     = decodeURIComponent(req.params.name);
    const brandRes = await pool.query('SELECT * FROM brands WHERE name=$1', [name]);
    if (!brandRes.rows.length) return res.status(404).json({ error: 'Brand not found' });

    const brand   = brandRes.rows[0];
    const prodRes = await pool.query(
      'SELECT * FROM products WHERE brand_id=$1 ORDER BY id', [brand.id]
    );
    const products = prodRes.rows;

    res.json({
      ...brand,
      product_count: products.length,
      total_stock:   products.reduce((s, p) => s + p.stock, 0),
      categories:    [...new Set(products.map(p => p.cat))],
      products,
    });
  } catch (err) {
    console.error('GET /api/brands/name/:name:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/brands/:id  — single brand + its products
app.get('/api/brands/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: 'Invalid id' });

    const brandRes = await pool.query('SELECT * FROM brands WHERE id=$1', [id]);
    if (!brandRes.rows.length) return res.status(404).json({ error: 'Brand not found' });

    const prodRes = await pool.query(
      'SELECT * FROM products WHERE brand_id=$1 ORDER BY id', [id]
    );
    const products = prodRes.rows;
    const brand    = brandRes.rows[0];

    res.json({
      ...brand,
      product_count: products.length,
      total_stock:   products.reduce((s, p) => s + p.stock, 0),
      categories:    [...new Set(products.map(p => p.cat))],
      products,
    });
  } catch (err) {
    console.error('GET /api/brands/:id:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/brands  — add new brand
app.post('/api/brands', async (req, res) => {
  try {
    const { name, initials, gradient, category, status, markets, revenue, growth, link } = req.body;
    if (!name || !initials || !category) return res.status(400).json({ error: 'name, initials, category required' });

    const result = await pool.query(
      `INSERT INTO brands (name, initials, gradient, category, status, markets, revenue, growth, link)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [name, initials, gradient || '', category, status || 'Active',
       markets || [], revenue || null, growth || null, link || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'Brand name already exists' });
    console.error('POST /api/brands:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/brands/:id  — update brand
app.put('/api/brands/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { name, initials, gradient, category, status, markets, revenue, growth, link } = req.body;

    const result = await pool.query(
      `UPDATE brands SET
        name=$1, initials=$2, gradient=$3, category=$4,
        status=$5, markets=$6, revenue=$7, growth=$8, link=$9
       WHERE id=$10 RETURNING *`,
      [name, initials, gradient, category, status, markets, revenue, growth, link, id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Brand not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('PUT /api/brands/:id:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/brands/:id  — delete brand (cascades to products)
app.delete('/api/brands/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await pool.query('DELETE FROM brands WHERE id=$1', [id]);
    res.json({ ok: true });
  } catch (err) {
    console.error('DELETE /api/brands/:id:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ═══════════════════════════════════════════════════════════════
//  PRODUCTS API
// ═══════════════════════════════════════════════════════════════

// GET /api/products
app.get('/api/products', async (_req, res) => {
  try {
    const result = await pool.query(`
      SELECT p.*, b.name AS brand_name
      FROM products p
      LEFT JOIN brands b ON p.brand_id = b.id
      ORDER BY p.id
    `);
    res.json({ data: result.rows, total: result.rows.length });
  } catch (err) {
    console.error('GET /api/products:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/products/:id
app.get('/api/products/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const result = await pool.query(
      `SELECT p.*, b.name AS brand_name FROM products p
       LEFT JOIN brands b ON p.brand_id = b.id WHERE p.id=$1`, [id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Product not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('GET /api/products/:id:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/products
app.post('/api/products', async (req, res) => {
  try {
    const { brand_id, name, sku, cat, icon, desc, stock, stock_pct, price } = req.body;
    if (!name || !sku || !cat) return res.status(400).json({ error: 'name, sku, cat required' });

    const result = await pool.query(
      `INSERT INTO products (brand_id, name, sku, cat, icon, description, stock, stock_pct, price)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [brand_id || null, name, sku, cat, icon || '📦', desc || '', stock || 0, stock_pct || 0, price || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'SKU already exists' });
    console.error('POST /api/products:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/products/:id
app.put('/api/products/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { brand_id, name, sku, cat, icon, desc, stock, stock_pct, price } = req.body;

    const result = await pool.query(
      `UPDATE products SET
        brand_id=$1, name=$2, sku=$3, cat=$4, icon=$5,
        description=$6, stock=$7, stock_pct=$8, price=$9
       WHERE id=$10 RETURNING *`,
      [brand_id, name, sku, cat, icon, desc, stock, stock_pct, price, id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Product not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('PUT /api/products/:id:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/products/:id
app.delete('/api/products/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await pool.query('DELETE FROM products WHERE id=$1', [id]);
    res.json({ ok: true });
  } catch (err) {
    console.error('DELETE /api/products/:id:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ═══════════════════════════════════════════════════════════════
//  ANALYTICS API
// ═══════════════════════════════════════════════════════════════

app.get('/api/analytics/summary', async (_req, res) => {
  try {
    const products = await pool.query('SELECT * FROM products');
    const brands   = await pool.query('SELECT * FROM brands');
    res.json({
      total_products:   products.rows.length,
      total_stock:      products.rows.reduce((s, p) => s + p.stock, 0),
      active_brands:    brands.rows.filter(b => b.status === 'Active').length,
      low_stock_count:  products.rows.filter(p => p.stock_pct < 50).length,
    });
  } catch (err) {
    console.error('GET /api/analytics/summary:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── Fallback ─────────────────────────────────────────────────
app.get('*', (_req, res) => {
  res.sendFile(path.join(frontendDir, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`✅  Server running → http://localhost:${PORT}`);
});