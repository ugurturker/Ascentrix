import './styles/main.css';
import './modules/legacy.js';
import { requestNotificationPermission } from './modules/audio.js';

// Notification Action bridge: SW -> client
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.addEventListener('message', (event) => {
    const data = event.data || {};
    if (data.type === 'notification-action') {
      try { window.focus(); } catch(_){}
      const action = data.action;
      const at = data.actionType;
      if (action === 'stop' || action === 'gowork' || action === 'gobreak') {
        if (typeof window.alarmPrimary === 'function' && (at === 'work' || at === 'break')) {
          // first stop alarm, then secondary if gobreak/gowork
          if (action === 'stop') window.alarmPrimary();
          else window.alarmSecondary();
        }
      } else if (action === 'finish' || action === 'continue') {
        if (action === 'finish' && typeof window.alarmPrimary === 'function') window.alarmPrimary();
        if (action === 'continue' && typeof window.alarmSecondary === 'function') window.alarmSecondary();
      } else {
        // notification body click (no action) -> just focus and ensure alarm restarts audible
        try { if (typeof window.ensureAudio === 'function') window.ensureAudio(); } catch(_){}
      }
    }
  });
}

// UX polish: gentle permission banner after 2s if default
setTimeout(() => {
  try {
    if ('Notification' in window && Notification.permission === 'default') {
      const existing = document.getElementById('notifBanner');
      if (existing) return;
      const banner = document.createElement('div');
      banner.id = 'notifBanner';
      banner.style.cssText = 'position:fixed;bottom:90px;left:50%;transform:translateX(-50%);background:rgba(15,23,42,0.96);border:1px solid rgba(0,255,65,0.35);border-radius:12px;padding:10px 14px;display:flex;gap:10px;align-items:center;z-index:1400;box-shadow:0 10px 30px rgba(0,0,0,0.5);font-size:0.8rem;';
      banner.innerHTML = '<span style="color:#00ff41;font-weight:800;">◈</span><span style="color:#d8ffe0;">Arka planda alarm için bildirimlere izin ver?</span><button id="notifAllow" style="background:#00ff41;color:#010403;border:none;border-radius:8px;padding:6px 10px;font-weight:800;cursor:pointer;">İzin Ver</button><button id="notifDismiss" style="background:transparent;color:#4fae63;border:1px solid rgba(255,255,255,0.15);border-radius:8px;padding:6px 10px;cursor:pointer;">Kapat</button>';
      document.body.appendChild(banner);
      banner.querySelector('#notifAllow').onclick = async () => {
        // Instant dismiss per spec — no delay
        const allowBtn = banner.querySelector('#notifAllow');
        banner.style.transition = 'opacity 0.15s ease, transform 0.15s ease';
        banner.style.opacity = '0';
        banner.style.transform = 'translateX(-50%) translateY(8px)';
        setTimeout(()=> { try{ banner.remove(); }catch(_){} }, 160);
        // Trigger native permission (browser handles its own popup)
        try {
          const permPromise = Notification.requestPermission();
          // Also prime audio
          try { const { ensureAudio, playNotifySuccess } = await import('./modules/audio.js'); ensureAudio(); } catch(_){}
          const result = await permPromise;
          if (result === 'granted') {
            // Immediate terminal success feedback
            try {
              const { playNotifySuccess } = await import('./modules/audio.js');
              playNotifySuccess();
            } catch(_){}
            // Visual: [SYS_NOTIFY: ACTIVE] toast/terminal line
            try {
              if (window.showToast) window.showToast('[SYS_NOTIFY: ACTIVE]', 'success');
              else {
                const t = document.createElement('div');
                t.textContent = '[SYS_NOTIFY: ACTIVE]';
                t.style.cssText = 'position:fixed;top:18px;left:50%;transform:translateX(-50%);background:rgba(0,255,65,0.12);border:1px solid #00ff41;color:#00ff41;font-family:Consolas,monospace;font-size:0.78rem;font-weight:800;letter-spacing:0.1em;padding:8px 14px;border-radius:8px;box-shadow:0 0 18px rgba(0,255,65,0.45);z-index:2000;';
                document.body.appendChild(t);
                setTimeout(()=> { t.style.opacity='0'; t.style.transition='opacity 0.4s ease'; setTimeout(()=> t.remove(), 420); }, 2200);
              }
            } catch(_){}
          } else if (result === 'denied') {
            if (window.showToast) window.showToast('[SYS_NOTIFY: DENIED]', 'warn');
          }
        } catch(e) {
          try { if (window.showToast) window.showToast('[SYS_NOTIFY: ERROR]', 'warn'); } catch(_){}
        }
      };
      banner.querySelector('#notifDismiss').onclick = () => banner.remove();
      setTimeout(()=> { try{ banner.remove(); }catch(_){} }, 15000);
    }
  } catch(_){}
}, 2000);

console.log('[Ascentrix] v2.0 — Vite + PWA + Notification Actions aktif');
