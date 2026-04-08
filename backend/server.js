const express = require('express');
const path = require('path');
const { Pool } = require('pg');
const productModulesRouter = require('./routes/product-modules');

const app = express();
const PORT = process.env.PORT || 3000;

const frontendDir = path.join(__dirname, '..', 'frontend');

// ─── Middleware ───────────────────────────────────────────────
app.use(express.json());
app.use(express.static(frontendDir));

// Your HTML is loading files from js/modules/..., while your actual
// files are inside frontend/modules/. This alias makes both work.
app.use('/js/modules', express.static(path.join(frontendDir, 'modules')));
app.use('/modules', express.static(path.join(frontendDir, 'modules')));

// ─── PostgreSQL Pool ──────────────────────────────────────────
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'janbros_db',
  password: 'neha*123',
  port: 5432,
});

// Make pool available to the product modules router
app.use((req, _res, next) => {
  req.pool = pool;
  next();
});

// ─── HEALTH ───────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'janbros-portal', version: '3.0.0' });
});

// ─── Helpers ──────────────────────────────────────────────────
function toInt(value) {
  const n = parseInt(value, 10);
  return Number.isNaN(n) ? null : n;
}

function normalizeMarkets(markets) {
  if (Array.isArray(markets)) return markets;
  if (typeof markets === 'string') {
    return markets
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);
  }
  return [];
}

async function resolveBrandId(brand_id, brandName) {
  const parsedId = toInt(brand_id);
  if (parsedId !== null) return parsedId;

  if (brandName && typeof brandName === 'string') {
    const brandRes = await pool.query(
      'SELECT id FROM brands WHERE LOWER(name) = LOWER($1) LIMIT 1',
      [brandName.trim()]
    );
    if (brandRes.rows.length) return brandRes.rows[0].id;
  }

  return null;
}

function buildBrandResponse(brand, products) {
  const total_stock = products.reduce((sum, p) => sum + Number(p.stock || 0), 0);
  const categories = [...new Set(products.map(p => p.cat).filter(Boolean))];

  return {
    ...brand,
    product_count: products.length,
    total_stock,
    categories,
    products,
  };
}

// ═══════════════════════════════════════════════════════════════
//  BRANDS API
// ═══════════════════════════════════════════════════════════════

// GET /api/brands
app.get('/api/brands', async (_req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        b.*,
        COUNT(p.id)::int               AS product_count,
        COALESCE(SUM(p.stock), 0)::int AS total_stock
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

// GET /api/brands/name/:name
app.get('/api/brands/name/:name', async (req, res) => {
  try {
    const name = decodeURIComponent(req.params.name || '').trim();
    if (!name) return res.status(400).json({ error: 'Brand name is required' });

    const brandRes = await pool.query(
      'SELECT * FROM brands WHERE LOWER(name) = LOWER($1) LIMIT 1',
      [name]
    );

    if (!brandRes.rows.length) {
      return res.status(404).json({ error: 'Brand not found' });
    }

    const brand = brandRes.rows[0];

    const prodRes = await pool.query(
      'SELECT * FROM products WHERE brand_id = $1 ORDER BY id',
      [brand.id]
    );

    res.json(buildBrandResponse(brand, prodRes.rows));
  } catch (err) {
    console.error('GET /api/brands/name/:name:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/brands/:id
app.get('/api/brands/:id', async (req, res) => {
  try {
    const id = toInt(req.params.id);
    if (id === null) return res.status(400).json({ error: 'Invalid id' });

    const brandRes = await pool.query('SELECT * FROM brands WHERE id=$1', [id]);
    if (!brandRes.rows.length) {
      return res.status(404).json({ error: 'Brand not found' });
    }

    const prodRes = await pool.query(
      'SELECT * FROM products WHERE brand_id = $1 ORDER BY id',
      [id]
    );

    res.json(buildBrandResponse(brandRes.rows[0], prodRes.rows));
  } catch (err) {
    console.error('GET /api/brands/:id:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// Optional: brand analytics endpoint
app.get('/api/brands/name/:name/analytics', async (req, res) => {
  try {
    const name = decodeURIComponent(req.params.name || '').trim();
    if (!name) return res.status(400).json({ error: 'Brand name is required' });

    const brandRes = await pool.query(
      'SELECT * FROM brands WHERE LOWER(name) = LOWER($1) LIMIT 1',
      [name]
    );

    if (!brandRes.rows.length) {
      return res.status(404).json({ error: 'Brand not found' });
    }

    const brand = brandRes.rows[0];
    const prodRes = await pool.query(
      'SELECT * FROM products WHERE brand_id = $1 ORDER BY id',
      [brand.id]
    );

    const products = prodRes.rows;

    const totalProducts = products.length;
    const totalStock = products.reduce((sum, p) => sum + Number(p.stock || 0), 0);
    const totalRevenue = products.reduce(
      (sum, p) => sum + Number(p.stock || 0) * Number(p.price || 0),
      0
    );
    const totalCost = products.reduce(
      (sum, p) => sum + Number(p.stock || 0) * Number(p.cost_price || p.price * 0.66 || 0),
      0
    );
    const grossProfit = totalRevenue - totalCost;
    const margin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;

    const categories = {};
    for (const p of products) {
      const key = p.cat || 'Other';
      categories[key] = (categories[key] || 0) + 1;
    }

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    const salesTrend = months.map((_, i) =>
      Math.max(20, Math.round((totalStock / 6) * (0.8 + i * 0.08)))
    );

    res.json({
      brand,
      metrics: {
        totalProducts,
        totalStock,
        totalRevenue,
        totalCost,
        grossProfit,
        margin: Number(margin.toFixed(1)),
      },
      charts: {
        months,
        salesTrend,
        categoryNames: Object.keys(categories),
        categoryValues: Object.values(categories),
      },
      products,
    });
  } catch (err) {
    console.error('GET /api/brands/name/:name/analytics:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/brands
app.post('/api/brands', async (req, res) => {
  try {
    const {
      name,
      initials,
      gradient,
      category,
      status,
      markets,
      revenue,
      growth,
      link,
    } = req.body;

    if (!name || !initials || !category) {
      return res.status(400).json({ error: 'name, initials, category required' });
    }

    const result = await pool.query(
      `INSERT INTO brands
        (name, initials, gradient, category, status, markets, revenue, growth, link)
       VALUES
        ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       RETURNING *`,
      [
        name.trim(),
        initials.trim(),
        gradient || '',
        category.trim(),
        status || 'Active',
        normalizeMarkets(markets),
        revenue || null,
        growth || null,
        link || null,
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Brand name already exists' });
    }
    console.error('POST /api/brands:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/brands/:id
app.put('/api/brands/:id', async (req, res) => {
  try {
    const id = toInt(req.params.id);
    if (id === null) return res.status(400).json({ error: 'Invalid id' });

    const {
      name,
      initials,
      gradient,
      category,
      status,
      markets,
      revenue,
      growth,
      link,
    } = req.body;

    if (!name || !initials || !category) {
      return res.status(400).json({ error: 'name, initials, category required' });
    }

    const result = await pool.query(
      `UPDATE brands SET
        name=$1,
        initials=$2,
        gradient=$3,
        category=$4,
        status=$5,
        markets=$6,
        revenue=$7,
        growth=$8,
        link=$9
       WHERE id=$10
       RETURNING *`,
      [
        name.trim(),
        initials.trim(),
        gradient || '',
        category.trim(),
        status || 'Active',
        normalizeMarkets(markets),
        revenue || null,
        growth || null,
        link || null,
        id,
      ]
    );

    if (!result.rows.length) {
      return res.status(404).json({ error: 'Brand not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Brand name already exists' });
    }
    console.error('PUT /api/brands/:id:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/brands/:id
app.delete('/api/brands/:id', async (req, res) => {
  try {
    const id = toInt(req.params.id);
    if (id === null) return res.status(400).json({ error: 'Invalid id' });

    const result = await pool.query('DELETE FROM brands WHERE id=$1 RETURNING id', [id]);
    if (!result.rows.length) {
      return res.status(404).json({ error: 'Brand not found' });
    }

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
      SELECT
        p.id,
        p.brand_id,
        p.name,
        p.sku,
        p.cat,
        p.icon,
        p.description,
        p.stock,
        p.stock_pct,
        p.price,
        b.name AS brand,
        b.name AS brand_name
      FROM products p
      LEFT JOIN brands b ON p.brand_id = b.id
      ORDER BY p.id DESC
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
    const id = toInt(req.params.id);
    if (id === null) return res.status(400).json({ error: 'Invalid id' });

    const result = await pool.query(
      `SELECT
        p.id,
        p.brand_id,
        p.name,
        p.sku,
        p.cat,
        p.icon,
        p.description,
        p.stock,
        p.stock_pct,
        p.price,
        b.name AS brand,
        b.name AS brand_name
       FROM products p
       LEFT JOIN brands b ON p.brand_id = b.id
       WHERE p.id=$1`,
      [id]
    );

    if (!result.rows.length) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('GET /api/products/:id:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/products
app.post('/api/products', async (req, res) => {
  try {
    const {
      brand_id,
      brand,
      name,
      sku,
      cat,
      icon,
      desc,
      description,
      stock,
      stock_pct,
      price,
    } = req.body;

    if (!name || !sku || !cat) {
      return res.status(400).json({ error: 'name, sku, cat required' });
    }

    const finalDescription = description !== undefined ? description : (desc || '');
    const finalBrandId = await resolveBrandId(brand_id, brand);

    const result = await pool.query(
      `INSERT INTO products
        (brand_id, name, sku, cat, icon, description, stock, stock_pct, price)
       VALUES
        ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       RETURNING *`,
      [
        finalBrandId,
        name.trim(),
        sku.trim(),
        cat.trim(),
        icon || '📦',
        finalDescription,
        Number(stock || 0),
        Number(stock_pct || 0),
        price || null,
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'SKU already exists' });
    }
    console.error('POST /api/products:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/products/:id
app.put('/api/products/:id', async (req, res) => {
  try {
    const id = toInt(req.params.id);
    if (id === null) return res.status(400).json({ error: 'Invalid id' });

    const {
      brand_id,
      brand,
      name,
      sku,
      cat,
      icon,
      desc,
      description,
      stock,
      stock_pct,
      price,
    } = req.body;

    const finalDescription = description !== undefined ? description : (desc || '');
    const finalBrandId = await resolveBrandId(brand_id, brand);

    const result = await pool.query(
      `UPDATE products SET
        brand_id=$1,
        name=$2,
        sku=$3,
        cat=$4,
        icon=$5,
        description=$6,
        stock=$7,
        stock_pct=$8,
        price=$9
       WHERE id=$10
       RETURNING *`,
      [
        finalBrandId,
        name?.trim(),
        sku?.trim(),
        cat?.trim(),
        icon || '📦',
        finalDescription,
        Number(stock || 0),
        Number(stock_pct || 0),
        price || null,
        id,
      ]
    );

    if (!result.rows.length) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'SKU already exists' });
    }
    console.error('PUT /api/products/:id:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/products/:id
app.delete('/api/products/:id', async (req, res) => {
  try {
    const id = toInt(req.params.id);
    if (id === null) return res.status(400).json({ error: 'Invalid id' });

    const result = await pool.query('DELETE FROM products WHERE id=$1 RETURNING id', [id]);
    if (!result.rows.length) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json({ ok: true });
  } catch (err) {
    console.error('DELETE /api/products/:id:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// Reusable product module routes
app.use('/api/products', productModulesRouter);

// ═══════════════════════════════════════════════════════════════
//  ANALYTICS API
// ═══════════════════════════════════════════════════════════════
app.get('/api/analytics/summary', async (_req, res) => {
  try {
    const products = await pool.query('SELECT * FROM products');
    const brands = await pool.query('SELECT * FROM brands');

    res.json({
      total_products: products.rows.length,
      total_stock: products.rows.reduce((s, p) => s + Number(p.stock || 0), 0),
      active_brands: brands.rows.filter(b => b.status === 'Active').length,
      low_stock_count: products.rows.filter(p => Number(p.stock_pct || 0) < 50).length,
    });
  } catch (err) {
    console.error('GET /api/analytics/summary:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── Fallback ──────────────────────────────────────────────────
// Keep SPA routing for page URLs, but do NOT send index.html for
// missing JS/CSS/API assets, otherwise the browser gets HTML in place
// of JavaScript and throws "Unexpected token '<'".
app.get('*', (req, res) => {
  const p = req.path || '';

  if (p.startsWith('/api/')) {
    return res.status(404).json({ error: 'Not found' });
  }

  if (
    p.startsWith('/assets/') ||
    p.startsWith('/js/') ||
    p.startsWith('/modules/')
  ) {
    return res.status(404).send('Not found');
  }

  res.sendFile(path.join(frontendDir, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`✅ Server running → http://localhost:${PORT}`);
});