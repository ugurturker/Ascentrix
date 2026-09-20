import { describe, it, expect, beforeEach } from 'vitest';
import { protocolSteps, computeEnergy } from '../../src/modules/peak.js';
import { userData } from '../../src/modules/store.js';

describe('peak', () => {
  it('protocolSteps T=20 için doğru adımları üretir', () => {
    // i18n t() mock gerekebilir ama fmtMin + t proto_step için store gerekmez; jsdom ile çalışır
    const steps = protocolSteps(20);
    expect(steps).toHaveLength(4);
    expect(steps[0].work).toBe(20);
    expect(steps[0].break).toBeCloseTo(6.5, 1);
    expect(steps[1].work).toBe(15);
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
