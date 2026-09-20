import { userData, saveUserData, timerState } from './store.js';
import { t, L, curLang, logLocale } from './i18n.js';
import { levelInfo, levelInfoOf } from './gamification.js';
import { fmtMin, todayStr, avgArr } from './utils.js';
import * as audio from './audio.js';
import * as peak from './peak.js';


// Placeholder — full UI extracted incrementally
// Re-export legacy globals via window to keep build passing
export function updateGamificationUI(){ if(window.updateGamificationUI) return window.updateGamificationUI(); }
export function switchTab(id){ if(window.switchTab) return window.switchTab(id); }
export function renderTracker(){ if(window.renderTracker) return window.renderTracker(); }
export function updateDisplay(){ if(window.updateDisplay) return window.updateDisplay(); }
export function renderStats(){ if(window.renderStats) return window.renderStats(); }
export function renderBadges(){ if(window.renderBadges) return window.renderBadges(); }
export function renderPeakHistory(){ if(window.renderPeakHistory) return window.renderPeakHistory(); }
export function drawTpeakChart(){ if(window.drawTpeakChart) return window.drawTpeakChart(); }
export function celebrate(k){ if(window.celebrate) return window.celebrate(k); }
export function showLevelBanner(l){ if(window.showLevelBanner) return window.showLevelBanner(l); }
export function showToast(m,t){ if(window.showToast) return window.showToast(m,t); }
export function updateSoundUI(){ if(window.updateSoundUI) return window.updateSoundUI(); }
export function updateProfileUI(){ if(window.updateProfileUI) return window.updateProfileUI(); }
export function renderTPeakUI(){ if(window.renderTPeakUI) return window.renderTPeakUI(); }
export function renderTestClock(){ if(window.renderTestClock) return window.renderTestClock(); }
export function renderPlanCard(){ if(window.renderPlanCard) return window.renderPlanCard(); }
