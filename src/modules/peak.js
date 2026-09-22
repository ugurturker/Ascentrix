// peak.js — T-Peak / enerji / plan motoru
import { userData, saveUserData, timerState } from './store.js';
import { t } from './i18n.js';
import { fmtMin, todayStr, avgArr } from './utils.js';

/**
 * Dynamic Time Multiplier Array (Core Algorithm) — Ascentrix spec 1
 * Step1: T*1.00 (Full) | Step2: T*0.80 (Friction) | Step3: T*0.65 (Fatigue) | Step4: T*0.50 (Descent)
 * >4 steps → cap 0.50 unless re-initialized
 */
export const MULTIPLIERS = [1.00, 0.80, 0.65, 0.50];
/**
 * Mola ritimleri — bilimsel varsayılan: odak süresinin %25'i mola.
 * 90 dk ultradian ritim (~20 dk toparlanma) ile 52/17 verimlilik
 * araştırmasının (%33) ve Pomodoro'nun (%20) ortak aralığı: %20–30.
 */
export const BREAK_MODES = {
  easy:    { ratio: 0.40, min: 4, max: 30 },
  natural: { ratio: 0.25, min: 3, max: 20 },
  medium:  { ratio: 0.20, min: 3, max: 15 },
  hard:    { ratio: 0.12, min: 2, max: 10 },
};
export function getBreakMode() {
  const m = userData.settings.breakMode;
  return BREAK_MODES[m] ? m : 'natural';
}
// Erken bitirmede mola: odaklanılan süre × ritim oranı (min/max kıskaçlı, 0.5 yuvarlama)
export function proportionalBreak(elapsedMin, breakMode) {
  const bm = BREAK_MODES[breakMode] || BREAK_MODES[getBreakMode()] || BREAK_MODES.natural;
  const e = Math.max(0, Number(elapsedMin) || 0);
  return Math.max(1, Math.round(Math.min(bm.max, Math.max(bm.min, e * bm.ratio)) * 2) / 2);
}
export function protocolSteps(T, count = 4, breakMode) {
  T = Math.max(5, Math.round(T * 10) / 10);
  const r1 = v => Math.max(1, Math.round(v * 2) / 2);
  const bm = BREAK_MODES[breakMode] || BREAK_MODES[getBreakMode()] || BREAK_MODES.natural;
  const n = Math.max(1, Math.floor(count));
  const works = Array.from({ length: n }, (_, i) => {
    const m = i < MULTIPLIERS.length ? MULTIPLIERS[i] : 0.50;
    return Math.max(5, r1(T * m));
  });
  const brks = works.map(w => r1(Math.min(bm.max, Math.max(bm.min, w * bm.ratio))));
  return works.map((w, i) => ({ work: w, break: brks[i], label: t('proto_step', { n: i + 1, x: fmtMin(w) }) }));
}
export function avgLastDays(n){
  const since = Date.now() - n*864e5;
  const vals = userData.peak.history.filter(r=> new Date(r.date+'T00:00:00').getTime()>=since).map(r=>r.tpeak);
  return avgArr(vals);
}
export function peakTrend(){
  const h=userData.peak.history;
  if(h.length<6) return { trend:'insufficient', label:t('trend_na') };
  const last6=h.slice(-6);
  const a=avgArr(last6.slice(0,3).map(r=>r.tpeak));
  const b=avgArr(last6.slice(3,6).map(r=>r.tpeak));
  const mean=(a+b)/2||1; const d=(b-a)/mean;
  if(d>0.05) return { trend:'up', label:t('trend_up') };
  if(d<-0.05) return { trend:'down', label:t('trend_down') };
  return { trend:'flat', label:t('trend_flat') };
}
export function completionRate7(){
  const since=Date.now()-7*864e5;
  const comp=(userData.peak.completions||[]).filter(d=> new Date(d+'T00:00:00').getTime()>=since).length;
  const aband=(userData.partialRuns||[]).filter(r=> r.date && new Date(r.date+'T00:00:00').getTime()>=since).length;
  const total=comp+aband; return total>0? comp/total : null;
}
export function computeEnergy(){
  const p=userData.peak;
  if(p.record==null||p.current==null||!(p.record>0)) return null;
  const base=p.current/p.record*10;
  let adj=0; const tr=peakTrend().trend;
  if(tr==='up') adj+=0.5; else if(tr==='down') adj-=0.5;
  return Math.min(10, Math.max(0, Math.round((base+adj)*10)/10));
}
export function setTPeak(tV, source){
  tV=Math.round(Number(tV)*10)/10; if(!(tV>0)) return false;
  const p=userData.peak; const today=todayStr();
  const last=p.history[p.history.length-1];
  if(last && last.date===today){ if(tV>last.tpeak) last.tpeak=tV; } else { p.history.push({date:today,tpeak:tV}); if(p.history.length>120) p.history.shift(); }
  if(source==='test') p.current=tV; else if(p.current==null||tV>p.current) p.current=tV;
  let newRecord=false; if(p.record==null||tV>p.record){ p.record=tV; newRecord=true; }
  saveUserData(); maybeRefreshPlan(); refreshPlanUI(); return newRecord;
}
export function buildSessionPlan(){
  const p=userData.peak; const energy=computeEnergy(); const notes=[];
  let steps; if(p.current==null){ steps=protocolSteps(20); notes.push('measure'); } else steps=protocolSteps(p.current);
  const capacity=(p.record&&p.current)? Math.round(p.current/p.record*1000)/10 : null;
  const totalWork=steps.reduce((a,s)=>a+s.work,0);
  timerState.currentModeKey='ascending';
  userData.plan={ date:todayStr(), mode:'ascending', steps, energy, capacity, mult:2.95, totalWork, record:p.record, tpeak:p.current, notes, rate:completionRate7(), compLen:(p.completions||[]).length, abandLen:(userData.partialRuns||[]).length, breakMode:getBreakMode() };
  saveUserData(); return userData.plan;
}
export function maybeRefreshPlan(){
  const s=timerState; const idle=s.stepIndex===0 && !s.isRunning && !s.isBreak && !s.alarmActive && !s.workStepPending && !s.breakStepPending && !s.testRunning;
  if(!idle) return;
  const pristine=s.secondsLeft>= s.totalSeconds -0.5;
  const today=todayStr(); const pl=userData.plan; const p=userData.peak;
  const compLen=(p.completions||[]).length; const abandLen=(userData.partialRuns||[]).length;
  const energyNow=computeEnergy();
  if(!pl||pl.date!==today||pl.tpeak!==p.current||pl.record!==p.record||pl.energy!==energyNow||pl.compLen!==compLen||pl.abandLen!==abandLen||pl.breakMode!==getBreakMode()){
    buildSessionPlan();
    if(pristine && userData.plan && Array.isArray(userData.plan.steps) && userData.plan.steps.length){
      s.currentSequence=userData.plan.steps; s.currentModeKey=userData.plan.mode||'ascending'; s.totalSeconds=s.currentSequence[0].work*60; s.secondsLeft=s.totalSeconds;
      const btn=document.getElementById('startBtn'); if(btn) btn.innerText=t('timer_start');
      // will be rendered by caller
    }
  }
  if(userData.plan && Array.isArray(userData.plan.steps) && userData.plan.steps.length){ s.currentSequence=userData.plan.steps; s.currentModeKey=userData.plan.mode||'ascending'; }
  renderPlanCard();
}
function renderPlanCard(){
  const pl=userData.plan; const p=userData.peak;
  const set=(id,v)=>{ const el=document.getElementById(id); if(el) el.innerText=v; };
  const eLive=computeEnergy();
  set('planEnergy', eLive==null?'—':(Math.round(eLive*10)/10)+'/10');
  set('planTpeak', p.current==null?'—':fmtMin(p.current)+' '+t('minUnit'));
  set('planRecord', p.record==null?'—':fmtMin(p.record)+' '+t('minUnit'));
  set('planCap', (p.record&&p.current)? '%'+(Math.round(p.current/p.record*1000)/10):'—');
  if(!pl){ set('planModeName','—'); set('planSteps','—'); set('planBreakMode','—'); set('planGoal','—'); set('planNotes',''); return; }
  set('planModeName', '~'+fmtMin(pl.totalWork||0)+' '+t('minUnit')+' ('+ (pl.mult||2)+'×T)');
  set('planSteps', pl.steps.map(s=>fmtMin(s.work)).join(' → ')+' '+t('minUnit'));
  set('planBreakMode', t('breakmode_'+(pl.breakMode||'natural'))+': '+pl.steps.map(s=>fmtMin(s.break)).join(' → ')+' '+t('minUnit'));
  set('planNotes', (pl.notes||[]).filter(Boolean).map(n=> t('plan_note_'+n)!==('plan_note_'+n)? t('plan_note_'+n):n).join(' • '));
  const goal=userData.profile.dailyGoalMins||180; const today=Math.round((userData.stats.todayWorkMins||0)*10)/10; const done=today>=goal;
  set('planGoal', fmtMin(today)+' / '+goal+' '+t('minUnit')+' (%'+(goal? Math.min(100,Math.round(today/goal*100)):0)+')'+(done? t('plan_goal_done'):''));
  const startBtn=document.getElementById('planStartBtn'); if(startBtn) startBtn.disabled=done;
  const badge=document.getElementById('tpeakBadge'); if(badge){ if(p.current!=null){ badge.style.display='block'; const bv=document.getElementById('tpeakBadgeVal'); if(bv) bv.innerText=fmtMin(p.current)+' '+t('minUnit'); } else badge.style.display='none'; }
}
export function refreshPlanUI(){
  renderPlanCard();
  const statsTab=document.getElementById('statsTab');
  if(statsTab && statsTab.classList.contains('active')){ try { if (typeof window !== 'undefined' && window.renderStats) window.renderStats(); } catch(_){} }
}
