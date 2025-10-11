import { beforeEach, afterEach, describe, expect, test, vi } from 'vitest';

import { SettingsPersistence } from '../../../src/lib/stores/settings/settings-persistence';
import { DEFAULT_SETTINGS } from '../../../src/lib/stores/settings/defaults';
import type { Settings } from '../../../src/lib/types/settings';
import { SettingsService } from '$lib/services/domain/settings';

const createState = (): Settings => structuredClone(DEFAULT_SETTINGS);

const ensureLocalStorage = () => {
  const storage = {
    getItem: vi.fn().mockReturnValue(null),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
    key: vi.fn(),
    length: 0
  } as unknown as Storage;

  Object.defineProperty(global, 'localStorage', {
    value: storage,
    writable: true
  });

  return storage;
};

describe('SettingsPersistence', () => {
  let updateSettingsPartiallySpy: ReturnType<
    typeof vi.spyOn<typeof SettingsService, 'updateSettingsPartially'>
  >;
  let loadSettingsSpy: ReturnType<typeof vi.spyOn<typeof SettingsService, 'loadSettings'>>;

  beforeEach(() => {
    const storage = ensureLocalStorage();
    storage.getItem.mockReturnValue(null);

    updateSettingsPartiallySpy = vi.spyOn(SettingsService, 'updateSettingsPartially');
    loadSettingsSpy = vi.spyOn(SettingsService, 'loadSettings');
    updateSettingsPartiallySpy.mockReset();
    loadSettingsSpy.mockReset();

    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    updateSettingsPartiallySpy.mockRestore();
    loadSettingsSpy.mockRestore();
  });

  test('save does nothing before initialization', async () => {
    const state = createState();
    const persistence = new SettingsPersistence(state);

    await persistence.save({ language: 'en' });

    expect(updateSettingsPartiallySpy).not.toHaveBeenCalled();
    expect(state.language).toBe(DEFAULT_SETTINGS.language);
  });

  test('save persists partial settings after initialization', async () => {
    const state = createState();
    const persistence = new SettingsPersistence(state);

    persistence.markInitialized();
    updateSettingsPartiallySpy.mockResolvedValue({
      language: 'en'
    } as Settings);

    await persistence.save({ language: 'en' });

    expect(updateSettingsPartiallySpy).toHaveBeenCalledWith({ language: 'en' });
    expect(state.language).toBe('en');
    expect(global.localStorage.setItem).toHaveBeenCalled();
  });

  test('save propagates errors after local fallback', async () => {
    const state = createState();
    const persistence = new SettingsPersistence(state);

    persistence.markInitialized();
    updateSettingsPartiallySpy.mockRejectedValue(new Error('failure'));

    await expect(persistence.save({ timezone: 'UTC' })).rejects.toThrow('failure');
    expect(global.localStorage.setItem).toHaveBeenCalled();
  });

  test('load applies remote settings', async () => {
    const state = createState();
    const persistence = new SettingsPersistence(state);

    loadSettingsSpy.mockResolvedValue({ language: 'fr' } as Settings);

    await persistence.load();

    expect(loadSettingsSpy).toHaveBeenCalledTimes(1);
    expect(state.language).toBe('fr');
    expect(global.localStorage.setItem).toHaveBeenCalledWith(expect.any(String), expect.any(String));
  });

  test('load falls back to localStorage on error', async () => {
    const state = createState();
    const persistence = new SettingsPersistence(state);
    const storage = global.localStorage as { getItem: ReturnType<typeof vi.fn> } & Storage;

    loadSettingsSpy.mockRejectedValue(new Error('network error'));
    storage.getItem.mockReturnValue(JSON.stringify({ timezone: 'Asia/Tokyo' }));

    await persistence.load();

    expect(state.timezone).toBe('Asia/Tokyo');
  });
});
