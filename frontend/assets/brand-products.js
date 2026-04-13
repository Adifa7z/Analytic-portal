// ══════════════════════════════════════════════════════════════
//  BRAND PRODUCTS VIEW FEATURE
//  Updated UI: View Analytics button + product analytics click
// ══════════════════════════════════════════════════════════════

async function viewBrandProducts(brandName) {
  try {
    const res = await fetch('/api/products');
    const json = await res.json();

    const products = (json.data || []).filter(
      p => (p.brand_name || '').toLowerCase() === brandName.toLowerCase()
    );

    openBrandProductsModal(brandName, products);
  } catch (err) {
    console.error(err);
    alert('Failed to load brand products');
  }
}

function openBrandProductsModal(brandName, products) {
  let overlay = document.getElementById('brand-products-overlay');

  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'brand-products-overlay';
    overlay.className = 'pbi-overlay';
    overlay.style.zIndex = '800';
    overlay.onclick = e => {
      if (e.target === overlay) closeBrandProductsModal();
    };
    document.body.appendChild(overlay);
  }

  overlay.innerHTML = `
    <div class="pbi-modal" style="max-width:760px;width:95vw;max-height:90vh;display:flex;flex-direction:column;border-radius:18px;overflow:hidden;box-shadow:0 30px 80px rgba(15,23,42,0.18)">

      <div class="pbi-header" style="padding:18px 22px;border-bottom:1px solid var(--border);background:var(--surface);display:flex;justify-content:space-between;align-items:center;gap:12px">
        <div style="min-width:0">
          <div style="font-size:19px;font-weight:800;color:var(--text);line-height:1.1">${brandName} Products</div>
          <div style="font-size:12px;color:var(--text3);margin-top:4px">${products.length} products found · click a product for full analytics</div>
        </div>

        <div style="display:flex;align-items:center;gap:8px;flex-shrink:0">
          <button
            onclick='closeBrandProductsModal(); setTimeout(() => openBrandAnalytics(${JSON.stringify(brandName)}), 260)'
            style="padding:8px 12px;font-size:12px;font-weight:700;border:1.5px solid var(--border);border-radius:10px;background:var(--surface2);color:var(--primary);cursor:pointer;display:flex;align-items:center;gap:6px">
            <svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path d="M14 3h7v7"/><path d="M10 14L21 3"/><path d="M5 7v12a2 2 0 0 0 2 2h12"/>
            </svg>
            View Analytics
          </button>
          <button class="pbi-close" onclick="closeBrandProductsModal()">✕</button>
        </div>
      </div>

      <div style="padding:18px;overflow-y:auto;display:flex;flex-direction:column;gap:10px;background:linear-gradient(180deg,var(--surface),#fbfdff)">
        ${products.length === 0
          ? `<div style="text-align:center;color:var(--text3);padding:42px">No products found for this brand</div>`
          : products.map(p => `
            <div
              onclick="closeBrandProductsModal(); setTimeout(() => openProductAnalytics(${p.id}), 280)"
              style="border:1px solid var(--border);border-radius:14px;padding:14px 16px;display:flex;gap:12px;align-items:center;cursor:pointer;transition:all 0.18s;background:#f8fbff;box-shadow:0 1px 0 rgba(255,255,255,0.7) inset"
              onmouseenter="this.style.borderColor='var(--primary)';this.style.boxShadow='0 8px 22px rgba(37,99,235,0.10)'"
              onmouseleave="this.style.borderColor='var(--border)';this.style.boxShadow='0 1px 0 rgba(255,255,255,0.7) inset'">

              <div style="font-size:24px;width:34px;text-align:center;flex-shrink:0">${p.icon || '📦'}</div>

              <div style="flex:1;min-width:0">
                <div style="font-weight:700;color:var(--text);font-size:14px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${p.name}</div>
                <div style="font-size:12px;color:var(--text3);margin-top:2px">${p.cat || '—'} · <span style="font-family:monospace">${p.sku || ''}</span></div>
              </div>

              <div style="text-align:right;flex-shrink:0">
                <div style="font-size:13px;font-weight:800;color:var(--text)">${Number(p.stock || 0).toLocaleString()} units</div>
                <div style="font-size:11px;color:var(--text3)">AED ${(Number(p.price) || 24.50).toFixed(2)}</div>
              </div>

              <svg width="14" height="14" fill="none" stroke="var(--text3)" stroke-width="2" viewBox="0 0 24 24" style="flex-shrink:0"><polyline points="9 18 15 12 9 6"/></svg>
            </div>
          `).join('')}
      </div>
    </div>`;

  overlay.style.display = 'flex';
  setTimeout(() => overlay.classList.add('open'), 10);
}

function closeBrandProductsModal() {
  const overlay = document.getElementById('brand-products-overlay');
  if (!overlay) return;
  overlay.classList.remove('open');
  setTimeout(() => overlay.style.display = 'none', 260);
}