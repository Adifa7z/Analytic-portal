// ─── EMERGENCY PATCH — fixes "Cannot read properties of null (reading 'classList')" ───
// Add this AFTER your app.js <script> tag in your HTML:
//   <script src="fix-patch.js"></script>
// OR paste the contents directly at the BOTTOM of your existing app.js

(function() {
  // Patch 1: null-safe closeBrandDropdown
  window.closeBrandDropdown = function() {
    var menu = document.getElementById('brand-dropdown-menu');
    var btn  = document.getElementById('brand-dropdown-btn');
    if (menu) menu.classList.remove('open');
    if (btn)  btn.classList.remove('open');
  };

  // Patch 2: null-safe toggleBrandDropdown
  window.toggleBrandDropdown = function() {
    var menu = document.getElementById('brand-dropdown-menu');
    var btn  = document.getElementById('brand-dropdown-btn');
    if (!menu || !btn) return;
    var isOpen = menu.classList.toggle('open');
    btn.classList.toggle('open', isOpen);
  };

  // Patch 3: null-safe closeAvatarMenu / toggleAvatarMenu
  window.closeAvatarMenu = function() {
    var m = document.getElementById('avatar-menu');
    if (m) m.classList.remove('open');
  };
  window.toggleAvatarMenu = function() {
    var m = document.getElementById('avatar-menu');
    if (m) m.classList.toggle('open');
  };

  console.log('[fix-patch.js] ✅ Null-safe dropdown patches applied.');
})();
