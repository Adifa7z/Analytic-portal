const isRtl = document.documentElement.lang === "ar";
async function loadFragment(targetId, url, mode = 'replace') {
  const target = document.getElementById(targetId);
  if (!target) return;
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error(`Failed to load ${url}`);
  const html = await res.text();
  if (mode === 'append') target.insertAdjacentHTML('beforeend', html);
  else target.innerHTML = html;
}

const gradientOptions = [
  'linear-gradient(135deg,#1A56DB,#60A5FA)',
  'linear-gradient(135deg,#F59E0B,#D97706)',
  'linear-gradient(135deg,#EF4444,#B91C1C)',
  'linear-gradient(135deg,#8B5CF6,#6D28D9)',
  'linear-gradient(135deg,#06B6D4,#0E7490)',
  'linear-gradient(135deg,#10B981,#047857)',
  'linear-gradient(135deg,#EC4899,#BE185D)',
  'linear-gradient(135deg,#F97316,#C2410C)',
];
let selectedGradient = gradientOptions[0];

async function bootstrapPortal() {
  try {
    await loadFragment('auth-container', 'components/auth-login.html', 'append');
    await loadFragment('auth-container', 'components/auth-signup.html', 'append');
    await loadFragment('app-root', 'components/layout.html');

    await loadFragment('sidebar-container', 'components/sidebar.html');
    await loadFragment('topbar-container', 'components/topbar.html');

    const pages = ['dashboard','analytics','brands','products','inventory','network','reports','spotlight','settings','contact','purchase-intelligence','inventory-control','retail-ops','decision-support'];
    await Promise.all(pages.map(p => loadFragment('pages-container', `pages/${p}.html`, 'append')));

    await loadFragment('modals-container', 'components/modals/pbi-overlay.html', 'append');
    await loadFragment('modals-container', 'components/modals/city-bi-overlay.html', 'append');
    await loadFragment('modals-container', 'components/modals/brand-detail-overlay.html', 'append');
    await loadFragment('modals-container', 'components/modals/product-analytics-overlay.html', 'append');

    if (typeof translate === 'function') translate();
    if (typeof initProducts === 'function') initProducts();
    if (typeof animateBars === 'function') animateBars();
    // ✅ Load brands from DB on startup
    loadBrandsFromDB();
  } catch (err) {
    console.error(err);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootstrapPortal);
} else {
  bootstrapPortal();
}

// ─── TRANSLATIONS ───────────────────────────────────────────
const i18n = {
  en: {
    enterprise_portal:'Enterprise Portal',overview:'Overview',management:'Management',insights:'Insights',other:'Other',
    dashboard:'Dashboard',analytics:'Analytics',brands:'Brands',our_network:'Our Network',
    reports:'Reports',power_bi:'Power BI',spotlight:'Spotlight',settings:'Settings',contact:'Contact',
    collapse:'Collapse',products:'Products',markets:'Markets',
    welcome_tag:'Analyze. Track. Grow.',
    hero_title:'Your Central Hub for,\nData, Insights, and Growth.',
    hero_desc:'Delivering 1,000+ products across 14+ brands in 10+ markets worldwide.',
    total_products:'Total Products',active_distributors:'Active Distributors',
    monthly_revenue:'Monthly Revenue',low_stock:'Low Stock Alerts',
    sales_by_category:'Sales by Category',category_split:'Category Distribution',
    recent_activity:'Recent Activity',view_all:'View all',search:'Search products, brands, cities...',
    login_title:'Welcome back',login_sub:'Sign in to your enterprise account',
    signup_title:'Create Account',signup_sub:'Join the Jan & Bros enterprise platform',
    email_label:'Email Address',password_label:'Password',fullname_label:'Full Name',
    email_ph:'admin@janbros.com',pass_ph:'••••••••',
    signin_btn:'Sign In',create_account_btn:'Create Account',
    no_account:"Don't have an account?",signup_link:'Create one',
    have_account:'Already have an account?',signin_link:'Sign in',
    demo_hint:'Demo: any email / any password',
    or_divider:'OR',profile:'My Profile',logout:'Sign Out',
    personal_care:'Personal Care',home_care:'Home Care',food_wellness:'Food & Wellness',
    all_brands:'All Brands Page',daily_utility:'Daily Utility',
    brands_sub:'All 14+ brands managed by Jan & Bros',
    add_brand:'+ Add Brand',filter_brands:'Filter brands...',
    th_brand:'Brand',th_category:'Category',th_products:'Products',th_status:'Status',th_market:'Market',th_action:'Action',
    view_btn:'View',active:'Active',review:'Review',
    add_brand_title:'Add New Brand',add_brand_sub:'Fill in the details to register a new brand',
    brand_name_label:'Brand Name',brand_name_ph:'e.g. reCare Aqua',
    brand_initials_label:'Initials (2–3 chars)',brand_initials_ph:'e.g. rC',
    brand_cat_label:'Category',brand_market_label:'Markets',
    brand_market_ph:'e.g. UAE, KSA',brand_status_label:'Status',
    brand_cancel:'Cancel',brand_save:'Save Brand',
    bd_total_products:'Total Products',bd_units_stock:'Units in Stock',
    bd_monthly_rev:'Monthly Revenue',bd_growth:'Growth MoM',
    bd_search_ph:'Search products...',bd_all:'All',
    bd_view_site:'View on janbros.com',bd_products_shown:'products shown',bd_stock:'Stock',
  },
  ar: {
    enterprise_portal:'بوابة المؤسسة',overview:'نظرة عامة',management:'الإدارة',insights:'الرؤى',other:'أخرى',
    dashboard:'لوحة التحكم',analytics:'التحليلات',brands:'العلامات التجارية',inventory:'المخزون',our_network:'شبكتنا',
    reports:'التقارير',power_bi:'باور بي آي',spotlight:'الأضواء',settings:'الإعدادات',contact:'اتصل بنا',
    collapse:'طي',products:'المنتجات',markets:'الأسواق',
    welcome_tag:'منصة الذكاء المؤسسي',
    hero_title:'نحن معك\nللحفاظ على النظافة الجيدة.',
    hero_desc:'نقدم أكثر من 1000 منتج عبر أكثر من 14 علامة تجارية في أكثر من 10 أسواق حول العالم.',
    total_products:'إجمالي المنتجات',active_distributors:'الموزعون النشطون',
    monthly_revenue:'الإيرادات الشهرية',low_stock:'تحذيرات المخزون المنخفض',
    sales_by_category:'المبيعات حسب الفئة',category_split:'توزيع الفئات',
    recent_activity:'النشاط الأخير',view_all:'عرض الكل',search:'البحث عن المنتجات والعلامات والمدن...',
    login_title:'مرحباً بعودتك',login_sub:'سجّل دخولك إلى حساب مؤسستك',
    signup_title:'إنشاء حساب',signup_sub:'انضم إلى منصة جان آند بروز',
    email_label:'البريد الإلكتروني',password_label:'كلمة المرور',fullname_label:'الاسم الكامل',
    email_ph:'admin@janbros.com',pass_ph:'••••••••',
    signin_btn:'تسجيل الدخول',create_account_btn:'إنشاء الحساب',
    no_account:'ليس لديك حساب؟',signup_link:'أنشئ واحداً',
    have_account:'لديك حساب بالفعل؟',signin_link:'تسجيل الدخول',
    demo_hint:'تجريبي: أي بريد إلكتروني / أي كلمة مرور',
    or_divider:'أو',profile:'ملفي الشخصي',logout:'تسجيل الخروج',
    personal_care:'العناية الشخصية',home_care:'العناية بالمنزل',food_wellness:'الغذاء والصحة',
    all_brands:'صفحة جميع العلامات',daily_utility:'المستلزمات اليومية',
    brands_sub:'أكثر من 14 علامة تجارية تديرها جان آند بروز',
    add_brand:'+ إضافة علامة',filter_brands:'تصفية العلامات...',
    th_brand:'العلامة',th_category:'الفئة',th_products:'المنتجات',th_status:'الحالة',th_market:'السوق',th_action:'الإجراء',
    view_btn:'عرض',active:'نشط',review:'مراجعة',
    add_brand_title:'إضافة علامة جديدة',add_brand_sub:'أدخل التفاصيل لتسجيل علامة تجارية جديدة',
    brand_name_label:'اسم العلامة',brand_name_ph:'مثال: reCare Aqua',
    brand_initials_label:'الاختصار (2–3 حروف)',brand_initials_ph:'مثال: rC',
    brand_cat_label:'الفئة',brand_market_label:'الأسواق',
    brand_market_ph:'مثال: UAE, KSA',brand_status_label:'الحالة',
    brand_cancel:'إلغاء',brand_save:'حفظ العلامة',
    bd_total_products:'إجمالي المنتجات',bd_units_stock:'وحدات في المخزن',
    bd_monthly_rev:'الإيرادات الشهرية',bd_growth:'النمو شهرياً',
    bd_search_ph:'بحث عن منتج...',bd_all:'الكل',
    bd_view_site:'عرض على janbros.com',bd_products_shown:'منتج معروض',bd_stock:'المخزون',
  }
};
let currentLang = 'en';
let isDark = false;

function translate() {
  const t = i18n[currentLang];
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (t[key] !== undefined) el.textContent = t[key];
  });
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const key = el.getAttribute('data-i18n-placeholder');
    if (t[key] !== undefined) el.placeholder = t[key];
  });
  const abOverlay = document.getElementById('add-brand-overlay');
  if (abOverlay && abOverlay.classList.contains('open')) _renderAddBrandModal();
  const bdModal = document.querySelector('#brand-detail-overlay .pbi-modal');
  if (bdModal) bdModal.setAttribute('dir', currentLang === 'ar' ? 'rtl' : 'ltr');
}

function setLang(lang, btn) {
  currentLang = lang;
  document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  document.documentElement.lang = lang;
  document.querySelectorAll('.lang-btn').forEach(b => {
    b.classList.toggle('active',
      (lang==='en' && b.textContent==='EN') ||
      (lang==='ar' && b.textContent==='AR') ||
      (lang==='en' && b.textContent==='English') ||
      (lang==='ar' && b.textContent==='العربية'));
  });
  translate();
}
function setAuthLang(lang, btn) { setLang(lang, btn); }
function setLangSettings(lang, btn) {
  setLang(lang, btn);
  btn.closest('.lang-toggle').querySelectorAll('.lang-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
}

// ─── AUTH ────────────────────────────────────────────────────
function doLogin() {
  document.querySelectorAll('.auth-screen').forEach(s => s.classList.remove('active'));
  document.getElementById('app-layout').style.display = 'flex';
  translate();
  initProducts();
  animateBars();
  loadBrandsFromDB(); // ✅ reload brands on login
}
function doLogout() {
  document.getElementById('app-layout').style.display = 'none';
  document.getElementById('avatar-menu').classList.remove('open');
  document.getElementById('auth-login').classList.add('active');
}
function showSignup() {
  document.getElementById('auth-login').classList.remove('active');
  document.getElementById('auth-signup').classList.add('active');
}
function showLogin() {
  document.getElementById('auth-signup').classList.remove('active');
  document.getElementById('auth-login').classList.add('active');
}

// ─── THEME ───────────────────────────────────────────────────
function toggleTheme() {
  isDark = !isDark;
  document.documentElement.setAttribute('data-theme', isDark ? 'dark' : '');
  const icon = document.getElementById('theme-icon');
  icon.innerHTML = isDark
    ? '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>'
    : '<circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>';
  const toggle = document.getElementById('dark-toggle');
  if (toggle) toggle.classList.toggle('on', isDark);
}
function toggleThemeBtn(btn) {
  btn.classList.toggle('on');
  isDark = btn.classList.contains('on');
  document.documentElement.setAttribute('data-theme', isDark ? 'dark' : '');
  const icon = document.getElementById('theme-icon');
  if (icon) icon.innerHTML = isDark
    ? '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>'
    : '<circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>';
}

// ─── SIDEBAR ─────────────────────────────────────────────────
function toggleSidebar() { document.getElementById('sidebar').classList.toggle('collapsed'); }
function toggleSidebarBtn(btn) {
  btn.classList.toggle('on');
  document.getElementById('sidebar').classList.toggle('collapsed', btn.classList.contains('on'));
  document.getElementById('sidebar-toggle').classList.toggle('on', btn.classList.contains('on'));
}

// ─── NAVIGATE ────────────────────────────────────────────────
function navigate(page, el) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  const pg = document.getElementById('page-' + page);
  if (pg) pg.classList.add('active');
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  if (el) el.classList.add('active');
  const titleMap = {
    dashboard:'dashboard', analytics:'analytics', brands:'brands', products:'products',
    inventory:'inventory', network:'our_network', reports:'reports',
    spotlight:'spotlight', settings:'settings', contact:'contact'
  };
  const t = i18n[currentLang];
  document.getElementById('page-title').textContent = t[titleMap[page]] || page;
  closeAvatarMenu();
  if (page === 'products')  initProducts();
  if (page === 'dashboard') animateBars();
  if (page === 'brands')    loadBrandsFromDB(); // ✅ DB reload on navigate
}

// ─── BRAND DROPDOWN ──────────────────────────────────────────
function toggleBrandDropdown() {
  const menu = document.getElementById('brand-dropdown-menu');
  const btn = document.getElementById('brand-dropdown-btn');
  if (!menu || !btn) return;
  const isOpen = menu.classList.toggle('open');
  btn.classList.toggle('open', isOpen);
}
function closeBrandDropdown() {
  const menu = document.getElementById('brand-dropdown-menu');
  const btn  = document.getElementById('brand-dropdown-btn');
  if (menu) menu.classList.remove('open');
  if (btn)  btn.classList.remove('open');
}

// ─── AVATAR MENU ─────────────────────────────────────────────
function toggleAvatarMenu() { const m = document.getElementById('avatar-menu'); if (m) m.classList.toggle('open'); }
function closeAvatarMenu()  { const m = document.getElementById('avatar-menu'); if (m) m.classList.remove('open'); }
// ─── SEARCH ──────────────────────────────────────────────────
const searchData = [
  {name:'Toothpaste',type:'Product',icon:'🦷',cat:'Pharmacy',page:'products'},
  {name:'Vitamin C',type:'Product',icon:'💊',cat:'Pharmacy',page:'products'},
  {name:'Wheat Flour',type:'Product',icon:'🌾',cat:'Grocery',page:'products'},
  {name:'Tablet',type:'Product',icon:'💻',cat:'Electronics',page:'products'},
  {name:'Sugar 5kg',type:'Product',icon:'🍬',cat:'Grocery',page:'products'},
  {name:'Women Kurti',type:'Product',icon:'👗',cat:'Clothing',page:'products'},
  {name:'reCare Aqua',type:'Brand',icon:'🧴',cat:'Personal Care',page:'brands'},
  {name:'Concord',type:'Brand',icon:'📦',cat:'Daily Utility',page:'brands'},
  {name:'Guard',type:'Brand',icon:'🛡️',cat:'Home Care',page:'brands'},
  {name:'Señorita',type:'Brand',icon:'💄',cat:'Personal Care',page:'brands'},
  {name:'WellFit',type:'Brand',icon:'💚',cat:'Food & Wellness',page:'brands'},
  {name:'Bangalore',type:'City',icon:'🇮🇳',cat:'342 products',page:'network'},
  {name:'Dubai',type:'City',icon:'🇦🇪',cat:'401 products',page:'network'},
  {name:'Mumbai',type:'City',icon:'🇮🇳',cat:'332 products',page:'network'},
  {name:'Chennai',type:'City',icon:'🇮🇳',cat:'318 products',page:'network'},
  {name:'Delhi',type:'City',icon:'🇮🇳',cat:'289 products',page:'network'},
  {name:'Madrid',type:'City',icon:'🇪🇸',cat:'195 products',page:'network'},
  {name:'Paris',type:'City',icon:'🇫🇷',cat:'168 products',page:'network'},
  {name:'Dashboard',type:'Page',icon:'📊',cat:'Overview',page:'dashboard'},
  {name:'Analytics',type:'Page',icon:'📈',cat:'Insights',page:'analytics'},
  {name:'Inventory',type:'Page',icon:'📦',cat:'Management',page:'inventory'},
  {name:'Reports',type:'Page',icon:'📋',cat:'Insights',page:'reports'},
];

let searchTimeout;
function doSearch(val) {
  clearTimeout(searchTimeout);
  if (!val.trim()) {
    document.getElementById('search-results').innerHTML = '';
    document.getElementById('search-results').classList.remove('show');
    return;
  }
  searchTimeout = setTimeout(() => {
    const q = val.toLowerCase();
    const results = searchData.filter(d =>
      d.name.toLowerCase().includes(q) ||
      d.cat.toLowerCase().includes(q) ||
      d.type.toLowerCase().includes(q)
    ).slice(0, 8);
    const el = document.getElementById('search-results');
    if (!results.length) {
      el.innerHTML = '<div style="padding:16px;text-align:center;font-size:13px;color:var(--text3)">No results found</div>';
      el.classList.add('show');
      return;
    }
    el.innerHTML = results.map(r =>
      `<div class="search-result-item" onmousedown="navigateSearch('${r.page}','${r.name}','${r.type}')">
        <div class="search-result-icon" style="background:var(--surface2)">${r.icon}</div>
        <div><div class="search-result-name">${highlight(r.name, val)}</div>
        <div class="search-result-type">${r.type} · ${r.cat}</div></div>
      </div>`
    ).join('');
    el.classList.add('show');
  }, 150);
}
function highlight(text, q) {
  const idx = text.toLowerCase().indexOf(q.toLowerCase());
  if (idx < 0) return text;
  return text.slice(0, idx) +
    '<mark style="background:var(--primary-light);color:var(--primary);border-radius:2px">' +
    text.slice(idx, idx + q.length) + '</mark>' + text.slice(idx + q.length);
}
function navigateSearch(page, name, type) {
  document.getElementById('search-input').value = '';
  document.getElementById('search-results').classList.remove('show');
  if (type === 'City') { openCityDashboard(name); } else { navigate(page, null); }
}
function showSearchResults() {
  if (document.getElementById('search-input').value)
    document.getElementById('search-results').classList.add('show');
}
function hideSearchResults() {
  setTimeout(() => document.getElementById('search-results').classList.remove('show'), 200);
}

// ─── BRANDS FILTER (table search) ────────────────────────────
function filterBrands(query) {
  const rows = document.querySelectorAll('#brands-table tbody tr');
  rows.forEach(row => {
    row.style.display = row.textContent.toLowerCase().includes(query.toLowerCase()) ? '' : 'none';
  });
}

// ─── PRODUCTS DATA (static — for Products page) ──────────────
let productsData = []; 
/*
  {name:'Antibacterial Liquid Soap',brand:'reCare Aqua',cat:'Pharmacy',icon:'🧴',desc:'99.9% antibacterial protection. Gentle on skin with moisturizing formula.',sku:'RCA-001',stock:2340,stockPct:92},
  {name:'Vitamin C 500mg Tablets',brand:'WellFit',cat:'Pharmacy',icon:'💊',desc:'Immune support supplement. 30 tablets per pack, daily dose formula.',sku:'WF-102',stock:1890,stockPct:78},
  {name:'Multi-Vitamin Complex',brand:'WellFit',cat:'Pharmacy',icon:'🌿',desc:'Complete daily nutrition with 22 essential vitamins and minerals.',sku:'WF-105',stock:1450,stockPct:65},
  {name:'Whitening Toothpaste',brand:'reCare Aqua',cat:'FMCG',icon:'🦷',desc:'Advanced whitening with fluoride. Fresh mint flavour. 150g tube.',sku:'RCA-020',stock:3350,stockPct:95},
  {name:'Dishwashing Liquid',brand:'Guard',cat:'FMCG',icon:'🍽️',desc:'Powerful grease-cutting formula. Gentle on hands, tough on grease.',sku:'GRD-011',stock:2100,stockPct:83},
  {name:'Fabric Softener',brand:'HomeCare+',cat:'FMCG',icon:'👕',desc:'Long-lasting freshness. 1L bottle, suitable for all fabric types.',sku:'HC-033',stock:1650,stockPct:70},
  {name:'Wheat Flour 5kg',brand:'Concord',cat:'Grocery',icon:'🌾',desc:'Premium quality wheat flour. Ideal for baking, cooking, and pastry.',sku:'CON-200',stock:3160,stockPct:88},
  {name:'Sugar 5kg',brand:'Concord',cat:'Grocery',icon:'🍬',desc:'Refined white sugar, food-grade quality. 5kg family pack.',sku:'CON-201',stock:2840,stockPct:80},
  {name:'Basmati Rice 2kg',brand:'Concord',cat:'Grocery',icon:'🍚',desc:'Long-grain aromatic basmati rice. Premium aged quality.',sku:'CON-205',stock:2200,stockPct:72},
  {name:'Android Tablet 10"',brand:'Concord',cat:'Electronics',icon:'📱',desc:'10-inch display, quad-core processor, 3GB RAM. Ideal for productivity.',sku:'CON-450',stock:890,stockPct:55},
  {name:'USB-C Charging Hub',brand:'Concord',cat:'Electronics',icon:'🔌',desc:'7-in-1 USB-C hub with 4K HDMI, SD card, and 100W PD charging.',sku:'CON-461',stock:1200,stockPct:60},
  {name:'Women Kurti (Floral)',brand:'Señorita',cat:'Clothing',icon:'👗',desc:'Elegant floral print kurti. Available in S, M, L, XL. Cotton blend.',sku:'SEN-301',stock:1430,stockPct:68},
  {name:'Men Formal Shirt',brand:'Señorita',cat:'Clothing',icon:'👔',desc:'Premium cotton formal shirt. Multiple colors. Slim fit design.',sku:'SEN-320',stock:980,stockPct:50},
  {name:'Floor Cleaner',brand:'Guard',cat:'FMCG',icon:'🧹',desc:'Multi-surface floor cleaner. Kills 99.9% germs. Citrus fragrance.',sku:'GRD-015',stock:1780,stockPct:75},
  {name:'Shampoo (Argan Oil)',brand:'reCare Aqua',cat:'Pharmacy',icon:'💆',desc:'Nourishing argan oil shampoo. Suitable for dry and damaged hair.',sku:'RCA-055',stock:1960,stockPct:82},
*/

const _editSVG   = `<svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>`;
const _deleteSVG = `<svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>`;

function _actionBtns(sku) {
  return `
    <div class="product-card-actions" style="display:flex;gap:5px;justify-content:flex-end;margin-top:8px;padding-top:8px;border-top:1px solid var(--border)">
      <button onclick="openEditProduct('${sku}')" title="Edit product"
        style="flex:1;padding:6px 0;border-radius:7px;border:1.5px solid var(--border);background:var(--surface2);cursor:pointer;display:flex;align-items:center;justify-content:center;gap:4px;color:var(--primary);font-size:11px;font-weight:600;transition:all 0.15s"
        onmouseover="this.style.background='#EEF2FF'" onmouseout="this.style.background='var(--surface2)'">
        ${_editSVG} Edit
      </button>
      <button onclick="deleteProduct('${sku}')" title="Delete product"
        style="flex:1;padding:6px 0;border-radius:7px;border:1.5px solid #fee2e2;background:#fef2f2;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:4px;color:#dc2626;font-size:11px;font-weight:600;transition:all 0.15s"
        onmouseover="this.style.background='#fee2e2'" onmouseout="this.style.background='#fef2f2'">
        ${_deleteSVG} Delete
      </button>
    </div>`;
}

function initProducts() {
  loadProductsFromDB();
}
function renderProducts(data) {
  const grid = document.getElementById('products-grid');
  if (!grid) return;
  if (!data.length) {
    grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:60px 20px;color:var(--text3);font-size:14px">No products found.</div>';
    return;
  }
  grid.innerHTML = data.map(p => `
    <div class="product-card" data-cat="${p.cat}" data-sku="${p.sku}">
      <div class="product-card-img" style="background:${catColor(p.cat)}">${p.icon}</div>
      <div class="product-card-body">
        <div class="product-card-brand">${p.brand}</div>
        <div class="product-card-name">${p.name}</div>
        <div class="product-card-desc">${p.desc}</div>
        <div class="product-card-footer">
          <span class="product-card-sku">${p.sku}</span>
          <span class="product-card-stock" style="color:${p.stockPct>75?'var(--success)':p.stockPct>50?'var(--warning)':'var(--danger)'}">${p.stock.toLocaleString()} units</span>
        </div>
        ${_actionBtns(p.sku)}
      </div>
    </div>
  `).join('');
}

function catColor(cat) {
  const map = {
    Pharmacy:'linear-gradient(135deg,#EBF2FF,#BFDBFE)',
    FMCG:'linear-gradient(135deg,#ECFDF5,#A7F3D0)',
    Grocery:'linear-gradient(135deg,#FFFBEB,#FDE68A)',
    Clothing:'linear-gradient(135deg,#FFF1F2,#FECDD3)',
    Electronics:'linear-gradient(135deg,#F5F3FF,#DDD6FE)'
  };
  return map[cat] || 'var(--surface2)';
}

function filterProducts(cat, chip) {
  document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
  chip.classList.add('active');
  renderProducts(cat === 'all' ? productsData : productsData.filter(p => p.cat === cat));
}
function filterProductsSearch(val) {
  const q = val.toLowerCase();
  renderProducts(q ? productsData.filter(p =>
    p.name.toLowerCase().includes(q) ||
    p.brand.toLowerCase().includes(q) ||
    p.cat.toLowerCase().includes(q)
  ) : productsData);
}

// ─── PRODUCT: DELETE ─────────────────────────────────────────
async function deleteProduct(sku) {
  const product = productsData.find(p => p.sku === sku);
  if (!product) return;

  if (!confirm(`Delete "${product.name}"?`)) return;

  await fetch(`/api/products/${product.id}`, {
    method: 'DELETE'
  });

  await loadProductsFromDB();
}

// ─── PRODUCT: MODAL ──────────────────────────────────────────
const PRODUCT_CATS     = ['Pharmacy','FMCG','Grocery','Clothing','Electronics'];
const PRODUCT_CAT_ICONS = {Pharmacy:'💊',FMCG:'🛒',Grocery:'🌾',Clothing:'👗',Electronics:'💻'};
let BRAND_NAMES = [];

async function loadBrandsForDropdown() {
  const res = await fetch('/api/brands');
  const json = await res.json();
  BRAND_NAMES = json.data; // [{id, name}]
}
function _modalInputStyle() {
  return 'width:100%;padding:10px 12px;border:1.5px solid var(--border);border-radius:10px;background:var(--surface2);color:var(--text);font-size:13px;outline:none;box-sizing:border-box;font-family:inherit';
}
async function openAddProduct() {
  await loadBrandsForDropdown();
  _openProductModal(null);
}
async function openEditProduct(sku) {
  await loadBrandsForDropdown();
}


function _openProductModal(sku) {
  const isEdit  = sku !== null;
  const product = isEdit ? productsData.find(p => p.sku === sku) : null;
  if (isEdit && !product) return;

  let overlay = document.getElementById('product-modal-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'product-modal-overlay';
    overlay.className = 'pbi-overlay';
    overlay.style.zIndex = '700';
    overlay.onclick = (e) => { if (e.target === overlay) closeProductModal(); };
    document.body.appendChild(overlay);
  }

  const s        = _modalInputStyle();
  const cats     = PRODUCT_CATS;
  const brands   = BRAND_NAMES;
  const curCat   = product ? product.cat : cats[0];
  const title    = isEdit ? 'Edit Product' : 'Add New Product';
  const subtitle = isEdit ? `Editing: ${product.name}` : 'Fill in product details to add to catalogue';
  const saveLabel= isEdit ? 'Save Changes' : '+ Add Product';

  overlay.innerHTML = `
    <div class="pbi-modal" style="max-width:620px;width:95vw;display:flex;flex-direction:column;max-height:92vh">
      <div class="pbi-header">
        <div>
          <div style="font-size:17px;font-weight:700;color:var(--text)">${title}</div>
          <div style="font-size:12px;color:var(--text3);margin-top:2px">${subtitle}</div>
        </div>
        <button class="pbi-close" onclick="closeProductModal()">✕</button>
      </div>
      <div style="padding:22px 24px;display:flex;flex-direction:column;gap:16px;overflow-y:auto">
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
          <div>
            <label style="font-size:12px;font-weight:600;color:var(--text2);display:block;margin-bottom:6px">Product Name *</label>
            <input id="pm-name" type="text" placeholder="e.g. Antibacterial Liquid Soap" value="${product ? product.name : ''}"
              style="${s}" oninput="_updatePMPreview()"
              onfocus="this.style.borderColor='var(--primary)'" onblur="this.style.borderColor='var(--border)'"/>
          </div>
          <div>
            <label style="font-size:12px;font-weight:600;color:var(--text2);display:block;margin-bottom:6px">Brand</label>
            <select id="pm-brand" style="${s}">
            <option value="">— Select Brand —</option>

            ${(BRAND_NAMES || []).map(b => `
              <option value="${b.id}" ${product && product.brand_id == b.id ? 'selected' : ''}>
                ${b.name}
              </option>
            `).join('')}

            </select>
          </div>
        </div>
        <div>
          <label style="font-size:12px;font-weight:600;color:var(--text2);display:block;margin-bottom:8px">Category *</label>
          <div style="display:flex;gap:7px;flex-wrap:wrap" id="pm-cat-row">
            ${cats.map(c => {
              const active = c === curCat;
              return `<div onclick="_selectPMCat('${c}',this)"
                style="padding:6px 13px;border:1.5px solid ${active?'var(--primary)':'var(--border)'};border-radius:20px;cursor:pointer;font-size:12px;font-weight:500;color:${active?'var(--primary)':'var(--text2)'};background:${active?'rgba(26,86,219,0.07)':'var(--surface2)'};transition:all 0.15s">
                ${PRODUCT_CAT_ICONS[c]} ${c}
              </div>`;
            }).join('')}
          </div>
          <input type="hidden" id="pm-cat" value="${curCat}">
        </div>
        <div>
          <label style="font-size:12px;font-weight:600;color:var(--text2);display:block;margin-bottom:6px">Description</label>
          <textarea id="pm-desc" rows="3" placeholder="Describe the product, key benefits, usage..."
            style="${s};resize:none;line-height:1.5"
            onfocus="this.style.borderColor='var(--primary)'" onblur="this.style.borderColor='var(--border)'">${product ? product.desc : ''}</textarea>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
          <div>
            <label style="font-size:12px;font-weight:600;color:var(--text2);display:block;margin-bottom:6px">Stock Units *</label>
            <input id="pm-stock" type="number" min="0" placeholder="0" value="${product ? product.stock : ''}"
              style="${s}" oninput="_updatePMPreview()"
              onfocus="this.style.borderColor='var(--primary)'" onblur="this.style.borderColor='var(--border)'"/>
          </div>
          <div>
            <label style="font-size:12px;font-weight:600;color:var(--text2);display:block;margin-bottom:6px">Stock Health % <span style="color:var(--text3);font-weight:400">(0–100)</span></label>
            <input id="pm-stockpct" type="number" min="0" max="100" placeholder="75" value="${product ? product.stockPct : ''}"
              style="${s}"
              onfocus="this.style.borderColor='var(--primary)'" onblur="this.style.borderColor='var(--border)'"/>
          </div>
        </div>
        <div style="display:grid;grid-template-columns:1fr auto 1fr;gap:10px;align-items:flex-end">
          <div>
            <label style="font-size:12px;font-weight:600;color:var(--text2);display:block;margin-bottom:6px">SKU Code *</label>
            <div style="display:flex;gap:6px">
              <input id="pm-sku" type="text" placeholder="e.g. RCA-001" value="${product ? product.sku : ''}"
                style="${s};flex:1" ${isEdit ? 'readonly' : ''}
                onfocus="this.style.borderColor='var(--primary)'" onblur="this.style.borderColor='var(--border)'"/>
              ${!isEdit ? `<button onclick="_autoGenSKU()" style="padding:10px 10px;border:1.5px solid var(--border);border-radius:10px;background:var(--surface2);color:var(--primary);font-size:11px;font-weight:700;cursor:pointer;white-space:nowrap">Auto</button>` : ''}
            </div>
            <div style="font-size:11px;color:var(--text3);margin-top:3px">Unique product identifier</div>
          </div>
          <div style="font-size:20px;text-align:center;padding-bottom:8px">→</div>
          <div>
            <label style="font-size:12px;font-weight:600;color:var(--text2);display:block;margin-bottom:6px">Emoji Icon</label>
            <input id="pm-icon" type="text" maxlength="4" placeholder="📦" value="${product ? product.icon : ''}"
              style="${s};text-align:center;font-size:20px" oninput="_updatePMPreview()"
              onfocus="this.style.borderColor='var(--primary)'" onblur="this.style.borderColor='var(--border)'"/>
          </div>
        </div>
        <div style="background:var(--surface2);border:1px solid var(--border);border-radius:12px;padding:14px;display:flex;align-items:center;gap:14px">
          <div id="pm-prev-icon" style="width:52px;height:52px;border-radius:12px;background:${catColor(curCat)};display:flex;align-items:center;justify-content:center;font-size:26px;flex-shrink:0">${product ? product.icon : PRODUCT_CAT_ICONS[curCat]}</div>
          <div style="min-width:0">
            <div id="pm-prev-brand" style="font-size:10px;font-weight:700;color:var(--primary);text-transform:uppercase;margin-bottom:2px">${product ? product.brand : 'BRAND'}</div>
            <div id="pm-prev-name" style="font-size:14px;font-weight:700;color:var(--text);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${product ? product.name : 'Product Name'}</div>
            <div id="pm-prev-sku" style="font-size:11px;color:var(--text3);margin-top:2px">${product ? product.sku+' · '+product.stock.toLocaleString()+' units' : 'SKU · 0 units'}</div>
          </div>
        </div>
      </div>
      <div style="padding:14px 24px;border-top:1px solid var(--border);display:flex;gap:10px;justify-content:flex-end;background:var(--surface2)">
        <button onclick="closeProductModal()" style="padding:9px 20px;border-radius:10px;border:1.5px solid var(--border);background:var(--surface2);color:var(--text2);font-size:13px;font-weight:600;cursor:pointer">Cancel</button>
        <button onclick="_saveProductModal('${isEdit ? sku : ''}')" style="padding:9px 22px;border-radius:10px;background:var(--primary);color:#fff;font-size:13px;font-weight:600;cursor:pointer;border:none">${saveLabel}</button>
      </div>
    </div>`;

  overlay.style.display = 'flex';
  setTimeout(() => overlay.classList.add('open'), 10);
}

function _selectPMCat(cat, el) {
  document.querySelectorAll('#pm-cat-row > div').forEach(d => {
    d.style.borderColor = 'var(--border)';
    d.style.color = 'var(--text2)';
    d.style.background = 'var(--surface2)';
  });
  el.style.borderColor = 'var(--primary)';
  el.style.color = 'var(--primary)';
  el.style.background = 'rgba(26,86,219,0.07)';
  document.getElementById('pm-cat').value = cat;
  document.getElementById('pm-prev-icon').style.background = catColor(cat);
  const icon = document.getElementById('pm-icon').value;
  if (!icon) document.getElementById('pm-prev-icon').textContent = PRODUCT_CAT_ICONS[cat];
  _updatePMPreview();
}
function _autoGenSKU() {
  const brand  = document.getElementById('pm-brand')?.value || 'PRD';
  const prefix = brand.replace(/[^A-Za-z]/g,'').slice(0,3).toUpperCase() || 'PRD';
  document.getElementById('pm-sku').value = prefix + '-' + (Math.floor(Math.random()*900)+100);
  _updatePMPreview();
}
function _updatePMPreview() {
  const name  = document.getElementById('pm-name')?.value || 'Product Name';
  const sku   = document.getElementById('pm-sku')?.value || '';
  const stock = document.getElementById('pm-stock')?.value || '0';
  const icon  = document.getElementById('pm-icon')?.value;

  const brandEl   = document.getElementById('pm-brand');
  const brandName = brandEl?.options[brandEl.selectedIndex]?.text || 'BRAND';

  const cat = document.getElementById('pm-cat')?.value || 'Pharmacy';
  const dispIcon = icon || PRODUCT_CAT_ICONS[cat] || '📦';

  const el = document.getElementById('pm-prev-icon');
  if (el) {
    el.textContent = dispIcon;
    el.style.background = catColor(cat);
  }

  const pn = document.getElementById('pm-prev-name');
  if (pn) pn.textContent = name;

  const pb = document.getElementById('pm-prev-brand');
  if (pb) pb.textContent = brandName !== '— Select Brand —' ? brandName.toUpperCase() : 'BRAND';

  const ps = document.getElementById('pm-prev-sku');
  if (ps) ps.textContent = sku + ' · ' + Number(stock).toLocaleString() + ' units';
}
async function _saveProductModal(editSku) {
  const name = document.getElementById('pm-name').value.trim();
  const brand_id = Number(document.getElementById('pm-brand').value);
  const cat = document.getElementById('pm-cat').value;
  const desc = document.getElementById('pm-desc').value.trim();
  const stock = parseInt(document.getElementById('pm-stock').value);
  const stockPct = parseInt(document.getElementById('pm-stockpct').value);
  const sku = document.getElementById('pm-sku').value.trim();
  const icon = document.getElementById('pm-icon').value.trim() || '📦';

  if (!name || !brand_id || !cat || !sku) {
    alert("Please fill all required fields");
    return;
  }

  try {
    const existing = editSku ? productsData.find(p => p.sku === editSku) : null;

    const url = existing ? `/api/products/${existing.id}` : '/api/products';
    const method = existing ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        brand_id,
        cat,
        desc,
        stock,
        stock_pct: stockPct,
        sku,
        icon
      })
    });
     
    console.log({
        name,
        brand_id,
        cat,
        sku
      });
    if (!res.ok) throw new Error('Failed to save');

    closeProductModal();
    await loadProductsFromDB();

  } catch (err) {
    console.error(err);
    alert('Error saving product');
  }
}

    // ✅ RELOAD FROM DB (VERY IMPORTANT)
   async function loadProductsFromDB() {
  const res = await fetch('/api/products');
  const json = await res.json();

  const formatted = (json.data || []).map(p => ({
    id: p.id,
    brand_id: p.brand_id,
    name: p.name,
    brand: p.brand || '',
    cat: p.cat,
    desc: p.description || '',
    stock: p.stock,
    stockPct: p.stock_pct,
    sku: p.sku,
    icon: p.icon || '📦'
  }));

  productsData = formatted;
  renderProducts(productsData);
}
function initProducts() {
  loadProductsFromDB();
}


function closeProductModal() {
  const overlay = document.getElementById('product-modal-overlay');
  if (!overlay) return;
  overlay.classList.remove('open');
  setTimeout(() => { overlay.style.display = 'none'; }, 300);
}

// ─── BAR ANIMATION ───────────────────────────────────────────
function animateBars() {
  const bars = document.querySelectorAll('.bar');
  bars.forEach((bar, i) => {
    const targetH = bar.style.height;
    bar.style.height = '0';
    setTimeout(() => { bar.style.height = targetH; }, i * 80 + 200);
  });
}

// ─── POWER BI ────────────────────────────────────────────────
const PBI_URL = 'https://app.powerbi.com/reportEmbed?reportId=1e84e47e-e56e-4734-8901-833d973c2755&autoAuth=true&ctid=dcf438c2-e741-4ece-822c-7f42d4d45380';
const pbiTabs = {
  embed: `<div style="grid-column:1/-1;height:560px"><iframe src="${PBI_URL}" width="100%" height="100%" frameborder="0" allowFullScreen="true" style="border-radius:12px"></iframe></div>`,
  overview: `
    <div class="bi-card"><div class="bi-card-title">Category Count by Warehouse × Supplier</div>
    <div style="display:flex;align-items:flex-end;gap:10px;height:140px">
      ${[['Pharm',82,'#1A56DB'],['FMCG',74,'#06B6D4'],['Grocery',70,'#F59E0B'],['Clothing',66,'#8B5CF6'],['Electr',60,'#EF4444']].map(([l,h,c])=>`<div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:4px;height:100%;justify-content:flex-end"><div style="width:100%;background:${c};border-radius:6px 6px 0 0;height:${h}%;position:relative"><div style="position:absolute;inset:0;background:linear-gradient(to bottom,rgba(255,255,255,0.2),transparent);border-radius:6px 6px 0 0"></div></div><div style="font-size:11px;color:var(--text3)">${l}</div></div>`).join('')}
    </div></div>
    <div class="bi-card"><div class="bi-card-title">Top Products by Category Count</div>
    <div style="display:flex;flex-direction:column;gap:10px">
      ${[['Women Kurti',343,100,'#1A56DB'],['Tablet',336,98,'#8B5CF6'],['Toothpaste',335,97,'#06B6D4'],['Vitamin C',329,96,'#F59E0B'],['Wheat Flour',316,92,'#EF4444']].map(([name,val,w,c])=>`<div><div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:4px"><span>${name}</span><span style="color:var(--text2);font-weight:600">${val}</span></div><div style="height:5px;background:var(--surface);border-radius:3px"><div style="width:${w}%;height:100%;background:${c};border-radius:3px"></div></div></div>`).join('')}
    </div></div>`,
  category: `
    <div class="bi-card"><div class="bi-card-title">Category Distribution — Pie Chart</div>
    <svg viewBox="0 0 200 200" style="width:160px;margin:0 auto;display:block">
      <circle cx="100" cy="100" r="80" fill="none" stroke="var(--surface)" stroke-width="30"/>
      <circle cx="100" cy="100" r="80" fill="none" stroke="#1A56DB" stroke-width="30" stroke-dasharray="100 402" stroke-dashoffset="0" transform="rotate(-90 100 100)"/>
      <circle cx="100" cy="100" r="80" fill="none" stroke="#06B6D4" stroke-width="30" stroke-dasharray="84 418" stroke-dashoffset="-100" transform="rotate(-90 100 100)"/>
      <circle cx="100" cy="100" r="80" fill="none" stroke="#F59E0B" stroke-width="30" stroke-dasharray="80 422" stroke-dashoffset="-184" transform="rotate(-90 100 100)"/>
      <circle cx="100" cy="100" r="80" fill="none" stroke="#8B5CF6" stroke-width="30" stroke-dasharray="78 424" stroke-dashoffset="-264" transform="rotate(-90 100 100)"/>
      <circle cx="100" cy="100" r="80" fill="none" stroke="#EF4444" stroke-width="30" stroke-dasharray="60 442" stroke-dashoffset="-342" transform="rotate(-90 100 100)"/>
      <text x="100" y="96" text-anchor="middle" font-size="18" font-weight="700" fill="var(--text)">8.25K</text>
      <text x="100" y="112" text-anchor="middle" font-size="11" fill="var(--text2)">Total Units</text>
    </svg></div>
    <div class="bi-card"><div class="bi-card-title">Category Breakdown</div>
    <div style="display:flex;flex-direction:column;gap:10px">
      <div class="legend-item"><div class="legend-dot" style="background:#1A56DB"></div><span class="legend-label">Pharmacy</span><span class="legend-val">1.75K</span></div>
      <div class="legend-item"><div class="legend-dot" style="background:#06B6D4"></div><span class="legend-label">FMCG</span><span class="legend-val">1.69K</span></div>
      <div class="legend-item"><div class="legend-dot" style="background:#F59E0B"></div><span class="legend-label">Grocery</span><span class="legend-val">1.65K</span></div>
      <div class="legend-item"><div class="legend-dot" style="background:#8B5CF6"></div><span class="legend-label">Clothing</span><span class="legend-val">1.64K</span></div>
      <div class="legend-item"><div class="legend-dot" style="background:#EF4444"></div><span class="legend-label">Electronics</span><span class="legend-val">1.62K</span></div>
    </div></div>`,
  stock: `
    <div class="bi-card" style="grid-column:1/-1"><div class="bi-card-title">Stock In Trend — All Products All Cities</div>
    <div style="display:flex;align-items:flex-end;gap:10px;height:180px">
      ${[['Toothpaste',85,'#1A56DB'],['Vitamin C',78,'#06B6D4'],['Wheat Flour',70,'#F59E0B'],['Tablet',95,'#8B5CF6'],['Sugar 5kg',55,'#EF4444'],['Women Kurti',42,'#10B981']].map(([l,h,c])=>`<div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:5px;height:100%;justify-content:flex-end"><div style="width:100%;background:${c};border-radius:6px 6px 0 0;height:${h}%"></div><div style="font-size:10px;color:var(--text3);text-align:center">${l}</div></div>`).join('')}
    </div></div>`,
  warehouse: `
    <div class="bi-card" style="grid-column:1/-1"><div class="bi-card-title">Warehouse Fill Rate — All Cities</div>
    <div style="display:flex;flex-direction:column;gap:10px">
      ${[['Dubai','96%',96,'#10B981'],['Mumbai','90%',90,'#10B981'],['Bangalore','88%',88,'#10B981'],['Madrid','82%',82,'#10B981'],['Paris','78%',78,'#F59E0B'],['Chennai','75%',75,'#F59E0B'],['Delhi','70%',70,'#F59E0B'],['Hyderabad','65%',65,'#EF4444'],['Kolkata','60%',60,'#EF4444']].map(([city,pct,w,color])=>`<div><div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:5px"><span>${city}</span><span style="color:var(--text2);font-weight:600">${pct}</span></div><div style="height:7px;background:var(--surface);border-radius:4px;overflow:hidden"><div style="width:${w}%;height:100%;background:${color};border-radius:4px;transition:width 1s"></div></div></div>`).join('')}
    </div></div>`
};

function openPBI() {
  document.getElementById('pbi-overlay').classList.add('open');
  switchPBITab('embed', null);
  document.querySelector('.pbi-tab').classList.remove('active');
  document.querySelector('.pbi-tab').classList.add('active');
}
function closePBI()            { document.getElementById('pbi-overlay').classList.remove('open'); }
function closePBIOutside(e)    { if (e.target === document.getElementById('pbi-overlay')) closePBI(); }
function switchPBITab(tab, btn) {
  document.querySelectorAll('.pbi-tab').forEach(t => t.classList.remove('active'));
  if (btn) btn.classList.add('active');
  document.getElementById('pbi-body').innerHTML = pbiTabs[tab] || '';
}

// ─── CITY BI DASHBOARD ───────────────────────────────────────
function openCityDashboard(city) {
  const flags    = {Bangalore:'🇮🇳',Dubai:'🇦🇪',Mumbai:'🇮🇳',Chennai:'🇮🇳',Delhi:'🇮🇳',Hyderabad:'🇮🇳',Kolkata:'🇮🇳',Madrid:'🇪🇸',Paris:'🇫🇷'};
  const products = {Bangalore:342,Dubai:401,Mumbai:332,Chennai:318,Delhi:289,Hyderabad:276,Kolkata:261,Madrid:195,Paris:168};
  document.getElementById('city-bi-title').textContent    = (flags[city]||'') + ' ' + city + ' — Inventory Dashboard';
  document.getElementById('city-bi-subtitle').textContent = (products[city]||0) + ' products · Power BI Report';
  const url = PBI_URL + '&filter=Warehouse%2FCity%20eq%20%27' + encodeURIComponent(city) + '%27';
  document.getElementById('city-bi-iframe').src = url;
  document.getElementById('city-bi-overlay').classList.add('open');
}
function closeCityDashboard(e)  { if (e.target === document.getElementById('city-bi-overlay')) closeCityDashboardBtn(); }
function closeCityDashboardBtn() {
  document.getElementById('city-bi-overlay').classList.remove('open');
  setTimeout(() => { document.getElementById('city-bi-iframe').src = ''; }, 300);
}

// ─── CLOSE DROPDOWNS ON OUTSIDE CLICK ───────────────────────
document.addEventListener('click', function(e) {
  if (!e.target.closest('.brand-dropdown-wrap')) closeBrandDropdown();
  if (!e.target.closest('[id="avatar-btn"]') && !e.target.closest('[id="avatar-menu"]')) closeAvatarMenu();
});

// ═══════════════════════════════════════════════════════════════
//  ADD BRAND MODAL
// ═══════════════════════════════════════════════════════════════


function openAddBrand() {
  if (document.getElementById('add-brand-overlay')) {
    document.getElementById('add-brand-overlay').style.display = 'flex';
    setTimeout(() => document.getElementById('add-brand-overlay').classList.add('open'), 10);
    _renderAddBrandModal();
    return;
  }
  const el = document.createElement('div');
  el.id = 'add-brand-overlay';
  el.className = 'pbi-overlay';
  el.onclick = (e) => { if (e.target === el) closeAddBrand(); };
  el.style.display = 'flex';
  el.style.zIndex = '700';
  document.body.appendChild(el);
  _renderAddBrandModal();
  setTimeout(() => el.classList.add('open'), 10);
}

function _renderAddBrandModal() {
  const t = i18n[currentLang];
  const modalIsRtl = currentLang === 'ar';
  const cats = ['Personal Care','Home Care','Food & Wellness','Daily Utility','Electronics','Clothing','Pharmacy','FMCG','Grocery'];
  document.getElementById('add-brand-overlay').innerHTML = `
    <div class="pbi-modal" style="max-width:540px;width:95vw;overflow:hidden;display:flex;flex-direction:column" dir="${modalIsRtl?'rtl':'ltr'}">
      <div class="pbi-header">
        <div>
          <div style="font-size:17px;font-weight:700;color:var(--text)">${t.add_brand_title||'Add New Brand'}</div>
          <div style="font-size:12px;color:var(--text3);margin-top:2px">${t.add_brand_sub||'Fill in the details to register a new brand'}</div>
        </div>
        <button class="pbi-close" onclick="closeAddBrand()">✕</button>
      </div>
      <div style="padding:24px;display:flex;flex-direction:column;gap:18px;overflow-y:auto">
        <div>
          <label style="font-size:12px;font-weight:600;color:var(--text2);display:block;margin-bottom:6px">${t.brand_name_label||'Brand Name'} *</label>
          <input id="ab-name" type="text" placeholder="${t.brand_name_ph||'e.g. reCare Aqua'}" oninput="updateAddBrandPreview()"
            style="width:100%;padding:10px 12px;border:1.5px solid var(--border);border-radius:10px;background:var(--surface2);color:var(--text);font-size:13px;outline:none;box-sizing:border-box"
            onfocus="this.style.borderColor='var(--primary)'" onblur="this.style.borderColor='var(--border)'"/>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
          <div>
            <label style="font-size:12px;font-weight:600;color:var(--text2);display:block;margin-bottom:6px">${t.brand_initials_label||'Initials'} *</label>
            <input id="ab-initials" type="text" maxlength="3" placeholder="${t.brand_initials_ph||'e.g. rC'}" oninput="updateAddBrandPreview()"
              style="width:100%;padding:10px 12px;border:1.5px solid var(--border);border-radius:10px;background:var(--surface2);color:var(--text);font-size:13px;outline:none;box-sizing:border-box"
              onfocus="this.style.borderColor='var(--primary)'" onblur="this.style.borderColor='var(--border)'"/>
          </div>
          <div>
            <label style="font-size:12px;font-weight:600;color:var(--text2);display:block;margin-bottom:6px">${t.brand_cat_label||'Category'} *</label>
            <select id="ab-cat" style="width:100%;padding:10px 12px;border:1.5px solid var(--border);border-radius:10px;background:var(--surface2);color:var(--text);font-size:13px;outline:none;box-sizing:border-box"
              onfocus="this.style.borderColor='var(--primary)'" onblur="this.style.borderColor='var(--border)'">
              ${cats.map(c => `<option value="${c}">${c}</option>`).join('')}
            </select>
          </div>
        </div>
        <div>
          <label style="font-size:12px;font-weight:600;color:var(--text2);display:block;margin-bottom:8px">Brand Colour</label>
          <div style="display:flex;gap:8px;flex-wrap:wrap" id="ab-color-picker">
            ${gradientOptions.map((g,i) => `
              <div onclick="selectBrandColor('${g}',this)" style="width:32px;height:32px;border-radius:8px;background:${g};cursor:pointer;border:3px solid ${i===0?'var(--primary)':'transparent'};transition:border 0.15s;flex-shrink:0"></div>
            `).join('')}
          </div>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
          <div>
            <label style="font-size:12px;font-weight:600;color:var(--text2);display:block;margin-bottom:6px">${t.brand_market_label||'Markets'}</label>
            <input id="ab-markets" type="text" placeholder="${t.brand_market_ph||'e.g. UAE, KSA'}"
              style="width:100%;padding:10px 12px;border:1.5px solid var(--border);border-radius:10px;background:var(--surface2);color:var(--text);font-size:13px;outline:none;box-sizing:border-box"
              onfocus="this.style.borderColor='var(--primary)'" onblur="this.style.borderColor='var(--border)'"/>
          </div>
          <div>
            <label style="font-size:12px;font-weight:600;color:var(--text2);display:block;margin-bottom:6px">${t.brand_status_label||'Status'}</label>
            <select id="ab-status" style="width:100%;padding:10px 12px;border:1.5px solid var(--border);border-radius:10px;background:var(--surface2);color:var(--text);font-size:13px;outline:none;box-sizing:border-box"
              onfocus="this.style.borderColor='var(--primary)'" onblur="this.style.borderColor='var(--border)'">
              <option value="Active">${t.active||'Active'}</option>
              <option value="Review">${t.review||'Review'}</option>
            </select>
          </div>
        </div>
        <div style="background:var(--surface2);border:1px solid var(--border);border-radius:12px;padding:16px;display:flex;align-items:center;gap:12px">
          <div id="ab-preview-icon" style="width:44px;height:44px;border-radius:11px;background:${selectedGradient};display:flex;align-items:center;justify-content:center;color:#fff;font-size:14px;font-weight:700;flex-shrink:0">AB</div>
          <div>
            <div id="ab-preview-name" style="font-size:15px;font-weight:700;color:var(--text)">New Brand</div>
            <div id="ab-preview-cat" style="font-size:12px;color:var(--text3);margin-top:2px">Category · Markets</div>
          </div>
        </div>
      </div>
      <div style="padding:16px 24px;border-top:1px solid var(--border);display:flex;gap:10px;justify-content:flex-end;background:var(--surface2)">
        <button onclick="closeAddBrand()" style="padding:9px 20px;border-radius:10px;border:1.5px solid var(--border);background:var(--surface2);color:var(--text2);font-size:13px;font-weight:600;cursor:pointer">${t.brand_cancel||'Cancel'}</button>
        <button onclick="saveAddBrand()" style="padding:9px 20px;border-radius:10px;background:var(--primary);color:#fff;font-size:13px;font-weight:600;cursor:pointer;border:none;box-shadow:0 2px 8px var(--primary-glow)">${t.brand_save||'Save Brand'}</button>
      </div>
    </div>`;
  selectedGradient = gradientOptions[0];
}

function selectBrandColor(gradient, el) {
  selectedGradient = gradient;
  document.querySelectorAll('#ab-color-picker > div').forEach(d => d.style.borderColor = 'transparent');
  el.style.borderColor = 'var(--primary)';
  const preview = document.getElementById('ab-preview-icon');
  if (preview) preview.style.background = gradient;
}
function updateAddBrandPreview() {
  const name     = document.getElementById('ab-name')?.value || 'New Brand';
  const initials = document.getElementById('ab-initials')?.value || 'AB';
  const cat      = document.getElementById('ab-cat')?.value || 'Category';
  const markets  = document.getElementById('ab-markets')?.value || 'Markets';
  const pi = document.getElementById('ab-preview-icon'); if (pi) pi.textContent = initials.slice(0,3);
  const pn = document.getElementById('ab-preview-name'); if (pn) pn.textContent = name || 'New Brand';
  const pc = document.getElementById('ab-preview-cat');  if (pc) pc.textContent = cat + (markets ? ' · ' + markets : '');
}

// ✅ saveAddBrand — saves to PostgreSQL via API
async function saveAddBrand() {
  const name     = document.getElementById('ab-name')?.value?.trim();
  const initials = document.getElementById('ab-initials')?.value?.trim();
  const cat      = document.getElementById('ab-cat')?.value;
  const markets  = document.getElementById('ab-markets')?.value?.trim();
  const status   = document.getElementById('ab-status')?.value;
  if (!name || !initials) { alert('Please fill in Brand Name and Initials.'); return; }

  try {
    const res = await fetch('/api/brands', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name, initials,
        gradient: selectedGradient,
        category: cat,
        status,
        markets: markets ? markets.split(',').map(m => m.trim()) : [],
      }),
    });
    if (res.status === 409) { alert(`Brand "${name}" already exists.`); return; }
    if (!res.ok) throw new Error('Save failed');
    closeAddBrand();
    await loadBrandsFromDB();
    showPortalToast(`Brand "${name}" added!`);
  } catch (err) {
    console.error(err);
    showPortalToast('Save failed. Please try again.', 'error');
  }
}

function closeAddBrand() {
  const el = document.getElementById('add-brand-overlay');
  if (!el) return;
  el.classList.remove('open');
  setTimeout(() => { el.style.display = 'none'; }, 300);
}

// ═══════════════════════════════════════════════════════════════
//  BRANDS — DB FUNCTIONS
// ═══════════════════════════════════════════════════════════════

// ✅ Load all brands from PostgreSQL and render table
async function loadBrandsFromDB() {
  try {
    const res  = await fetch('/api/brands');
    const json = await res.json();
    if (!json.data) return;

    const tbody = document.getElementById('brands-tbody');
    if (!tbody) return;

    const t      = i18n[currentLang];
    const editSVG = `<svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>`;
    const delSVG  = `<svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>`;

    tbody.innerHTML = json.data.map(b => {
      const badgeClass = b.status === 'Active' ? 'badge-green' : 'badge-orange';
      const markets    = Array.isArray(b.markets) ? b.markets.join(', ') : (b.markets || '—');
      const safeN      = b.name.replace(/'/g, "\\'");
      return `
        <tr data-brand-id="${b.id}">
          <td><div class="brand-logo-cell"><div class="brand-icon" style="background:${b.gradient}">${b.initials}</div>${b.name}</div></td>
          <td>${b.category}</td>
          <td>${b.product_count}</td>
          <td><span class="badge ${badgeClass}">${b.status === 'Active' ? (t.active||'Active') : (t.review||'Review')}</span></td>
          <td>${markets}</td>
          <td>
            <div style="display:flex;gap:5px;align-items:center">
              <button class="btn-ghost" onclick="viewBrandProducts('${safeN}')" style="padding:5px 12px;font-size:12px">${t.view_btn||'View'}</button>
              <button onclick="openEditBrand(this)" title="Edit"
                style="width:30px;height:30px;border-radius:7px;border:1.5px solid var(--border);background:var(--surface2);cursor:pointer;display:flex;align-items:center;justify-content:center;color:var(--primary);transition:all 0.15s"
                onmouseover="this.style.background='#EEF2FF'" onmouseout="this.style.background='var(--surface2)'">${editSVG}</button>
              <button onclick="deleteBrand(this)" title="Delete"
                style="width:30px;height:30px;border-radius:7px;border:1.5px solid #fee2e2;background:#fef2f2;cursor:pointer;display:flex;align-items:center;justify-content:center;color:#dc2626;transition:all 0.15s"
                onmouseover="this.style.background='#fee2e2'" onmouseout="this.style.background='#fef2f2'">${delSVG}</button>
            </div>
          </td>
        </tr>`;
    }).join('');
  } catch (err) {
    console.error('loadBrandsFromDB:', err);
  }
}

// ─── EDIT BRAND ──────────────────────────────────────────────
function openEditBrand(btn) {
  const row = btn.closest('tr');
  if (!row) return;

  const brandId  = row.getAttribute('data-brand-id');
  const cells    = row.querySelectorAll('td');
  const iconEl   = cells[0].querySelector('.brand-icon');
  const nameEl   = cells[0].querySelector('.brand-logo-cell');
  const name     = nameEl     ? nameEl.textContent.trim()   : '';
  const cat      = cells[1].textContent.trim();
  const badgeEl  = cells[3].querySelector('.badge');
  const status   = badgeEl   ? (badgeEl.classList.contains('badge-green') ? 'Active' : 'Review') : 'Active';
  const markets  = cells[4].textContent.trim();
  const gradient = iconEl    ? iconEl.style.background      : gradientOptions[0];
  const initials = iconEl    ? iconEl.textContent.trim()    : '';
  const cats     = ['Personal Care','Home Care','Food & Wellness','Daily Utility','Electronics','Clothing','Pharmacy','FMCG','Grocery'];

  let overlay = document.getElementById('edit-brand-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'edit-brand-overlay';
    overlay.className = 'pbi-overlay';
    overlay.style.zIndex = '700';
    overlay.onclick = (e) => { if (e.target === overlay) closeEditBrand(); };
    document.body.appendChild(overlay);
  }
  overlay._editRow      = row;
  overlay._editGradient = gradient;
  overlay._editBrandId  = brandId; // ✅ store DB id

  overlay.innerHTML = `
    <div class="pbi-modal" style="max-width:540px;width:95vw;display:flex;flex-direction:column">
      <div class="pbi-header">
        <div>
          <div style="font-size:17px;font-weight:700;color:var(--text)">Edit Brand</div>
          <div style="font-size:12px;color:var(--text3);margin-top:2px">Updating: ${name}</div>
        </div>
        <button class="pbi-close" onclick="closeEditBrand()">✕</button>
      </div>
      <div style="padding:24px;display:flex;flex-direction:column;gap:18px;overflow-y:auto">
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
          <div>
            <label style="font-size:12px;font-weight:600;color:var(--text2);display:block;margin-bottom:6px">Brand Name *</label>
            <input id="eb-name" type="text" value="${name}"
              style="width:100%;padding:10px 12px;border:1.5px solid var(--border);border-radius:10px;background:var(--surface2);color:var(--text);font-size:13px;outline:none;box-sizing:border-box"
              oninput="updateEditBrandPreview()"
              onfocus="this.style.borderColor='var(--primary)'" onblur="this.style.borderColor='var(--border)'"/>
          </div>
          <div>
            <label style="font-size:12px;font-weight:600;color:var(--text2);display:block;margin-bottom:6px">Initials *</label>
            <input id="eb-initials" type="text" maxlength="3" value="${initials}"
              style="width:100%;padding:10px 12px;border:1.5px solid var(--border);border-radius:10px;background:var(--surface2);color:var(--text);font-size:13px;outline:none;box-sizing:border-box"
              oninput="updateEditBrandPreview()"
              onfocus="this.style.borderColor='var(--primary)'" onblur="this.style.borderColor='var(--border)'"/>
          </div>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
          <div>
            <label style="font-size:12px;font-weight:600;color:var(--text2);display:block;margin-bottom:6px">Category *</label>
            <select id="eb-cat"
              style="width:100%;padding:10px 12px;border:1.5px solid var(--border);border-radius:10px;background:var(--surface2);color:var(--text);font-size:13px;outline:none;box-sizing:border-box"
              onfocus="this.style.borderColor='var(--primary)'" onblur="this.style.borderColor='var(--border)'">
              ${cats.map(c => `<option value="${c}" ${c===cat?'selected':''}>${c}</option>`).join('')}
            </select>
          </div>
          <div>
            <label style="font-size:12px;font-weight:600;color:var(--text2);display:block;margin-bottom:6px">Status</label>
            <select id="eb-status"
              style="width:100%;padding:10px 12px;border:1.5px solid var(--border);border-radius:10px;background:var(--surface2);color:var(--text);font-size:13px;outline:none;box-sizing:border-box"
              onfocus="this.style.borderColor='var(--primary)'" onblur="this.style.borderColor='var(--border)'">
              <option value="Active"  ${status==='Active'?'selected':''}>Active</option>
              <option value="Review"  ${status==='Review'?'selected':''}>Review</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
        </div>
        <div>
          <label style="font-size:12px;font-weight:600;color:var(--text2);display:block;margin-bottom:6px">Markets</label>
          <input id="eb-markets" type="text" value="${markets === '—' ? '' : markets}" placeholder="e.g. UAE, KSA, Global"
            style="width:100%;padding:10px 12px;border:1.5px solid var(--border);border-radius:10px;background:var(--surface2);color:var(--text);font-size:13px;outline:none;box-sizing:border-box"
            onfocus="this.style.borderColor='var(--primary)'" onblur="this.style.borderColor='var(--border)'"/>
        </div>
        <div>
          <label style="font-size:12px;font-weight:600;color:var(--text2);display:block;margin-bottom:8px">Brand Colour</label>
          <div style="display:flex;gap:8px;flex-wrap:wrap" id="eb-color-picker">
            ${gradientOptions.map(g => `
              <div onclick="selectEditBrandColor('${g}',this)"
                style="width:32px;height:32px;border-radius:8px;background:${g};cursor:pointer;border:3px solid ${g===gradient?'var(--primary)':'transparent'};transition:border 0.15s;flex-shrink:0"></div>
            `).join('')}
          </div>
        </div>
        <div style="background:var(--surface2);border:1px solid var(--border);border-radius:12px;padding:14px;display:flex;align-items:center;gap:12px">
          <div id="eb-preview-icon" style="width:44px;height:44px;border-radius:11px;background:${gradient};display:flex;align-items:center;justify-content:center;color:#fff;font-size:14px;font-weight:700;flex-shrink:0">${initials}</div>
          <div>
            <div id="eb-preview-name" style="font-size:15px;font-weight:700;color:var(--text)">${name}</div>
            <div id="eb-preview-cat"  style="font-size:12px;color:var(--text3);margin-top:2px">${cat} · ${markets}</div>
          </div>
        </div>
      </div>
      <div style="padding:16px 24px;border-top:1px solid var(--border);display:flex;gap:10px;justify-content:flex-end;background:var(--surface2)">
        <button onclick="closeEditBrand()" style="padding:9px 20px;border-radius:10px;border:1.5px solid var(--border);background:var(--surface2);color:var(--text2);font-size:13px;font-weight:600;cursor:pointer">Cancel</button>
        <button onclick="saveEditBrand()" style="padding:9px 20px;border-radius:10px;background:var(--primary);color:#fff;font-size:13px;font-weight:600;cursor:pointer;border:none">Save Changes</button>
      </div>
    </div>`;

  overlay.style.display = 'flex';
  setTimeout(() => overlay.classList.add('open'), 10);
}

function selectEditBrandColor(gradient, el) {
  const overlay = document.getElementById('edit-brand-overlay');
  overlay._editGradient = gradient;
  document.querySelectorAll('#eb-color-picker > div').forEach(d => d.style.borderColor = 'transparent');
  el.style.borderColor = 'var(--primary)';
  const prev = document.getElementById('eb-preview-icon');
  if (prev) prev.style.background = gradient;
}
function updateEditBrandPreview() {
  const name     = document.getElementById('eb-name')?.value     || 'Brand Name';
  const initials = document.getElementById('eb-initials')?.value || 'AB';
  const cat      = document.getElementById('eb-cat')?.value      || 'Category';
  const markets  = document.getElementById('eb-markets')?.value  || 'Markets';
  const pi = document.getElementById('eb-preview-icon'); if (pi) pi.textContent = initials.slice(0,3);
  const pn = document.getElementById('eb-preview-name'); if (pn) pn.textContent = name;
  const pc = document.getElementById('eb-preview-cat');  if (pc) pc.textContent = cat + ' · ' + (markets||'—');
}

// ✅ saveEditBrand — saves to PostgreSQL via API
async function saveEditBrand() {
  const name     = document.getElementById('eb-name')?.value?.trim();
  const initials = document.getElementById('eb-initials')?.value?.trim();
  const cat      = document.getElementById('eb-cat')?.value;
  const status   = document.getElementById('eb-status')?.value;
  const markets  = document.getElementById('eb-markets')?.value?.trim() || '—';
  const overlay  = document.getElementById('edit-brand-overlay');
  const gradient = overlay._editGradient;
  const brandId  = overlay._editBrandId;

  if (!name || !initials) { alert('Please fill in Brand Name and Initials.'); return; }

  try {
    const res = await fetch(`/api/brands/${brandId}`, {
      method:  'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name, initials, gradient, category: cat, status,
        markets: markets !== '—' ? markets.split(',').map(m => m.trim()) : [],
        revenue: null, growth: null, link: null,
      }),
    });
    if (!res.ok) throw new Error('Update failed');
    closeEditBrand();
    await loadBrandsFromDB();
    showPortalToast(`Brand "${name}" updated!`);
  } catch (err) {
    console.error(err);
    showPortalToast('Update failed. Please try again.', 'error');
  }
}

function closeEditBrand() {
  const el = document.getElementById('edit-brand-overlay');
  if (!el) return;
  el.classList.remove('open');
  setTimeout(() => { el.style.display = 'none'; }, 300);
}

// ✅ deleteBrand — deletes from PostgreSQL via API
async function deleteBrand(btn) {
  const row     = btn.closest('tr');
  if (!row) return;
  const brandId = row.getAttribute('data-brand-id');
  const nameEl  = row.querySelector('.brand-logo-cell');
  const name    = nameEl ? nameEl.textContent.trim() : 'this brand';

  if (!confirm(`Delete "${name}"?\n\nThis action cannot be undone.`)) return;

  try {
    const res = await fetch(`/api/brands/${brandId}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Delete failed');
    row.style.transition = 'opacity 0.3s,transform 0.3s';
    row.style.opacity    = '0';
    row.style.transform  = 'translateX(16px)';
    setTimeout(() => row.remove(), 300);
    showPortalToast(`Brand "${name}" deleted.`, 'error');
  } catch (err) {
    console.error(err);
    showPortalToast('Delete failed. Please try again.', 'error');
  }
}

// ═══════════════════════════════════════════════════════════════
//  BRAND DETAIL — fetches live from DB
// ═══════════════════════════════════════════════════════════════
let brandDetailActiveFilter = 'all';
let brandDetailCurrentBrand = null; // holds full brand object from API

async function openBrandDetail(brandName) {
  const overlay = document.getElementById('brand-detail-overlay');
  if (!overlay) return;

  // Show overlay with loading state immediately
  overlay.style.display = 'flex';
  setTimeout(() => overlay.classList.add('open'), 10);

  const iconEl  = document.getElementById('brand-detail-icon');
  const titleEl = document.getElementById('brand-detail-title');
  const subEl   = document.getElementById('brand-detail-subtitle');
  const statsEl = document.getElementById('brand-detail-stats');
  const catsEl  = document.getElementById('brand-detail-cats');
  const gridEl  = document.getElementById('brand-detail-products');
  const countEl = document.getElementById('brand-detail-count');

  if (iconEl)  { iconEl.textContent = '…'; iconEl.style.background = 'var(--surface2)'; }
  if (titleEl) titleEl.textContent = 'Loading…';
  if (subEl)   subEl.textContent   = '';
  if (statsEl) statsEl.innerHTML   = '';
  if (catsEl)  catsEl.innerHTML    = '';
  if (gridEl)  gridEl.innerHTML    = '<div style="grid-column:1/-1;text-align:center;padding:60px;color:var(--text3)">Loading products…</div>';
  if (countEl) countEl.textContent = '';

  try {
    const res = await fetch(`/api/brands/name/${encodeURIComponent(brandName)}`);
    if (!res.ok) throw new Error('Brand not found');
    const brand = await res.json();

    brandDetailCurrentBrand = brand;
    brandDetailActiveFilter = 'all';

    const t          = i18n[currentLang];
    const modalIsRtl = currentLang === 'ar';
    const modal      = overlay.querySelector('.pbi-modal');
    if (modal) modal.setAttribute('dir', modalIsRtl ? 'rtl' : 'ltr');

    // Header
    iconEl.style.background = brand.gradient;
    iconEl.textContent       = brand.initials;
    titleEl.textContent      = brand.name;
    const markets            = Array.isArray(brand.markets) ? brand.markets.join(', ') : (brand.markets || '');
    subEl.textContent        = brand.category + ' · ' + markets + ' · ' + brand.product_count + ' products';

    const linkEl = document.getElementById('brand-detail-link');
    if (linkEl) linkEl.href = brand.link || '#';

    // Stats
    const growthColor = (brand.growth || '').startsWith('+') ? 'var(--success)' : 'var(--danger)';
    statsEl.innerHTML = `
      <div style="text-align:center">
        <div style="font-size:20px;font-weight:700;color:var(--text)">${brand.product_count}</div>
        <div style="font-size:11px;color:var(--text3);margin-top:2px">${t.bd_total_products||'Total Products'}</div>
      </div>
      <div style="text-align:center">
        <div style="font-size:20px;font-weight:700;color:var(--text)">${(brand.total_stock||0).toLocaleString()}</div>
        <div style="font-size:11px;color:var(--text3);margin-top:2px">${t.bd_units_stock||'Units in Stock'}</div>
      </div>
      <div style="text-align:center">
        <div style="font-size:20px;font-weight:700;color:var(--text)">${brand.revenue||'—'}</div>
        <div style="font-size:11px;color:var(--text3);margin-top:2px">${t.bd_monthly_rev||'Monthly Revenue'}</div>
      </div>
      <div style="text-align:center">
        <div style="font-size:20px;font-weight:700;color:${growthColor}">${brand.growth||'—'}</div>
        <div style="font-size:11px;color:var(--text3);margin-top:2px">${t.bd_growth||'Growth MoM'}</div>
      </div>`;

    // Category filter chips
    const cats = ['all', ...(brand.categories || [])];
    catsEl.innerHTML = cats.map(c =>
      `<div class="filter-chip ${c==='all'?'active':''}" style="font-size:11px;padding:4px 10px"
        onclick="filterBrandDetailCat('${c}',this)">${c==='all'?(t.bd_all||'All'):c}</div>`
    ).join('');

    const searchEl = document.getElementById('brand-detail-search');
    if (searchEl) searchEl.value = '';

    renderBrandDetailProducts(brand.products || []);

  } catch (err) {
    console.error('openBrandDetail:', err);
    if (gridEl) gridEl.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:60px;color:var(--danger)">Failed to load brand data.</div>';
  }
}

function renderBrandDetailProducts(products) {
  const t    = i18n[currentLang];
  const grid = document.getElementById('brand-detail-products');
  if (!grid) return;

  const countEl = document.getElementById('brand-detail-count');

  if (!products.length) {
    grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:40px;color:var(--text3);font-size:13px">No products found</div>';
    if (countEl) countEl.textContent = '0 ' + (t.bd_products_shown||'products shown');
    return;
  }
  if (countEl) countEl.textContent = products.length + ' ' + (t.bd_products_shown||'products shown');

  const catColors = {
    'Hand Care':'linear-gradient(135deg,#EBF2FF,#BFDBFE)','Oral Care':'linear-gradient(135deg,#ECFDF5,#A7F3D0)',
    'Hair Care':'linear-gradient(135deg,#FFF1F2,#FECDD3)','Body Care':'linear-gradient(135deg,#FFFBEB,#FDE68A)',
    'Skin Care':'linear-gradient(135deg,#F5F3FF,#DDD6FE)','Grocery':'linear-gradient(135deg,#FFFBEB,#FDE68A)',
    'Electronics':'linear-gradient(135deg,#F5F3FF,#DDD6FE)','Kitchen':'linear-gradient(135deg,#ECFDF5,#A7F3D0)',
    'Floor Care':'linear-gradient(135deg,#EBF2FF,#BFDBFE)','Bathroom':'linear-gradient(135deg,#EFF6FF,#DBEAFE)',
    'Surface Care':'linear-gradient(135deg,#F0FDF4,#BBF7D0)','Laundry':'linear-gradient(135deg,#F0F9FF,#BAE6FD)',
    'Clothing':'linear-gradient(135deg,#FFF1F2,#FECDD3)','Fragrance':'linear-gradient(135deg,#F5F3FF,#DDD6FE)',
    'Makeup':'linear-gradient(135deg,#FFF7ED,#FED7AA)','Air Care':'linear-gradient(135deg,#F0FDFA,#99F6E4)',
    'Cleaning Tools':'linear-gradient(135deg,#FAFAFA,#E5E7EB)','Supplements':'linear-gradient(135deg,#F0FDF4,#BBF7D0)',
    'Sports Nutrition':'linear-gradient(135deg,#EBF2FF,#BFDBFE)',
  };

  grid.innerHTML = products.map(p => {
    const bg         = catColors[p.cat] || 'var(--surface2)';
    // Support both DB field (stock_pct) and static field (stockPct)
    const pct        = p.stock_pct !== undefined ? p.stock_pct : (p.stockPct || 0);
    const desc       = p.description !== undefined ? p.description : (p.desc || '');
    const stockColor = pct > 75 ? 'var(--success)' : pct > 50 ? 'var(--warning)' : 'var(--danger)';
    return `
      <div style="background:var(--surface2);border:1px solid var(--border);border-radius:12px;overflow:hidden;display:flex;flex-direction:column;transition:box-shadow 0.2s"
        onmouseenter="this.style.boxShadow='0 4px 16px rgba(0,0,0,0.1)'" onmouseleave="this.style.boxShadow=''">
        <div style="background:${bg};display:flex;align-items:center;justify-content:center;height:64px;font-size:28px">${p.icon||'📦'}</div>
        <div style="padding:10px 12px;flex:1;display:flex;flex-direction:column;gap:4px">
          <div style="font-size:10px;font-weight:600;color:var(--primary);text-transform:uppercase;letter-spacing:0.5px">${p.cat}</div>
          <div style="font-size:13px;font-weight:600;color:var(--text);line-height:1.3">${p.name}</div>
          <div style="font-size:11px;color:var(--text3);line-height:1.4;flex:1">${desc}</div>
          <div style="display:flex;justify-content:space-between;align-items:center;margin-top:6px;padding-top:6px;border-top:1px solid var(--border)">
            <span style="font-size:10px;color:var(--text3);font-family:monospace">${p.sku}</span>
            <span style="font-size:12px;font-weight:700;color:var(--text)">${p.price||''}</span>
          </div>
          <div style="margin-top:4px">
            <div style="display:flex;justify-content:space-between;font-size:10px;color:var(--text3);margin-bottom:3px">
              <span>${t.bd_stock||'Stock'}</span>
              <span style="color:${stockColor};font-weight:600">${(p.stock||0).toLocaleString()} units</span>
            </div>
            <div style="height:4px;background:var(--surface);border-radius:2px;overflow:hidden">
              <div style="width:${pct}%;height:100%;background:${stockColor};border-radius:2px;transition:width 0.8s ease"></div>
            </div>
          </div>
        </div>
      </div>`;
  }).join('');
}

function filterBrandDetailCat(cat, chip) {
  brandDetailActiveFilter = cat;
  document.querySelectorAll('#brand-detail-cats .filter-chip').forEach(c => c.classList.remove('active'));
  chip.classList.add('active');
  const searchEl = document.getElementById('brand-detail-search');
  if (searchEl) searchEl.value = '';
  const brand    = brandDetailCurrentBrand;
  if (!brand) return;
  const products = cat === 'all' ? brand.products : (brand.products||[]).filter(p => p.cat === cat);
  renderBrandDetailProducts(products);
}

function filterBrandDetailProducts(query) {
  const brand = brandDetailCurrentBrand;
  if (!brand) return;
  const q = query.toLowerCase();
  let products = brandDetailActiveFilter === 'all'
    ? (brand.products || [])
    : (brand.products || []).filter(p => p.cat === brandDetailActiveFilter);
  if (q) products = products.filter(p =>
    p.name.toLowerCase().includes(q) ||
    p.sku.toLowerCase().includes(q)  ||
    (p.description || p.desc || '').toLowerCase().includes(q)
  );
  renderBrandDetailProducts(products);
}

function closeBrandDetail() {
  const overlay = document.getElementById('brand-detail-overlay');
  if (!overlay) return;
  overlay.classList.remove('open');
  setTimeout(() => { overlay.style.display = 'none'; }, 300);
}
function closeBrandDetailOutside(e) {
  if (e.target === document.getElementById('brand-detail-overlay')) closeBrandDetail();
}

// ─── TOAST ───────────────────────────────────────────────────
function showPortalToast(msg, type = 'success') {
  let toast = document.getElementById('_portal-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = '_portal-toast';
    toast.style.cssText = 'position:fixed;bottom:28px;right:28px;z-index:9999;padding:12px 20px;border-radius:12px;font-size:13px;font-weight:600;color:#fff;opacity:0;transform:translateY(12px);transition:all 0.3s cubic-bezier(0.34,1.56,0.64,1);pointer-events:none;max-width:320px;box-shadow:0 4px 24px rgba(0,0,0,0.18)';
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.style.background = type === 'error' ? '#dc2626' : '#16a34a';
  void toast.offsetWidth;
  toast.style.opacity   = '1';
  toast.style.transform = 'translateY(0)';
  clearTimeout(toast._t);
  toast._t = setTimeout(() => {
    toast.style.opacity   = '0';
    toast.style.transform = 'translateY(12px)';
  }, 3000);
}