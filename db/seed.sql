DELETE FROM products;

INSERT INTO products (name, brand_id, category, description, units, price)
VALUES

-- reCare Aqua
('Antibacterial Liquid Soap',1,'Hand Care','Gentle antibacterial soap',2340,50),
('Whitening Toothpaste',1,'Oral Care','Advanced whitening toothpaste',3350,30),

-- Concord
('Wheat Flour 5kg',2,'Grocery','Premium wheat flour',3160,120),
('Sugar 5kg',2,'Grocery','Refined sugar',2840,110),

-- Guard
('Dishwashing Liquid',3,'Kitchen','Powerful cleaning',2100,80),

-- Señorita
('Women Kurti Floral',4,'Clothing','Elegant kurti',1430,500),

-- HomeCare+
('Fabric Softener',5,'Laundry','Long lasting freshness',1650,200),
('Air Freshener',5,'Air Care','Fresh smell',1300,100),
('Cleaning Cloth',5,'Cleaning Tools','Soft cloth',900,80),

-- WellFit
('Vitamin C Tablets',6,'Supplements','Immunity booster',1890,300),
('Protein Powder',6,'Sports Nutrition','Muscle gain',1500,600),
('Omega 3',6,'Supplements','Heart health',1200,250);

SELECT * FROM products;