// ══════════════════════════════════════════════════════════════
//  PRODUCT ANALYTICS DASHBOARD
//  Updated UI + edit fix
// ══════════════════════════════════════════════════════════════

let paCurrentProduct = null;
let paCurrentPeriod = '3m';
let paSalesChartInst = null;
let paBarChartInst = null;
let paDonutChartInst = null;

// ── Open ──────────────────────────────────────────────────────
async function openProductAnalytics(productId) {
  const overlay = document.getElementById('product-analytics-overlay');
  if (!overlay) return;

  // Reset to overview
  const firstTab = overlay.querySelector('.pa-tab');
  switchPaTab('overview', firstTab);

  overlay.style.display = 'flex';
  setTimeout(() => overlay.classList.add('open'), 10);

  // Loading state
  document.getElementById('pa-title').textContent = 'Loading…';
  document.getElementById('pa-subtitle').textContent = '';
  document.getElementById('pa-icon').textContent = '⏳';

  ['pa-kpi-price','pa-kpi-cost','pa-kpi-sold','pa-kpi-days','pa-donut-center','pa-leg-revenue','pa-leg-cost','pa-leg-profit','pa-leg-margin'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.textContent = '—';
  });

  try {
    const res = await fetch(`/api/products/${productId}`);
    if (!res.ok) throw new Error('Product not found');
    const product = await res.json();
    paCurrentProduct = product;
    renderProductAnalytics(product);
  } catch (err) {
    console.error('openProductAnalytics:', err);
    document.getElementById('pa-title').textContent = 'Failed to load product';
  }
}

// ── Close ─────────────────────────────────────────────────────
function closeProductAnalytics() {
  const overlay = document.getElementById('product-analytics-overlay');
  if (!overlay) return;
  overlay.classList.remove('open');
  setTimeout(() => {
    overlay.style.display = 'none';
  }, 260);
}

function closeProductAnalyticsOutside(e) {
  if (e.target === document.getElementById('product-analytics-overlay')) {
    closeProductAnalytics();
  }
}

// ── Edit from analytics ───────────────────────────────────────
function editProductFromAnalytics() {
  if (!paCurrentProduct) return;
  closeProductAnalytics();
  setTimeout(() => {
    if (typeof openEditProduct === 'function') {
      openEditProduct(paCurrentProduct.sku);
    }
  }, 280);
}

// ── Tab switching ─────────────────────────────────────────────
function switchPaTab(tab, btn) {
  ['overview','inventory','details','modules'].forEach(t => {
    const el = document.getElementById('pa-tab-' + t);
    if (el) el.style.display = (t === tab) ? 'block' : 'none';
  });

  document.querySelectorAll('.pa-tab').forEach(b => {
    b.style.color = 'var(--text3)';
    b.style.borderBottom = '2px solid transparent';
    b.style.fontWeight = '600';
  });

  if (btn) {
    btn.style.color = 'var(--primary)';
    btn.style.borderBottom = '2px solid var(--primary)';
    btn.style.fontWeight = '700';
  }

  if (tab === 'inventory' && paCurrentProduct) renderInventoryTab(paCurrentProduct);
  if (tab === 'details' && paCurrentProduct) renderDetailsTab(paCurrentProduct);
}

// ── Main render ───────────────────────────────────────────────
function renderProductAnalytics(p) {
  const stock = Number(p.stock || 0);
  const stockPct = Number(p.stock_pct || p.stockPct || 0);
  const price = Number(p.price || 0);
  const cost = Number(p.cost_price || p.cost || (price * 0.67));
  const unitsSold = Number(p.units_sold || p.sold || Math.max(50, Math.round(stock * 4.2)));
  const daysInStock = Number(p.days_in_stock || p.days || Math.max(1, Math.round(stock / 2)));

  // Header
  document.getElementById('pa-icon').textContent = p.icon || '📦';
  document.getElementById('pa-title').textContent = p.name || 'Product';
  document.getElementById('pa-subtitle').textContent = `${p.cat || 'Category'} · ${p.brand_name || p.brand || ''}`.trim();

  const badge = document.getElementById('pa-status-badge');
  if (badge) {
    const active = (p.status || 'Active').toLowerCase() === 'active';
    badge.textContent = p.status || 'Active';
    badge.className = active ? 'badge badge-green' : 'badge badge-warning';
  }

  // KPI cards
  document.getElementById('pa-kpi-price').textContent = price ? `AED ${price.toLocaleString()}` : '—';
  document.getElementById('pa-kpi-cost').textContent = cost ? `AED ${cost.toLocaleString()}` : '—';
  document.getElementById('pa-kpi-sold').textContent = unitsSold.toLocaleString();
  document.getElementById('pa-kpi-days').textContent = daysInStock.toString();

  const stockLabel = document.getElementById('pa-kpi-stock-label');
  if (stockLabel) {
    if (stockPct > 75) {
      stockLabel.textContent = 'Healthy';
      stockLabel.className = 'badge badge-green';
    } else if (stockPct > 50) {
      stockLabel.textContent = 'Watch';
      stockLabel.className = 'badge badge-warning';
    } else {
      stockLabel.textContent = 'Low';
      stockLabel.className = 'badge badge-danger';
    }
  }

  // Profitability summary
  const revenue = unitsSold * price;
  const grossProfit = revenue - (unitsSold * cost);
  const margin = revenue > 0 ? (grossProfit / revenue) * 100 : 0;

  document.getElementById('pa-leg-revenue').textContent = revenue ? formatMoney(revenue) : '—';
  document.getElementById('pa-leg-cost').textContent = formatMoney(unitsSold * cost);
  document.getElementById('pa-leg-profit').textContent = formatMoney(grossProfit);
  document.getElementById('pa-leg-margin').textContent = `${margin.toFixed(1)}%`;

  // Charts
  renderSalesChart(p);
  renderDonutChart(p, revenue, grossProfit, margin);

  // Transactions
  renderTransactions(p);

  // Inventory + Details defaults
  renderInventoryTab(p);
  renderDetailsTab(p);
}

function formatMoney(value) {
  if (!Number.isFinite(value)) return '—';
  const v = Math.round(value);
  if (v >= 1000000) return `AED ${(v / 1000000).toFixed(2)}M`;
  if (v >= 1000) return `AED ${(v / 1000).toFixed(1)}K`;
  return `AED ${v.toLocaleString()}`;
}

// ── Sales Trend Chart ─────────────────────────────────────────
function renderSalesChart(p) {
  const canvas = document.getElementById('pa-sales-chart');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  const W = canvas.parentElement.offsetWidth || 520;
  const H = 210;

  canvas.width = W * dpr;
  canvas.height = H * dpr;
  canvas.style.width = W + 'px';
  canvas.style.height = H + 'px';
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  const months = getMonthLabels(paCurrentPeriod);
  const base = Math.max(30, (p.stock || 200) / 5);
  const data = months.map((_, i) => {
    const noise = (Math.sin(i * 1.5 + (p.id || 1)) * 0.28 + 1);
    return Math.round(base * noise + (i * base * 0.07));
  });

  const maxVal = Math.max(...data);
  const minVal = Math.min(...data);

  const pad = { top: 12, right: 12, bottom: 30, left: 42 };
  const chartW = W - pad.left - pad.right;
  const chartH = H - pad.top - pad.bottom;

  const style = getComputedStyle(document.documentElement);
  const accent = (style.getPropertyValue('--primary').trim() || '#2563eb');
  const border = (style.getPropertyValue('--border').trim() || '#e5e7eb');
  const text3 = (style.getPropertyValue('--text3').trim() || '#94a3b8');

  ctx.clearRect(0, 0, W, H);

  // Grid
  ctx.strokeStyle = border;
  ctx.lineWidth = 1;
  [0, 0.25, 0.5, 0.75, 1].forEach(f => {
    const y = pad.top + chartH * (1 - f);
    ctx.beginPath();
    ctx.moveTo(pad.left, y);
    ctx.lineTo(pad.left + chartW, y);
    ctx.stroke();
  });

  // Y labels
  ctx.fillStyle = text3;
  ctx.font = '10px system-ui, sans-serif';
  ctx.textAlign = 'right';
  [0, 0.5, 1].forEach(f => {
    const val = Math.round(minVal + (maxVal - minVal) * f);
    const y = pad.top + chartH * (1 - f) + 3;
    ctx.fillText(val.toLocaleString(), pad.left - 5, y);
  });

  const pts = data.map((v, i) => ({
    x: pad.left + (i / Math.max(1, data.length - 1)) * chartW,
    y: pad.top + chartH * (1 - (v - minVal) / Math.max(1, maxVal - minVal)),
  }));

  // Area
  ctx.beginPath();
  ctx.moveTo(pts[0].x, pad.top + chartH);
  pts.forEach(pt => ctx.lineTo(pt.x, pt.y));
  ctx.lineTo(pts[pts.length - 1].x, pad.top + chartH);
  ctx.closePath();
  const grad = ctx.createLinearGradient(0, pad.top, 0, pad.top + chartH);
  grad.addColorStop(0, accent + '33');
  grad.addColorStop(1, accent + '00');
  ctx.fillStyle = grad;
  ctx.fill();

  // Line
  ctx.beginPath();
  ctx.strokeStyle = accent;
  ctx.lineWidth = 2.5;
  pts.forEach((pt, i) => {
    if (i === 0) ctx.moveTo(pt.x, pt.y);
    else ctx.lineTo(pt.x, pt.y);
  });
  ctx.stroke();

  // Dots
  pts.forEach(pt => {
    ctx.beginPath();
    ctx.arc(pt.x, pt.y, 3.5, 0, Math.PI * 2);
    ctx.fillStyle = accent;
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  });

  // X labels
  ctx.fillStyle = text3;
  ctx.font = '10px system-ui, sans-serif';
  ctx.textAlign = 'center';
  months.forEach((m, i) => ctx.fillText(m, pts[i].x, H - 8));
}

function getMonthLabels(period) {
  const all = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const now = new Date();
  const month = now.getMonth();
  const count = period === '3m' ? 3 : period === '6m' ? 6 : 12;
  const labels = [];
  for (let i = count - 1; i >= 0; i--) {
    labels.push(all[(month - i + 12) % 12]);
  }
  return labels;
}

function setPeriod(p, btn) {
  paCurrentPeriod = p;
  document.querySelectorAll('.pa-period-btn').forEach(b => {
    b.style.background = 'var(--surface2)';
    b.style.color = 'var(--text3)';
  });
  btn.style.background = 'var(--primary)';
  btn.style.color = '#fff';
  if (paCurrentProduct) renderSalesChart(paCurrentProduct);
}

// ── Donut Chart ───────────────────────────────────────────────
function renderDonutChart(p, revenue, grossProfit, margin) {
  const canvas = document.getElementById('pa-donut-chart');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  const size = 160;
  const dpr = window.devicePixelRatio || 1;
  canvas.width = size * dpr;
  canvas.height = size * dpr;
  canvas.style.width = size + 'px';
  canvas.style.height = size + 'px';
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  const pct = Math.max(0, Math.min(100, Number(margin || 0)));
  const style = getComputedStyle(document.documentElement);
  const bg = style.getPropertyValue('--surface2').trim() || '#e5e7eb';

  const revenueColor = '#2563eb';
  const costColor = '#60a5fa';
  const profitColor = '#34d399';

  const colors = [revenueColor, costColor, profitColor, '#93c5fd'];
  const segments = [55, 18, 14, 13];

  ctx.clearRect(0, 0, size, size);

  const cx = size / 2;
  const cy = size / 2;
  const r = 52;
  const lw = 14;
  let start = -Math.PI / 2;

  // background ring
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.strokeStyle = bg;
  ctx.lineWidth = lw;
  ctx.stroke();

  // segments
  segments.forEach((seg, i) => {
    const arc = (seg / 100) * Math.PI * 2;
    ctx.beginPath();
    ctx.arc(cx, cy, r, start, start + arc);
    ctx.strokeStyle = colors[i];
    ctx.lineWidth = lw;
    ctx.lineCap = 'round';
    ctx.stroke();
    start += arc + 0.02;
  });

  document.getElementById('pa-donut-center').textContent = `${pct.toFixed(1)}%`;
  document.getElementById('pa-leg-revenue').textContent = formatMoney(revenue);
  document.getElementById('pa-leg-cost').textContent = formatMoney(unitsSoldSafe(p, revenue, grossProfit));
  document.getElementById('pa-leg-profit').textContent = formatMoney(grossProfit);
  document.getElementById('pa-leg-margin').textContent = `${pct.toFixed(1)}%`;
}

function unitsSoldSafe(p, revenue, grossProfit) {
  const price = Number(p.price || 0);
  if (!price) return 0;
  return Math.max(0, Math.round(revenue / price) * (p.cost_price || p.cost || 1));
}

// ── Transactions ──────────────────────────────────────────────
function renderTransactions(p) {
  const tbody = document.getElementById('pa-transactions-body');
  if (!tbody) return;

  const base = Number(p.price || 20);
  const rows = [];
  const types = ['Sale', 'Sale', 'Purchase', 'Sale', 'Sale'];

  for (let i = 0; i < 5; i++) {
    const d = new Date();
    d.setDate(d.getDate() - (i * 4 + 2));
    const qty = Math.max(1, Math.round(1 + Math.random() * 4));
    const type = types[i];
    const unit = type === 'Purchase' ? (base * 0.68) : base;
    const total = qty * unit;

    rows.push({
      date: d.toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' }),
      type,
      qty,
      unit,
      total,
    });
  }

  tbody.innerHTML = rows.map(r => `
    <tr style="border-bottom:1px solid var(--border)">
      <td style="padding:8px 10px;color:var(--text2)">${r.date}</td>
      <td style="padding:8px 10px">
        <span style="padding:2px 8px;border-radius:5px;font-size:11px;font-weight:700;
          background:${r.type === 'Sale' ? '#dcfce7' : '#eff6ff'};
          color:${r.type === 'Sale' ? '#16a34a' : '#1d4ed8'}">
          ${r.type}
        </span>
      </td>
      <td style="padding:8px 10px;text-align:right;color:var(--text)">${r.qty}</td>
      <td style="padding:8px 10px;text-align:right;color:var(--text2)">AED ${r.unit.toFixed(2)}</td>
      <td style="padding:8px 10px;text-align:right;font-weight:700;color:var(--text)">AED ${r.total.toFixed(2)}</td>
    </tr>
  `).join('');
}

// ── Inventory Tab ─────────────────────────────────────────────
function renderInventoryTab(p) {
  const stock = Number(p.stock || 0);
  const reserved = Math.round(stock * 0.12);
  const transit = Math.round(stock * 0.08);
  const total = stock + reserved + transit;

  setTxt('inv-available', `${stock.toLocaleString()} units`);
  setTxt('inv-reserved', `${reserved.toLocaleString()} units`);
  setTxt('inv-transit', `${transit.toLocaleString()} units`);
  setTxt('inv-total', `${total.toLocaleString()} units`);

  const barContainer = document.getElementById('inv-bar-container');
  if (barContainer) {
    const bars = [
      { label: 'Available', value: stock, color: 'var(--success)' },
      { label: 'Reserved', value: reserved, color: 'var(--warning)' },
      { label: 'In Transit', value: transit, color: 'var(--primary)' },
    ];

    barContainer.innerHTML = bars.map(b => `
      <div>
        <div style="display:flex;justify-content:space-between;font-size:11px;color:var(--text3);margin-bottom:4px">
          <span>${b.label}</span>
          <span style="font-weight:700;color:var(--text)">${b.value.toLocaleString()}</span>
        </div>
        <div style="height:8px;background:var(--surface2);border-radius:999px;overflow:hidden">
          <div style="width:${total > 0 ? Math.round((b.value / total) * 100) : 0}%;height:100%;background:${b.color};border-radius:999px"></div>
        </div>
      </div>
    `).join('');
  }

  const marketGrid = document.getElementById('inv-market-grid');
  if (marketGrid) {
    const markets = ['UAE', 'KSA', 'Kuwait', 'Bahrain', 'Oman', 'Jordan'];
    marketGrid.innerHTML = markets.map(m => {
      const share = Math.round(6 + Math.random() * 28);
      return `
        <div style="background:var(--surface2);border:1px solid var(--border);border-radius:12px;padding:12px">
          <div style="font-size:13px;font-weight:700;color:var(--text)">${m}</div>
          <div style="font-size:11px;color:var(--text3);margin-top:2px">${share}% share</div>
          <div style="height:4px;background:var(--border);border-radius:999px;margin-top:8px;overflow:hidden">
            <div style="width:${share}%;height:100%;background:var(--primary);border-radius:999px"></div>
          </div>
        </div>
      `;
    }).join('');
  }
}

// ── Details Tab ───────────────────────────────────────────────
function renderDetailsTab(p) {
  const info = document.getElementById('det-info-table');
  if (info) {
    const rows = [
      ['SKU', p.sku || '—'],
      ['Category', p.cat || '—'],
      ['Brand', p.brand_name || p.brand || '—'],
      ['Price', p.price ? `AED ${Number(p.price).toLocaleString()}` : '—'],
      ['Stock', `${Number(p.stock || 0).toLocaleString()} units`],
      ['Product ID', `#${p.id || '—'}`],
    ];

    info.innerHTML = rows.map(([k, v]) => `
      <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border);font-size:12px;gap:16px">
        <span style="color:var(--text3)">${k}</span>
        <span style="font-weight:700;color:var(--text);text-align:right;max-width:65%;word-break:break-word">${v}</span>
      </div>
    `).join('');
  }

  const desc = document.getElementById('det-desc');
  if (desc) desc.textContent = p.description || p.desc || 'No description available for this product.';

  const qs = document.getElementById('det-quick-stats');
  if (qs) {
    const pct = Number(p.stock_pct || 0);
    const color = pct > 75 ? 'var(--success)' : pct > 50 ? 'var(--warning)' : 'var(--danger)';
    qs.innerHTML = [
      ['Stock Level', `${pct}%`, color],
      ['Available', `${Number(p.stock || 0).toLocaleString()} units`, 'var(--text)'],
      ['Category', p.cat || '—', 'var(--text)'],
      ['Price', p.price ? `AED ${Number(p.price).toLocaleString()}` : '—', 'var(--text)'],
    ].map(([k, v, c]) => `
      <div style="background:var(--surface2);border:1px solid var(--border);border-radius:12px;padding:12px;text-align:center">
        <div style="font-size:11px;color:var(--text3);margin-bottom:4px">${k}</div>
        <div style="font-size:13px;font-weight:800;color:${c}">${v}</div>
      </div>
    `).join('');
  }
}

// ── Util ──────────────────────────────────────────────────────
function setTxt(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}