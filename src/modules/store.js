// store.js — merkezi state + localStorage persist
import { todayStr } from './utils.js';

function getDefaultUserData() {
  return {
    profile: { name: 'Neo', dailyGoalMins: 180, totalScore: 0 },
    stats: {
      totalWorkSeconds: 0, completedSteps: 0, completedLadders: 0,
      streakDays: 0, lastActiveDate: null, todayWorkMins: 0,
      todayDate: null, maxStepMins: 0, partialRuns: 0
    },
    gamification: { xp: 0, achievements: [] },
    settings: { soundEnabled: true, lang: 'tr' },
    logs: [],
    partialRuns: [],
    peak: { current: null, record: null, history: [], completions: [], sickPoints: [], extras: [], dailyFocus: [], upStamp: 0 },
    plan: null
  };
}
function isPlainObject(v) {
  return v !== null && typeof v === 'object' && !Array.isArray(v);
}
function deepMerge(target, source) {
  const out = Object.assign({}, target);
  if (!isPlainObject(source)) return out;
  Object.keys(source).forEach((k) => {
    const sv = source[k];
    const tv = out[k];
    if (isPlainObject(sv) && isPlainObject(tv)) out[k] = deepMerge(tv, sv);
    else if (sv !== undefined) out[k] = sv;
  });
  return out;
}
function normalizeUserData(data) {
  const defs = getDefaultUserData();
  if (!isPlainObject(data)) return defs;
  const merged = deepMerge(defs, data);
  if (!isPlainObject(merged.profile)) merged.profile = Object.assign({}, defs.profile);
  if (!isPlainObject(merged.stats)) merged.stats = Object.assign({}, defs.stats);
  if (!isPlainObject(merged.gamification)) merged.gamification = Object.assign({}, defs.gamification);
  if (!isPlainObject(merged.settings)) merged.settings = Object.assign({}, defs.settings);
  if (!Array.isArray(merged.logs)) merged.logs = [];
  if (!Array.isArray(merged.partialRuns)) merged.partialRuns = [];
  if (!isPlainObject(merged.peak)) merged.peak = { current: null, record: null, history: [], completions: [], sickPoints: [], extras: [], dailyFocus: [], upStamp: 0 };
  delete merged.peak.downStamp;
  if (!Array.isArray(merged.peak.history)) merged.peak.history = [];
  if (!Array.isArray(merged.peak.completions)) merged.peak.completions = [];
  if (!Array.isArray(merged.peak.sickPoints)) merged.peak.sickPoints = [];
  if (!Array.isArray(merged.peak.extras)) merged.peak.extras = [];
  if (!Array.isArray(merged.peak.dailyFocus)) merged.peak.dailyFocus = [];
  if (typeof merged.peak.upStamp !== 'number') merged.peak.upStamp = 0;
  delete merged.peak.durationStats;
  if (!isPlainObject(merged.plan) && merged.plan !== null) merged.plan = null;
  if (merged.peak.current == null && typeof merged.settings.tPeak === 'number' && merged.settings.tPeak > 0) {
    merged.peak.current = merged.settings.tPeak;
    merged.peak.record = merged.settings.tPeak;
    merged.peak.history.push({ date: todayStr(), tpeak: merged.settings.tPeak });
  }
  delete merged.settings.tPeak;
  if (!Array.isArray(merged.gamification.achievements)) merged.gamification.achievements = [];
  delete merged.gamification.clearedDifficulties;
  if (typeof merged.profile.dailyGoalMins !== 'number' || !(merged.profile.dailyGoalMins > 0)) merged.profile.dailyGoalMins = defs.profile.dailyGoalMins;
  if (typeof merged.profile.totalScore !== 'number') merged.profile.totalScore = 0;
  delete merged.settings.difficulty;
  return merged;
}
function loadUserData() {
  try {
    const rawText = localStorage.getItem('ladder_user_data');
    if (!rawText) return getDefaultUserData();
    let raw;
    try { raw = JSON.parse(rawText); } catch (parseErr) { console.warn('Kayıtlı veri bozuk (JSON), varsayılanlar yükleniyor:', parseErr); return getDefaultUserData(); }
    return normalizeUserData(raw);
  } catch (e) { console.warn('Veri yükleme hatası, varsayılanlar yükleniyor:', e); return getDefaultUserData(); }
}

export const userData = loadUserData();

// Firestore cloud sync — localStorage her zaman fallback
let cloudEnabled = false;
let cloudSaveTimer = null;
let firestoreUnsub = null;

export function saveUserData() {
  localStorage.setItem('ladder_user_data', JSON.stringify(userData));
  // Debounced cloud write (auth + firestore varsa)
  if (cloudEnabled) {
    clearTimeout(cloudSaveTimer);
    cloudSaveTimer = setTimeout(() => { cloudSave().catch(()=>{}); }, 800);
  }
}

async function cloudSave() {
  try {
    const { db, auth, isFirebaseConfigured } = await import('./firebase.js');
    const { doc, setDoc } = await import('firebase/firestore');
    if (!isFirebaseConfigured || !auth || !auth.currentUser || !db) return;
    const uid = auth.currentUser.uid;
    const ref = doc(db, 'users', uid);
    await setDoc(ref, { data: userData, updatedAt: new Date().toISOString() }, { merge: true });
  } catch (e) { console.warn('[Ascentrix] cloudSave hatası:', e?.message); }
}

export async function enableCloudSync() {
  try {
    const { isFirebaseConfigured, auth, db } = await import('./firebase.js');
    const { doc, getDoc, onSnapshot } = await import('firebase/firestore');
    if (!isFirebaseConfigured || !auth || !db || !auth.currentUser) return false;
    cloudEnabled = true;
    const uid = auth.currentUser.uid;
    const ref = doc(db, 'users', uid);
    // İlk yüklemede cloud verisi varsa merge et (cloud öncelikli değil, en güncel kazanır)
    try {
      const snap = await getDoc(ref);
      if (snap.exists() && snap.data() && snap.data().data) {
        const cloudData = snap.data().data;
        // Basit strateji: eğer cloud'da daha çok history varsa onu al, yoksa local'i koru
        const localLen = (userData.peak?.history?.length || 0) + (userData.logs?.length || 0);
        const cloudLen = (cloudData.peak?.history?.length || 0) + (cloudData.logs?.length || 0);
        if (cloudLen > localLen) {
          const merged = normalizeUserData(cloudData);
          Object.keys(merged).forEach(k => { userData[k] = merged[k]; });
          localStorage.setItem('ladder_user_data', JSON.stringify(userData));
        } else if (localLen > 0) {
          await cloudSave();
        }
      } else {
        await cloudSave();
      }
    } catch(e) { console.warn('[Ascentrix] cloud load hatası:', e?.message); }
    // Realtime sync (optional — tek cihazda debounce yeterli)
    try {
      if (firestoreUnsub) firestoreUnsub();
    } catch(_){}
    // Not enabling continuous onSnapshot to avoid loop; manual save yeterli
    return true;
  } catch (e) { console.warn('[Ascentrix] enableCloudSync hatası:', e?.message); return false; }
}

export function disableCloudSync() {
  cloudEnabled = false;
  try { if (firestoreUnsub) firestoreUnsub(); } catch(_){}
  firestoreUnsub = null;
  clearTimeout(cloudSaveTimer);
}

export function isCloudEnabled() { return cloudEnabled; }
export function resetAllData() {
  localStorage.removeItem('ladder_user_data');
  const defs = getDefaultUserData();
  Object.keys(defs).forEach(k => { userData[k] = defs[k]; });
  saveUserData();
}
export function checkDailyReset() {
  const today = todayStr();
  if (userData.stats.todayDate !== today) {
    if (userData.stats.lastActiveDate) {
      const lastDate = new Date(userData.stats.lastActiveDate);
      const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1);
      if (lastDate.getTime() < yesterday.getTime()) userData.stats.streakDays = 0;
    }
    userData.stats.todayWorkMins = 0;
    userData.stats.todayDate = today;
    saveUserData();
  }
}
// Timer / session mutable state — single source of truth
export const timerState = {
  currentModeKey: 'ascending',
  stepIndex: 0,
  isBreak: false,
  timerInterval: null,
  isRunning: false,
  alarmActive: false,
  workStepPending: false,
  breakStepPending: false,
  alarmMode: null,
  alarmTimer: null,
  testRunning: false,
  testSeconds: 0,
  testInterval: null,
  suppressPartial: false,
  endAt: null,
  testBase: 0,
  sessionDone: false,
  extraActive: false,
  extraSeconds: 0,
  extraBase: 0,
  extraInterval: null,
  fullBreak: false,
  currentSequence: [],
  totalSeconds: 0,
  secondsLeft: 0,
};
