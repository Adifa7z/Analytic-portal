-- Jan & Bros Portal — PostgreSQL Schema v2.0
-- Run: psql -U postgres -d janbros -f schema.sql

CREATE TABLE IF NOT EXISTS users (
  id           SERIAL PRIMARY KEY,
  full_name    VARCHAR(150) NOT NULL,
  email        VARCHAR(150) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role         VARCHAR(30) DEFAULT 'viewer',  -- viewer | admin
  created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS brands (
  id           SERIAL PRIMARY KEY,
  name         VARCHAR(120) NOT NULL,
  initials     VARCHAR(4)   NOT NULL,
  gradient     TEXT,
  category     VARCHAR(80)  NOT NULL,
  status       VARCHAR(30)  DEFAULT 'Active',  -- Active | Review | Inactive
  markets      TEXT[],                          -- e.g. ARRAY['UAE','KSA']
  revenue      NUMERIC(12,2) DEFAULT 0,
  growth       NUMERIC(6,2) DEFAULT 0,          -- % MoM growth
  created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS products (
  id           SERIAL PRIMARY KEY,
  sku          VARCHAR(50)   UNIQUE NOT NULL,
  brand_id     INT           REFERENCES brands(id) ON DELETE SET NULL,
  name         VARCHAR(200)  NOT NULL,
  cat          VARCHAR(80)   NOT NULL,
  icon         VARCHAR(10),                     -- emoji icon
  stock        INT           NOT NULL DEFAULT 0,
  stock_pct    INT           NOT NULL DEFAULT 0, -- 0–100 stock health %
  price        NUMERIC(10,2) NOT NULL DEFAULT 0,
  description  TEXT,
  created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS warehouses (
  id           SERIAL PRIMARY KEY,
  city         VARCHAR(100) NOT NULL,
  country      VARCHAR(100),
  fill_rate    INT          NOT NULL DEFAULT 0,
  active       BOOLEAN      DEFAULT TRUE
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_products_brand_id ON products(brand_id);
CREATE INDEX IF NOT EXISTS idx_products_cat      ON products(cat);
CREATE INDEX IF NOT EXISTS idx_brands_status     ON brands(status);