// utils.js — ortak yardımcılar
export function fmtMin(m) {
  return String(Number(Number(m).toFixed(1)));
}
export function todayStr() {
  // Yerel gün — UTC değil (00:00–03:00 arası kaymayı önler)
  const d = new Date();
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}
export function avgArr(a) {
  return a.length ? a.reduce((x, y) => x + y, 0) / a.length : null;
}
