// ══════════════════════════════════════════════════════════════
//  MODULE: PURCHASE INTELLIGENCE
//  File: frontend/js/modules/purchase-module.js
//  Depends: Chart.js (loaded in index.html)
// ══════════════════════════════════════════════════════════════

let _purchaseChartLine = null;
let _purchaseChartBar  = null;

async function openPurchaseModule(productId) {
  if (!productId) return;
  _renderModuleShell('purchase-module-overlay', 'Purchase Intelligence', '🛒', '#1A56DB');
  _showModuleLoading('purchase-module-overlay');

  try {
    const res  = await fetch(`/api/products/${productId}/purchase`);
    if (!res.ok) throw new Error('Failed to load purchase data');
    const data = await res.json();
    _renderPurchaseContent(data);
  } catch (err) {
    _showModuleError('purchase-module-overlay', err.message);
  }
}

function _renderPurchaseContent(d) {
  const body = document.getElementById('module-body');
  if (!body) return;

  const rec = d.recommendations || [];
  const sup = d.suppliers || [];

  body.innerHTML = `
    <!-- KPI Row -->
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:18px">
      ${_kpiCard('Total Purchase Value', d.kpis.total_purchase_value, '🛒', '#1A56DB')}
      ${_kpiCard('Supplier Performance', d.kpis.supplier_performance, '📊', '#10B981')}
      ${_kpiCard('Avg Lead Time',        d.kpis.avg_lead_time,        '⚡', '#F59E0B')}
      ${_kpiCard('Gross Margin',         d.kpis.gross_margin,         '📉', '#8B5CF6')}
    </div>

    <!-- Charts Row -->
    <div style="display:grid;grid-template-columns:2fr 1fr;gap:14px;margin-bottom:18px">
      <div class="mod-card">
        <div class="mod-card-hdr">
          <span class="mod-card-title">Purchase vs Sales Trend</span>
          <div style="display:flex;gap:12px">
            ${_legend('#1A56DB','Purchases')} ${_legend('#10B981','Sales')}
          </div>
        </div>
        <canvas id="purchase-line-chart" height="130"></canvas>
      </div>

      <div class="mod-card">
        <div class="mod-card-hdr"><span class="mod-card-title">Supplier Performance</span></div>
        <div style="display:flex;flex-direction:column;gap:10px;margin-top:4px">
          ${sup.map(s => `
            <div style="display:flex;align-items:center;gap:8px">
              <div style="flex:1;min-width:0">
                <div style="font-size:12px;font-weight:600;color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${s.name}</div>
                <div style="height:6px;background:#e5e7eb;border-radius:99px;margin-top:4px;overflow:hidden">
                  <div style="height:100%;width:${s.score}%;background:${s.score>=85?'#10B981':s.score>=70?'#1A56DB':'#F59E0B'};border-radius:99px;transition:width 0.6s"></div>
                </div>
              </div>
              <span style="font-size:13px;font-weight:800;color:var(--text);flex-shrink:0">${s.score}%</span>
            </div>
          `).join('')}
        </div>
      </div>
    </div>

    <!-- Reorder + Recommendations -->
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:18px">
      <div class="mod-card">
        <div class="mod-card-hdr"><span class="mod-card-title">Reorder Intelligence</span></div>
        <div style="display:flex;flex-direction:column;gap:10px;margin-top:8px">
          ${_infoRow('Suggested Qty',  d.reorder.suggested_qty + ' units')}
          ${_infoRow('Reorder Point',  d.reorder.reorder_point + ' units remaining')}
          ${_infoRow('Coverage Days',  d.reorder.coverage_days + ' days')}
          ${_urgencyBadge(d.reorder.urgency, d.reorder.coverage_days)}
        </div>
      </div>

      <div class="mod-card">
        <div class="mod-card-hdr"><span class="mod-card-title">AI Recommendations</span><span class="ai-badge-sm">AI</span></div>
        <div style="display:flex;flex-direction:column;gap:8px;margin-top:6px">
          ${rec.map(r => `
            <div style="display:flex;gap:10px;align-items:flex-start;padding:10px;border-radius:10px;background:${r.level==='urgent'?'#fef2f2':r.level==='warn'?'#fffbeb':r.level==='info'?'#eff6ff':'#f0fdf4'};border:1px solid ${r.level==='urgent'?'#fecaca':r.level==='warn'?'#fde68a':r.level==='info'?'#bfdbfe':'#bbf7d0'}">
              <span style="font-size:16px;flex-shrink:0">${r.icon}</span>
              <div>
                <div style="font-size:12px;font-weight:700;color:var(--text)">${r.title}</div>
                <div style="font-size:11px;color:var(--text3);margin-top:2px">${r.detail}</div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    </div>

    <!-- Bar chart: monthly purchase units -->
    <div class="mod-card">
      <div class="mod-card-hdr"><span class="mod-card-title">Monthly Purchase vs Sales Volume</span></div>
      <canvas id="purchase-bar-chart" height="100"></canvas>
    </div>
  `;

  // Line chart
  const lineCtx = document.getElementById('purchase-line-chart');
  if (lineCtx) {
    if (_purchaseChartLine) _purchaseChartLine.destroy();
    _purchaseChartLine = new Chart(lineCtx, {
      type: 'line',
      data: {
        labels:   d.trends.labels,
        datasets: [
          { label: 'Purchases', data: d.trends.purchase, borderColor: '#1A56DB', backgroundColor: 'rgba(26,86,219,0.08)', borderWidth: 2.5, tension: 0.4, fill: true, pointRadius: 3 },
          { label: 'Sales',     data: d.trends.sales,    borderColor: '#10B981', backgroundColor: 'rgba(16,185,129,0.08)', borderWidth: 2.5, tension: 0.4, fill: true, pointRadius: 3 },
        ]
      },
      options: { responsive: true, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.04)' } }, x: { grid: { display: false } } } }
    });
  }

  // Bar chart
  const barCtx = document.getElementById('purchase-bar-chart');
  if (barCtx) {
    if (_purchaseChartBar) _purchaseChartBar.destroy();
    _purchaseChartBar = new Chart(barCtx, {
      type: 'bar',
      data: {
        labels:   d.trends.labels,
        datasets: [
          { label: 'Purchases', data: d.trends.purchase, backgroundColor: 'rgba(26,86,219,0.75)', borderRadius: 6 },
          { label: 'Sales',     data: d.trends.sales,    backgroundColor: 'rgba(16,185,129,0.75)', borderRadius: 6 },
        ]
      },
      options: { responsive: true, plugins: { legend: { position: 'top', labels: { font: { size: 11 } } } }, scales: { y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.04)' } }, x: { grid: { display: false } } } }
    });
  }
}
