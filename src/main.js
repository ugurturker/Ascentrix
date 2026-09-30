import './styles/main.css';
import './modules/legacy.js';
import { playNotifySuccess, playClickSound } from './modules/audio.js';
import { isFirebaseConfigured } from './modules/firebase.js';
import { onAuthChange, getCurrentUser } from './modules/auth.js';
import { enableCloudSync, disableCloudSync } from './modules/store.js';
import { applyTheme, getTheme, getSimplifyLevel, setSimplifyLevel } from './modules/theme.js';
import { initGalaxyBackground } from './modules/galaxyBackground.js';
import { initAeroBackground } from './modules/aeroBackground.js';
import { APP_VERSION } from './version.js';

try { applyTheme(); } catch(_){}
try { setTimeout(()=> initGalaxyBackground(), 400); } catch(_){}
try { setTimeout(()=> initAeroBackground(), 500); } catch(_){}
try {
  const vEl = document.getElementById('appVersion');
  if (vEl) vEl.textContent = 'v' + APP_VERSION;
} catch(_){}
console.log('[Ascentrix] v' + APP_VERSION + ' — Vite + PWA aktif');

// SW güncellemesi: yeni build yayındaysa kullanıcıyı bilgilendir
// Odak oturumu sürerken otomatik yenileme YAPILMAZ (veri kaybı olmasın)
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    try {
      navigator.serviceWorker.ready.then(reg => {
        try { reg.update(); } catch(_){}
        const watch = (sw) => {
          if (!sw) return;
          sw.addEventListener('statechange', () => {
            if (sw.state === 'installed' && navigator.serviceWorker.controller) {
              promptSwUpdate();
            }
          });
        };
        if (reg.waiting) promptSwUpdate();
        else if (reg.installing) watch(reg.installing);
        reg.addEventListener('updatefound', () => watch(reg.installing));
      }).catch(()=>{});
      let swReloaded = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (swReloaded) return; swReloaded = true;
        try {
          const busy = (typeof window.AscentrixIsBusy === 'function') && window.AscentrixIsBusy();
          if (busy) {
            if (window.showToast) window.showToast('Yeni sürüm hazır — mola verince sayfayı yenileyin', 'success');
          } else {
            if (window.showToast) window.showToast('Yeni sürüm etkin — sayfa yenileniyor', 'success');
            setTimeout(() => { try { window.location.reload(); } catch(_){} }, 1500);
          }
        } catch(_){}
      });
    } catch(_){}
  });
}
function promptSwUpdate() {
  try {
    if (window.showToast) window.showToast('Yeni sürüm hazır — etkinleşmesi için sayfayı yenileyin', 'success');
  } catch(_){}
}

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
    status.textContent = '[AUTH: GUEST] Giriş yapmadın — oturum';
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

// Tema sistemi — uygula ve UI senkronla
function syncThemeUI() {
  const cur = getTheme();
  const lvl = getSimplifyLevel();
  document.querySelectorAll('.theme-btn').forEach(b => {
    const isActive = b.dataset.theme === cur;
    b.classList.toggle('active', isActive);
    if (isActive) { b.style.borderColor = 'var(--primary)'; b.style.background = ''; b.style.color = 'var(--primary)'; b.style.boxShadow = '0 0 12px var(--primary)'; }
    else { b.style.borderColor = ''; b.style.background = ''; b.style.color = ''; b.style.boxShadow = ''; }
  });
  const slider = document.getElementById('simplifySlider');
  const label = document.getElementById('simplifyLabel');
  if (slider) slider.value = String(lvl);
  if (label) {
    const labels = ['Seviye 0 — Kapalı','Seviye 1 — Hafif','Seviye 2 — Orta','Seviye 3 — Sade (göz dostu)'];
    label.textContent = labels[lvl] || labels[0];
  }
}
setTimeout(() => {
  try { applyTheme(); syncThemeUI(); } catch(_){}
  const slider = document.getElementById('simplifySlider');
  if (slider) {
    slider.addEventListener('input', (e) => {
      const v = Number(e.target.value);
      setSimplifyLevel(v);
      syncThemeUI();
      try { playClickSound(); } catch(_){}
    });
  }
  document.querySelectorAll('.theme-btn').forEach(b => {
    b.addEventListener('click', () => { try { playClickSound(); } catch(_){} setTimeout(syncThemeUI, 50); });
  });
  window.addEventListener('themechange', () => { try { applyTheme(); } catch(_){} syncThemeUI(); });
}, 600);
