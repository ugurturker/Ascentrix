import './styles/main.css';
import './modules/legacy.js';
import { playNotifySuccess } from './modules/audio.js';
import { isFirebaseConfigured } from './modules/firebase.js';
import { onAuthChange, getCurrentUser } from './modules/auth.js';
import { enableCloudSync, disableCloudSync } from './modules/store.js';

console.log('[Ascentrix] v2.0 — Vite + PWA aktif');

// Firebase Auth UI — matrix terminal style
function updateAuthUI(user) {
  const status = document.getElementById('authStatus');
  const signInBtn = document.getElementById('googleSignInBtn');
  const signOutBtn = document.getElementById('googleSignOutBtn');
  const userInfo = document.getElementById('authUserInfo');
  const avatar = document.getElementById('authAvatar');
  const nameEl = document.getElementById('authName');
  const emailEl = document.getElementById('authEmail');
  const cloudBadge = document.getElementById('authCloudBadge');
  if (!status || !signInBtn || !signOutBtn) return;
  if (!isFirebaseConfigured) {
    status.textContent = '[SYS_AUTH: OFFLINE] Firebase yapılandırılmadı — .env doldur';
    status.style.color = '#ff5757';
    signInBtn.style.display = 'none';
    signOutBtn.style.display = 'none';
    if (userInfo) userInfo.style.display = 'none';
    return;
  }
  if (user) {
    status.textContent = '[AUTH: OK] ' + (user.displayName || user.email);
    status.style.color = '#00ff9d';
    signInBtn.style.display = 'none';
    signOutBtn.style.display = 'block';
    if (userInfo) userInfo.style.display = 'flex';
    if (avatar) avatar.src = user.photoURL || '';
    if (nameEl) nameEl.textContent = user.displayName || '—';
    if (emailEl) emailEl.textContent = user.email || '';
    if (cloudBadge) cloudBadge.style.display = 'inline-block';
    try { playNotifySuccess(); } catch(_){}
    if (window.showToast) window.showToast('[SYS_AUTH: CONNECTED]', 'success');
    enableCloudSync().catch(()=>{});
  } else {
    status.textContent = '[AUTH: GUEST] Giriş yapmadın — localStorage';
    status.style.color = '#4fae63';
    signInBtn.style.display = 'flex';
    signOutBtn.style.display = 'none';
    if (userInfo) userInfo.style.display = 'none';
    if (cloudBadge) cloudBadge.style.display = 'none';
    disableCloudSync();
  }
}

setTimeout(() => {
  updateAuthUI(getCurrentUser());
  onAuthChange((user) => {
    updateAuthUI(user);
    try {
      if (user && window.renderTPeakUI) window.renderTPeakUI();
      if (user && window.updateProfileUI) window.updateProfileUI();
      if (user && window.renderStats) window.renderStats();
    } catch(_){}
  });
  window.addEventListener('ascentrix-auth', (e) => {
    const u = e.detail?.user || null;
    updateAuthUI(u);
  });
}, 500);
