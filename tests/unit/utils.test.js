import { describe, it, expect } from 'vitest';
import { fmtMin, todayStr, avgArr } from '../../src/modules/utils.js';

describe('utils', () => {
  it('fmtMin doğru formatlar', () => {
    expect(fmtMin(5)).toBe('5');
    expect(fmtMin(5.5)).toBe('5.5');
    expect(fmtMin(11.05)).toBe('11.1');
  });
  it('todayStr ISO tarih döner', () => {
    expect(todayStr()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
  it('todayStr yerel günü döner (UTC değil)', () => {
    const d = new Date();
    const local = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
    expect(todayStr()).toBe(local);
  });
  it('avgArr ortalamayı hesaplar', () => {
    expect(avgArr([2,4,6])).toBe(4);
    expect(avgArr([])).toBe(null);
  });
});
