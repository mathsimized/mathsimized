(function() {
  var params = new URLSearchParams(window.location.search);
  var testFlag = params.get('testuser') || localStorage.getItem('sat_testuser');
  if (testFlag !== '1' && testFlag !== 'true') return;

  localStorage.setItem('sat_testuser', '1');
  window.__testUserMode = true;

  document.documentElement.style.paddingTop = '32px';
  function addBanner() {
    if (!document.body) { setTimeout(addBanner, 10); return; }
    if (document.getElementById('testUserBanner')) return;
    var b = document.createElement('div');
    b.id = 'testUserBanner';
    b.style.cssText = 'position:fixed;top:0;left:0;right:0;z-index:9999;background:#f59e0b;color:#000;text-align:center;padding:6px 12px;font-size:13px;font-weight:600;font-family:sans-serif;';
    b.innerHTML = '🧪 Test Mode — logged in as TestUser <button onclick="exitTestMode()" style="margin-left:12px;padding:2px 10px;border:none;border-radius:4px;background:#000;color:#f59e0b;cursor:pointer;font-size:12px;">Exit</button>';
    document.body.prepend(b);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', addBanner);
  else addBanner();

  window.currentUser = { uid: 'test_user_001', email: 'testuser@mathsimized.com', isAdmin: false };
  window.currentUsername = 'TestUser';

  function reapply() {
    if (window.currentUser && window.currentUser.uid !== 'test_user_001') return;
    window.currentUser = { uid: 'test_user_001', email: 'testuser@mathsimized.com', isAdmin: false };
    window.currentUsername = 'TestUser';
    if (typeof updateNavbarUI === 'function') updateNavbarUI();
    window.dispatchEvent(new CustomEvent('authStateChanged', {
      detail: { user: window.currentUser, username: window.currentUsername }
    }));
  }

  setTimeout(reapply, 100);
  setTimeout(reapply, 500);
  setTimeout(reapply, 1500);
})();

function exitTestMode() {
  localStorage.removeItem('sat_testuser');
  window.__testUserMode = false;
  window.currentUser = null;
  window.currentUsername = null;
  if (typeof updateNavbarUI === 'function') updateNavbarUI();
  window.dispatchEvent(new CustomEvent('authStateChanged', {
    detail: { user: null, username: null }
  }));
  var b = document.getElementById('testUserBanner');
  if (b) b.remove();
  document.documentElement.style.paddingTop = '';
}
