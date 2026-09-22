// theme.js — Ascentrix tema sistemi
import { userData, saveUserData } from './store.js';

export const THEMES = {
  matrix: { label: { tr: 'Matrix', en: 'Matrix', de: 'Matrix' }, icon: '◈' },
  mario: { label: { tr: 'Super Mario', en: 'Super Mario', de: 'Super Mario' }, icon: '🍄' },
  aero: { label: { tr: 'Frutiger Aero', en: 'Frutiger Aero', de: 'Frutiger Aero' }, icon: '✧' },
  galaxy: { label: { tr: 'Galaksi', en: 'Galaxy', de: 'Galaxie' }, icon: '✦' },
};

export function getTheme() {
  // Açık seçim (userData) öncelikli; varsayılanda localStorage yedeğine düş
  const t = userData.settings.theme;
  if (THEMES[t] && t !== 'matrix') return t;
  try {
    const ls = localStorage.getItem('ascentrix_theme');
    if (ls && THEMES[ls]) return ls;
  } catch(_){}
  return THEMES[t] ? t : 'matrix';
}
export function getSimplifyLevel() {
  const v = userData.settings.simplifyLevel;
  if (typeof v === 'number' && v >= 0 && v <= 3 && v !== 0) return v;
  try {
    const ls = Number(localStorage.getItem('ascentrix_simplify'));
    if (ls >= 0 && ls <= 3) return ls;
  } catch(_){}
  return 0;
}

export function applyTheme() {
  const theme = getTheme();
  const lvl = getSimplifyLevel();
  document.body.classList.remove('theme-matrix','theme-mario','theme-aero','theme-galaxy');
  document.body.classList.add('theme-' + theme);
  document.body.classList.remove('simplify-0','simplify-1','simplify-2','simplify-3');
  document.body.classList.add('simplify-' + lvl);
  // CSS variables are handled via body class selectors in main.css
  // Also update meta theme-color per theme
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) {
    const colors = {
      matrix: '#020805',
      mario: '#5c94fc',
      aero: '#e0f6ff',
      galaxy: '#0a0a1a',
    };
    meta.setAttribute('content', colors[theme] || '#020805');
  }
}

export function setTheme(theme) {
  if (!THEMES[theme]) return;
  userData.settings.theme = theme;
  try { localStorage.setItem('ascentrix_theme', theme); } catch(_){}
  saveUserData();
  applyTheme();
  try { window.dispatchEvent(new CustomEvent('themechange', { detail: { theme } })); } catch(_){}
}

export function setSimplifyLevel(lvl) {
  lvl = Math.max(0, Math.min(3, Math.floor(Number(lvl) || 0)));
  userData.settings.simplifyLevel = lvl;
  try { localStorage.setItem('ascentrix_simplify', String(lvl)); } catch(_){}
  saveUserData();
  applyTheme();
}

// Init on load
try {
  if (typeof window !== 'undefined') {
    window.AscentrixTheme = { setTheme, setSimplifyLevel, getTheme, getSimplifyLevel, applyTheme, THEMES };
  }
} catch(_){}
