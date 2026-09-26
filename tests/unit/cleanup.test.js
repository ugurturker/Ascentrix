import { describe, it, expect } from 'vitest';
import { userData } from '../../src/modules/store.js';
import { I18N } from '../../src/modules/i18n.js';
import { protocolSteps, MULTIPLIERS } from '../../src/modules/peak.js';
import fs from 'fs';

describe('kapsamlı temizlik — sick/pyramid/flow', () => {
  it('store sickPoints kaldırıldı', () => {
    expect(userData.peak.sickPoints).toBeUndefined();
    expect(userData.peak.extras).toBeDefined();
    expect(userData.peak.history).toBeDefined();
  });

  it('i18n dead keys silindi', () => {
    const dead = ['hist_sick','toast_sick_saved','log_sick','sick_latest','ctl_flow','toast_flow','flow_extend','stat_score','profile_score'];
    for (const lang of ['tr','en','de']) {
      for (const key of dead) {
        expect(I18N[lang][key], `${lang}.${key} should be removed`).toBeUndefined();
      }
    }
    // yaşayan keyler hala duruyor
    expect(I18N.tr.hist_extra).toBeDefined();
    expect(I18N.en.hist_extra).toBeDefined();
  });

  it('multiplier array spec 1.00/0.80/0.65/0.50 cap 0.50', () => {
    expect(MULTIPLIERS).toEqual([1.00, 0.80, 0.65, 0.50]);
    const steps = protocolSteps(20);
    expect(steps.map(s=>s.work)).toEqual([20,16,13,10]);
    const steps6 = protocolSteps(20, 6);
    expect(steps6[4].work).toBe(10);
    expect(steps6[5].work).toBe(10);
  });

  it('index.html sick/pyramid/flow izi kalmadı', () => {
    const html = fs.readFileSync('index.html','utf-8');
    expect(html.includes('hist_sick')).toBe(false);
    expect(html.includes('histSick')).toBe(false);
    expect(html.includes('statScore')).toBe(false);
    expect(html.includes('profileScore')).toBe(false);
    expect(html.includes('flowBtn')).toBe(false);
    expect(html.includes('btn-flow')).toBe(false);
  });

  it('CSS dead stiller silindi', () => {
    const css = fs.readFileSync('src/styles/main.css','utf-8');
    expect(css.includes('.btn-sick')).toBe(false);
    expect(css.includes('.btn-flow')).toBe(false);
  });

  it('legacy sickPoints kodu silindi', () => {
    const legacy = fs.readFileSync('src/modules/legacy.js','utf-8');
    expect(legacy.includes('sickPoints')).toBe(false);
    expect(legacy.includes("set('histSick'")).toBe(false);
  });

  it('sessiz alarm öğeleri mevcut', () => {
    const html = fs.readFileSync('index.html','utf-8');
    expect(html.includes('id="silentOverlay"')).toBe(true);
    expect(html.includes('id="alarmModeBtn"')).toBe(true);
    expect(html.includes('toggleAlarmMode()')).toBe(true);
    const css = fs.readFileSync('src/styles/main.css','utf-8');
    expect(css.includes('.silent-overlay')).toBe(true);
    expect(css.includes('silentFlash')).toBe(true);
    const legacy = fs.readFileSync('src/modules/legacy.js','utf-8');
    expect(legacy.includes('showSilentOverlay')).toBe(true);
    expect(legacy.includes('toggleAlarmMode')).toBe(true);
    for (const lang of ['tr','en','de']) {
      expect(I18N[lang].alarm_mode_sound, `${lang}.alarm_mode_sound`).toBeDefined();
      expect(I18N[lang].alarm_mode_silent, `${lang}.alarm_mode_silent`).toBeDefined();
      expect(I18N[lang].toast_alarm_mode, `${lang}.toast_alarm_mode`).toBeDefined();
    }
  });
});
