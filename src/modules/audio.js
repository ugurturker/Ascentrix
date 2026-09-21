// audio.js — ses
import { userData } from './store.js';

let audioCtx = null;

export function soundEnabled() { return userData.settings.soundEnabled !== false; }

export function ensureAudio() {
  try {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') audioCtx.resume();
    return audioCtx;
  } catch (e) { return null; }
}
export function primeAudio() { if (!audioCtx) ensureAudio(); }

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

export function playNotifySuccess(){
  // Terminal success chime: crisp two-tone
  playTone(1200,0,0.08,'square',0.12);
  playTone(1800,0.09,0.12,'square',0.12);
  playTone(2400,0.22,0.18,'sine',0.10);
}
export function playDeleteConfirm(){
  // Secure purge: low buzz + click
  playTone(180,0,0.12,'square',0.14);
  playTone(90,0.13,0.15,'square',0.12);
  playTone(1200,0.28,0.06,'square',0.08);
}

// alarm loops — delegated to timer module but keep helpers here for reuse
export function getAudioCtx(){ return audioCtx; }
export function setAudioCtx(ctx){ audioCtx = ctx; }
