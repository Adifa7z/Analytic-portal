const express = require('express');
const { requireAuth, requireAdmin } = require('./auth');

const router = express.Router();

// ═══════════════════════════════════════════════════════════════
//  PURCHASE ORDERS
// ═══════════════════════════════════════════════════════════════

// POST /api/data-entry/purchase  [admin only]
router.post('/purchase', requireAuth, requireAdmin, async (req, res) => {
  const {
    product_id, supplier_name, qty_ordered, cost_price, po_date,
    lead_time_days, delivery_date, notes,
  } = req.body;

  if (!product_id || !supplier_name || !qty_ordered || !cost_price || !po_date) {
    return res.status(400).json({
      error: 'product_id, supplier_name, qty_ordered, cost_price and po_date are required',
    });
  }

  try {
    const result = await req.pool.query(
      `INSERT INTO purchase_orders
         (product_id, supplier_name, qty_ordered, cost_price, po_date,
          lead_time_days, delivery_date, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
       RETURNING *`,
      [
        product_id,
        supplier_name.trim(),
        qty_ordered,
        cost_price,
        po_date,
        lead_time_days ?? 7,
        delivery_date  || null,
        notes          || null,
      ]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('POST /api/data-entry/purchase:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/data-entry/purchases  [any authenticated user]
router.get('/purchases', requireAuth, async (req, res) => {
  try {
    const result = await req.pool.query(`
      SELECT
        po.*,
        p.name AS product_name,
        p.sku  AS product_sku,
        b.name AS brand_name
      FROM purchase_orders po
      JOIN products p ON po.product_id = p.id
      JOIN brands   b ON p.brand_id    = b.id
      ORDER BY po.po_date DESC
      LIMIT 100
    `);
    res.json({ data: result.rows, total: result.rows.length });
  } catch (err) {
    console.error('GET /api/data-entry/purchases:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/data-entry/purchase/:id  [admin only]
router.put('/purchase/:id', requireAuth, requireAdmin, async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) return res.status(400).json({ error: 'Invalid id' });

  const { status, delivery_date, notes } = req.body;

  try {
    const result = await req.pool.query(
      `UPDATE purchase_orders
       SET status=$1, delivery_date=$2, notes=$3
       WHERE id=$4
       RETURNING *`,
      [status, delivery_date || null, notes || null, id]
    );
    if (!result.rows.length) {
      return res.status(404).json({ error: 'Purchase order not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('PUT /api/data-entry/purchase/:id:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ═══════════════════════════════════════════════════════════════
//  INVENTORY LOGS
// ═══════════════════════════════════════════════════════════════

// POST /api/data-entry/inventory  [admin only]
// Also syncs products.stock and products.stock_pct in the same transaction
router.post('/inventory', requireAuth, requireAdmin, async (req, res) => {
  const {
    product_id, erp_qty, physical_qty, count_date,
    warehouse, damage_qty, shrinkage_qty, counted_by, notes,
  } = req.body;

  if (
    !product_id ||
    erp_qty      == null ||
    physical_qty == null ||
    !count_date
  ) {
    return res.status(400).json({
      error: 'product_id, erp_qty, physical_qty and count_date are required',
    });
  }

  const client = await req.pool.connect();
  try {
    await client.query('BEGIN');

    const insertResult = await client.query(
      `INSERT INTO inventory_logs
         (product_id, warehouse, erp_qty, physical_qty, damage_qty,
          shrinkage_qty, count_date, counted_by, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       RETURNING *`,
      [
        product_id,
        warehouse     || 'Dubai Warehouse A',
        erp_qty,
        physical_qty,
        damage_qty    ?? 0,
        shrinkage_qty ?? 0,
        count_date,
        counted_by    || null,
        notes         || null,
      ]
    );

    // Keep products table in sync with the latest physical count
    await client.query(
      `UPDATE products
       SET stock     = $1,
           stock_pct = LEAST(100, ROUND($1::float / GREATEST($2, 1) * 100))
       WHERE id = $3`,
      [physical_qty, erp_qty, product_id]
    );

    await client.query('COMMIT');
    res.status(201).json(insertResult.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('POST /api/data-entry/inventory:', err.message);
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

// GET /api/data-entry/inventory-logs  [any authenticated user]
router.get('/inventory-logs', requireAuth, async (req, res) => {
  try {
    const result = await req.pool.query(`
      SELECT
        il.*,
        (il.physical_qty - il.erp_qty) AS variance,
        p.name AS product_name,
        p.sku  AS product_sku,
        b.name AS brand_name
      FROM inventory_logs il
      JOIN products p ON il.product_id = p.id
      JOIN brands   b ON p.brand_id    = b.id
      ORDER BY il.count_date DESC
      LIMIT 100
    `);
    res.json({ data: result.rows, total: result.rows.length });
  } catch (err) {
    console.error('GET /api/data-entry/inventory-logs:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ═══════════════════════════════════════════════════════════════
//  SALES TRANSACTIONS
// ═══════════════════════════════════════════════════════════════

// POST /api/data-entry/sales  [admin only]
router.post('/sales', requireAuth, requireAdmin, async (req, res) => {
  const {
    product_id, qty_sold, sale_price, sale_date,
    channel, market, notes,
  } = req.body;

  if (!product_id || !qty_sold || !sale_price || !sale_date) {
    return res.status(400).json({
      error: 'product_id, qty_sold, sale_price and sale_date are required',
    });
  }

  try {
    const result = await req.pool.query(
      `INSERT INTO sales_transactions
         (product_id, qty_sold, sale_price, channel, market, sale_date, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7)
       RETURNING *`,
      [
        product_id,
        qty_sold,
        sale_price,
        channel || 'In-Store',
        market  || 'UAE',
        sale_date,
        notes   || null,
      ]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('POST /api/data-entry/sales:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/data-entry/sales  [any authenticated user]
router.get('/sales', requireAuth, async (req, res) => {
  try {
    const result = await req.pool.query(`
      SELECT
        st.*,
        (st.qty_sold * st.sale_price) AS total_revenue,
        p.name AS product_name,
        p.sku  AS product_sku,
        b.name AS brand_name
      FROM sales_transactions st
      JOIN products p ON st.product_id = p.id
      JOIN brands   b ON p.brand_id    = b.id
      ORDER BY st.sale_date DESC
      LIMIT 100
    `);
    res.json({ data: result.rows, total: result.rows.length });
  } catch (err) {
    console.error('GET /api/data-entry/sales:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
