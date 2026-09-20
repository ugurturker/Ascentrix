import { describe, it, expect } from 'vitest';
import { levelInfo, levelTitle } from '../../src/modules/gamification.js';

describe('gamification', () => {
  it('levelInfo 0 XP seviye 1', () => {
    const info = levelInfo(0);
    expect(info.level).toBe(1);
    expect(info.need).toBe(80);
  });
  it('levelInfo 80 XP seviye 2', () => {
    const info = levelInfo(80);
    expect(info.level).toBe(2);
  });
  it('levelTitle seviye 1 için string döner', () => {
    expect(levelTitle(1)).toBeTruthy();
  });
});
