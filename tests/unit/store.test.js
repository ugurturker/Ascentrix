import { describe, it, expect, beforeEach } from 'vitest';
import { userData, saveUserData, applyDailyResetIfNeeded, resolveSyncData } from '../../src/modules/store.js';
import { todayStr } from '../../src/modules/utils.js';

function dayStr(offsetDays) {
  const d = new Date();
  const t = new Date(d.getFullYear(), d.getMonth(), d.getDate() + offsetDays);
  return t.getFullYear() + '-' + String(t.getMonth() + 1).padStart(2, '0') + '-' + String(t.getDate()).padStart(2, '0');
}

describe('store', () => {
  it('userData varsayılanları yükler', () => {
    expect(userData.profile).toBeDefined();
    expect(userData.stats).toBeDefined();
    expect(userData.peak).toBeDefined();
  });
  it('bayat gün verisi resetlenir (115+75=190 regresyonu)', () => {
    // Senaryo: Firestore'dan dünün 75 dk'lık verisi geldi
    const d = new Date();
    const yesterday = new Date(d.getFullYear(), d.getMonth(), d.getDate() - 1);
    const yStr = yesterday.getFullYear() + '-' + String(yesterday.getMonth() + 1).padStart(2, '0') + '-' + String(yesterday.getDate()).padStart(2, '0');
    const origDate = userData.stats.todayDate;
    const origMins = userData.stats.todayWorkMins;
    userData.stats.todayDate = yStr;
    userData.stats.todayWorkMins = 75;
    expect(applyDailyResetIfNeeded()).toBe(true);
    expect(userData.stats.todayWorkMins).toBe(0);
    expect(userData.stats.todayDate).toBe(todayStr());
    // İkinci çağrı no-op olmalı
    expect(applyDailyResetIfNeeded()).toBe(false);
    userData.stats.todayDate = origDate;
    userData.stats.todayWorkMins = origMins;
  });
  it('resolveSyncData: bayat cloud + taze local → keep-local', () => {
    const local = { stats: { todayDate: todayStr(), todayWorkMins: 76 } };
    const cloud = { stats: { todayDate: dayStr(-1), todayWorkMins: 68 } };
    expect(resolveSyncData(local, cloud, todayStr()).action).toBe('keep-local');
  });
  it('resolveSyncData: taze cloud → overwrite', () => {
    const local = { stats: { todayDate: todayStr(), todayWorkMins: 76 } };
    const cloud = { stats: { todayDate: todayStr(), todayWorkMins: 68 } };
    expect(resolveSyncData(local, cloud, todayStr()).action).toBe('overwrite');
  });
  it('resolveSyncData: bulutsuz + sıfır local → overwrite', () => {
    const local = { stats: { todayDate: todayStr(), todayWorkMins: 0 } };
    expect(resolveSyncData(local, null, todayStr()).action).toBe('overwrite');
  });
  it('saveUserData offline yazmaz, sadece Firestore (unauthenticated no-op)', () => {
    userData.profile.name = 'TestUser';
    saveUserData();
    const raw = localStorage.getItem('ladder_user_data');
    // offline yedek kaldırıldı — localStorage'a yazmamalı
    expect(raw === null || !String(raw).includes('TestUser')).toBeTruthy();
    userData.profile.name = 'Neo';
    saveUserData();
  });
});
