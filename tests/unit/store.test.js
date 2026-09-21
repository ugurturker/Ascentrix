import { describe, it, expect, beforeEach } from 'vitest';
import { userData, saveUserData } from '../../src/modules/store.js';

describe('store', () => {
  it('userData varsayılanları yükler', () => {
    expect(userData.profile).toBeDefined();
    expect(userData.stats).toBeDefined();
    expect(userData.peak).toBeDefined();
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
