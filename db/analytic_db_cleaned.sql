--
-- PostgreSQL database dump
--


-- Dumped from database version 18.3
-- Dumped by pg_dump version 18.3

-- Started on 2026-04-13 14:37:52

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 220 (class 1259 OID 73778)
-- Name: brands; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.brands (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    initials character varying(5) NOT NULL,
    gradient text NOT NULL,
    category character varying(100) NOT NULL,
    status character varying(20) DEFAULT 'Active'::character varying NOT NULL,
    markets text[] DEFAULT '{}'::text[] NOT NULL,
    revenue character varying(20),
    growth character varying(20),
    link text,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.brands OWNER TO postgres;

--
-- TOC entry 219 (class 1259 OID 73777)
-- Name: brands_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.brands_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.brands_id_seq OWNER TO postgres;

--
-- TOC entry 5072 (class 0 OID 0)
-- Dependencies: 219
-- Name: brands_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.brands_id_seq OWNED BY public.brands.id;


--
-- TOC entry 226 (class 1259 OID 73985)
-- Name: inventory_logs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.inventory_logs (
    id integer NOT NULL,
    product_id integer,
    warehouse character varying(100),
    erp_qty integer,
    physical_qty integer,
    damage_qty integer DEFAULT 0,
    shrinkage_qty integer DEFAULT 0,
    count_date date,
    counted_by character varying(100),
    notes text,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.inventory_logs OWNER TO postgres;

--
-- TOC entry 225 (class 1259 OID 73984)
-- Name: inventory_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.inventory_logs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.inventory_logs_id_seq OWNER TO postgres;

--
-- TOC entry 5073 (class 0 OID 0)
-- Dependencies: 225
-- Name: inventory_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.inventory_logs_id_seq OWNED BY public.inventory_logs.id;


--
-- TOC entry 222 (class 1259 OID 73799)
-- Name: products; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.products (
    id integer NOT NULL,
    brand_id integer,
    name character varying(200) NOT NULL,
    sku character varying(50) NOT NULL,
    cat character varying(100) NOT NULL,
    icon character varying(10),
    description text,
    stock integer DEFAULT 0 NOT NULL,
    stock_pct integer DEFAULT 0 NOT NULL,
    price character varying(30),
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.products OWNER TO postgres;

--
-- TOC entry 221 (class 1259 OID 73798)
-- Name: products_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.products_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.products_id_seq OWNER TO postgres;

--
-- TOC entry 5074 (class 0 OID 0)
-- Dependencies: 221
-- Name: products_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.products_id_seq OWNED BY public.products.id;


--
-- TOC entry 224 (class 1259 OID 73824)
-- Name: purchase_orders; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.purchase_orders (
    id integer NOT NULL,
    product_id integer,
    supplier_name character varying(150),
    qty_ordered integer,
    cost_price numeric(10,2),
    lead_time_days integer,
    status character varying(20),
    po_date date,
    delivery_date date,
    notes text,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.purchase_orders OWNER TO postgres;

--
-- TOC entry 223 (class 1259 OID 73823)
-- Name: purchase_orders_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.purchase_orders_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.purchase_orders_id_seq OWNER TO postgres;

--
-- TOC entry 5075 (class 0 OID 0)
-- Dependencies: 223
-- Name: purchase_orders_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.purchase_orders_id_seq OWNED BY public.purchase_orders.id;


--
-- TOC entry 228 (class 1259 OID 74004)
-- Name: sales_transactions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.sales_transactions (
    id integer NOT NULL,
    product_id integer,
    qty_sold integer,
    sale_price numeric(10,2),
    channel character varying(50),
    market character varying(50),
    sale_date date,
    notes text,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.sales_transactions OWNER TO postgres;

--
-- TOC entry 227 (class 1259 OID 74003)
-- Name: sales_transactions_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.sales_transactions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.sales_transactions_id_seq OWNER TO postgres;

--
-- TOC entry 5076 (class 0 OID 0)
-- Dependencies: 227
-- Name: sales_transactions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.sales_transactions_id_seq OWNED BY public.sales_transactions.id;


--
-- TOC entry 4876 (class 2604 OID 73781)
-- Name: brands id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.brands ALTER COLUMN id SET DEFAULT nextval('public.brands_id_seq'::regclass);


--
-- TOC entry 4886 (class 2604 OID 73988)
-- Name: inventory_logs id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inventory_logs ALTER COLUMN id SET DEFAULT nextval('public.inventory_logs_id_seq'::regclass);


--
-- TOC entry 4880 (class 2604 OID 73802)
-- Name: products id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products ALTER COLUMN id SET DEFAULT nextval('public.products_id_seq'::regclass);


--
-- TOC entry 4884 (class 2604 OID 73827)
-- Name: purchase_orders id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.purchase_orders ALTER COLUMN id SET DEFAULT nextval('public.purchase_orders_id_seq'::regclass);


--
-- TOC entry 4890 (class 2604 OID 74007)
-- Name: sales_transactions id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sales_transactions ALTER COLUMN id SET DEFAULT nextval('public.sales_transactions_id_seq'::regclass);


--
-- TOC entry 5058 (class 0 OID 73778)
-- Dependencies: 220
-- Data for Name: brands; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.brands (id, name, initials, gradient, category, status, markets, revenue, growth, link, created_at) FROM stdin;
1	reCare Aqua	rC	linear-gradient(135deg,#1A56DB,#60A5FA)	Personal Care	Active	{UAE,KSA}	AED 2.4M	+12.4%	https://www.janbros.com/brand/recare-aqua	2026-04-10 17:06:51.369665
2	Concord	CC	linear-gradient(135deg,#F59E0B,#D97706)	Daily Utility	Active	{Global}	AED 3.8M	+8.1%	https://www.janbros.com/brand/concord	2026-04-10 17:06:51.369665
3	Guard	Gd	linear-gradient(135deg,#EF4444,#B91C1C)	Home Care	Active	{UAE}	AED 1.9M	+5.6%	https://www.janbros.com/brand/guard	2026-04-10 17:06:51.369665
4	Señorita	Sm	linear-gradient(135deg,#8B5CF6,#6D28D9)	Personal Care	Active	{KSA,Jordan}	AED 1.4M	+18.3%	https://www.janbros.com/brand/senorita	2026-04-10 17:06:51.369665
5	HomeCare+	HC	linear-gradient(135deg,#06B6D4,#0E7490)	Home Care	Review	{UAE,Oman}	AED 0.9M	-2.1%	https://www.janbros.com/brand/homecare-plus	2026-04-10 17:06:51.369665
6	WellFit	WF	linear-gradient(135deg,#10B981,#047857)	Food & Wellness	Active	{Bahrain,Kuwait}	AED 2.1M	+22.7%	https://www.janbros.com/brand/wellfit	2026-04-10 17:06:51.369665
\.


--
-- TOC entry 5064 (class 0 OID 73985)
-- Dependencies: 226
-- Data for Name: inventory_logs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.inventory_logs (id, product_id, warehouse, erp_qty, physical_qty, damage_qty, shrinkage_qty, count_date, counted_by, notes, created_at) FROM stdin;
\.


--
-- TOC entry 5060 (class 0 OID 73799)
-- Dependencies: 222
-- Data for Name: products; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.products (id, brand_id, name, sku, cat, icon, description, stock, stock_pct, price, created_at) FROM stdin;
1	1	Antibacterial Liquid Soap 500ml	RCA-001	Hand Care	🧴	99.9% antibacterial protection. Gentle on skin with moisturizing formula.	2340	92	AED 8.50	2026-04-10 17:06:51.369665
2	1	Whitening Toothpaste 150g	RCA-020	Oral Care	🦷	Advanced whitening with fluoride protection. Fresh mint flavour.	3350	95	AED 12.00	2026-04-10 17:06:51.369665
3	1	Shampoo Argan Oil 400ml	RCA-055	Hair Care	💆	Nourishing argan oil shampoo for dry and damaged hair.	1960	82	AED 22.00	2026-04-10 17:06:51.369665
4	1	Body Wash Refreshing 750ml	RCA-060	Body Care	🚿	Energizing citrus body wash with deep moisturising formula.	2100	85	AED 18.50	2026-04-10 17:06:51.369665
5	1	Hand Cream Moisturising 75ml	RCA-075	Hand Care	🤲	Fast-absorbing hand cream enriched with vitamin E and aloe vera.	1720	74	AED 9.00	2026-04-10 17:06:51.369665
6	1	Micellar Water 200ml	RCA-090	Skin Care	💧	Gentle cleansing water removes makeup and impurities without rinsing.	1440	68	AED 16.00	2026-04-10 17:06:51.369665
7	1	Face Wash Foam 100ml	RCA-100	Skin Care	🫧	Deep cleansing foam for all skin types. Removes excess oil and dirt.	1890	79	AED 14.00	2026-04-10 17:06:51.369665
8	1	Conditioner Repair 400ml	RCA-110	Hair Care	✨	Intensive repair conditioner with keratin and coconut oil.	1550	72	AED 20.00	2026-04-10 17:06:51.369665
9	2	Wheat Flour 5kg	CON-200	Grocery	🌾	Premium quality wheat flour. Ideal for baking, cooking and pastry.	3160	88	AED 14.00	2026-04-10 17:06:51.369665
10	2	Sugar 5kg	CON-201	Grocery	🍬	Refined white sugar, food-grade quality. 5kg family pack.	2840	80	AED 16.00	2026-04-10 17:06:51.369665
11	2	Basmati Rice 2kg	CON-205	Grocery	🍚	Long-grain aromatic basmati rice. Premium aged quality.	2200	72	AED 18.50	2026-04-10 17:06:51.369665
12	2	Sunflower Oil 1L	CON-210	Grocery	🌻	100% pure sunflower oil. Light taste, suitable for all cooking.	2650	84	AED 11.00	2026-04-10 17:06:51.369665
13	2	Android Tablet 10"	CON-450	Electronics	📱	10-inch display, quad-core processor, 3GB RAM. Ideal for productivity.	890	55	AED 380.00	2026-04-10 17:06:51.369665
14	2	USB-C Charging Hub 7-in-1	CON-461	Electronics	🔌	7-in-1 USB-C hub with 4K HDMI, SD card, and 100W PD charging.	1200	60	AED 95.00	2026-04-10 17:06:51.369665
15	2	Bluetooth Earbuds TWS	CON-470	Electronics	🎧	True wireless earbuds with 24hr battery life and noise cancellation.	1050	58	AED 120.00	2026-04-10 17:06:51.369665
16	2	Olive Oil Extra Virgin 750ml	CON-215	Grocery	🫒	Cold-pressed extra virgin olive oil. Imported from the Mediterranean.	1800	69	AED 28.00	2026-04-10 17:06:51.369665
17	3	Dishwashing Liquid 750ml	GRD-011	Kitchen	🍽️	Powerful grease-cutting formula. Gentle on hands, tough on grease.	2100	83	AED 7.50	2026-04-10 17:06:51.369665
18	3	Floor Cleaner Citrus 1L	GRD-015	Floor Care	🧹	Multi-surface floor cleaner. Kills 99.9% germs. Citrus fragrance.	1780	75	AED 9.00	2026-04-10 17:06:51.369665
19	3	Toilet Bowl Cleaner 500ml	GRD-020	Bathroom	🚽	Thick formula clings to bowl surface. Removes limescale and stains.	1540	70	AED 6.00	2026-04-10 17:06:51.369665
20	3	Glass Cleaner Spray 500ml	GRD-025	Surface Care	🪟	Streak-free glass cleaner for windows, mirrors and glass surfaces.	1320	65	AED 8.00	2026-04-10 17:06:51.369665
21	3	Laundry Detergent Powder 3kg	GRD-030	Laundry	👕	Concentrated detergent powder. Removes tough stains at low temperatures.	2450	86	AED 24.00	2026-04-10 17:06:51.369665
22	3	Multi-Purpose Spray 500ml	GRD-035	Surface Care	🧽	All-in-one surface cleaner. Safe on all household surfaces.	1640	73	AED 7.00	2026-04-10 17:06:51.369665
23	4	Women Kurti Floral Print	SEN-301	Clothing	👗	Elegant floral print kurti. Available in S-XL. Cotton blend.	1430	68	AED 65.00	2026-04-10 17:06:51.369665
24	4	Men Formal Shirt	SEN-320	Clothing	👔	Premium cotton formal shirt. Multiple colours. Slim fit design.	980	50	AED 75.00	2026-04-10 17:06:51.369665
25	4	Perfume Floral 50ml	SEN-400	Fragrance	🌸	Long-lasting floral fragrance. Notes of rose, jasmine and musk.	1220	62	AED 85.00	2026-04-10 17:06:51.369665
26	4	Body Lotion Rose 400ml	SEN-410	Skin Care	🌹	Luxuriously creamy rose-scented body lotion for silky smooth skin.	1550	71	AED 28.00	2026-04-10 17:06:51.369665
27	4	Lip Gloss Nude Collection	SEN-420	Makeup	💄	High-shine lip gloss in 6 nude shades. Long-lasting formula.	880	48	AED 32.00	2026-04-10 17:06:51.369665
28	4	Abaya Classic Black	SEN-330	Clothing	🖤	Premium quality classic abaya with subtle embroidery detail.	760	42	AED 180.00	2026-04-10 17:06:51.369665
29	5	Fabric Softener Lavender 1L	HC-033	Laundry	👕	Long-lasting lavender freshness. Suitable for all fabric types.	1650	70	AED 11.00	2026-04-10 17:06:51.369665
30	5	Air Freshener Ocean 300ml	HC-040	Air Care	🌊	Continuous release ocean-breeze air freshener. Up to 45-day use.	1380	64	AED 12.00	2026-04-10 17:06:51.369665
31	5	Microfibre Cleaning Cloth Set	HC-050	Cleaning Tools	🧤	Set of 5 ultra-soft microfibre cloths for streak-free cleaning.	920	52	AED 18.00	2026-04-10 17:06:51.369665
32	5	Mop Bucket Set	HC-060	Cleaning Tools	🪣	Spin mop with 360 degree rotating head and press-wring bucket.	560	38	AED 45.00	2026-04-10 17:06:51.369665
33	5	Toilet Freshener Clip	HC-045	Bathroom	🚿	Under-rim toilet freshener. Keeps bathroom fresh for 30 days.	1800	76	AED 5.00	2026-04-10 17:06:51.369665
34	6	Vitamin C 500mg 30 Tablets	WF-102	Supplements	💊	Immune support supplement. 30 tablets per pack, daily dose.	1890	78	AED 22.00	2026-04-10 17:06:51.369665
35	6	Multi-Vitamin Complex 60 Caps	WF-105	Supplements	🌿	Complete daily nutrition with 22 essential vitamins and minerals.	1450	65	AED 45.00	2026-04-10 17:06:51.369665
36	6	Whey Protein Chocolate 1kg	WF-200	Sports Nutrition	🏋	High-quality whey protein. 24g protein per serving. Low sugar.	1120	58	AED 120.00	2026-04-10 17:06:51.369665
37	6	Omega-3 Fish Oil 60 Softgels	WF-110	Supplements	🐟	Pharmaceutical-grade omega-3 fatty acids. 1000mg per capsule.	1340	62	AED 38.00	2026-04-10 17:06:51.369665
38	6	Green Tea Extract 90 Caps	WF-115	Supplements	🍵	Standardised green tea extract with EGCG for antioxidant support.	980	52	AED 28.00	2026-04-10 17:06:51.369665
39	6	Protein Snack Bar (Box 12)	WF-210	Sports Nutrition	🍫	High-protein snack bars, 20g protein each. Available in 3 flavours.	1650	73	AED 55.00	2026-04-10 17:06:51.369665
40	6	Collagen Peptides 250g	WF-120	Supplements	✨	Hydrolysed collagen peptides for skin, hair, and joint health.	860	47	AED 65.00	2026-04-10 17:06:51.369665
41	6	Probiotic Capsules 30ct	WF-125	Supplements	🦠	10 billion CFU probiotic blend for digestive health and immunity.	1100	56	AED 35.00	2026-04-10 17:06:51.369665
\.


--
-- TOC entry 5062 (class 0 OID 73824)
-- Dependencies: 224
-- Data for Name: purchase_orders; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.purchase_orders (id, product_id, supplier_name, qty_ordered, cost_price, lead_time_days, status, po_date, delivery_date, notes, created_at) FROM stdin;
\.


--
-- TOC entry 5066 (class 0 OID 74004)
-- Dependencies: 228
-- Data for Name: sales_transactions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.sales_transactions (id, product_id, qty_sold, sale_price, channel, market, sale_date, notes, created_at) FROM stdin;
\.


--
-- TOC entry 5077 (class 0 OID 0)
-- Dependencies: 219
-- Name: brands_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.brands_id_seq', 6, true);


--
-- TOC entry 5078 (class 0 OID 0)
-- Dependencies: 225
-- Name: inventory_logs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.inventory_logs_id_seq', 1, false);


--
-- TOC entry 5079 (class 0 OID 0)
-- Dependencies: 221
-- Name: products_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.products_id_seq', 41, true);


--
-- TOC entry 5080 (class 0 OID 0)
-- Dependencies: 223
-- Name: purchase_orders_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.purchase_orders_id_seq', 1, false);


--
-- TOC entry 5081 (class 0 OID 0)
-- Dependencies: 227
-- Name: sales_transactions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.sales_transactions_id_seq', 1, false);


--
-- TOC entry 4893 (class 2606 OID 73797)
-- Name: brands brands_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.brands
    ADD CONSTRAINT brands_name_key UNIQUE (name);


--
-- TOC entry 4895 (class 2606 OID 73795)
-- Name: brands brands_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.brands
    ADD CONSTRAINT brands_pkey PRIMARY KEY (id);


--
-- TOC entry 4903 (class 2606 OID 73996)
-- Name: inventory_logs inventory_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inventory_logs
    ADD CONSTRAINT inventory_logs_pkey PRIMARY KEY (id);


--
-- TOC entry 4897 (class 2606 OID 73815)
-- Name: products products_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_pkey PRIMARY KEY (id);


--
-- TOC entry 4899 (class 2606 OID 73817)
-- Name: products products_sku_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_sku_key UNIQUE (sku);


--
-- TOC entry 4901 (class 2606 OID 73833)
-- Name: purchase_orders purchase_orders_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.purchase_orders
    ADD CONSTRAINT purchase_orders_pkey PRIMARY KEY (id);


--
-- TOC entry 4905 (class 2606 OID 74013)
-- Name: sales_transactions sales_transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sales_transactions
    ADD CONSTRAINT sales_transactions_pkey PRIMARY KEY (id);


--
-- TOC entry 4908 (class 2606 OID 73997)
-- Name: inventory_logs inventory_logs_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inventory_logs
    ADD CONSTRAINT inventory_logs_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id);


--
-- TOC entry 4906 (class 2606 OID 73818)
-- Name: products products_brand_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_brand_id_fkey FOREIGN KEY (brand_id) REFERENCES public.brands(id) ON DELETE CASCADE;


--
-- TOC entry 4907 (class 2606 OID 73834)
-- Name: purchase_orders purchase_orders_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.purchase_orders
    ADD CONSTRAINT purchase_orders_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id);


--
-- TOC entry 4909 (class 2606 OID 74014)
-- Name: sales_transactions sales_transactions_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sales_transactions
    ADD CONSTRAINT sales_transactions_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id);


-- Completed on 2026-04-13 14:37:52

--
-- PostgreSQL database dump complete
--


