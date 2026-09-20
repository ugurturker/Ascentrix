import { describe, it, expect, beforeEach } from 'vitest';
import { protocolSteps, computeEnergy } from '../../src/modules/peak.js';
import { userData } from '../../src/modules/store.js';

describe('peak', () => {
  it('protocolSteps T=20 için doğru adımları üretir (1.00/0.80/0.65/0.50)', () => {
    const steps = protocolSteps(20);
    expect(steps).toHaveLength(4);
    expect(steps[0].work).toBe(20);
    expect(steps[0].break).toBeCloseTo(6.5, 1);
    expect(steps[1].work).toBe(16); // 0.80
    expect(steps[2].work).toBe(13); // 0.65
    expect(steps[3].work).toBe(10); // 0.50
  });
  it('protocolSteps >4 cap 0.50', () => {
    const steps = protocolSteps(20, 6);
    expect(steps).toHaveLength(6);
    expect(steps[4].work).toBe(10);
    expect(steps[5].work).toBe(10);
    expect(steps[4].break).toBeCloseTo(3.5, 1);
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
