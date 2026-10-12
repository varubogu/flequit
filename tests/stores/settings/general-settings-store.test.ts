import { beforeEach, describe, expect, test, vi } from 'vitest';
import { errorHandler } from '../../../src/lib/stores/error-handler.svelte';

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

  test('uses the runtime time zone while the setting is system and skips saves before init', () => {
    const { store, persistence } = createStore();

    expect(store.effectiveTimezone).toBe(Intl.DateTimeFormat().resolvedOptions().timeZone);
    store.setLanguage('en');
    store.setTimezone('Asia/Tokyo');
    const formatId = store.addCustomDateFormat('Draft', 'yyyy-MM-dd');

    expect(store.language).toBe('en');
    expect(store.timezone).toBe('Asia/Tokyo');
    expect(store.effectiveTimezone).toBe('Asia/Tokyo');
    expect(store.customDateFormats.map((format) => format.id)).toContain(formatId);
    expect(persistence.save).not.toHaveBeenCalled();
  });

  test('records save failures for Error and non-Error rejections', async () => {
    const { store, persistence } = createStore();
    await store.init();
    errorHandler.clearAllErrors();

    persistence.save.mockRejectedValueOnce(new Error('disk full'));
    store.setDateFormat('yyyy-MM-dd');
    await vi.waitFor(() => {
      expect(errorHandler.errors.some((error) => error.details === 'disk full')).toBe(true);
    });

    errorHandler.clearAllErrors();
    persistence.save.mockRejectedValueOnce('boom');
    store.setTimezone('Europe/Paris');
    await vi.waitFor(() => {
      expect(errorHandler.errors.some((error) => error.details === 'boom')).toBe(true);
    });
  });

  test('updates and removes only the matching custom format or time label', async () => {
    const { store, persistence } = createStore();
    await store.init();
    persistence.save.mockClear();

    const formatId = store.addCustomDateFormat('Alpha', 'yyyy');
    const otherFormatId = store.addCustomDateFormat('Beta', 'MM');
    store.updateCustomDateFormat(formatId, { name: 'Alpha 2' });
    store.updateCustomDateFormat('missing-format', { name: 'Ignored' });
    store.removeCustomDateFormat(otherFormatId);
    store.removeCustomDateFormat('missing-format');

    expect(store.customDateFormats).toEqual([
      expect.objectContaining({ id: formatId, name: 'Alpha 2', format: 'yyyy' })
    ]);

    const morningId = store.addTimeLabel('Morning', '08:00');
    const eveningId = store.addTimeLabel('Evening', '18:00');
    store.updateTimeLabel(morningId, { name: 'Early' });
    store.updateTimeLabel('missing-label', { name: 'Ignored' });
    store.removeTimeLabel(eveningId);

    expect(store.timeLabels).toEqual([
      expect.objectContaining({ id: morningId, name: 'Early', time: '08:00' })
    ]);
    expect(store.getTimeLabelsByTime('08:00')).toHaveLength(1);
    expect(store.getTimeLabelsByTime('18:00')).toEqual([]);
    expect(persistence.save).toHaveBeenCalled();
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
