// ══════════════════════════════════════════════════════════════
//  PRODUCT MODULE ROUTES  —  REAL DATABASE VERSION
//  All metrics derived from purchase_orders, inventory_logs,
//  sales_transactions. deriveMetrics() and trendArray() removed.
// ══════════════════════════════════════════════════════════════

const express    = require('express');
const router     = express.Router();
const { requireAuth } = require('./auth');

// ── Shared helpers ────────────────────────────────────────────

// Safe numeric parse — handles plain numbers and "AED 8.50" strings
function _n(v, fallback = 0) {
  if (v === null || v === undefined) return fallback;
  const n = parseFloat(String(v).replace(/[^0-9.-]/g, ''));
  return isNaN(n) ? fallback : n;
}

// Format as "AED X,XXX"
function _fmt(n) {
  return 'AED ' + Math.round(n).toLocaleString('en-US');
}

// Supplier score → tag
function _tag(score) {
  return score >= 90 ? 'Top' : score >= 75 ? 'Good' : score >= 60 ? 'Fair' : 'Poor';
}

// Fixed channel colours (used across retail + decision routes)
const CHANNEL_COLORS = {
  'In-Store':  '#1A56DB',
  'Online':    '#10B981',
  'Wholesale': '#F59E0B',
  'Export':    '#8B5CF6',
};

// ══════════════════════════════════════════════════════════════
//  1. PURCHASE INTELLIGENCE  GET /api/products/:id/purchase
// ══════════════════════════════════════════════════════════════
router.get('/:id/purchase', requireAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ error: 'Invalid id' });

    const [productRes, trendRes, kpiRes, supplierRes, coverageRes] = await Promise.all([

      // 1. Base product
      req.pool.query(
        `SELECT p.*, b.name AS brand_name
         FROM products p
         LEFT JOIN brands b ON p.brand_id = b.id
         WHERE p.id = $1`,
        [id]
      ),

      // 2. 6-month purchase spend + sales revenue (generate_series ensures all 6 months present)
      req.pool.query(
        `WITH months(month) AS (
           SELECT generate_series(
             DATE_TRUNC('month', NOW() - INTERVAL '5 months'),
             DATE_TRUNC('month', NOW()),
             '1 month'
           )
         ),
         po_data AS (
           SELECT DATE_TRUNC('month', po_date) AS month,
                  SUM(qty_ordered * cost_price)  AS total
           FROM   purchase_orders
           WHERE  product_id = $1
           GROUP BY 1
         ),
         sale_data AS (
           SELECT DATE_TRUNC('month', sale_date) AS month,
                  SUM(qty_sold * sale_price)      AS total
           FROM   sales_transactions
           WHERE  product_id = $1
           GROUP BY 1
         )
         SELECT TO_CHAR(m.month, 'Mon')     AS label,
                COALESCE(p.total, 0)::NUMERIC AS purchase,
                COALESCE(s.total, 0)::NUMERIC AS sales
         FROM   months m
         LEFT JOIN po_data   p ON p.month = m.month
         LEFT JOIN sale_data s ON s.month = m.month
         ORDER  BY m.month`,
        [id]
      ),

      // 3. Purchase KPIs: total spend (last 6 months), avg lead time, latest cost
      req.pool.query(
        `SELECT COALESCE(SUM(qty_ordered * cost_price), 0)        AS total_purchase_value,
                ROUND(COALESCE(AVG(lead_time_days), 0))           AS avg_lead_time,
                (SELECT cost_price
                 FROM   purchase_orders
                 WHERE  product_id = $1
                 ORDER  BY po_date DESC LIMIT 1)                  AS latest_cost
         FROM   purchase_orders
         WHERE  product_id = $1
           AND  po_date >= NOW() - INTERVAL '6 months'`,
        [id]
      ),

      // 4. Supplier performance: delivery rate per supplier
      req.pool.query(
        `SELECT supplier_name                                                           AS name,
                COUNT(*)                                                               AS orders,
                ROUND(AVG(lead_time_days)::NUMERIC, 1)                                AS avg_lead_time,
                ROUND(
                  COUNT(CASE WHEN status = 'Delivered' THEN 1 END)::NUMERIC
                  / NULLIF(COUNT(*), 0) * 100
                )                                                                      AS score
         FROM   purchase_orders
         WHERE  product_id = $1
         GROUP  BY supplier_name
         ORDER  BY score DESC NULLS LAST
         LIMIT  5`,
        [id]
      ),

      // 5. Stock coverage: current stock ÷ avg daily sales last 30 days
      req.pool.query(
        `SELECT p.stock,
                COALESCE(
                  (SELECT SUM(qty_sold)::FLOAT / 30
                   FROM   sales_transactions
                   WHERE  product_id = $1
                     AND  sale_date  >= NOW() - INTERVAL '30 days'),
                  0
                ) AS daily_rate
         FROM products p
         WHERE p.id = $1`,
        [id]
      ),
    ]);

    if (!productRes.rows.length) return res.status(404).json({ error: 'Not found' });

    const p   = productRes.rows[0];
    const kpi = kpiRes.rows[0]      || {};
    const cov = coverageRes.rows[0] || {};

    const totalPurchaseValue = _n(kpi.total_purchase_value);
    const avgLeadTime        = _n(kpi.avg_lead_time);
    const latestCost         = _n(kpi.latest_cost);
    const sellingPrice       = _n(p.price);
    const marginPct          = sellingPrice > 0
      ? ((sellingPrice - latestCost) / sellingPrice) * 100
      : 0;

    const stock        = _n(cov.stock);
    const dailyRate    = _n(cov.daily_rate);
    const coverageDays = Math.round(stock / Math.max(dailyRate, 1));

    // Trend arrays from generate_series result (always 6 entries)
    const labels   = trendRes.rows.map(r => r.label);
    const purchase = trendRes.rows.map(r => Math.round(_n(r.purchase)));
    const sales    = trendRes.rows.map(r => Math.round(_n(r.sales)));

    // Supplier list
    const suppliers = supplierRes.rows.map(s => ({
      name:          s.name,
      score:         _n(s.score),
      tag:           _tag(_n(s.score)),
      orders:        _n(s.orders),
      avg_lead_time: _n(s.avg_lead_time),
    }));
    const bestScore = suppliers.length ? suppliers[0].score : 0;

    // Reorder suggestion
    const reorderQty   = Math.max(50, Math.round((stock * 0.4) / 10) * 10 + 50);
    const reorderPoint = avgLeadTime > 0 ? Math.round(reorderQty * (avgLeadTime / 30)) : 0;

    // Recommendations built from real values
    const recommendations = [];
    if (coverageDays < 10) {
      recommendations.push({ level: 'urgent', icon: '🚨', title: 'Reorder Immediately',
        detail: `Only ${coverageDays} days stock remaining. Order ${reorderQty} units now.` });
    } else if (coverageDays < 20) {
      recommendations.push({ level: 'warn', icon: '⚠️', title: 'Reorder Soon',
        detail: `${coverageDays} days remaining. Place PO within ${Math.round(coverageDays - 10)} days.` });
    } else {
      recommendations.push({ level: 'ok', icon: '✅', title: 'Stock On Track',
        detail: `${coverageDays} days coverage. Current schedule is optimal.` });
    }
    if (latestCost > 0) {
      recommendations.push({
        level:  marginPct < 15 ? 'warn' : 'info',
        icon:   '💡',
        title:  'Margin Opportunity',
        detail: `Gross margin at ${marginPct.toFixed(1)}%. ${marginPct < 15
          ? 'Consider renegotiating cost or adjusting price.'
          : 'Negotiate with suppliers for further reduction.'}`,
      });
    }
    if (avgLeadTime > 0) {
      recommendations.push({ level: 'warn', icon: '⚠️', title: 'Lead Time Alert',
        detail: `Lead time is ${Math.round(avgLeadTime)} days. Place PO before reorder point (${reorderPoint} units).` });
    }
    if (!recommendations.length) {
      recommendations.push({ level: 'info', icon: 'ℹ️', title: 'No Purchase Data',
        detail: 'Add purchase orders to see intelligence insights.' });
    }

    res.json({
      product: { id: p.id, name: p.name, sku: p.sku, icon: p.icon, cat: p.cat, brand: p.brand_name },
      kpis: {
        total_purchase_value: _fmt(totalPurchaseValue),
        supplier_performance: suppliers.length ? `${Math.round(bestScore)}%` : 'No data',
        avg_lead_time:        avgLeadTime > 0   ? `${Math.round(avgLeadTime)} days` : 'No data',
        gross_margin:         sellingPrice > 0  ? `${marginPct.toFixed(1)}%` : 'No data',
      },
      reorder: {
        suggested_qty: reorderQty,
        reorder_point: reorderPoint,
        coverage_days: coverageDays,
        urgency:       coverageDays < 10 ? 'urgent' : coverageDays < 20 ? 'warning' : 'ok',
      },
      trends:          { labels, purchase, sales },
      suppliers,
      recommendations,
    });
  } catch (err) {
    console.error('purchase module:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ══════════════════════════════════════════════════════════════
//  2. INVENTORY CONTROL  GET /api/products/:id/inventory
// ══════════════════════════════════════════════════════════════
router.get('/:id/inventory', requireAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ error: 'Invalid id' });

    const [productRes, latestInvRes, aggInvRes, trendRes, locationRes, salesAggRes, latestCostRes] =
      await Promise.all([

        // 1. Base product
        req.pool.query(
          `SELECT p.*, b.name AS brand_name
           FROM products p
           LEFT JOIN brands b ON p.brand_id = b.id
           WHERE p.id = $1`,
          [id]
        ),

        // 2. Most recent inventory count row
        req.pool.query(
          `SELECT physical_qty, erp_qty, count_date
           FROM   inventory_logs
           WHERE  product_id = $1
           ORDER  BY count_date DESC
           LIMIT  1`,
          [id]
        ),

        // 3. All-time damage, shrinkage, last count date, shrinkage rate
        req.pool.query(
          `SELECT COALESCE(SUM(damage_qty),    0) AS total_damage,
                  COALESCE(SUM(shrinkage_qty), 0) AS total_shrinkage,
                  COALESCE(SUM(physical_qty),  0) AS total_physical,
                  MAX(count_date)                  AS last_count_date
           FROM   inventory_logs
           WHERE  product_id = $1`,
          [id]
        ),

        // 4. 6-month stock movement trend
        req.pool.query(
          `WITH months(month) AS (
             SELECT generate_series(
               DATE_TRUNC('month', NOW() - INTERVAL '5 months'),
               DATE_TRUNC('month', NOW()),
               '1 month'
             )
           ),
           inv_data AS (
             SELECT DATE_TRUNC('month', count_date)           AS month,
                    ROUND(AVG(physical_qty))::INTEGER          AS avg_stock,
                    SUM(damage_qty + shrinkage_qty)::INTEGER   AS consumed
             FROM   inventory_logs
             WHERE  product_id = $1
             GROUP  BY 1
           )
           SELECT TO_CHAR(m.month, 'Mon')           AS label,
                  COALESCE(d.avg_stock,  0)          AS stock,
                  COALESCE(d.consumed,   0)          AS consumed
           FROM   months m
           LEFT JOIN inv_data d ON d.month = m.month
           ORDER  BY m.month`,
          [id]
        ),

        // 5. Latest physical count per warehouse (distinct on)
        req.pool.query(
          `SELECT DISTINCT ON (warehouse)
                  warehouse                                    AS name,
                  physical_qty                                 AS units,
                  ROUND(
                    physical_qty::FLOAT / GREATEST(erp_qty, 1) * 100
                  )::INTEGER                                   AS capacity
           FROM   inventory_logs
           WHERE  product_id = $1
           ORDER  BY warehouse, count_date DESC`,
          [id]
        ),

        // 6. Total units sold (for inventory turns)
        req.pool.query(
          `SELECT COALESCE(SUM(qty_sold), 0) AS total_sold
           FROM   sales_transactions
           WHERE  product_id = $1`,
          [id]
        ),

        // 7. Latest cost price (for valuation)
        req.pool.query(
          `SELECT cost_price
           FROM   purchase_orders
           WHERE  product_id = $1
           ORDER  BY po_date DESC
           LIMIT  1`,
          [id]
        ),
      ]);

    if (!productRes.rows.length) return res.status(404).json({ error: 'Not found' });

    const p          = productRes.rows[0];
    const latestInv  = latestInvRes.rows[0]  || null;
    const agg        = aggInvRes.rows[0]     || {};
    const salesAgg   = salesAggRes.rows[0]   || {};

    const currentStock = latestInv ? _n(latestInv.physical_qty) : _n(p.stock);
    const erpStock     = latestInv ? _n(latestInv.erp_qty)      : _n(p.stock);
    const variance     = currentStock - erpStock;
    const stockPct     = _n(p.stock_pct);

    const totalDamage    = _n(agg.total_damage);
    const totalShrinkage = _n(agg.total_shrinkage);
    const totalPhysical  = _n(agg.total_physical);
    const lastCountDate  = agg.last_count_date
      ? String(agg.last_count_date).slice(0, 10)
      : 'No counts yet';

    const shrinkageRate = totalPhysical > 0
      ? ((totalShrinkage / totalPhysical) * 100).toFixed(1)
      : '0.0';

    const totalSold       = _n(salesAgg.total_sold);
    const inventoryTurns  = currentStock > 0
      ? ((totalSold / currentStock) * 12).toFixed(1)
      : '0.0';

    // Valuation
    const latestCost   = _n(latestCostRes.rows[0]?.cost_price);
    const sellingPrice = _n(p.price);

    // Locations — fall back to product stock if no inventory logs
    const locations = locationRes.rows.length
      ? locationRes.rows
      : [{ name: 'Dubai Warehouse A', units: currentStock, capacity: stockPct }];

    // Trend arrays (always 6 entries from generate_series)
    const labels   = trendRes.rows.map(r => r.label);
    const stock_h  = trendRes.rows.map(r => _n(r.stock));
    const consumed = trendRes.rows.map(r => _n(r.consumed));

    // Alerts built from real values
    const alerts = [];
    if (stockPct < 30) {
      alerts.push({ type: 'danger',  msg: `Critical: only ${stockPct}% stock remaining` });
    } else if (stockPct < 60) {
      alerts.push({ type: 'warning', msg: `Low stock alert: ${stockPct}% — consider restocking` });
    } else {
      alerts.push({ type: 'ok',      msg: `Stock healthy at ${stockPct}%` });
    }
    if (variance !== 0) {
      alerts.push({
        type: variance < 0 ? 'warning' : 'info',
        msg:  `Inventory variance: ${variance > 0 ? '+' : ''}${variance} units vs ERP`,
      });
    }
    alerts.push({ type: 'info', msg: `Inventory turnover: ${inventoryTurns}× per year` });
    if (agg.last_count_date) {
      const daysSince = Math.round((Date.now() - new Date(agg.last_count_date)) / 86400000);
      alerts.push({ type: daysSince > 30 ? 'warning' : 'info',
        msg: `Last physical count was ${daysSince} day${daysSince === 1 ? '' : 's'} ago` });
    }

    res.json({
      product: { id: p.id, name: p.name, sku: p.sku, icon: p.icon, cat: p.cat, brand: p.brand_name },
      kpis: {
        current_stock:   currentStock.toLocaleString(),
        erp_stock:       erpStock.toLocaleString(),
        variance,
        damage_loss:     totalDamage,
        shrinkage:       totalShrinkage,
        last_count_date: lastCountDate,
        stock_health:    stockPct >= 70 ? 'Healthy' : stockPct >= 40 ? 'Low' : 'Critical',
        stock_pct:       stockPct,
        inventory_turns: `${inventoryTurns}×/yr`,
        shrinkage_rate:  `${shrinkageRate}%`,
      },
      locations,
      movements: { labels, stock: stock_h, consumed },
      alerts,
      valuation: {
        at_cost:          _fmt(latestCost   * currentStock),
        at_retail:        _fmt(sellingPrice * currentStock),
        potential_profit: _fmt((sellingPrice - latestCost) * currentStock),
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
router.get('/:id/retail', requireAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ error: 'Invalid id' });

    const [productRes, trendRes, salesAggRes, channelRes, marketRes] = await Promise.all([

      // 1. Base product
      req.pool.query(
        `SELECT p.*, b.name AS brand_name
         FROM products p
         LEFT JOIN brands b ON p.brand_id = b.id
         WHERE p.id = $1`,
        [id]
      ),

      // 2. 6-month sales trend: units and revenue
      req.pool.query(
        `WITH months(month) AS (
           SELECT generate_series(
             DATE_TRUNC('month', NOW() - INTERVAL '5 months'),
             DATE_TRUNC('month', NOW()),
             '1 month'
           )
         ),
         sales AS (
           SELECT DATE_TRUNC('month', sale_date)   AS month,
                  SUM(qty_sold)                    AS units,
                  SUM(qty_sold * sale_price)       AS revenue
           FROM   sales_transactions
           WHERE  product_id = $1
           GROUP  BY 1
         )
         SELECT TO_CHAR(m.month, 'Mon')          AS label,
                COALESCE(s.units,   0)::INTEGER  AS units,
                COALESCE(s.revenue, 0)::NUMERIC  AS revenue
         FROM   months m
         LEFT JOIN sales s ON s.month = m.month
         ORDER  BY m.month`,
        [id]
      ),

      // 3. All-time totals + avg daily sales
      req.pool.query(
        `SELECT COALESCE(SUM(qty_sold), 0)             AS total_units,
                COALESCE(SUM(qty_sold * sale_price), 0) AS total_revenue,
                EXTRACT(DAY FROM NOW() - MIN(sale_date)) AS days_trading
         FROM   sales_transactions
         WHERE  product_id = $1`,
        [id]
      ),

      // 4. Revenue by channel
      req.pool.query(
        `SELECT channel,
                SUM(qty_sold * sale_price) AS revenue
         FROM   sales_transactions
         WHERE  product_id = $1
         GROUP  BY channel
         ORDER  BY revenue DESC`,
        [id]
      ),

      // 5. Revenue by market (top 5)
      req.pool.query(
        `SELECT market,
                SUM(qty_sold * sale_price) AS revenue
         FROM   sales_transactions
         WHERE  product_id = $1
         GROUP  BY market
         ORDER  BY revenue DESC
         LIMIT  5`,
        [id]
      ),
    ]);

    if (!productRes.rows.length) return res.status(404).json({ error: 'Not found' });

    const p        = productRes.rows[0];
    const salesAgg = salesAggRes.rows[0] || {};

    const totalUnits   = _n(salesAgg.total_units);
    const totalRevenue = _n(salesAgg.total_revenue);
    const daysTrading  = Math.max(_n(salesAgg.days_trading), 1);
    const avgDaily     = totalUnits > 0 ? (totalUnits / daysTrading).toFixed(1) : '0';

    // Sell-through: sold / (sold + current stock)
    const currentStock  = _n(p.stock);
    const sellThrough   = (totalUnits + currentStock) > 0
      ? Math.round((totalUnits / (totalUnits + currentStock)) * 100)
      : 0;

    // Trend arrays
    const labels        = trendRes.rows.map(r => r.label);
    const units         = trendRes.rows.map(r => _n(r.units));
    const revenue       = trendRes.rows.map(r => Math.round(_n(r.revenue)));
    // returns not available without a returns table — placeholder zeros
    const returns       = trendRes.rows.map(() => 0);

    // Channel breakdown with percentages
    const totalChannelRev = channelRes.rows.reduce((s, r) => s + _n(r.revenue), 0);
    const channels = channelRes.rows.map(r => ({
      name:  r.channel,
      pct:   totalChannelRev > 0 ? Math.round((_n(r.revenue) / totalChannelRev) * 100) : 0,
      color: CHANNEL_COLORS[r.channel] || '#9CA3AF',
    }));

    // Top markets with percentage share
    const totalMarketRev = marketRes.rows.reduce((s, r) => s + _n(r.revenue), 0);
    const top_markets = marketRes.rows.map(r => ({
      market: r.market,
      share:  totalMarketRev > 0 ? Math.round((_n(r.revenue) / totalMarketRev) * 100) : 0,
    }));

    res.json({
      product: { id: p.id, name: p.name, sku: p.sku, icon: p.icon, cat: p.cat, brand: p.brand_name },
      kpis: {
        total_revenue:   totalRevenue > 0 ? _fmt(totalRevenue) : 'No data',
        units_sold:      totalUnits.toLocaleString(),
        avg_daily_sales: `${avgDaily} units/day`,
        return_rate:     'No data',
        sell_through:    `${sellThrough}%`,
      },
      channels:   channels.length ? channels : [],
      trends:     { labels, units, revenue, returns },
      top_markets: top_markets.length ? top_markets : [],
      promotions: [],
    });
  } catch (err) {
    console.error('retail module:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ══════════════════════════════════════════════════════════════
//  4. DECISION SUPPORT  GET /api/products/:id/decision
// ══════════════════════════════════════════════════════════════
router.get('/:id/decision', requireAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ error: 'Invalid id' });

    const [productRes, priceHistRes, overduePORes, forecastRes, salesAggRes, latestInvRes, supplierRateRes] =
      await Promise.all([

        // 1. Base product
        req.pool.query(
          `SELECT p.*, b.name AS brand_name
           FROM products p
           LEFT JOIN brands b ON p.brand_id = b.id
           WHERE p.id = $1`,
          [id]
        ),

        // 2. Latest 2 cost prices (for price-spike detection using LAG equivalent)
        req.pool.query(
          `WITH costs AS (
             SELECT cost_price,
                    ROW_NUMBER() OVER (ORDER BY po_date DESC) AS rn
             FROM   purchase_orders
             WHERE  product_id = $1
           )
           SELECT MAX(CASE WHEN rn = 1 THEN cost_price END) AS current_cost,
                  MAX(CASE WHEN rn = 2 THEN cost_price END) AS prev_cost
           FROM   costs
           WHERE  rn <= 2`,
          [id]
        ),

        // 3. Overdue pending POs (po_date + lead_time_days < now)
        req.pool.query(
          `SELECT id, supplier_name, po_date, lead_time_days
           FROM   purchase_orders
           WHERE  product_id = $1
             AND  status     = 'Pending'
             AND  (po_date + lead_time_days * INTERVAL '1 day') < NOW()
           LIMIT  1`,
          [id]
        ),

        // 4. 6-month revenue for forecast base
        req.pool.query(
          `WITH months(month) AS (
             SELECT generate_series(
               DATE_TRUNC('month', NOW() - INTERVAL '5 months'),
               DATE_TRUNC('month', NOW()),
               '1 month'
             )
           ),
           monthly AS (
             SELECT DATE_TRUNC('month', sale_date)   AS month,
                    SUM(qty_sold * sale_price)       AS revenue
             FROM   sales_transactions
             WHERE  product_id = $1
             GROUP  BY 1
           )
           SELECT TO_CHAR(m.month, 'Mon')          AS label,
                  COALESCE(r.revenue, 0)::NUMERIC  AS revenue
           FROM   months m
           LEFT JOIN monthly r ON r.month = m.month
           ORDER  BY m.month`,
          [id]
        ),

        // 5. All-time sales aggregate
        req.pool.query(
          `SELECT COALESCE(SUM(qty_sold * sale_price), 0) AS total_revenue,
                  COALESCE(SUM(qty_sold), 0)              AS total_units
           FROM   sales_transactions
           WHERE  product_id = $1`,
          [id]
        ),

        // 6. Latest physical count (for stock figure in health score)
        req.pool.query(
          `SELECT physical_qty
           FROM   inventory_logs
           WHERE  product_id = $1
           ORDER  BY count_date DESC
           LIMIT  1`,
          [id]
        ),

        // 7. Overall supplier delivery rate (for scorecard)
        req.pool.query(
          `SELECT ROUND(
             COUNT(CASE WHEN status = 'Delivered' THEN 1 END)::NUMERIC
             / NULLIF(COUNT(*), 0) * 100
           ) AS delivery_rate
           FROM purchase_orders
           WHERE product_id = $1`,
          [id]
        ),
      ]);

    if (!productRes.rows.length) return res.status(404).json({ error: 'Not found' });

    const p           = productRes.rows[0];
    const priceHist   = priceHistRes.rows[0]    || {};
    const salesAgg    = salesAggRes.rows[0]     || {};
    const latestInv   = latestInvRes.rows[0]    || null;
    const supplierRate = supplierRateRes.rows[0] || {};

    const sellingPrice   = _n(p.price);
    const stockPct       = _n(p.stock_pct);
    const currentStock   = latestInv ? _n(latestInv.physical_qty) : _n(p.stock);
    const currentCost    = _n(priceHist.current_cost);
    const prevCost       = _n(priceHist.prev_cost);
    const totalRevenue   = _n(salesAgg.total_revenue);
    const totalUnits     = _n(salesAgg.total_units);
    const deliveryRate   = _n(supplierRate.delivery_rate);

    const marginPct = sellingPrice > 0 && currentCost > 0
      ? ((sellingPrice - currentCost) / sellingPrice) * 100
      : 0;

    // ── Build alerts from real conditions ────────────────────
    const alerts = [];

    if (stockPct < 30) {
      alerts.push({
        type: 'low_stock', severity: 'critical',
        msg:  `Critical stock: only ${stockPct}% remaining (${currentStock.toLocaleString()} units)`,
      });
    }

    if (currentCost > 0 && prevCost > 0 && currentCost > prevCost * 1.05) {
      const spikePct = (((currentCost - prevCost) / prevCost) * 100).toFixed(1);
      alerts.push({
        type: 'price_spike', severity: 'warning',
        msg:  `Cost price increased ${spikePct}% (AED ${prevCost.toFixed(2)} → AED ${currentCost.toFixed(2)})`,
      });
    }

    if (marginPct > 0 && marginPct < 15) {
      alerts.push({
        type: 'margin_erosion', severity: 'warning',
        msg:  `Gross margin at ${marginPct.toFixed(1)}% — below 15% threshold`,
      });
    }

    if (overduePORes.rows.length) {
      const po = overduePORes.rows[0];
      alerts.push({
        type: 'overdue_po', severity: 'critical',
        msg:  `Overdue PO from ${po.supplier_name} — ${po.lead_time_days} day lead time exceeded`,
      });
    }

    // ── Forecast from real monthly revenue ───────────────────
    const forecastRows  = forecastRes.rows;
    const forecastBase  = forecastRows.map(r => Math.round(_n(r.revenue)));
    const avgMonthlyRev = forecastBase.reduce((s, v) => s + v, 0) / Math.max(forecastBase.filter(v => v > 0).length, 1);

    const forecastLabels     = forecastRows.map(r => r.label);
    const forecastOptimistic = forecastBase.map(v => v > 0 ? Math.round(v * 1.15) : Math.round(avgMonthlyRev * 1.15));
    const forecastPessimistic = forecastBase.map(v => v > 0 ? Math.round(v * 0.85) : Math.round(avgMonthlyRev * 0.85));

    // ── Profit waterfall ──────────────────────────────────────
    const cogs  = currentCost * totalUnits;
    const gross = totalRevenue - cogs;
    const opex  = gross * 0.28;      // estimated 28% of gross as operating expense
    const net   = gross - opex;
    const roi   = currentCost > 0 ? ((sellingPrice - currentCost) / currentCost) * 100 : 0;

    const profitWaterfall = {
      revenue: Math.round(totalRevenue),
      cogs:    Math.round(cogs),
      gross:   Math.round(gross),
      opex:    Math.round(opex),
      net:     Math.round(net),
    };

    // ── Health score (0-100) ──────────────────────────────────
    const marginScore   = Math.min(100, Math.round(Math.max(marginPct, 0) * 2.5));
    const stockScore    = Math.min(100, stockPct);
    const salesScore    = Math.min(100, totalUnits > 0 ? Math.round(Math.log10(totalUnits + 1) * 33) : 0);
    const supplierScore = Math.min(100, deliveryRate > 0 ? Math.round(deliveryRate) : 50);
    const alertPenalty  = alerts.filter(a => a.severity === 'critical').length * 15
                        + alerts.filter(a => a.severity === 'warning').length  * 8;

    const healthScore = Math.max(0, Math.min(100, Math.round(
      marginScore   * 0.30 +
      stockScore    * 0.25 +
      salesScore    * 0.25 +
      supplierScore * 0.20
    ) - alertPenalty));

    // ── Scorecard ─────────────────────────────────────────────
    const scorecard = [
      { label: 'Margin Health',    score: marginScore,   weight: 30 },
      { label: 'Stock Efficiency', score: stockScore,    weight: 25 },
      { label: 'Sales Velocity',   score: salesScore,    weight: 25 },
      { label: 'Supplier Risk',    score: supplierScore, weight: 20 },
    ];

    // ── Actions from real signals ─────────────────────────────
    const actions = [
      {
        priority: marginPct < 20 ? 'high' : 'medium',
        label:    marginPct < 20 ? 'Review pricing strategy — margin below target' : 'Maintain margin discipline',
        icon:     '📈',
      },
      {
        priority: stockPct < 50 ? 'high' : 'medium',
        label:    stockPct < 50 ? 'Accelerate restock plan — stock running low' : 'Optimize reorder cadence',
        icon:     '📦',
      },
      {
        priority: 'medium',
        label:    'Expand channel mix — analyse top-performing markets',
        icon:     '🌍',
      },
      {
        priority: deliveryRate < 80 ? 'high' : 'low',
        label:    deliveryRate < 80 ? 'Supplier performance below 80% — request review' : 'Request supplier performance review',
        icon:     '🤝',
      },
    ];

    res.json({
      product: { id: p.id, name: p.name, sku: p.sku, icon: p.icon, cat: p.cat, brand: p.brand_name },
      health_score: healthScore,
      health_label: healthScore >= 80 ? 'Excellent' : healthScore >= 60 ? 'Good' : healthScore >= 40 ? 'Fair' : 'At Risk',
      kpis: {
        net_profit:      net   !== 0  ? _fmt(net)  : 'No sales data',
        roi:             roi   >  0   ? `${roi.toFixed(1)}%` : 'No cost data',
        gross_margin:    marginPct > 0 ? `${marginPct.toFixed(1)}%` : 'No data',
        forecast_30d:    avgMonthlyRev > 0 ? _fmt(avgMonthlyRev) : 'No data',
      },
      profit_waterfall: profitWaterfall,
      scorecard,
      actions,
      alerts: alerts.length ? alerts : [{ type: 'ok', severity: 'info', msg: 'No active alerts — product health looks good' }],
      forecast: {
        labels:      forecastLabels,
        optimistic:  forecastOptimistic,
        base:        forecastBase,
        pessimistic: forecastPessimistic,
      },
    });
  } catch (err) {
    console.error('decision module:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
