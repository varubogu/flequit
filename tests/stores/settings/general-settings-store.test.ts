import { beforeEach, describe, expect, test, vi } from 'vitest';

vi.mock('../../../src/lib/stores/settings/settings-persistence', () => {
  class StubSettingsPersistence {
    load = vi.fn().mockResolvedValue(undefined);
    markInitialized = vi.fn();
    save = vi.fn().mockResolvedValue(undefined);
  }

  return { SettingsPersistence: StubSettingsPersistence };
});

import { GeneralSettingsStore } from '../../../src/lib/stores/settings/general-settings-store.svelte';

const createStore = () => {
  const persistence = {
    load: vi.fn().mockResolvedValue(undefined),
    markInitialized: vi.fn(),
    save: vi.fn().mockResolvedValue(undefined)
  };

  const store = new GeneralSettingsStore(persistence);
  return { store, persistence } as const;
};

describe('GeneralSettingsStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('init triggers persistence load and markInitialized', async () => {
    const { store, persistence } = createStore();

    await store.init();

    expect(persistence.load).toHaveBeenCalledTimes(1);
    expect(persistence.markInitialized).toHaveBeenCalledTimes(1);
  });

  test('setWeekStart updates state and persists partial settings', async () => {
    const { store, persistence } = createStore();
    await store.init();
    persistence.save.mockClear();

    store.setWeekStart('monday');

    expect(store.weekStart).toBe('monday');
    expect(persistence.save).toHaveBeenCalledWith({ weekStart: 'monday' });
  });

  test('setTimezone updates timezone and requests persistence save', async () => {
    const { store, persistence } = createStore();
    await store.init();
    persistence.save.mockClear();

    store.setTimezone('Europe/Paris');

    expect(store.timezone).toBe('Europe/Paris');
    expect(store.effectiveTimezone).toBe('Europe/Paris');
    expect(persistence.save).toHaveBeenCalledWith({ timezone: 'Europe/Paris' });
  });

  test('addCustomDateFormat registers new format and persists', async () => {
    const { store, persistence } = createStore();
    await store.init();
    persistence.save.mockClear();

    const formatId = store.addCustomDateFormat('My format', 'yyyy/MM/dd');

    expect(formatId.startsWith('custom_')).toBe(true);
    expect(store.customDateFormats.find((format) => format.id === formatId)).toBeDefined();
    expect(persistence.save).toHaveBeenCalledWith({
      customDateFormats: expect.arrayContaining([
        expect.objectContaining({ id: formatId, name: 'My format', format: 'yyyy/MM/dd' })
      ])
    });
  });

  test('addTimeLabel registers entry and persists', async () => {
    const { store, persistence } = createStore();
    await store.init();
    persistence.save.mockClear();

    const labelId = store.addTimeLabel('Morning', '08:00');

    expect(labelId.startsWith('time_')).toBe(true);
    expect(store.getTimeLabelsByTime('08:00')).toHaveLength(1);
    expect(persistence.save).toHaveBeenCalledWith({
      timeLabels: expect.arrayContaining([
        expect.objectContaining({ id: labelId, name: 'Morning', time: '08:00' })
      ])
    });
  });
});
