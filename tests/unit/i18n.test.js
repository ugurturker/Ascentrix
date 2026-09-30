import { describe, it, expect } from 'vitest';
import { t, curLang, I18N } from '../../src/modules/i18n.js';
import { userData } from '../../src/modules/store.js';
import fs from 'fs';

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

describe('i18n tek kaynak', () => {
  const legacy = fs.readFileSync('src/modules/legacy.js', 'utf-8');

  it('legacy.js sözlüğü import ediyor, kendi kopyasını tutmuyor', () => {
    expect(legacy).toMatch(/import\s*\{\s*I18N\s*\}\s*from\s*'\.\/i18n\.js'/);
    expect(legacy, 'legacy.js içinde ikinci bir I18N tanımı olmamalı').not.toMatch(/const\s+I18N\s*=\s*\{/);
  });

  it('üç dil anahtar kümesi birebir aynı', () => {
    const keys = Object.keys(I18N.tr).sort();
    for (const lang of ['en', 'de']) {
      expect(Object.keys(I18N[lang]).sort(), `${lang} anahtar kümesi`).toEqual(keys);
    }
  });

  it('index.html data-i18n anahtarlarının hepsi çözülebiliyor', () => {
    const html = fs.readFileSync('index.html', 'utf-8');
    const used = [...html.matchAll(/data-i18n(?:-ph|-title)?="([^"]+)"/g)].map((m) => m[1]);
    const missing = [...new Set(used)].filter((k) => I18N.tr[k] === undefined);
    expect(missing, 'sözlükte olmayan data-i18n anahtarı').toEqual([]);
  });
});
