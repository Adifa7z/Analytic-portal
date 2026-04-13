-- ══════════════════════════════════════════════════════════════
--  JanBros Portal — Data Entry Tables Migration
--  Run against: analytic_db
-- ══════════════════════════════════════════════════════════════

-- ─── purchase_orders ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS purchase_orders (
  id             SERIAL PRIMARY KEY,
  product_id     INTEGER       NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  supplier_name  VARCHAR(150)  NOT NULL,
  qty_ordered    INTEGER       NOT NULL CHECK (qty_ordered > 0),
  cost_price     NUMERIC(10,2) NOT NULL CHECK (cost_price > 0),
  lead_time_days INTEGER       NOT NULL DEFAULT 7,
  status         VARCHAR(20)   NOT NULL DEFAULT 'Pending'
                   CHECK (status IN ('Pending','Delivered','Partial','Cancelled')),
  po_date        DATE          NOT NULL DEFAULT CURRENT_DATE,
  delivery_date  DATE,
  notes          TEXT,
  created_at     TIMESTAMP     NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_po_product_id    ON purchase_orders(product_id);
CREATE INDEX IF NOT EXISTS idx_po_po_date       ON purchase_orders(po_date);
CREATE INDEX IF NOT EXISTS idx_po_supplier_name ON purchase_orders(supplier_name);

-- ─── inventory_logs ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS inventory_logs (
  id            SERIAL PRIMARY KEY,
  product_id    INTEGER      NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  warehouse     VARCHAR(100) NOT NULL DEFAULT 'Dubai Warehouse A',
  erp_qty       INTEGER      NOT NULL DEFAULT 0,
  physical_qty  INTEGER      NOT NULL DEFAULT 0,
  damage_qty    INTEGER      NOT NULL DEFAULT 0 CHECK (damage_qty >= 0),
  shrinkage_qty INTEGER      NOT NULL DEFAULT 0 CHECK (shrinkage_qty >= 0),
  count_date    DATE         NOT NULL DEFAULT CURRENT_DATE,
  counted_by    VARCHAR(100),
  notes         TEXT,
  created_at    TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_il_product_id ON inventory_logs(product_id);
CREATE INDEX IF NOT EXISTS idx_il_count_date ON inventory_logs(count_date);
CREATE INDEX IF NOT EXISTS idx_il_warehouse  ON inventory_logs(warehouse);

-- ─── sales_transactions ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS sales_transactions (
  id         SERIAL PRIMARY KEY,
  product_id INTEGER       NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  qty_sold   INTEGER       NOT NULL CHECK (qty_sold > 0),
  sale_price NUMERIC(10,2) NOT NULL CHECK (sale_price > 0),
  channel    VARCHAR(50)   NOT NULL DEFAULT 'In-Store'
               CHECK (channel IN ('In-Store','Online','Wholesale','Export')),
  market     VARCHAR(50)   NOT NULL DEFAULT 'UAE'
               CHECK (market IN ('UAE','KSA','Kuwait','Bahrain','Oman','Jordan','Global')),
  sale_date  DATE          NOT NULL DEFAULT CURRENT_DATE,
  notes      TEXT,
  created_at TIMESTAMP     NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_st_product_id ON sales_transactions(product_id);
CREATE INDEX IF NOT EXISTS idx_st_sale_date  ON sales_transactions(sale_date);
CREATE INDEX IF NOT EXISTS idx_st_channel    ON sales_transactions(channel);
CREATE INDEX IF NOT EXISTS idx_st_market     ON sales_transactions(market);

-- ─── Verify ──────────────────────────────────────────────────
SELECT 'purchase_orders'    AS table_name, COUNT(*) AS row_count FROM purchase_orders
UNION ALL
SELECT 'inventory_logs',                   COUNT(*)              FROM inventory_logs
UNION ALL
SELECT 'sales_transactions',               COUNT(*)              FROM sales_transactions;
