// ══════════════════════════════════════════════════════════════
//  PRODUCT MODULE ROUTES
//  4 reusable modules: purchase, inventory, retail, decision
//  Each endpoint is dynamically driven by productId
// ══════════════════════════════════════════════════════════════

const express = require('express');
const router  = express.Router();

// ─── Helper: derive simulated metrics from real product data ──
function deriveMetrics(p) {
  const rawPrice  = parseFloat(p.price);
  const price     = isNaN(rawPrice) ? 0 : rawPrice;
  const rawCost   = parseFloat(p.cost || p.cost_price);
  const cost      = isNaN(rawCost) ? (price * 0.63) : rawCost;
  const rawStock  = parseFloat(p.stock);
  const stock     = isNaN(rawStock) ? 0 : rawStock;
  const rawPct    = parseFloat(p.stock_pct);
  const stockPct  = isNaN(rawPct) ? 50 : rawPct;
  const rawSold   = parseFloat(p.units_sold || p.sold);
  const sold      = isNaN(rawSold) ? Math.max(50, Math.round(stock * 4.2)) : rawSold;
  const rawDays   = parseFloat(p.days_in_stock);
  const days      = isNaN(rawDays) ? Math.max(7, Math.round(stock / Math.max(sold / 30, 1))) : rawDays;
  const margin    = price > 0 ? ((price - cost) / price) * 100 : 22.0;
  const revenue   = price * sold;
  const profit    = (price - cost) * sold;

  return { price, cost, stock, stockPct, sold, days, margin, revenue, profit };
}

// ─── seed-stable fake trend array ────────────────────────────
function trendArray(seed, months = 6, base = 100, variance = 30) {
  const arr = [];
  let val = base + (seed % variance);
  for (let i = 0; i < months; i++) {
    val = Math.max(10, val + ((seed * (i + 3)) % variance) - variance / 2);
    arr.push(Math.round(val));
  }
  return arr;
}

const MONTHS = ['Oct','Nov','Dec','Jan','Feb','Mar'];

// ══════════════════════════════════════════════════════════════
//  1. PURCHASE INTELLIGENCE  GET /api/products/:id/purchase
// ══════════════════════════════════════════════════════════════
router.get('/:id/purchase', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ error: 'Invalid id' });

    const r = await req.pool.query(
      `SELECT p.*, b.name AS brand_name
       FROM products p LEFT JOIN brands b ON p.brand_id = b.id
       WHERE p.id = $1`, [id]
    );
    if (!r.rows.length) return res.status(404).json({ error: 'Not found' });

    const p = r.rows[0];
    const m = deriveMetrics(p);
    const seed = id * 7;

    const purchaseTrend  = trendArray(seed,      6, Math.round(m.cost * 200), 40);
    const salesTrend     = trendArray(seed + 13, 6, Math.round(m.price * 180), 45);
    const reorderQty     = Math.round((m.stock * 0.4) / 10) * 10 + 100;
    const leadDays       = 5 + (seed % 8);
    const reorderPoint   = Math.round(reorderQty * (leadDays / 30));
    const coverageDays   = m.sold > 0 ? Math.round((m.stock / (m.sold / 30))) : m.days;

    res.json({
      product: { id: p.id, name: p.name, sku: p.sku, icon: p.icon, cat: p.cat, brand: p.brand_name },
      kpis: {
        total_purchase_value: `AED ${(m.cost * reorderQty).toLocaleString()}`,
        supplier_performance: `${78 + (seed % 20)}%`,
        avg_lead_time:        `${leadDays} days`,
        gross_margin:         `${m.margin.toFixed(1)}%`,
      },
      reorder: {
        suggested_qty:  reorderQty,
        reorder_point:  reorderPoint,
        coverage_days:  coverageDays,
        urgency:        coverageDays < 10 ? 'urgent' : coverageDays < 20 ? 'warning' : 'ok',
      },
      trends: {
        labels:   MONTHS,
        purchase: purchaseTrend,
        sales:    salesTrend,
      },
      suppliers: [
        { name: 'Primary Supplier',   score: 88 + (seed % 10), tag: 'Top'  },
        { name: 'Secondary Supplier', score: 72 + (seed % 12), tag: 'Good' },
        { name: 'Backup Supplier',    score: 58 + (seed % 15), tag: 'Fair' },
      ],
      recommendations: [
        coverageDays < 10
          ? { level: 'urgent', icon: '🚨', title: 'Reorder Immediately', detail: `Only ${coverageDays} days stock remaining. Order ${reorderQty} units now.` }
          : { level: 'ok',     icon: '✅', title: 'Stock On Track',      detail: `${coverageDays} days coverage. Current schedule is optimal.` },
        { level: 'info', icon: '💡', title: 'Margin Opportunity', detail: `Gross margin at ${m.margin.toFixed(1)}%. Negotiate with Primary Supplier for 3% reduction.` },
        { level: 'warn', icon: '⚠️', title: 'Lead Time Alert',   detail: `Lead time is ${leadDays} days. Place PO before reorder point (${reorderPoint} units).` },
      ],
    });
  } catch (err) {
    console.error('purchase module:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ══════════════════════════════════════════════════════════════
//  2. INVENTORY CONTROL  GET /api/products/:id/inventory
// ══════════════════════════════════════════════════════════════
router.get('/:id/inventory', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ error: 'Invalid id' });

    const r = await req.pool.query(
      `SELECT p.*, b.name AS brand_name
       FROM products p LEFT JOIN brands b ON p.brand_id = b.id
       WHERE p.id = $1`, [id]
    );
    if (!r.rows.length) return res.status(404).json({ error: 'Not found' });

    const p = r.rows[0];
    const m = deriveMetrics(p);
    const seed = id * 11;

    const stockHistory = trendArray(seed, 6, m.stock, Math.round(m.stock * 0.25));
    const consumed     = trendArray(seed + 5, 6, Math.round(m.sold / 6), 20);

    const locations = [
      { name: 'Dubai Warehouse A', units: Math.round(m.stock * 0.45), capacity: 80 + (seed % 15) },
      { name: 'Abu Dhabi Store',   units: Math.round(m.stock * 0.30), capacity: 60 + (seed % 20) },
      { name: 'KSA Distribution',  units: Math.round(m.stock * 0.15), capacity: 40 + (seed % 25) },
      { name: 'Online Reserve',    units: Math.round(m.stock * 0.10), capacity: 30 + (seed % 10) },
    ];

    const turnover = m.sold > 0 ? (m.sold / Math.max(m.stock, 1) * 12).toFixed(1) : '0.0';

    res.json({
      product: { id: p.id, name: p.name, sku: p.sku, icon: p.icon, cat: p.cat, brand: p.brand_name },
      kpis: {
        current_stock:    m.stock.toLocaleString(),
        stock_health:     m.stockPct >= 70 ? 'Healthy' : m.stockPct >= 40 ? 'Low' : 'Critical',
        stock_pct:        m.stockPct,
        inventory_turns:  `${turnover}×/yr`,
        shrinkage_rate:   `${(1.2 + (seed % 20) / 10).toFixed(1)}%`,
      },
      locations,
      movements: {
        labels:   MONTHS,
        stock:    stockHistory,
        consumed: consumed,
      },
      alerts: [
        m.stockPct < 30
          ? { type: 'danger',  msg: `Critical: only ${m.stockPct}% stock remaining` }
          : m.stockPct < 60
          ? { type: 'warning', msg: `Low stock alert: ${m.stockPct}% — consider restocking` }
          : { type: 'ok',      msg: `Stock healthy at ${m.stockPct}%` },
        { type: 'info', msg: `Inventory turnover: ${turnover}× per year` },
        { type: 'info', msg: `Next physical count scheduled in ${7 + (seed % 14)} days` },
      ],
      valuation: {
        at_cost:   `AED ${(m.cost  * m.stock).toLocaleString()}`,
        at_retail: `AED ${(m.price * m.stock).toLocaleString()}`,
        potential_profit: `AED ${((m.price - m.cost) * m.stock).toLocaleString()}`,
      },
    });
  } catch (err) {
    console.error('inventory module:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ══════════════════════════════════════════════════════════════
//  3. RETAIL OPERATIONS  GET /api/products/:id/retail
// ══════════════════════════════════════════════════════════════
router.get('/:id/retail', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ error: 'Invalid id' });

    const r = await req.pool.query(
      `SELECT p.*, b.name AS brand_name
       FROM products p LEFT JOIN brands b ON p.brand_id = b.id
       WHERE p.id = $1`, [id]
    );
    if (!r.rows.length) return res.status(404).json({ error: 'Not found' });

    const p = r.rows[0];
    const m = deriveMetrics(p);
    const seed = id * 13;

    const salesUnits   = trendArray(seed,      6, Math.round(m.sold / 6), 25);
    const salesRevenue = salesUnits.map(u => Math.round(u * m.price));
    const returnRates  = trendArray(seed + 3,  6, 4, 3);

    res.json({
      product: { id: p.id, name: p.name, sku: p.sku, icon: p.icon, cat: p.cat, brand: p.brand_name },
      kpis: {
        total_revenue:   `AED ${m.revenue.toLocaleString()}`,
        units_sold:      m.sold.toLocaleString(),
        avg_daily_sales: `${Math.round(m.sold / 30)} units/day`,
        return_rate:     `${2 + (seed % 5)}%`,
        sell_through:    `${Math.min(99, 60 + (seed % 35))}%`,
      },
      channels: [
        { name: 'In-Store',    pct: 45 + (seed % 15), color: '#1A56DB' },
        { name: 'Online',      pct: 30 + (seed % 10), color: '#10B981' },
        { name: 'Wholesale',   pct: 15 + (seed % 8),  color: '#F59E0B' },
        { name: 'Export',      pct: 10 - (seed % 5),  color: '#8B5CF6' },
      ],
      trends: {
        labels:   MONTHS,
        units:    salesUnits,
        revenue:  salesRevenue,
        returns:  returnRates,
      },
      top_markets: [
        { market: 'UAE',    share: 42 + (seed % 10) },
        { market: 'KSA',    share: 28 + (seed % 8)  },
        { market: 'Kuwait', share: 15 + (seed % 6)  },
        { market: 'Bahrain',share: 8  + (seed % 4)  },
        { market: 'Oman',   share: 7  + (seed % 3)  },
      ],
      promotions: [
        { name: 'Ramadan Bundle',  uplift: `+${22 + (seed % 15)}%`, status: 'Active'   },
        { name: 'Summer Sale',     uplift: `+${15 + (seed % 10)}%`, status: 'Planned'  },
        { name: 'Loyalty Bonus',   uplift: `+${8  + (seed % 6)}%`,  status: 'Completed'},
      ],
    });
  } catch (err) {
    console.error('retail module:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ══════════════════════════════════════════════════════════════
//  4. DECISION SUPPORT  GET /api/products/:id/decision
// ══════════════════════════════════════════════════════════════
router.get('/:id/decision', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ error: 'Invalid id' });

    const r = await req.pool.query(
      `SELECT p.*, b.name AS brand_name
       FROM products p LEFT JOIN brands b ON p.brand_id = b.id
       WHERE p.id = $1`, [id]
    );
    if (!r.rows.length) return res.status(404).json({ error: 'Not found' });

    const p = r.rows[0];
    const m = deriveMetrics(p);
    const seed = id * 17;

    const score = Math.min(98, 55 + (m.margin > 20 ? 15 : 5) + (m.stockPct > 60 ? 10 : 0) + (seed % 18));

    const profitSplit = {
      revenue: Math.round(m.revenue),
      cogs:    Math.round(m.cost * m.sold),
      gross:   Math.round(m.profit),
      opex:    Math.round(m.profit * 0.28),
      net:     Math.round(m.profit * 0.72),
    };

    res.json({
      product: { id: p.id, name: p.name, sku: p.sku, icon: p.icon, cat: p.cat, brand: p.brand_name },
      health_score: score,
      health_label: score >= 80 ? 'Excellent' : score >= 60 ? 'Good' : score >= 40 ? 'Fair' : 'At Risk',
      kpis: {
        net_profit:       `AED ${profitSplit.net.toLocaleString()}`,
        roi:              `${(((m.price - m.cost) / Math.max(m.cost, 1)) * 100).toFixed(1)}%`,
        breakeven_units:  `${Math.round((m.cost * 500) / Math.max(m.price - m.cost, 1))} units`,
        forecast_30d:     `AED ${Math.round(m.price * m.sold * 0.11 * 10) * 10}`,
      },
      profit_waterfall: profitSplit,
      scorecard: [
        { label: 'Margin Health',    score: Math.min(100, Math.round(m.margin * 2.5)),  weight: 30 },
        { label: 'Stock Efficiency', score: m.stockPct,                                 weight: 25 },
        { label: 'Sales Velocity',   score: Math.min(100, 40 + (seed % 50)),            weight: 25 },
        { label: 'Supplier Risk',    score: 78 + (seed % 20),                           weight: 20 },
      ],
      actions: [
        { priority: 'high',   label: m.margin < 20 ? 'Review pricing strategy' : 'Maintain margin discipline',         icon: '📈' },
        { priority: 'medium', label: m.stockPct < 50 ? 'Accelerate restock plan' : 'Optimize reorder cadence',         icon: '📦' },
        { priority: 'medium', label: `Expand into ${['Jordan','Egypt','Iraq'][(seed % 3)]} market`,                    icon: '🌍' },
        { priority: 'low',    label: 'Request supplier performance review',                                             icon: '🤝' },
      ],
      forecast: {
        labels: MONTHS,
        optimistic:  trendArray(seed,     6, Math.round(m.revenue / 6 * 1.15), 20),
        base:        trendArray(seed + 2, 6, Math.round(m.revenue / 6),        15),
        pessimistic: trendArray(seed + 4, 6, Math.round(m.revenue / 6 * 0.85), 12),
      },
    });
  } catch (err) {
    console.error('decision module:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;