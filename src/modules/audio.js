// audio.js — ses & bildirim
import { userData } from './store.js';
import { t } from './i18n.js';

let audioCtx = null;

export function soundEnabled() { return userData.settings.soundEnabled !== false; }

export function ensureAudio() {
  try {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') audioCtx.resume();
    return audioCtx;
  } catch (e) { return null; }
}
export function primeAudio() { if (!audioCtx) ensureAudio(); requestNotificationPermission(); }

export function playTone(freq, delay, dur, type, gainVal) {
  if (!soundEnabled()) return;
  const ctx = ensureAudio(); if (!ctx) return;
  try {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type || 'sine';
    osc.frequency.value = freq;
    const t0 = ctx.currentTime + (delay || 0);
    const len = dur || 0.2;
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(Math.min(gainVal || 0.12, 0.5), t0 + 0.015);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + len);
    osc.connect(g); g.connect(ctx.destination);
    osc.onended = () => { try{ osc.disconnect(); }catch(_){} try{ g.disconnect(); }catch(_){} };
    osc.start(t0); osc.stop(t0 + len + 0.03);
  } catch(e) { console.log('Audio Error:', e); }
}
export function playClickSound(){ playTone(1400,0,0.03,'square',0.03); }
export function playTickSound(){ playTone(1200,0,0.03,'square',0.04); }
export function playBreakSound(){ playTone(660,0,0.3,'sine',0.11); playTone(990,0.18,0.45,'sine',0.11); }
export function playLadderSound(){ [523.25,659.25,783.99,1046.5].forEach((f,i)=> playTone(f,i*0.1,0.25,'square',0.1)); playTone(1318.5,0.4,0.5,'square',0.09); }
export function playLevelUpSound(){ [523.25,659.25,783.99,1046.5,783.99,1046.5,1318.5,1567.98].forEach((f,i)=> playTone(f,i*0.09,0.22,'square',0.08)); playTone(2093,0.72,0.6,'square',0.07); }
export function playBadgeSound(){ playTone(1567.98,0,0.08,'square',0.07); playTone(2093,0.09,0.14,'square',0.07); }
export function playFlowSound(){ playTone(740,0,0.14,'triangle',0.1); playTone(987.77,0.12,0.3,'triangle',0.1); }
export function playAlertSound(){ playTone(587.33,0,0.35,'sine',0.16); playTone(880,0.22,0.5,'sine',0.16); }

export function requestNotificationPermission(){
  try { if ('Notification' in window && Notification.permission === 'default') Notification.requestPermission().catch(()=>{}); } catch(_){}
  // UX polish: show banner if still default after short delay — handled in app.js
}
export async function showSystemNotification(title, body, actionType = 'work'){
  // actionType: 'work' | 'break' | 'session'
  try {
    if (!('Notification' in window) || Notification.permission !== 'granted') return;
    // Prefer ServiceWorker notification with actions (works even when page hidden/background)
    if ('serviceWorker' in navigator) {
      try {
        const reg = await navigator.serviceWorker.ready;
        if (reg && reg.showNotification) {
          const actions = actionType === 'break'
            ? [{ action: 'stop', title: t('alarm_stop') }, { action: 'gowork', title: t('alarm_go_work') }]
            : actionType === 'session'
            ? [{ action: 'finish', title: t('alarm_finish') }, { action: 'continue', title: t('alarm_continue') }]
            : [{ action: 'stop', title: t('alarm_stop') }, { action: 'gobreak', title: t('alarm_go_break') }];
          await reg.showNotification(title, {
            body,
            icon: '/icon-192.png',
            badge: '/icon-192.png',
            requireInteraction: true,
            silent: false,
            vibrate: [400,300,400],
            actions,
            data: { actionType, url: location.href }
          });
          return;
        }
      } catch(_){}
    }
    // Fallback: classic Notification
    const n = new Notification(title, { body, silent:false, requireInteraction:true, icon: '/icon-192.png' });
    n.onclick = () => { try{ window.focus(); }catch(_){} n.close(); };
    setTimeout(()=>{ try{ n.close(); }catch(_){} }, 12000);
  } catch(_){}
}

// alarm loops — delegated to timer module but keep helpers here for reuse
export function getAudioCtx(){ return audioCtx; }
export function setAudioCtx(ctx){ audioCtx = ctx; }
