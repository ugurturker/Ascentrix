// utils.js — ortak yardımcılar
export function fmtMin(m) {
  return String(Number(Number(m).toFixed(1)));
}
export function todayStr() {
  return new Date().toISOString().split('T')[0];
}
export function avgArr(a) {
  return a.length ? a.reduce((x, y) => x + y, 0) / a.length : null;
}
