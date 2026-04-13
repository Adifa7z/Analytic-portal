// ══════════════════════════════════════════════════════════════
//  BRAND ANALYTICS DASHBOARD
//  Aggregated SaaS-style ERP Dashboard for Brands
//  Depends: Chart.js
// ══════════════════════════════════════════════════════════════

let baBrandName = '';
let baProducts = [];
let baCurrentPeriod = 'monthly';

// Chart Instances
let baSalesChart = null;
let baRevCostChart = null;
let baProfitDonut = null;
let baConsAreaChart = null;
let baCatPieChart = null;
let baTopProdChart = null;

const BA_PERIODS = {
  daily: { pts: 7, label: 'Last 7 Days', mult: 0.1 },
  weekly: { pts: 4, label: 'Last 4 Weeks', mult: 0.4 },
  monthly: { pts: 6, label: 'Last 6 Months', mult: 1.0 },
  quarterly: { pts: 4, label: 'Last 4 Quarters', mult: 3.0 },
  yearly: { pts: 5, label: 'Last 5 Years', mult: 12.0 }
};

// ── Open ──────────────────────────────────────────────────────
async function openBrandAnalytics(brandName) {
  baBrandName = brandName || 'Brand';
  
  // Show loading skeleton / overlay
  let overlay = document.getElementById('brand-analytics-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'brand-analytics-overlay';
    overlay.className = 'pbi-overlay';
    overlay.style.cssText = 'z-index:900; background:rgba(15,23,42,0.6); backdrop-filter:blur(8px);';
    overlay.onclick = (e) => {
      if (e.target === overlay) closeBrandAnalytics();
    };
    document.body.appendChild(overlay);
  }

  overlay.innerHTML = `
    <div class="ba-modal" style="width:98vw; height:96vh; max-width:1800px; background:#f8fafc; border-radius:18px; display:flex; flex-direction:column; overflow:hidden; box-shadow:0 30px 80px rgba(0,0,0,0.3); animation: slideUp 0.3s ease-out;">
      <div style="flex:1; display:flex; align-items:center; justify-content:center; color:var(--text3); font-size:16px;">
        <div style="width:40px;height:40px;border:3px solid var(--border);border-top-color:var(--primary);border-radius:50%;animation:spin 0.8s linear infinite; margin-right:16px;"></div>
        Loading Enterprise Analytics for ${baBrandName}...
      </div>
    </div>
  `;
  overlay.style.display = 'flex';
  setTimeout(() => overlay.classList.add('open'), 10);

  try {
    const res = await fetch('/api/products');
    const json = await res.json();
    baProducts = (json.data || []).filter(
      p => (p.brand_name || '').toLowerCase() === baBrandName.toLowerCase()
    );
    renderBrandAnalytics();
  } catch (err) {
    console.error(err);
    alert('Failed to load brand data');
    closeBrandAnalytics();
  }
}

function closeBrandAnalytics() {
  const overlay = document.getElementById('brand-analytics-overlay');
  if (overlay) {
    overlay.classList.remove('open');
    setTimeout(() => overlay.style.display = 'none', 260);
  }
}

// ── Aggregation Engine ────────────────────────────────────────
function getBrandMetrics() {
  let revenue = 0;
  let cost = 0;
  let unitsSold = 0;
  let expectedCons = 0;
  let healthyStockCount = 0;
  
  const pList = baProducts.map(p => {
    const pStock = Number(p.stock) || Math.floor(Math.random() * 200 + 50);
    const pStockPct = Number(p.stock_pct || p.stockPct) || 65;
    const pPrice = Number(p.price) || 24.50;
    const pCost = Number(p.cost_price || p.cost) || (pPrice * 0.67);
    const pSold = Number(p.units_sold || p.sold) || Math.max(50, Math.round(pStock * 4.2));
    
    // Scale to period
    const mult = BA_PERIODS[baCurrentPeriod]?.mult || 1;
    const pSoldScaled = Math.round(pSold * mult);
    
    const pRev = pSoldScaled * pPrice;
    const pCst = pSoldScaled * pCost;
    
    revenue += pRev;
    cost += pCst;
    unitsSold += pSoldScaled;
    expectedCons += Math.round(pSoldScaled * 0.8); // simulated consumption
    
    if (pStockPct > 50) healthyStockCount++;

    return { 
      name: p.name, 
      cat: p.cat || 'Other', 
      rev: pRev, 
      sold: pSoldScaled, 
      sku: p.sku || 'SKU',
      stock: pStockPct
    };
  });

  const profit = revenue - cost;
  let margin = revenue > 0 ? (profit / revenue) * 100 : 0;
  
  let healthStat = 'Low';
  let healthCol = 'var(--danger)';
  const healthPct = (healthyStockCount / Math.max(1, baProducts.length)) * 100;
  if(healthPct > 70) { healthStat = 'Good'; healthCol = 'var(--success)'; }
  else if(healthPct > 40) { healthStat = 'Medium'; healthCol = 'var(--warning)'; }

  // Sort products
  pList.sort((a,b) => b.rev - a.rev);
  const topProducts = pList.slice(0, 5);
  const lowProducts = [...pList].sort((a,b) => a.rev - b.rev).slice(0, 5);

  // Categories
  const catMap = {};
  pList.forEach(p => catMap[p.cat] = (catMap[p.cat] || 0) + p.rev);

  return {
    revenue, cost, profit, margin, unitsSold, expectedCons, healthStat, healthCol,
    topProducts, lowProducts, catMap
  };
}

// ── Time Series Generation ────────────────────────────────────
function getBrandTimeSeries(pts, baseVal) {
  const arr = [];
  for(let i=0; i<pts; i++) {
    // Generate organic looking curves based on brand name length
    const noise = Math.sin(i * 1.2 + baBrandName.length) * 0.3 + 1;
    arr.push(Math.max(0, Math.round(baseVal * noise + (i * baseVal * 0.05))));
  }
  return arr.reverse(); // latest at end
}

function getPeriodLabels(period) {
  const labels = [];
  const d = new Date();
  if (period === 'daily') {
    for (let i = 6; i >= 0; i--) {
      const temp = new Date(d); temp.setDate(d.getDate() - i);
      labels.push(temp.toLocaleDateString('en-GB', { weekday:'short'}));
    }
  } else if (period === 'weekly') {
    for (let i = 3; i >= 0; i--) labels.push('Week ' + (4 - i));
  } else if (period === 'monthly') {
    for (let i = 5; i >= 0; i--) {
      const temp = new Date(d); temp.setMonth(d.getMonth() - i);
      labels.push(temp.toLocaleDateString('en-GB', { month:'short'}));
    }
  } else if (period === 'quarterly') {
    for (let i = 3; i >= 0; i--) labels.push('Q' + (4 - i));
  } else if (period === 'yearly') {
    for (let i = 4; i >= 0; i--) labels.push((d.getFullYear() - i).toString());
  }
  return labels;
}

// ── Rendering Engine ──────────────────────────────────────────
function renderBrandAnalytics() {
  const overlay = document.getElementById('brand-analytics-overlay');
  if (!overlay) return;

  const m = getBrandMetrics();
  
  overlay.innerHTML = `
    <div class="ba-modal" style="width:98vw; height:96vh; max-width:1800px; background:#f4f7f9; border-radius:18px; display:flex; flex-direction:column; overflow:hidden; box-shadow:0 30px 80px rgba(0,0,0,0.3); font-family:'Inter', system-ui, sans-serif;">
      
      <!-- Top header -->
      <div style="background:#fff; border-bottom:1px solid #e2e8f0; padding:18px 26px; display:flex; justify-content:space-between; align-items:center; z-index:10;">
        <div style="display:flex; align-items:center; gap:16px;">
          <div style="width:44px; height:44px; border-radius:12px; background:linear-gradient(135deg, #1A56DB, #3b82f6); display:flex; align-items:center; justify-content:center; color:#fff; font-weight:800; font-size:22px; box-shadow:0 4px 12px rgba(37,99,235,0.3);">
            ${baBrandName.charAt(0).toUpperCase()}
          </div>
          <div>
            <div style="font-size:22px; font-weight:900; color:#0f172a; letter-spacing:-0.5px;">${baBrandName} Analytics</div>
            <div style="font-size:13px; color:#64748b; font-weight:500; margin-top:2px;">
              ${baProducts.length} Products  ·  Organized as an Enterprise Overview
            </div>
          </div>
        </div>
        
        <div style="display:flex; align-items:center; gap:12px;">
          <div style="display:flex; background:#f1f5f9; padding:4px; border-radius:10px;">
            ${['daily','weekly','monthly','quarterly','yearly'].map(p => `
              <button onclick="setBaPeriod('${p}')" style="padding:6px 14px; border-radius:6px; font-size:12px; font-weight:700; cursor:pointer; transition:all 0.2s; border:none; ${baCurrentPeriod === p ? 'background:#fff; color:#0f172a; box-shadow:0 2px 6px rgba(0,0,0,0.06);' : 'background:transparent; color:#64748b;'}">
                ${p.charAt(0).toUpperCase() + p.slice(1)}
              </button>
            `).join('')}
          </div>
          <button onclick="closeBrandAnalytics()" style="width:36px; height:36px; border-radius:10px; border:1px solid #e2e8f0; background:#fff; font-size:18px; cursor:pointer; color:#64748b; display:flex; align-items:center; justify-content:center; transition:0.2s;" onmouseover="this.style.background='#f1f5f9'" onmouseout="this.style.background='#fff'">✕</button>
        </div>
      </div>

      <!-- Scrollable Base -->
      <div style="flex:1; overflow-y:auto; padding:24px; background:#f8fafc;">
        
        <!-- KPI Cards Row -->
        <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(200px, 1fr)); gap:18px; margin-bottom:24px;">
          ${baKpiCard('Total Revenue', 'AED ' + Number(m.revenue).toLocaleString(), '💳', '#1A56DB', '#eff6ff')}
          ${baKpiCard('Total Cost', 'AED ' + Number(m.cost).toLocaleString(), '📉', '#ef4444', '#fef2f2')}
          ${baKpiCard('Gross Profit', 'AED ' + Number(m.profit).toLocaleString(), '💰', '#10B981', '#ecfdf5')}
          ${baKpiCard('Gross Margin', m.margin.toFixed(1) + '%', '📊', '#8b5cf6', '#f5f3ff')}
          ${baKpiCard('Units Sold', Number(m.unitsSold).toLocaleString(), '📦', '#f59e0b', '#fffbeb')}
          ${baKpiCard('Expected Consumption', Number(m.expectedCons).toLocaleString(), '🔥', '#ec4899', '#fdf2f8')}
          ${baKpiCard('Inventory Health', m.healthStat, '🏥', m.healthCol, m.healthCol+'15')}
        </div>

        <!-- BENTO GRID -->
        <div style="display:grid; grid-template-columns:2fr 1fr; gap:20px; margin-bottom:20px;">
          
          <!-- Sales Trend (Main Span) -->
          <div class="ba-card">
            <div class="ba-card-title">Overall Sales Trend</div>
            <div style="height:280px; position:relative; margin-top:16px;">
              <canvas id="ba-sales-chart" style="width:100%;height:100%"></canvas>
            </div>
          </div>

          <!-- Profitability Donut -->
          <div class="ba-card">
            <div class="ba-card-title">Profitability Distribution</div>
            <div style="height:250px; position:relative; margin-top:16px; display:flex; justify-content:center;">
              <canvas id="ba-donut-chart"></canvas>
              <div style="position:absolute; top:50%; left:50%; transform:translate(-50%, -50%); text-align:center;">
                 <div style="font-size:28px; font-weight:900; color:#0f172a;">${m.margin.toFixed(1)}%</div>
                 <div style="font-size:12px; color:#64748b; font-weight:600;">MARGIN</div>
              </div>
            </div>
          </div>

        </div>

        <div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:20px; margin-bottom:20px;">
          
          <!-- Revenue vs Cost Bar -->
          <div class="ba-card">
            <div class="ba-card-title">Revenue vs Cost</div>
            <div style="height:240px; position:relative; margin-top:16px;">
              <canvas id="ba-revcost-chart" style="width:100%;height:100%"></canvas>
            </div>
          </div>

          <!-- Category Pie -->
          <div class="ba-card">
            <div class="ba-card-title">Category Wise Distribution</div>
            <div style="height:240px; position:relative; margin-top:16px; padding-bottom:10px;">
              <canvas id="ba-cat-chart" style="width:100%;height:100%"></canvas>
            </div>
          </div>

          <!-- Consumption Trend -->
          <div class="ba-card">
            <div class="ba-card-title">Consumption Velocity (Units)</div>
            <div style="height:240px; position:relative; margin-top:16px;">
              <canvas id="ba-cons-chart" style="width:100%;height:100%"></canvas>
            </div>
          </div>

        </div>

        <!-- Tables Row -->
        <div style="display:grid; grid-template-columns:1.5fr 1fr; gap:20px;">
          
          <!-- Top Performers (Horizontal Bar) -->
          <div class="ba-card">
            <div class="ba-card-title">Top Performing Products</div>
            <div style="height:260px; position:relative; margin-top:16px;">
               <canvas id="ba-topprod-chart" style="width:100%;height:100%"></canvas>
            </div>
          </div>

          <!-- Bottom Performers (Table) -->
          <div class="ba-card">
            <div class="ba-card-title">Needs Attention (Low Performers)</div>
            <div style="margin-top:16px; display:flex; flex-direction:column; gap:8px;">
               ${m.lowProducts.map(p => `
                 <div style="background:#f8fafc; border:1px solid #f1f5f9; border-radius:10px; padding:12px; display:flex; justify-content:space-between; align-items:center;">
                   <div style="min-width:0; flex:1;">
                     <div style="font-size:13px; font-weight:700; color:#0f172a; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${p.name}</div>
                     <div style="font-size:11px; color:#64748b; margin-top:3px;">${p.cat} · ${p.sku}</div>
                   </div>
                   <div style="text-align:right; flex-shrink:0;">
                     <div style="font-size:13px; font-weight:800; color:#ef4444;">AED ${p.rev.toLocaleString()}</div>
                     <div style="font-size:11px; color:#64748b; margin-top:3px;">${p.sold} units sold</div>
                   </div>
                 </div>
               `).join('')}
               ${m.lowProducts.length === 0 ? '<div style="padding:20px;text-align:center;color:#94a3b8;font-size:13px;">No data</div>' : ''}
            </div>
          </div>

        </div>
      </div>
    </div>
  `;

  injectBaStyles();
  renderBaCharts(m);
}

function baKpiCard(title, val, icon, color, bg) {
  return `
    <div style="background:#fff; border:1px solid #e2e8f0; border-radius:16px; padding:20px; display:flex; justify-content:space-between; align-items:center; box-shadow:0 2px 10px rgba(0,0,0,0.02); transition:transform 0.2s, box-shadow 0.2s;" onmouseenter="this.style.transform='translateY(-2px)';this.style.boxShadow='0 8px 24px rgba(0,0,0,0.06)'" onmouseleave="this.style.transform='none';this.style.boxShadow='0 2px 10px rgba(0,0,0,0.02)'">
      <div>
        <div style="font-size:12px; font-weight:700; color:#64748b; text-transform:uppercase; letter-spacing:0.5px; margin-bottom:6px;">${title}</div>
        <div style="font-size:22px; font-weight:900; color:#0f172a;">${val}</div>
      </div>
      <div style="width:48px; height:48px; border-radius:14px; background:${bg}; color:${color}; font-size:22px; display:flex; align-items:center; justify-content:center;">
        ${icon}
      </div>
    </div>
  `;
}

function setBaPeriod(p) {
  baCurrentPeriod = p;
  renderBrandAnalytics();
}

// ── Render Charts ─────────────────────────────────────────────
function renderBaCharts(m) {
  const pts = BA_PERIODS[baCurrentPeriod].pts;
  const labels = getPeriodLabels(baCurrentPeriod);
  
  // 1. Sales Trend (Line)
  const salesCtx = document.getElementById('ba-sales-chart')?.getContext('2d');
  if (salesCtx) {
    if (baSalesChart) baSalesChart.destroy();
    const grad = salesCtx.createLinearGradient(0,0,0,280);
    grad.addColorStop(0, 'rgba(37, 99, 235, 0.2)');
    grad.addColorStop(1, 'rgba(37, 99, 235, 0)');

    const dataArr = getBrandTimeSeries(pts, m.revenue / pts);

    baSalesChart = new Chart(salesCtx, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: 'Brand Sales (AED)', 
          data: dataArr, 
          borderColor: '#2563eb', 
          backgroundColor: grad, 
          borderWidth: 3, 
          tension: 0.4, 
          fill: true,
          pointBackgroundColor: '#fff', 
          pointBorderColor: '#2563eb', 
          pointBorderWidth: 2, 
          pointRadius: 4, 
          pointHoverRadius: 6
        }]
      },
      options: getSharedOpt()
    });
  }

  // 2. Rev vs Cost (Bar)
  const rcCtx = document.getElementById('ba-revcost-chart')?.getContext('2d');
  if (rcCtx) {
    if (baRevCostChart) baRevCostChart.destroy();
    
    const revArr = getBrandTimeSeries(pts, m.revenue / pts);
    const costArr = getBrandTimeSeries(pts, m.cost / pts);

    baRevCostChart = new Chart(rcCtx, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          { label: 'Revenue', data: revArr, backgroundColor: '#3b82f6', borderRadius: 4 },
          { label: 'Cost', data: costArr, backgroundColor: '#f43f5e', borderRadius: 4 }
        ]
      },
      options: { ...getSharedOpt(), plugins: { legend: { display:true, position:'top', labels:{boxWidth:10, font:{family:'Inter'}} } } }
    });
  }

  // 3. Profit Donut
  const dnCtx = document.getElementById('ba-donut-chart')?.getContext('2d');
  if (dnCtx) {
    if (baProfitDonut) baProfitDonut.destroy();
    baProfitDonut = new Chart(dnCtx, {
      type: 'doughnut',
      data: {
        labels: ['Cost', 'Gross Profit'],
        datasets: [{
          data: [m.cost, m.profit],
          backgroundColor: ['#f43f5e', '#10b981'],
          borderWidth: 0, hoverOffset: 6
        }]
      },
      options: { responsive:true, maintainAspectRatio:false, cutout: '76%', plugins:{ legend:{display:false}, tooltip: getSharedOpt().plugins.tooltip } }
    });
  }

  // 4. Consumption Area
  const consCtx = document.getElementById('ba-cons-chart')?.getContext('2d');
  if (consCtx) {
    if (baConsAreaChart) baConsAreaChart.destroy();
    const grad = consCtx.createLinearGradient(0,0,0,240);
    grad.addColorStop(0, 'rgba(16, 185, 129, 0.25)');
    grad.addColorStop(1, 'rgba(16, 185, 129, 0)');
    
    const cArr = getBrandTimeSeries(pts, m.expectedCons / pts);

    baConsAreaChart = new Chart(consCtx, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: 'Units Consumed', data: cArr, borderColor: '#10b981', backgroundColor: grad, 
          borderWidth: 2, tension: 0.4, fill: true, pointRadius: 0, pointHoverRadius: 5
        }]
      },
      options: { ...getSharedOpt(), scales:{x:{grid:{display:false}}, y:{display:false}} }
    });
  }

  // 5. Category Pie
  const catCtx = document.getElementById('ba-cat-chart')?.getContext('2d');
  if (catCtx) {
    if (baCatPieChart) baCatPieChart.destroy();
    
    const catKeys = Object.keys(m.catMap);
    const catVals = Object.values(m.catMap);
    const colors = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#14b8a6', '#64748b'];

    baCatPieChart = new Chart(catCtx, {
      type: 'pie',
      data: {
        labels: catKeys,
        datasets: [{ data: catVals, backgroundColor: colors, borderWidth: 2, borderColor:'#fff', hoverOffset: 4 }]
      },
      options: { responsive:true, maintainAspectRatio:false, plugins:{ legend:{position:'right', labels:{usePointStyle:true, boxWidth:8, font:{size:11, family:'Inter'}}}, tooltip: getSharedOpt().plugins.tooltip } }
    });
  }

  // 6. Top Products Horizontal Bar
  const tpCtx = document.getElementById('ba-topprod-chart')?.getContext('2d');
  if (tpCtx) {
    if (baTopProdChart) baTopProdChart.destroy();
    
    const tpNames = m.topProducts.map(p => p.name.length > 22 ? p.name.substring(0,20)+'...' : p.name);
    const tpRevs = m.topProducts.map(p => p.rev);

    baTopProdChart = new Chart(tpCtx, {
      type: 'bar',
      data: {
        labels: tpNames,
        datasets: [{ label: 'Revenue (AED)', data: tpRevs, backgroundColor: '#8b5cf6', borderRadius: 6 }]
      },
      options: {
        indexAxis: 'y',
        responsive: true, maintainAspectRatio: false,
        plugins: { legend:{display:false}, tooltip: getSharedOpt().plugins.tooltip },
        scales: { 
          x: { display:false }, 
          y: { grid:{display:false, drawBorder:false}, ticks:{font:{family:'Inter', size:11}, color:'#475569'} }
        }
      }
    });
  }
}

function getSharedOpt() {
  return {
    responsive: true, maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#0f172a',
        titleFont: { size: 13, family: 'Inter' },
        bodyFont: { size: 14, family: 'Inter', weight: 'bold' },
        padding: 12, cornerRadius: 8, displayColors: false
      }
    },
    scales: {
      x: { grid: { display:false, drawBorder:false }, ticks: { font:{size:11, family:'Inter'}, color:'#94a3b8' } },
      y: { grid: { color:'#f1f5f9', drawBorder:false, borderDash:[5,5] }, ticks: { font:{size:11, family:'Inter'}, color:'#94a3b8', maxTicksLimit:5 }, beginAtZero:true }
    }
  };
}

// ── Styles ────────────────────────────────────────────────────
function injectBaStyles() {
  if (document.getElementById('ba-styles-id')) return;
  const st = document.createElement('style');
  st.id = 'ba-styles-id';
  st.innerHTML = `
    .ba-card {
      background: #fff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 22px;
      box-shadow: 0 4px 14px rgba(0,0,0,0.015);
    }
    .ba-card-title {
      font-size: 15px; font-weight: 800; color: #0f172a; letter-spacing: -0.2px;
    }
    @keyframes slideUp {
      from { transform: translateY(20px); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
  `;
  document.head.appendChild(st);
}
