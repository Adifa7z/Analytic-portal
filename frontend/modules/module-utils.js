// ══════════════════════════════════════════════════════════════
//  MODULE SHARED UTILITIES
//  File: frontend/js/modules/module-utils.js
//  Load FIRST before any individual module files
// ══════════════════════════════════════════════════════════════

// ─── Shell: creates the overlay + modal wrapper ───────────────
function _renderModuleShell(overlayId, title, icon, accentColor) {
  // Destroy any existing module overlay
  document.querySelectorAll('[data-module-overlay]').forEach(el => el.remove());

  const overlay = document.createElement('div');
  overlay.id = overlayId;
  overlay.setAttribute('data-module-overlay', '1');
  overlay.className = 'pbi-overlay';
  overlay.style.cssText = 'z-index:1100';
  overlay.onclick = e => { if (e.target === overlay) _closeModuleOverlay(overlayId); };

  overlay.innerHTML = `
    <div class="pbi-modal" style="
      max-width:1080px;width:96vw;max-height:92vh;
      overflow:hidden;display:flex;flex-direction:column;
      border-radius:18px;background:var(--surface);
      box-shadow:0 30px 80px rgba(15,23,42,0.18)">

      <!-- Header -->
      <div style="
        display:flex;align-items:center;justify-content:space-between;
        padding:16px 22px;border-bottom:1px solid var(--border);
        background:linear-gradient(135deg,var(--surface),var(--surface2));
        flex-shrink:0">
        <div style="display:flex;align-items:center;gap:12px">
          <div style="
            width:40px;height:40px;border-radius:12px;
            background:linear-gradient(135deg,${accentColor}22,${accentColor}44);
            border:1.5px solid ${accentColor}44;
            display:flex;align-items:center;justify-content:center;font-size:20px">${icon}</div>
          <div>
            <div style="font-size:18px;font-weight:800;color:var(--text)">${title}</div>
            <div id="module-subtitle" style="font-size:11px;color:var(--text3);margin-top:2px">Loading product data…</div>
          </div>
        </div>
        <button class="pbi-close" onclick="_closeModuleOverlay('${overlayId}')">✕</button>
      </div>

      <!-- Body (scrollable) -->
      <div id="module-body" style="overflow-y:auto;flex:1;padding:20px 22px"></div>
    </div>
  `;

  document.body.appendChild(overlay);
  overlay.style.display = 'flex';
  setTimeout(() => overlay.classList.add('open'), 10);
}

function _closeModuleOverlay(overlayId) {
  const el = document.getElementById(overlayId);
  if (!el) return;
  el.classList.remove('open');
  setTimeout(() => el.remove(), 260);
}

function _showModuleLoading(overlayId) {
  const body = document.getElementById('module-body');
  if (!body) return;
  body.innerHTML = `
    <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;padding:60px 20px;gap:14px">
      <div style="width:36px;height:36px;border:3px solid var(--border);border-top-color:var(--primary);border-radius:50%;animation:spin 0.8s linear infinite"></div>
      <div style="font-size:13px;color:var(--text3)">Loading analytics…</div>
    </div>
  `;
}

function _showModuleError(overlayId, msg) {
  const body = document.getElementById('module-body');
  if (!body) return;
  body.innerHTML = `
    <div style="text-align:center;padding:60px 20px;color:var(--text3)">
      <div style="font-size:32px;margin-bottom:12px">⚠️</div>
      <div style="font-size:14px;font-weight:600;color:var(--text);margin-bottom:6px">Failed to load data</div>
      <div style="font-size:12px">${msg}</div>
    </div>
  `;
}

// ─── Shared UI building blocks ────────────────────────────────

function _kpiCard(label, value, icon, color) {
  return `
    <div style="
      background:var(--surface2);
      border:1px solid var(--border);
      border-radius:14px;
      padding:16px;
      position:relative;overflow:hidden">
      <div style="position:absolute;top:-8px;right:-8px;font-size:48px;opacity:0.06">${icon}</div>
      <div style="font-size:11px;color:var(--text3);font-weight:600;margin-bottom:6px;text-transform:uppercase;letter-spacing:0.4px">${label}</div>
      <div style="font-size:20px;font-weight:900;color:var(--text)">${value}</div>
    </div>`;
}

function _infoRow(label, value) {
  return `
    <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid var(--border)">
      <span style="font-size:12px;color:var(--text3)">${label}</span>
      <span style="font-size:13px;font-weight:700;color:var(--text)">${value}</span>
    </div>`;
}

function _legend(color, label) {
  return `
    <span style="display:flex;align-items:center;gap:5px;font-size:11px;color:var(--text3)">
      <span style="width:10px;height:3px;border-radius:2px;background:${color};display:inline-block"></span>
      ${label}
    </span>`;
}

function _urgencyBadge(urgency, days) {
  const map = {
    urgent:  { bg: '#fef2f2', color: '#dc2626', text: `🚨 URGENT — ${days} days left` },
    warning: { bg: '#fffbeb', color: '#d97706', text: `⚠️ WARNING — ${days} days left` },
    ok:      { bg: '#f0fdf4', color: '#16a34a', text: `✅ ON TRACK — ${days} days coverage` },
  };
  const s = map[urgency] || map.ok;
  return `<div style="padding:10px 12px;border-radius:10px;background:${s.bg};font-size:12px;font-weight:700;color:${s.color};text-align:center">${s.text}</div>`;
}

// ─── CSS for module cards (injected once) ─────────────────────
(function injectModuleStyles() {
  if (document.getElementById('module-utils-styles')) return;
  const style = document.createElement('style');
  style.id = 'module-utils-styles';
  style.textContent = `
    .mod-card {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 14px;
      padding: 16px;
    }
    .mod-card-hdr {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 10px;
    }
    .mod-card-title {
      font-size: 14px;
      font-weight: 800;
      color: var(--text);
    }
    .ai-badge-sm {
      font-size: 10px;
      font-weight: 800;
      padding: 2px 7px;
      background: linear-gradient(135deg,#8B5CF6,#6D28D9);
      color: #fff;
      border-radius: 20px;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `;
  document.head.appendChild(style);
})();
