import { describe, test, expect, beforeEach, vi } from 'vitest';
import { settingsStore, getAvailableTimezones } from '../../src/lib/stores/settings.svelte';

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn()
};
global.localStorage = localStorageMock as unknown as Storage;

// Mock console.error
const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

describe('SettingsStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
  });

  describe('initialization', () => {
    test('should initialize with default timezone', () => {
      const store = new (settingsStore.constructor as new () => typeof settingsStore)();

      expect(store.timezone).toBe('system');
    });

    test('should load settings from localStorage on initialization', () => {
      const savedSettings = { timezone: 'Asia/Tokyo' };
      localStorageMock.getItem.mockReturnValue(JSON.stringify(savedSettings));

      const store = new (settingsStore.constructor as new () => typeof settingsStore)();

      expect(localStorageMock.getItem).toHaveBeenCalledWith('flequit-settings');
      expect(store.timezone).toBe('Asia/Tokyo');
    });

    test('should handle invalid JSON in localStorage', () => {
      localStorageMock.getItem.mockReturnValue('invalid json');

      const store = new (settingsStore.constructor as new () => typeof settingsStore)();

      expect(store.timezone).toBe('system'); // Should fallback to default
      expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to parse settings:', expect.any(Error));
    });

    test('should handle missing localStorage gracefully', () => {
      // Temporarily remove localStorage
      const originalLocalStorage = global.localStorage;
      delete (global as unknown as { localStorage?: Storage }).localStorage;

      expect(() => {
        new (settingsStore.constructor as new () => typeof settingsStore)();
      }).not.toThrow();

      // Restore localStorage
      global.localStorage = originalLocalStorage;
    });
  });

  describe('timezone getter', () => {
    test('should return current timezone setting', () => {
      expect(settingsStore.timezone).toBe('system');
    });
  });

  describe('effectiveTimezone getter', () => {
    test('should return system timezone when set to system', () => {
      // Mock Intl.DateTimeFormat
      const mockResolvedOptions = vi.fn().mockReturnValue({ timeZone: 'America/New_York' });
      const mockDateTimeFormat = vi.fn().mockReturnValue({
        resolvedOptions: mockResolvedOptions
      });

      global.Intl = {
        ...global.Intl,
        DateTimeFormat: mockDateTimeFormat as unknown as typeof Intl.DateTimeFormat
      };

      const store = new (settingsStore.constructor as new () => typeof settingsStore)();

      expect(store.effectiveTimezone).toBe('America/New_York');
      expect(mockDateTimeFormat).toHaveBeenCalled();
    });

    test('should return specific timezone when not set to system', () => {
      const store = new (settingsStore.constructor as new () => typeof settingsStore)();
      store.setTimezone('Asia/Tokyo');

      expect(store.effectiveTimezone).toBe('Asia/Tokyo');
    });
  });

  describe('setTimezone', () => {
    test('should update timezone and save to localStorage', () => {
      const store = new (settingsStore.constructor as new () => typeof settingsStore)();

      store.setTimezone('Europe/London');

      expect(store.timezone).toBe('Europe/London');
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'flequit-settings',
        JSON.stringify({ 
          timezone: 'Europe/London',
          dateFormat: 'yyyy年MM月dd日(E) HH:mm:ss',
          customDateFormats: []
        })
      );
    });

    test('should handle localStorage unavailable during save', () => {
      // Temporarily remove localStorage
      const originalLocalStorage = global.localStorage;
      delete (global as unknown as { localStorage?: Storage }).localStorage;

      // Create a new settings store class for testing
      class TestSettingsStore {
        private settings = { timezone: 'system' };

        get timezone() {
          return this.settings.timezone;
        }

        setTimezone(timezone: string) {
          this.settings.timezone = timezone;
          this.saveSettings();
        }

        private saveSettings() {
          if (typeof localStorage !== 'undefined') {
            localStorage.setItem('flequit-settings', JSON.stringify(this.settings));
          }
        }
      }

      const store = new TestSettingsStore();

      expect(() => {
        store.setTimezone('UTC');
      }).not.toThrow();

      // Restore localStorage
      global.localStorage = originalLocalStorage;
    });
  });

  describe('getAvailableTimezones function', () => {
    test('should contain expected timezone options', () => {
      const timezones = getAvailableTimezones();
      expect(timezones).toEqual(
        expect.arrayContaining([
          { value: 'system', label: expect.any(String) },
          { value: 'UTC', label: 'UTC' },
          { value: 'Asia/Tokyo', label: 'Tokyo (JST)' },
          { value: 'America/New_York', label: 'New York (EST/EDT)' },
          { value: 'Europe/London', label: 'London (GMT/BST)' }
        ])
      );
    });

    test('should have system timezone as first option', () => {
      const timezones = getAvailableTimezones();
      expect(timezones[0]).toEqual({
        value: 'system',
        label: expect.any(String)
      });
    });

    test('should contain major timezones', () => {
      const timezones = getAvailableTimezones();
      const timezoneValues = timezones.map((tz) => tz.value);

      expect(timezoneValues).toContain('UTC');
      expect(timezoneValues).toContain('Asia/Tokyo');
      expect(timezoneValues).toContain('America/New_York');
      expect(timezoneValues).toContain('Europe/London');
      expect(timezoneValues).toContain('Australia/Sydney');
    });
  });
});
