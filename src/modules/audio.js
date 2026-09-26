// audio.js — ses
import { userData } from './store.js';

let audioCtx = null;

export function soundEnabled() {
  // Canlı ayar legacy modülündedir (toggleSound oraya yazar); önce oraya bak
  try {
    if (typeof window !== 'undefined' && window._legacyUserData && window._legacyUserData.settings) {
      return window._legacyUserData.settings.soundEnabled !== false;
    }
  } catch(_){}
  return userData.settings.soundEnabled !== false;
}
export function isSilentAlarm() {
  try {
    if (typeof window !== 'undefined' && window._legacyUserData && window._legacyUserData.settings) {
      return window._legacyUserData.settings.silentAlarm === true;
    }
  } catch(_){}
  return userData.settings.silentAlarm === true;
}

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
function currentTheme(){ try { return userData.settings.theme || 'matrix'; } catch { return 'matrix'; } }
export function playClickSound(){
  const th = currentTheme();
  if (th==='mario') { playTone(800,0,0.06,'square',0.09); playTone(1200,0.06,0.06,'square',0.07); return; }
  if (th==='aero') { playTone(1400,0,0.04,'triangle',0.06); return; }
  if (th==='galaxy') { playTone(600,0,0.08,'sine',0.07); playTone(900,0.08,0.08,'sine',0.05); return; }
  playTone(1400,0,0.03,'square',0.03);
}
export function playTickSound(){
  const th = currentTheme();
  if (th==='mario') { playTone(1000,0,0.04,'square',0.05); return; }
  if (th==='aero') { playTone(1800,0,0.03,'sine',0.04); return; }
  if (th==='galaxy') { playTone(400,0,0.05,'sine',0.04); return; }
  playTone(1200,0,0.03,'square',0.04);
}
export function playBreakSound(){
  const th = currentTheme();
  if (th==='mario') { playTone(659,0,0.12,'square',0.1); playTone(783,0.12,0.12,'square',0.1); return; }
  if (th==='aero') { playTone(880,0,0.25,'triangle',0.08); playTone(1320,0.18,0.3,'sine',0.06); return; }
  if (th==='galaxy') { playTone(220,0,0.4,'sine',0.09); playTone(330,0.2,0.4,'sine',0.07); return; }
  playTone(660,0,0.3,'sine',0.11); playTone(990,0.18,0.45,'sine',0.11);
}
export function playLadderSound(){
  const th = currentTheme();
  if (th==='mario') { [523,659,783,1046].forEach((f,i)=> playTone(f,i*0.08,0.12,'square',0.1)); playTone(1318,0.32,0.3,'square',0.12); return; }
  if (th==='aero') { [440,550,660,880].forEach((f,i)=> playTone(f,i*0.1,0.22,'triangle',0.07)); playTone(1100,0.4,0.4,'sine',0.06); return; }
  if (th==='galaxy') { [196,246,293,392].forEach((f,i)=> playTone(f,i*0.12,0.35,'sine',0.09)); playTone(523,0.48,0.6,'sine',0.08); return; }
  [523.25,659.25,783.99,1046.5].forEach((f,i)=> playTone(f,i*0.1,0.25,'square',0.1)); playTone(1318.5,0.4,0.5,'square',0.09);
}
export function playLevelUpSound(){
  const th = currentTheme();
  if (th==='mario') { [523,659,783,1046,1318,1046,1318,1567].forEach((f,i)=> playTone(f,i*0.07,0.12,'square',0.1)); playTone(2093,0.56,0.4,'square',0.1); return; }
  if (th==='aero') { [600,750,900,1200,900,1200,1500,1800].forEach((f,i)=> playTone(f,i*0.08,0.18,'triangle',0.07)); playTone(2200,0.64,0.5,'sine',0.06); return; }
  if (th==='galaxy') { [150,180,220,300,220,300,400,500].forEach((f,i)=> playTone(f,i*0.1,0.28,'sine',0.08)); playTone(700,0.8,0.7,'sine',0.07); return; }
  [523.25,659.25,783.99,1046.5,783.99,1046.5,1318.5,1567.98].forEach((f,i)=> playTone(f,i*0.09,0.22,'square',0.08)); playTone(2093,0.72,0.6,'square',0.07);
}
export function playBadgeSound(){
  const th = currentTheme();
  if (th==='mario') { playTone(1200,0,0.08,'square',0.09); playTone(1600,0.08,0.12,'square',0.09); return; }
  if (th==='aero') { playTone(1400,0,0.08,'triangle',0.07); playTone(1800,0.08,0.12,'sine',0.06); return; }
  if (th==='galaxy') { playTone(300,0,0.12,'sine',0.08); playTone(500,0.12,0.15,'sine',0.07); return; }
  playTone(1567.98,0,0.08,'square',0.07); playTone(2093,0.09,0.14,'square',0.07);
}
export function playAlertSound(){
  const th = currentTheme();
  if (th==='mario') { playTone(800,0,0.15,'square',0.12); playTone(600,0.15,0.15,'square',0.12); playTone(800,0.3,0.15,'square',0.12); return; }
  if (th==='aero') { playTone(1200,0,0.2,'sine',0.09); playTone(900,0.2,0.3,'sine',0.08); return; }
  if (th==='galaxy') { playTone(80,0,0.5,'sine',0.12); playTone(120,0.3,0.5,'sine',0.1); return; }
  playTone(587.33,0,0.35,'sine',0.16); playTone(880,0.22,0.5,'sine',0.16);
}

export function playNotifySuccess(){
  const th = currentTheme();
  if (th==='mario') { playTone(1000,0,0.08,'square',0.12); playTone(1500,0.08,0.12,'square',0.12); playTone(2000,0.16,0.15,'square',0.1); return; }
  if (th==='aero') { playTone(1200,0,0.08,'triangle',0.09); playTone(1600,0.08,0.1,'sine',0.08); return; }
  if (th==='galaxy') { playTone(400,0,0.12,'sine',0.09); playTone(600,0.12,0.15,'sine',0.08); return; }
  playTone(1200,0,0.08,'square',0.12); playTone(1800,0.09,0.12,'square',0.12); playTone(2400,0.22,0.18,'sine',0.10);
}
export function playDeleteConfirm(){
  const th = currentTheme();
  if (th==='mario') { playTone(200,0,0.08,'square',0.12); playTone(100,0.08,0.12,'square',0.1); return; }
  if (th==='aero') { playTone(300,0,0.1,'triangle',0.08); return; }
  if (th==='galaxy') { playTone(60,0,0.2,'sine',0.1); return; }
  playTone(180,0,0.12,'square',0.14); playTone(90,0.13,0.15,'square',0.12); playTone(1200,0.28,0.06,'square',0.08);
}

// alarm loops — delegated to timer module but keep helpers here for reuse
export function getAudioCtx(){ return audioCtx; }
export function setAudioCtx(ctx){ audioCtx = ctx; }
