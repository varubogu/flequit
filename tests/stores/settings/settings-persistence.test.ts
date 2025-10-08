import { beforeEach, describe, expect, test, vi } from 'vitest';

import { SettingsPersistence } from '../../../src/lib/stores/settings/settings-persistence';
import { DEFAULT_SETTINGS } from '../../../src/lib/stores/settings/defaults';
import type { Settings } from '../../../src/lib/types/settings';

const dataServiceMock = vi.hoisted(() => ({
  updateSettingsPartially: vi.fn(),
  loadSettings: vi.fn()
}));

vi.mock('$lib/services/data-service', () => ({
  dataService: dataServiceMock
}));

const getDataService = () => dataServiceMock;

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
  beforeEach(() => {
    const storage = ensureLocalStorage();
    storage.getItem.mockReturnValue(null);

    const dataService = getDataService();
    dataService.updateSettingsPartially.mockReset();
    dataService.loadSettings.mockReset();

    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  test('save does nothing before initialization', async () => {
    const state = createState();
    const persistence = new SettingsPersistence(state);
    const dataService = getDataService();

    await persistence.save({ language: 'en' });

    expect(dataService.updateSettingsPartially).not.toHaveBeenCalled();
    expect(state.language).toBe(DEFAULT_SETTINGS.language);
  });

  test('save persists partial settings after initialization', async () => {
    const state = createState();
    const persistence = new SettingsPersistence(state);
    const dataService = getDataService();

    persistence.markInitialized();
    dataService.updateSettingsPartially.mockResolvedValue({
      language: 'en'
    } as Settings);

    await persistence.save({ language: 'en' });

    expect(dataService.updateSettingsPartially).toHaveBeenCalledWith({ language: 'en' });
    expect(state.language).toBe('en');
    expect(global.localStorage.setItem).toHaveBeenCalled();
  });

  test('save propagates errors after local fallback', async () => {
    const state = createState();
    const persistence = new SettingsPersistence(state);
    const dataService = getDataService();

    persistence.markInitialized();
    dataService.updateSettingsPartially.mockRejectedValue(new Error('failure'));

    await expect(persistence.save({ timezone: 'UTC' })).rejects.toThrow('failure');
    expect(global.localStorage.setItem).toHaveBeenCalled();
  });

  test('load applies remote settings', async () => {
    const state = createState();
    const persistence = new SettingsPersistence(state);
    const dataService = getDataService();

    dataService.loadSettings.mockResolvedValue({ language: 'fr' } as Settings);

    await persistence.load();

    expect(dataService.loadSettings).toHaveBeenCalledTimes(1);
    expect(state.language).toBe('fr');
    expect(global.localStorage.setItem).toHaveBeenCalledWith(expect.any(String), expect.any(String));
  });

  test('load falls back to localStorage on error', async () => {
    const state = createState();
    const persistence = new SettingsPersistence(state);
    const dataService = getDataService();
    const storage = global.localStorage as { getItem: ReturnType<typeof vi.fn> } & Storage;

    dataService.loadSettings.mockRejectedValue(new Error('network error'));
    storage.getItem.mockReturnValue(JSON.stringify({ timezone: 'Asia/Tokyo' }));

    await persistence.load();

    expect(state.timezone).toBe('Asia/Tokyo');
  });
});
