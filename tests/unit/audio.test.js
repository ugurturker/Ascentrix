import { describe, it, expect } from 'vitest';
import { isSilentAlarm } from '../../src/modules/audio.js';
import { userData } from '../../src/modules/store.js';

describe('audio alarm modu', () => {
  it('varsayılan sesli moddur (sessiz kapalı)', () => {
    userData.settings.silentAlarm = false;
    expect(isSilentAlarm()).toBe(false);
  });
  it('sessiz mod bayrağını okur', () => {
    userData.settings.silentAlarm = true;
    expect(isSilentAlarm()).toBe(true);
    userData.settings.silentAlarm = false;
    expect(isSilentAlarm()).toBe(false);
  });
});
