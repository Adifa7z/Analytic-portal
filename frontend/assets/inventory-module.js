// ══════════════════════════════════════════════════════════════
//  MODULE: INVENTORY CONTROL & PHYSICAL STOCK MONITORING
//  File: frontend/js/modules/inventory-module.js
// ══════════════════════════════════════════════════════════════

let _invChartLine  = null;
let _invChartDonut = null;

async function openInventoryModule(productId) {
  if (!productId) return;
  _renderModuleShell('inventory-module-overlay', 'Inventory Control', '📦', '#10B981');
  _showModuleLoading('inventory-module-overlay');

  try {
    const res  = await fetch(`/api/products/${productId}/inventory`);
    if (!res.ok) throw new Error('Failed to load inventory data');
    const data = await res.json();
    _renderInventoryContent(data);
  } catch (err) {
    _showModuleError('inventory-module-overlay', err.message);
  }
}

function _renderInventoryContent(d) {
  const body = document.getElementById('module-body');
  if (!body) return;

  const locs   = d.locations   || [];
  const alerts = d.alerts      || [];
  const val    = d.valuation   || {};
  const pct    = d.kpis.stock_pct;

  body.innerHTML = `
    <!-- KPI Row -->
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:18px">
      ${_kpiCard('Current Stock',    d.kpis.current_stock,   '📦', '#10B981')}
      ${_kpiCard('Stock Health',     d.kpis.stock_health,    '❤️', pct>=70?'#10B981':pct>=40?'#F59E0B':'#EF4444')}
      ${_kpiCard('Inventory Turns',  d.kpis.inventory_turns, '🔄', '#1A56DB')}
      ${_kpiCard('Shrinkage Rate',   d.kpis.shrinkage_rate,  '📉', '#8B5CF6')}
    </div>

    <!-- Gauge + Alerts -->
    <div style="display:grid;grid-template-columns:1fr 2fr;gap:14px;margin-bottom:18px">
      <div class="mod-card" style="display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px">
        <div style="font-size:13px;font-weight:700;color:var(--text3)">STOCK LEVEL</div>
        <div style="position:relative;width:130px;height:130px">
          <canvas id="inv-donut-chart" width="130" height="130"></canvas>
          <div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center">
            <div style="font-size:24px;font-weight:900;color:var(--text)">${pct}%</div>
            <div style="font-size:10px;color:var(--text3);font-weight:600">${d.kpis.stock_health}</div>
          </div>
        </div>
      </div>

      <div class="mod-card">
        <div class="mod-card-hdr"><span class="mod-card-title">Stock Alerts</span></div>
        <div style="display:flex;flex-direction:column;gap:8px;margin-top:6px">
          ${alerts.map(a => `
            <div style="display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:10px;background:${a.type==='danger'?'#fef2f2':a.type==='warning'?'#fffbeb':'#eff6ff'};border:1px solid ${a.type==='danger'?'#fecaca':a.type==='warning'?'#fde68a':'#bfdbfe'}">
              <span>${a.type==='danger'?'🚨':a.type==='warning'?'⚠️':'ℹ️'}</span>
              <span style="font-size:12px;color:var(--text)">${a.msg}</span>
            </div>
          `).join('')}
        </div>

        <!-- Valuation -->
        <div style="margin-top:14px;padding-top:14px;border-top:1px solid var(--border)">
          <div style="font-size:12px;font-weight:700;color:var(--text3);margin-bottom:8px">STOCK VALUATION</div>
          <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px">
            ${_valBox('At Cost',          val.at_cost,          '#6B7280')}
            ${_valBox('At Retail',        val.at_retail,        '#1A56DB')}
            ${_valBox('Potential Profit', val.potential_profit,  '#10B981')}
          </div>
        </div>
      </div>
    </div>

    <!-- Location Grid -->
    <div class="mod-card" style="margin-bottom:18px">
      <div class="mod-card-hdr"><span class="mod-card-title">Stock by Location</span></div>
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:10px;margin-top:10px">
        ${locs.map(loc => {
          const fillPct = Math.round((loc.units / (locs.reduce((s,l)=>s+l.units,0)||1)) * 100);
          return `
            <div style="padding:14px;border:1px solid var(--border);border-radius:12px;background:var(--surface2)">
              <div style="font-size:12px;font-weight:700;color:var(--text);margin-bottom:6px">${loc.name}</div>
              <div style="font-size:20px;font-weight:900;color:var(--text);margin-bottom:6px">${loc.units.toLocaleString()}</div>
              <div style="height:5px;background:#e5e7eb;border-radius:99px;overflow:hidden">
                <div style="height:100%;width:${fillPct}%;background:#10B981;border-radius:99px"></div>
              </div>
              <div style="font-size:10px;color:var(--text3);margin-top:4px">${fillPct}% of total stock</div>
            </div>
          `;
        }).join('')}
      </div>
    </div>

    <!-- Movement chart -->
    <div class="mod-card">
      <div class="mod-card-hdr">
        <span class="mod-card-title">Stock Movement History</span>
        <div style="display:flex;gap:12px">${_legend('#10B981','Stock Level')} ${_legend('#EF4444','Consumed')}</div>
      </div>
      <canvas id="inv-line-chart" height="110"></canvas>
    </div>
  `;

  // Donut
  const donutCtx = document.getElementById('inv-donut-chart');
  if (donutCtx) {
    if (_invChartDonut) _invChartDonut.destroy();
    _invChartDonut = new Chart(donutCtx, {
      type: 'doughnut',
      data: {
        datasets: [{
          data: [pct, 100 - pct],
          backgroundColor: [pct>=70?'#10B981':pct>=40?'#F59E0B':'#EF4444', '#e5e7eb'],
          borderWidth: 0,
          borderRadius: 4,
        }]
      },
      options: { cutout: '72%', plugins: { legend: { display: false }, tooltip: { enabled: false } } }
    });
  }

  // Line chart
  const lineCtx = document.getElementById('inv-line-chart');
  if (lineCtx) {
    if (_invChartLine) _invChartLine.destroy();
    _invChartLine = new Chart(lineCtx, {
      type: 'line',
      data: {
        labels:   d.movements.labels,
        datasets: [
          { label: 'Stock Level', data: d.movements.stock,    borderColor: '#10B981', backgroundColor: 'rgba(16,185,129,0.08)', borderWidth: 2.5, tension: 0.4, fill: true, pointRadius: 3 },
          { label: 'Consumed',    data: d.movements.consumed, borderColor: '#EF4444', backgroundColor: 'rgba(239,68,68,0.06)',   borderWidth: 2,   tension: 0.4, fill: false, pointRadius: 3, borderDash: [4,3] },
        ]
      },
      options: { responsive: true, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.04)' } }, x: { grid: { display: false } } } }
    });
  }
}

function _valBox(label, val, color) {
  return `
    <div style="background:var(--surface);border:1px solid var(--border);border-radius:10px;padding:10px;text-align:center">
      <div style="font-size:10px;color:var(--text3);font-weight:600;margin-bottom:4px">${label}</div>
      <div style="font-size:13px;font-weight:800;color:${color}">${val}</div>
    </div>
  `;
}
