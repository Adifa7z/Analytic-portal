// ══════════════════════════════════════════════════════════════
//  MODULE: RETAIL OPERATIONS DASHBOARD & ANALYTICS
//  File: frontend/js/modules/retail-module.js
// ══════════════════════════════════════════════════════════════

let _retailChartLine  = null;
let _retailChartDonut = null;
let _retailChartBar   = null;

async function openRetailModule(productId) {
  if (!productId) return;
  _renderModuleShell('retail-module-overlay', 'Retail Operations', '🏪', '#F59E0B');
  _showModuleLoading('retail-module-overlay');

  try {
    const res  = await fetch(`/api/products/${productId}/retail`);
    if (!res.ok) throw new Error('Failed to load retail data');
    const data = await res.json();
    _renderRetailContent(data);
  } catch (err) {
    _showModuleError('retail-module-overlay', err.message);
  }
}

function _renderRetailContent(d) {
  const body = document.getElementById('module-body');
  if (!body) return;

  const channels = d.channels    || [];
  const markets  = d.top_markets || [];
  const promos   = d.promotions  || [];

  body.innerHTML = `
    <!-- KPI Row -->
    <div style="display:grid;grid-template-columns:repeat(5,1fr);gap:12px;margin-bottom:18px">
      ${_kpiCard('Total Revenue',    d.kpis.total_revenue,   '💰', '#F59E0B')}
      ${_kpiCard('Units Sold',       d.kpis.units_sold,      '📦', '#1A56DB')}
      ${_kpiCard('Avg Daily Sales',  d.kpis.avg_daily_sales, '📈', '#10B981')}
      ${_kpiCard('Return Rate',      d.kpis.return_rate,     '↩️', '#EF4444')}
      ${_kpiCard('Sell-Through',     d.kpis.sell_through,    '✅', '#8B5CF6')}
    </div>

    <!-- Sales Trend + Channel Mix -->
    <div style="display:grid;grid-template-columns:2fr 1fr;gap:14px;margin-bottom:18px">
      <div class="mod-card">
        <div class="mod-card-hdr">
          <span class="mod-card-title">Sales Trend (Units vs Revenue)</span>
          <div style="display:flex;gap:12px">${_legend('#F59E0B','Revenue')} ${_legend('#1A56DB','Units')}</div>
        </div>
        <canvas id="retail-line-chart" height="130"></canvas>
      </div>

      <div class="mod-card">
        <div class="mod-card-hdr"><span class="mod-card-title">Channel Mix</span></div>
        <div style="display:flex;justify-content:center;margin:8px 0">
          <div style="position:relative;width:120px;height:120px">
            <canvas id="retail-donut-chart" width="120" height="120"></canvas>
          </div>
        </div>
        <div style="display:flex;flex-direction:column;gap:6px;margin-top:4px">
          ${channels.map(c => `
            <div style="display:flex;align-items:center;justify-content:space-between;gap:6px">
              <div style="display:flex;align-items:center;gap:6px">
                <div style="width:8px;height:8px;border-radius:2px;background:${c.color};flex-shrink:0"></div>
                <span style="font-size:11px;color:var(--text)">${c.name}</span>
              </div>
              <span style="font-size:11px;font-weight:700;color:var(--text)">${c.pct}%</span>
            </div>
          `).join('')}
        </div>
      </div>
    </div>

    <!-- Top Markets + Promotions -->
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:18px">
      <div class="mod-card">
        <div class="mod-card-hdr"><span class="mod-card-title">Top Markets</span></div>
        <div style="display:flex;flex-direction:column;gap:9px;margin-top:6px">
          ${markets.map((m, i) => `
            <div style="display:flex;align-items:center;gap:8px">
              <span style="font-size:11px;font-weight:700;color:var(--text3);width:14px">${i+1}</span>
              <div style="flex:1">
                <div style="display:flex;justify-content:space-between;margin-bottom:3px">
                  <span style="font-size:12px;font-weight:600;color:var(--text)">${m.market}</span>
                  <span style="font-size:12px;font-weight:700;color:var(--text)">${m.share}%</span>
                </div>
                <div style="height:5px;background:#e5e7eb;border-radius:99px;overflow:hidden">
                  <div style="height:100%;width:${m.share}%;background:${['#1A56DB','#10B981','#F59E0B','#8B5CF6','#EF4444'][i]};border-radius:99px"></div>
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>

      <div class="mod-card">
        <div class="mod-card-hdr"><span class="mod-card-title">Active Promotions</span></div>
        <div style="display:flex;flex-direction:column;gap:8px;margin-top:6px">
          ${promos.map(pr => `
            <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 12px;border-radius:10px;background:var(--surface2);border:1px solid var(--border)">
              <div>
                <div style="font-size:12px;font-weight:700;color:var(--text)">${pr.name}</div>
                <div style="font-size:11px;color:var(--text3);margin-top:1px">Sales uplift: <strong style="color:#10B981">${pr.uplift}</strong></div>
              </div>
              <span style="font-size:10px;font-weight:700;padding:3px 8px;border-radius:20px;background:${pr.status==='Active'?'#dcfce7':pr.status==='Planned'?'#dbeafe':'#f3f4f6'};color:${pr.status==='Active'?'#166534':pr.status==='Planned'?'#1e40af':'#6b7280'}">${pr.status}</span>
            </div>
          `).join('')}
        </div>
      </div>
    </div>

    <!-- Return Rate Bar Chart -->
    <div class="mod-card">
      <div class="mod-card-hdr">
        <span class="mod-card-title">Monthly Return Rate (%)</span>
      </div>
      <canvas id="retail-bar-chart" height="90"></canvas>
    </div>
  `;

  // Line chart
  const lineCtx = document.getElementById('retail-line-chart');
  if (lineCtx) {
    if (_retailChartLine) _retailChartLine.destroy();
    _retailChartLine = new Chart(lineCtx, {
      type: 'line',
      data: {
        labels:   d.trends.labels,
        datasets: [
          { label: 'Revenue', data: d.trends.revenue, borderColor: '#F59E0B', backgroundColor: 'rgba(245,158,11,0.08)', borderWidth: 2.5, tension: 0.4, fill: true, yAxisID: 'yR', pointRadius: 3 },
          { label: 'Units',   data: d.trends.units,   borderColor: '#1A56DB', backgroundColor: 'transparent',           borderWidth: 2,   tension: 0.4, fill: false, yAxisID: 'yU', pointRadius: 3, borderDash: [4,3] },
        ]
      },
      options: {
        responsive: true,
        plugins: { legend: { display: false } },
        scales: {
          yR: { type: 'linear', position: 'left',  beginAtZero: true, grid: { color: 'rgba(0,0,0,0.04)' } },
          yU: { type: 'linear', position: 'right', beginAtZero: true, grid: { drawOnChartArea: false } },
          x:  { grid: { display: false } }
        }
      }
    });
  }

  // Donut
  const donutCtx = document.getElementById('retail-donut-chart');
  if (donutCtx) {
    if (_retailChartDonut) _retailChartDonut.destroy();
    _retailChartDonut = new Chart(donutCtx, {
      type: 'doughnut',
      data: {
        labels:   channels.map(c => c.name),
        datasets: [{ data: channels.map(c => c.pct), backgroundColor: channels.map(c => c.color), borderWidth: 2, borderColor: '#fff' }]
      },
      options: { cutout: '65%', plugins: { legend: { display: false }, tooltip: { callbacks: { label: ctx => ` ${ctx.label}: ${ctx.raw}%` } } } }
    });
  }

  // Bar chart
  const barCtx = document.getElementById('retail-bar-chart');
  if (barCtx) {
    if (_retailChartBar) _retailChartBar.destroy();
    _retailChartBar = new Chart(barCtx, {
      type: 'bar',
      data: {
        labels:   d.trends.labels,
        datasets: [{ label: 'Return Rate %', data: d.trends.returns, backgroundColor: 'rgba(239,68,68,0.7)', borderRadius: 6 }]
      },
      options: { responsive: true, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, max: 15, ticks: { callback: v => v + '%' }, grid: { color: 'rgba(0,0,0,0.04)' } }, x: { grid: { display: false } } } }
    });
  }
}
