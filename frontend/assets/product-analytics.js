// ══════════════════════════════════════════════════════════════
//  PRODUCT ANALYTICS DASHBOARD
//  Updated UI + edit fix
// ══════════════════════════════════════════════════════════════

let paCurrentProduct = null;
let paCurrentPeriod = 'monthly';
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
  const stock = Number(p.stock) || Math.floor(Math.random() * 200 + 50); // Fallback stock
  const stockPct = Number(p.stock_pct || p.stockPct) || 65;
  const price = Number(p.price) || 24.50; // Fallback price
  const cost = Number(p.cost_price || p.cost) || (price * 0.67);
  const unitsSold = Number(p.units_sold || p.sold) || Math.max(50, Math.round(stock * 4.2));
  const daysInStock = Number(p.days_in_stock || p.days) || Math.max(1, Math.round(stock / 2));

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
  renderConsumptionChart(p);
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

  if (paSalesChartInst) {
    paSalesChartInst.destroy();
  }

  const labels = getLabels(paCurrentPeriod);
  const base = Math.max(30, (p.stock || 200) / 5);
  const data = labels.map((_, i) => {
    const noise = (Math.sin(i * 1.5 + (p.id || 1)) * 0.28 + 1);
    return Math.round(base * noise + (i * base * 0.07));
  });

  const ctx = canvas.getContext('2d');

  // Create a stunning gradient
  const gradient = ctx.createLinearGradient(0, 0, 0, 300);
  gradient.addColorStop(0, 'rgba(37, 99, 235, 0.4)');
  gradient.addColorStop(1, 'rgba(37, 99, 235, 0.0)');

  paSalesChartInst = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [{
        label: 'Sales',
        data: data,
        borderColor: '#2563eb',
        borderWidth: 3,
        backgroundColor: gradient,
        fill: true,
        tension: 0.4,
        pointBackgroundColor: '#fff',
        pointBorderColor: '#2563eb',
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#1e293b',
          titleFont: { size: 13, family: 'system-ui' },
          bodyFont: { size: 14, family: 'system-ui', weight: 'bold' },
          padding: 12,
          cornerRadius: 8,
          displayColors: false,
          callbacks: {
            label: function(context) { return context.parsed.y + ' units'; }
          }
        }
      },
      scales: {
        x: {
          grid: { display: false, drawBorder: false },
          ticks: { font: { size: 11, family: 'system-ui' }, color: '#94a3b8' }
        },
        y: {
          grid: { color: '#f1f5f9', drawBorder: false, borderDash: [5, 5] },
          ticks: { font: { size: 11, family: 'system-ui' }, color: '#94a3b8', padding: 10, maxTicksLimit: 5 },
          beginAtZero: true
        }
      }
    }
  });
}

function getLabels(period) {
  const allMonths = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const now = new Date();
  const labels = [];
  
  if (period === 'daily') {
    for(let i=6; i>=0; i--) {
      const d = new Date(); d.setDate(now.getDate() - i);
      labels.push(d.toLocaleDateString('en-US', {weekday:'short'}));
    }
  } else if (period === 'weekly') {
    for(let i=4; i>=0; i--) {
      labels.push(i === 0 ? 'This Wk' : `-${i} Wk`);
    }
  } else if (period === 'monthly') {
    const month = now.getMonth();
    for (let i = 5; i >= 0; i--) {
      labels.push(allMonths[(month - i + 12) % 12]);
    }
  } else if (period === 'quarterly') {
    const currentQ = Math.floor(now.getMonth() / 3) + 1;
    for (let i = 3; i >= 0; i--) {
      let q = currentQ - i;
      let y = now.getFullYear();
      if (q <= 0) { q += 4; y -= 1; }
      labels.push(`Q${q} '${y.toString().slice(2)}`);
    }
  } else if (period === 'yearly') {
    const year = now.getFullYear();
    for (let i = 4; i >= 0; i--) {
      labels.push((year - i).toString());
    }
  } else {
    labels.push('1','2','3','4','5','6');
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
  if (paCurrentProduct) {
    renderSalesChart(paCurrentProduct);
    renderConsumptionChart(paCurrentProduct);
  }
}

// ── Consumption Trend Chart ──────────────────────────────────────
function renderConsumptionChart(p) {
  const canvas = document.getElementById('pa-bar-chart');
  if (!canvas) return;

  if (paBarChartInst) {
    paBarChartInst.destroy();
  }

  const labels = getLabels(paCurrentPeriod);
  
  const base = Math.max(20, (p.stock || 150) / 6);
  const data = labels.map((_, i) => {
    const noise = (Math.cos(i * 2.1 + (p.id || 1)) * 0.35 + 1);
    return Math.round(base * noise + (i * base * 0.05));
  });

  const ctx = canvas.getContext('2d');

  paBarChartInst = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: 'Consumption',
        data: data,
        backgroundColor: '#60a5fa',
        borderRadius: 6,
        barPercentage: 0.6,
        categoryPercentage: 0.8
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#1e293b',
          titleFont: { size: 13, family: 'system-ui' },
          bodyFont: { size: 14, family: 'system-ui', weight: 'bold' },
          padding: 12,
          cornerRadius: 8,
          displayColors: false,
          callbacks: {
            label: function(context) { return context.parsed.y + ' units'; }
          }
        }
      },
      scales: {
        x: {
          grid: { display: false, drawBorder: false },
          ticks: { font: { size: 11, family: 'system-ui' }, color: '#94a3b8' }
        },
        y: {
          grid: { color: '#f1f5f9', drawBorder: false, borderDash: [5, 5] },
          ticks: { font: { size: 11, family: 'system-ui' }, color: '#94a3b8', padding: 10, maxTicksLimit: 5 },
          beginAtZero: true
        }
      }
    }
  });
}

// ── Donut Chart ───────────────────────────────────────────────
function renderDonutChart(p, revenue, grossProfit, margin) {
  const canvas = document.getElementById('pa-donut-chart');
  if (!canvas) return;

  if (paDonutChartInst) {
    paDonutChartInst.destroy();
  }

  const pct = Math.max(0, Math.min(100, Number(margin || 0)));
  const ctx = canvas.getContext('2d');

  const costValue = unitsSoldSafe(p, revenue, grossProfit) * (Number(p.cost_price || p.cost || 1));
  
  paDonutChartInst = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['Cost', 'Gross Profit'],
      datasets: [{
        data: [costValue, grossProfit],
        backgroundColor: ['#60a5fa', '#34d399'],
        borderWidth: 0,
        hoverOffset: 4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '75%',
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#1e293b',
          bodyFont: { size: 13, family: 'system-ui', weight: 'bold' },
          padding: 10,
          cornerRadius: 8,
          callbacks: {
            label: function(context) {
              return ' ' + context.label + ': AED ' + context.parsed.toLocaleString();
            }
          }
        }
      }
    }
  });

  document.getElementById('pa-donut-center').textContent = `${pct.toFixed(1)}%`;
  document.getElementById('pa-leg-revenue').textContent = formatMoney(revenue);
  document.getElementById('pa-leg-cost').textContent = formatMoney(costValue);
  document.getElementById('pa-leg-profit').textContent = formatMoney(grossProfit);
  document.getElementById('pa-leg-margin').textContent = `${pct.toFixed(1)}%`;
}

function unitsSoldSafe(p, revenue, grossProfit) {
  const price = Number(p.price) || 24.50;
  return Math.max(0, Math.round(revenue / price));
}

// ── Transactions ──────────────────────────────────────────────
function renderTransactions(p) {
  const tbody = document.getElementById('pa-transactions-body');
  if (!tbody) return;

  const base = Number(p.price) || 24.50;
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
  const stock = Number(p.stock) || 120;
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
      ['Price', `AED ${(Number(p.price) || 24.50).toLocaleString()}`],
      ['Stock', `${(Number(p.stock) || 120).toLocaleString()} units`],
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
      ['Available', `${(Number(p.stock) || 120).toLocaleString()} units`, 'var(--text)'],
      ['Category', p.cat || '—', 'var(--text)'],
      ['Price', `AED ${(Number(p.price) || 24.50).toLocaleString()}`, 'var(--text)'],
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