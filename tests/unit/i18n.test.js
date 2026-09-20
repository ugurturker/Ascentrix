import { describe, it, expect } from 'vitest';
import { t, curLang } from '../../src/modules/i18n.js';
import { userData } from '../../src/modules/store.js';

describe('i18n', () => {
  it('t() TR anahtar çevirir', () => {
    userData.settings.lang = 'tr';
    expect(t('nav_timer')).toBe('Zamanlayıcı');
  });
  it('t() EN anahtar çevirir', () => {
    userData.settings.lang = 'en';
    expect(t('nav_timer')).toBe('Timer');
    userData.settings.lang = 'tr';
  });
  it('t() bilinmeyen anahtar için key döner', () => {
    expect(t('__nope__')).toBe('__nope__');
  });
  it('curLang desteklenmeyen dilde tr döner', () => {
    userData.settings.lang = 'xx';
    expect(curLang()).toBe('tr');
    userData.settings.lang = 'tr';
  });
});
