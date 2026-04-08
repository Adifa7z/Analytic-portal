// ══════════════════════════════════════════════════════════════
//  MODULE: DECISION SUPPORT REPORTS & CONTROL PANELS
//  File: frontend/js/modules/decision-module.js
// ══════════════════════════════════════════════════════════════

let _dsChartForecast  = null;
let _dsChartWaterfall = null;

async function openDecisionModule(productId) {
  if (!productId) return;
  _renderModuleShell('decision-module-overlay', 'Decision Support', '🧠', '#8B5CF6');
  _showModuleLoading('decision-module-overlay');

  try {
    const res  = await fetch(`/api/products/${productId}/decision`);
    if (!res.ok) throw new Error('Failed to load decision data');
    const data = await res.json();
    _renderDecisionContent(data);
  } catch (err) {
    _showModuleError('decision-module-overlay', err.message);
  }
}

function _renderDecisionContent(d) {
  const body = document.getElementById('module-body');
  if (!body) return;

  const score    = d.health_score || 0;
  const sc       = d.scorecard   || [];
  const actions  = d.actions     || [];
  const wf       = d.profit_waterfall || {};

  const scoreColor = score >= 80 ? '#10B981' : score >= 60 ? '#1A56DB' : score >= 40 ? '#F59E0B' : '#EF4444';

  body.innerHTML = `
    <!-- KPI Row -->
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:18px">
      ${_kpiCard('Net Profit',       d.kpis.net_profit,       '💰', '#10B981')}
      ${_kpiCard('ROI',              d.kpis.roi,              '📈', '#8B5CF6')}
      ${_kpiCard('Breakeven Units',  d.kpis.breakeven_units,  '⚖️', '#F59E0B')}
      ${_kpiCard('30-Day Forecast',  d.kpis.forecast_30d,     '🔮', '#1A56DB')}
    </div>

    <!-- Health Score + Scorecard -->
    <div style="display:grid;grid-template-columns:auto 1fr;gap:14px;margin-bottom:18px">
      <div class="mod-card" style="min-width:170px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;padding:22px">
        <div style="font-size:12px;font-weight:700;color:var(--text3);text-align:center">PRODUCT HEALTH SCORE</div>
        <div style="position:relative">
          <svg width="120" height="120" viewBox="0 0 120 120">
            <circle cx="60" cy="60" r="52" fill="none" stroke="#e5e7eb" stroke-width="10"/>
            <circle cx="60" cy="60" r="52" fill="none" stroke="${scoreColor}" stroke-width="10"
              stroke-dasharray="${(score / 100) * 326.7} 326.7"
              stroke-linecap="round"
              transform="rotate(-90 60 60)"
              style="transition:stroke-dasharray 1s ease"/>
          </svg>
          <div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center">
            <div style="font-size:26px;font-weight:900;color:${scoreColor}">${score}</div>
            <div style="font-size:10px;color:var(--text3);font-weight:700">${d.health_label}</div>
          </div>
        </div>
        <div style="font-size:11px;color:var(--text3);text-align:center">Out of 100</div>
      </div>

      <div class="mod-card">
        <div class="mod-card-hdr"><span class="mod-card-title">Performance Scorecard</span></div>
        <div style="display:flex;flex-direction:column;gap:12px;margin-top:8px">
          ${sc.map(item => `
            <div>
              <div style="display:flex;justify-content:space-between;margin-bottom:4px">
                <span style="font-size:12px;font-weight:600;color:var(--text)">${item.label}</span>
                <span style="font-size:12px;font-weight:800;color:${item.score>=70?'#10B981':item.score>=50?'#F59E0B':'#EF4444'}">${item.score}/100</span>
              </div>
              <div style="height:7px;background:#e5e7eb;border-radius:99px;overflow:hidden">
                <div style="height:100%;width:${item.score}%;background:${item.score>=70?'#10B981':item.score>=50?'#F59E0B':'#EF4444'};border-radius:99px;transition:width 0.8s ease"></div>
              </div>
              <div style="font-size:10px;color:var(--text3);margin-top:2px">Weight: ${item.weight}%</div>
            </div>
          `).join('')}
        </div>
      </div>
    </div>

    <!-- Profit Waterfall + Actions -->
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:18px">
      <div class="mod-card">
        <div class="mod-card-hdr"><span class="mod-card-title">Profit Waterfall</span></div>
        <canvas id="ds-waterfall-chart" height="160"></canvas>
      </div>

      <div class="mod-card">
        <div class="mod-card-hdr">
          <span class="mod-card-title">Priority Action Plan</span>
          <span class="ai-badge-sm">AI</span>
        </div>
        <div style="display:flex;flex-direction:column;gap:8px;margin-top:6px">
          ${actions.map(a => `
            <div style="display:flex;gap:10px;align-items:flex-start;padding:10px 12px;border-radius:10px;border:1px solid var(--border);background:var(--surface2)">
              <span style="font-size:18px;flex-shrink:0">${a.icon}</span>
              <div style="flex:1">
                <span style="font-size:10px;font-weight:700;padding:2px 7px;border-radius:20px;background:${a.priority==='high'?'#fef2f2':a.priority==='medium'?'#fffbeb':'#f0fdf4'};color:${a.priority==='high'?'#dc2626':a.priority==='medium'?'#d97706':'#16a34a'}">${a.priority.toUpperCase()}</span>
                <div style="font-size:12px;color:var(--text);margin-top:4px">${a.label}</div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    </div>

    <!-- Revenue Forecast -->
    <div class="mod-card">
      <div class="mod-card-hdr">
        <span class="mod-card-title">3-Scenario Revenue Forecast</span>
        <div style="display:flex;gap:12px">
          ${_legend('#10B981','Optimistic')} ${_legend('#1A56DB','Base')} ${_legend('#EF4444','Pessimistic')}
        </div>
      </div>
      <canvas id="ds-forecast-chart" height="110"></canvas>
    </div>
  `;

  // Waterfall (simulated with bar chart)
  const wfCtx = document.getElementById('ds-waterfall-chart');
  if (wfCtx) {
    if (_dsChartWaterfall) _dsChartWaterfall.destroy();
    const wfLabels = ['Revenue','COGS','Gross Profit','OpEx','Net Profit'];
    const wfVals   = [wf.revenue, -wf.cogs, wf.gross, -wf.opex, wf.net];
    _dsChartWaterfall = new Chart(wfCtx, {
      type: 'bar',
      data: {
        labels:   wfLabels,
        datasets: [{ data: wfVals, backgroundColor: wfVals.map(v => v >= 0 ? 'rgba(16,185,129,0.75)' : 'rgba(239,68,68,0.7)'), borderRadius: 6 }]
      },
      options: {
        responsive: true,
        plugins: { legend: { display: false }, tooltip: { callbacks: { label: ctx => ` AED ${Math.abs(ctx.raw).toLocaleString()}` } } },
        scales: { y: { beginAtZero: false, grid: { color: 'rgba(0,0,0,0.04)' }, ticks: { callback: v => 'AED ' + Math.abs(v/1000).toFixed(0) + 'K' } }, x: { grid: { display: false } } }
      }
    });
  }

  // Forecast
  const fcCtx = document.getElementById('ds-forecast-chart');
  if (fcCtx) {
    if (_dsChartForecast) _dsChartForecast.destroy();
    _dsChartForecast = new Chart(fcCtx, {
      type: 'line',
      data: {
        labels:   d.forecast.labels,
        datasets: [
          { label: 'Optimistic',  data: d.forecast.optimistic,  borderColor: '#10B981', backgroundColor: 'rgba(16,185,129,0.06)',  borderWidth: 2.5, tension: 0.4, fill: false, pointRadius: 3 },
          { label: 'Base',        data: d.forecast.base,        borderColor: '#1A56DB', backgroundColor: 'rgba(26,86,219,0.08)',   borderWidth: 3,   tension: 0.4, fill: true,  pointRadius: 3 },
          { label: 'Pessimistic', data: d.forecast.pessimistic, borderColor: '#EF4444', backgroundColor: 'transparent',            borderWidth: 2,   tension: 0.4, fill: false, pointRadius: 3, borderDash: [5,4] },
        ]
      },
      options: { responsive: true, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.04)' }, ticks: { callback: v => 'AED ' + (v/1000).toFixed(0) + 'K' } }, x: { grid: { display: false } } } }
    });
  }
}
