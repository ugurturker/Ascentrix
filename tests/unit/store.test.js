import { describe, it, expect, beforeEach } from 'vitest';
import { userData, saveUserData } from '../../src/modules/store.js';

describe('store', () => {
  it('userData varsayılanları yükler', () => {
    expect(userData.profile).toBeDefined();
    expect(userData.stats).toBeDefined();
    expect(userData.peak).toBeDefined();
  });
  it('saveUserData localStorage yazar', () => {
    userData.profile.name = 'TestUser';
    saveUserData();
    const raw = localStorage.getItem('ladder_user_data');
    expect(raw).toContain('TestUser');
    // geri al
    userData.profile.name = 'Neo';
    saveUserData();
  });
});
