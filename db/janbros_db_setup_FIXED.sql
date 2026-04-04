-- ============================================================
--  JAN & BROS — FIXED DATABASE SETUP (desc → description)
--  Run this in pgAdmin Query Tool on janbros_db
-- ============================================================

-- Drop existing tables if re-running
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS brands CASCADE;

-- ─── BRANDS TABLE ───────────────────────────────────────────
CREATE TABLE brands (
  id           SERIAL PRIMARY KEY,
  name         VARCHAR(100) NOT NULL UNIQUE,
  initials     VARCHAR(5)   NOT NULL,
  gradient     TEXT         NOT NULL,
  category     VARCHAR(100) NOT NULL,
  status       VARCHAR(20)  NOT NULL DEFAULT 'Active',
  markets      TEXT[]       NOT NULL DEFAULT '{}',
  revenue      VARCHAR(20),
  growth       VARCHAR(20),
  link         TEXT,
  created_at   TIMESTAMP    DEFAULT NOW()
);

-- ─── PRODUCTS TABLE ─────────────────────────────────────────
CREATE TABLE products (
  id           SERIAL PRIMARY KEY,
  brand_id     INTEGER      REFERENCES brands(id) ON DELETE CASCADE,
  name         VARCHAR(200) NOT NULL,
  sku          VARCHAR(50)  NOT NULL UNIQUE,
  cat          VARCHAR(100) NOT NULL,
  icon         VARCHAR(10),
  description  TEXT,
  stock        INTEGER      NOT NULL DEFAULT 0,
  stock_pct    INTEGER      NOT NULL DEFAULT 0,
  price        VARCHAR(30),
  created_at   TIMESTAMP    DEFAULT NOW()
);

-- ─── SEED: BRANDS ───────────────────────────────────────────
INSERT INTO brands (name, initials, gradient, category, status, markets, revenue, growth, link) VALUES
  ('reCare Aqua', 'rC', 'linear-gradient(135deg,#1A56DB,#60A5FA)', 'Personal Care',   'Active', ARRAY['UAE','KSA'],        'AED 2.4M', '+12.4%', 'https://www.janbros.com/brand/recare-aqua'),
  ('Concord',     'CC', 'linear-gradient(135deg,#F59E0B,#D97706)', 'Daily Utility',   'Active', ARRAY['Global'],           'AED 3.8M', '+8.1%',  'https://www.janbros.com/brand/concord'),
  ('Guard',       'Gd', 'linear-gradient(135deg,#EF4444,#B91C1C)', 'Home Care',       'Active', ARRAY['UAE'],              'AED 1.9M', '+5.6%',  'https://www.janbros.com/brand/guard'),
  ('Señorita',    'Sm', 'linear-gradient(135deg,#8B5CF6,#6D28D9)', 'Personal Care',   'Active', ARRAY['KSA','Jordan'],     'AED 1.4M', '+18.3%', 'https://www.janbros.com/brand/senorita'),
  ('HomeCare+',   'HC', 'linear-gradient(135deg,#06B6D4,#0E7490)', 'Home Care',       'Review', ARRAY['UAE','Oman'],       'AED 0.9M', '-2.1%',  'https://www.janbros.com/brand/homecare-plus'),
  ('WellFit',     'WF', 'linear-gradient(135deg,#10B981,#047857)', 'Food & Wellness', 'Active', ARRAY['Bahrain','Kuwait'], 'AED 2.1M', '+22.7%', 'https://www.janbros.com/brand/wellfit');

-- ─── SEED: reCare Aqua ──────────────────────────────────────
INSERT INTO products (brand_id, name, sku, cat, icon, description, stock, stock_pct, price) VALUES
  ((SELECT id FROM brands WHERE name='reCare Aqua'), 'Antibacterial Liquid Soap 500ml', 'RCA-001', 'Hand Care',  '🧴', '99.9% antibacterial protection. Gentle on skin with moisturizing formula.',       2340, 92, 'AED 8.50'),
  ((SELECT id FROM brands WHERE name='reCare Aqua'), 'Whitening Toothpaste 150g',       'RCA-020', 'Oral Care',  '🦷', 'Advanced whitening with fluoride protection. Fresh mint flavour.',                3350, 95, 'AED 12.00'),
  ((SELECT id FROM brands WHERE name='reCare Aqua'), 'Shampoo Argan Oil 400ml',         'RCA-055', 'Hair Care',  '💆', 'Nourishing argan oil shampoo for dry and damaged hair.',                          1960, 82, 'AED 22.00'),
  ((SELECT id FROM brands WHERE name='reCare Aqua'), 'Body Wash Refreshing 750ml',      'RCA-060', 'Body Care',  '🚿', 'Energizing citrus body wash with deep moisturising formula.',                     2100, 85, 'AED 18.50'),
  ((SELECT id FROM brands WHERE name='reCare Aqua'), 'Hand Cream Moisturising 75ml',    'RCA-075', 'Hand Care',  '🤲', 'Fast-absorbing hand cream enriched with vitamin E and aloe vera.',                1720, 74, 'AED 9.00'),
  ((SELECT id FROM brands WHERE name='reCare Aqua'), 'Micellar Water 200ml',            'RCA-090', 'Skin Care',  '💧', 'Gentle cleansing water removes makeup and impurities without rinsing.',           1440, 68, 'AED 16.00'),
  ((SELECT id FROM brands WHERE name='reCare Aqua'), 'Face Wash Foam 100ml',            'RCA-100', 'Skin Care',  '🫧', 'Deep cleansing foam for all skin types. Removes excess oil and dirt.',            1890, 79, 'AED 14.00'),
  ((SELECT id FROM brands WHERE name='reCare Aqua'), 'Conditioner Repair 400ml',        'RCA-110', 'Hair Care',  '✨', 'Intensive repair conditioner with keratin and coconut oil.',                      1550, 72, 'AED 20.00');

-- ─── SEED: Concord ──────────────────────────────────────────
INSERT INTO products (brand_id, name, sku, cat, icon, description, stock, stock_pct, price) VALUES
  ((SELECT id FROM brands WHERE name='Concord'), 'Wheat Flour 5kg',              'CON-200', 'Grocery',     '🌾', 'Premium quality wheat flour. Ideal for baking, cooking and pastry.',              3160, 88, 'AED 14.00'),
  ((SELECT id FROM brands WHERE name='Concord'), 'Sugar 5kg',                    'CON-201', 'Grocery',     '🍬', 'Refined white sugar, food-grade quality. 5kg family pack.',                      2840, 80, 'AED 16.00'),
  ((SELECT id FROM brands WHERE name='Concord'), 'Basmati Rice 2kg',             'CON-205', 'Grocery',     '🍚', 'Long-grain aromatic basmati rice. Premium aged quality.',                        2200, 72, 'AED 18.50'),
  ((SELECT id FROM brands WHERE name='Concord'), 'Sunflower Oil 1L',             'CON-210', 'Grocery',     '🌻', '100% pure sunflower oil. Light taste, suitable for all cooking.',                2650, 84, 'AED 11.00'),
  ((SELECT id FROM brands WHERE name='Concord'), 'Android Tablet 10"',           'CON-450', 'Electronics', '📱', '10-inch display, quad-core processor, 3GB RAM. Ideal for productivity.',         890,  55, 'AED 380.00'),
  ((SELECT id FROM brands WHERE name='Concord'), 'USB-C Charging Hub 7-in-1',    'CON-461', 'Electronics', '🔌', '7-in-1 USB-C hub with 4K HDMI, SD card, and 100W PD charging.',                 1200, 60, 'AED 95.00'),
  ((SELECT id FROM brands WHERE name='Concord'), 'Bluetooth Earbuds TWS',        'CON-470', 'Electronics', '🎧', 'True wireless earbuds with 24hr battery life and noise cancellation.',           1050, 58, 'AED 120.00'),
  ((SELECT id FROM brands WHERE name='Concord'), 'Olive Oil Extra Virgin 750ml', 'CON-215', 'Grocery',     '🫒', 'Cold-pressed extra virgin olive oil. Imported from the Mediterranean.',          1800, 69, 'AED 28.00');

-- ─── SEED: Guard ────────────────────────────────────────────
INSERT INTO products (brand_id, name, sku, cat, icon, description, stock, stock_pct, price) VALUES
  ((SELECT id FROM brands WHERE name='Guard'), 'Dishwashing Liquid 750ml',     'GRD-011', 'Kitchen',      '🍽️', 'Powerful grease-cutting formula. Gentle on hands, tough on grease.',           2100, 83, 'AED 7.50'),
  ((SELECT id FROM brands WHERE name='Guard'), 'Floor Cleaner Citrus 1L',      'GRD-015', 'Floor Care',   '🧹', 'Multi-surface floor cleaner. Kills 99.9% germs. Citrus fragrance.',            1780, 75, 'AED 9.00'),
  ((SELECT id FROM brands WHERE name='Guard'), 'Toilet Bowl Cleaner 500ml',    'GRD-020', 'Bathroom',     '🚽', 'Thick formula clings to bowl surface. Removes limescale and stains.',          1540, 70, 'AED 6.00'),
  ((SELECT id FROM brands WHERE name='Guard'), 'Glass Cleaner Spray 500ml',    'GRD-025', 'Surface Care', '🪟', 'Streak-free glass cleaner for windows, mirrors and glass surfaces.',           1320, 65, 'AED 8.00'),
  ((SELECT id FROM brands WHERE name='Guard'), 'Laundry Detergent Powder 3kg', 'GRD-030', 'Laundry',      '👕', 'Concentrated detergent powder. Removes tough stains at low temperatures.',     2450, 86, 'AED 24.00'),
  ((SELECT id FROM brands WHERE name='Guard'), 'Multi-Purpose Spray 500ml',    'GRD-035', 'Surface Care', '🧽', 'All-in-one surface cleaner. Safe on all household surfaces.',                  1640, 73, 'AED 7.00');

-- ─── SEED: Señorita ─────────────────────────────────────────
INSERT INTO products (brand_id, name, sku, cat, icon, description, stock, stock_pct, price) VALUES
  ((SELECT id FROM brands WHERE name='Señorita'), 'Women Kurti Floral Print',  'SEN-301', 'Clothing',  '👗', 'Elegant floral print kurti. Available in S-XL. Cotton blend.',               1430, 68, 'AED 65.00'),
  ((SELECT id FROM brands WHERE name='Señorita'), 'Men Formal Shirt',          'SEN-320', 'Clothing',  '👔', 'Premium cotton formal shirt. Multiple colours. Slim fit design.',             980,  50, 'AED 75.00'),
  ((SELECT id FROM brands WHERE name='Señorita'), 'Perfume Floral 50ml',       'SEN-400', 'Fragrance', '🌸', 'Long-lasting floral fragrance. Notes of rose, jasmine and musk.',            1220, 62, 'AED 85.00'),
  ((SELECT id FROM brands WHERE name='Señorita'), 'Body Lotion Rose 400ml',    'SEN-410', 'Skin Care', '🌹', 'Luxuriously creamy rose-scented body lotion for silky smooth skin.',          1550, 71, 'AED 28.00'),
  ((SELECT id FROM brands WHERE name='Señorita'), 'Lip Gloss Nude Collection', 'SEN-420', 'Makeup',    '💄', 'High-shine lip gloss in 6 nude shades. Long-lasting formula.',                880,  48, 'AED 32.00'),
  ((SELECT id FROM brands WHERE name='Señorita'), 'Abaya Classic Black',       'SEN-330', 'Clothing',  '🖤', 'Premium quality classic abaya with subtle embroidery detail.',                760,  42, 'AED 180.00');

-- ─── SEED: HomeCare+ ────────────────────────────────────────
INSERT INTO products (brand_id, name, sku, cat, icon, description, stock, stock_pct, price) VALUES
  ((SELECT id FROM brands WHERE name='HomeCare+'), 'Fabric Softener Lavender 1L',   'HC-033', 'Laundry',        '👕', 'Long-lasting lavender freshness. Suitable for all fabric types.',          1650, 70, 'AED 11.00'),
  ((SELECT id FROM brands WHERE name='HomeCare+'), 'Air Freshener Ocean 300ml',     'HC-040', 'Air Care',       '🌊', 'Continuous release ocean-breeze air freshener. Up to 45-day use.',        1380, 64, 'AED 12.00'),
  ((SELECT id FROM brands WHERE name='HomeCare+'), 'Microfibre Cleaning Cloth Set', 'HC-050', 'Cleaning Tools', '🧤', 'Set of 5 ultra-soft microfibre cloths for streak-free cleaning.',         920,  52, 'AED 18.00'),
  ((SELECT id FROM brands WHERE name='HomeCare+'), 'Mop Bucket Set',               'HC-060', 'Cleaning Tools', '🪣', 'Spin mop with 360 degree rotating head and press-wring bucket.',          560,  38, 'AED 45.00'),
  ((SELECT id FROM brands WHERE name='HomeCare+'), 'Toilet Freshener Clip',         'HC-045', 'Bathroom',       '🚿', 'Under-rim toilet freshener. Keeps bathroom fresh for 30 days.',           1800, 76, 'AED 5.00');

-- ─── SEED: WellFit ──────────────────────────────────────────
INSERT INTO products (brand_id, name, sku, cat, icon, description, stock, stock_pct, price) VALUES
  ((SELECT id FROM brands WHERE name='WellFit'), 'Vitamin C 500mg 30 Tablets',    'WF-102', 'Supplements',      '💊', 'Immune support supplement. 30 tablets per pack, daily dose.',             1890, 78, 'AED 22.00'),
  ((SELECT id FROM brands WHERE name='WellFit'), 'Multi-Vitamin Complex 60 Caps', 'WF-105', 'Supplements',      '🌿', 'Complete daily nutrition with 22 essential vitamins and minerals.',       1450, 65, 'AED 45.00'),
  ((SELECT id FROM brands WHERE name='WellFit'), 'Whey Protein Chocolate 1kg',    'WF-200', 'Sports Nutrition', '🏋', 'High-quality whey protein. 24g protein per serving. Low sugar.',         1120, 58, 'AED 120.00'),
  ((SELECT id FROM brands WHERE name='WellFit'), 'Omega-3 Fish Oil 60 Softgels',  'WF-110', 'Supplements',      '🐟', 'Pharmaceutical-grade omega-3 fatty acids. 1000mg per capsule.',          1340, 62, 'AED 38.00'),
  ((SELECT id FROM brands WHERE name='WellFit'), 'Green Tea Extract 90 Caps',     'WF-115', 'Supplements',      '🍵', 'Standardised green tea extract with EGCG for antioxidant support.',      980,  52, 'AED 28.00'),
  ((SELECT id FROM brands WHERE name='WellFit'), 'Protein Snack Bar (Box 12)',     'WF-210', 'Sports Nutrition', '🍫', 'High-protein snack bars, 20g protein each. Available in 3 flavours.',   1650, 73, 'AED 55.00'),
  ((SELECT id FROM brands WHERE name='WellFit'), 'Collagen Peptides 250g',         'WF-120', 'Supplements',      '✨', 'Hydrolysed collagen peptides for skin, hair, and joint health.',         860,  47, 'AED 65.00'),
  ((SELECT id FROM brands WHERE name='WellFit'), 'Probiotic Capsules 30ct',        'WF-125', 'Supplements',      '🦠', '10 billion CFU probiotic blend for digestive health and immunity.',      1100, 56, 'AED 35.00');

-- ─── VERIFY ─────────────────────────────────────────────────
SELECT b.name AS brand, COUNT(p.id) AS products, SUM(p.stock) AS total_stock
FROM brands b LEFT JOIN products p ON b.id = p.brand_id
GROUP BY b.name ORDER BY b.name;
