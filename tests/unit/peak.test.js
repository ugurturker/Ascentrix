import { describe, it, expect, beforeEach } from 'vitest';
import { protocolSteps, computeEnergy, BREAK_MODES, getBreakMode, proportionalBreak } from '../../src/modules/peak.js';
import { userData } from '../../src/modules/store.js';

describe('peak', () => {
  it('protocolSteps T=20 varsayılan (natural %25) adımları üretir', () => {
    const steps = protocolSteps(20);
    expect(steps).toHaveLength(4);
    expect(steps[0].work).toBe(20);
    expect(steps[0].break).toBe(5);
    expect(steps[1].work).toBe(16); // 0.80
    expect(steps[1].break).toBe(4);
    expect(steps[2].work).toBe(13); // 0.65
    expect(steps[2].break).toBe(3.5);
    expect(steps[3].work).toBe(10); // 0.50
    expect(steps[3].break).toBe(3); // 2.5 -> min 3
  });
  it('protocolSteps >4 cap 0.50', () => {
    const steps = protocolSteps(20, 6);
    expect(steps).toHaveLength(6);
    expect(steps[4].work).toBe(10);
    expect(steps[5].work).toBe(10);
    expect(steps[4].break).toBe(3);
  });
  it('mola ritimleri oranları uygular (easy/medium/hard)', () => {
    expect(protocolSteps(20, 4, 'easy').map(s => s.break)).toEqual([8, 6.5, 5, 4]);
    expect(protocolSteps(20, 4, 'medium').map(s => s.break)).toEqual([4, 3, 3, 3]);
    expect(protocolSteps(20, 4, 'hard').map(s => s.break)).toEqual([2.5, 2, 2, 2]);
  });
  it('natural üst sınırı kırpar (T=90 -> 20 dk)', () => {
    expect(protocolSteps(90, 4, 'natural')[0].break).toBe(20);
  });
  it('proportionalBreak odaklanılan süreye göre oranlar', () => {
    expect(proportionalBreak(12, 'natural')).toBe(3);
    expect(proportionalBreak(20, 'natural')).toBe(5);
    expect(proportionalBreak(12, 'easy')).toBe(5);
    expect(proportionalBreak(12, 'hard')).toBe(2);
    expect(proportionalBreak(0, 'natural')).toBe(3);
    expect(proportionalBreak(200, 'natural')).toBe(20);
  });
  it('geçersiz mod naturale düşer', () => {
    expect(getBreakMode()).toBe('natural');
    expect(protocolSteps(20, 4, 'bozuk').map(s => s.break)).toEqual(protocolSteps(20, 4, 'natural').map(s => s.break));
    expect(BREAK_MODES.natural.ratio).toBe(0.25);
  });
  it('computeEnergy rekor olmadan null döner', () => {
    const origCurrent = userData.peak.current;
    const origRecord = userData.peak.record;
    userData.peak.current = null;
    userData.peak.record = null;
    expect(computeEnergy()).toBe(null);
    userData.peak.current = origCurrent;
    userData.peak.record = origRecord;
  });
  it('computeEnergy oran hesaplar', () => {
    userData.peak.current = 10;
    userData.peak.record = 20;
    const e = computeEnergy();
    expect(e).toBeGreaterThan(4);
    expect(e).toBeLessThanOrEqual(10);
    userData.peak.current = null;
    userData.peak.record = null;
  });
});
