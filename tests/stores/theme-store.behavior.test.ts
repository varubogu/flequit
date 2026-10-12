import { beforeEach, describe, expect, it, vi } from 'vitest';

const { setMode, gateway } = vi.hoisted(() => ({
  setMode: vi.fn(),
  gateway: {
    loadSettings: vi.fn(async () => null as { theme?: string } | null),
    updateSettingsPartially: vi.fn(async () => ({ theme: 'system' }) as { theme: string } | null)
  }
}));

vi.mock('mode-watcher', () => ({
  setMode,
  userPrefersMode: { current: 'system' }
}));

vi.mock('$lib/dependencies/settings', () => ({
  resolveSettingsGateway: () => gateway
}));

import { themeStore } from '$lib/stores/theme-store.svelte';

function memoryStorage() {
  const entries = new Map<string, string>();
  return {
    getItem: (key: string) => entries.get(key) ?? null,
    setItem: (key: string, value: string) => {
      entries.set(key, String(value));
    },
    removeItem: (key: string) => {
      entries.delete(key);
    },
    clear: () => entries.clear()
  };
}

describe('theme store persistence', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('localStorage', memoryStorage());
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    gateway.loadSettings.mockResolvedValue(null);
    gateway.updateSettingsPartially.mockResolvedValue({ theme: 'system' });
  });

  it('reads the current preference and applies a stored theme', async () => {
    expect(themeStore.currentTheme).toBe('system');

    gateway.loadSettings.mockResolvedValueOnce({ theme: 'dark' });
    await themeStore.init();
    expect(setMode).toHaveBeenCalledWith('dark');

    setMode.mockClear();
    gateway.loadSettings.mockResolvedValueOnce({ theme: 'sepia' });
    await themeStore.init();
    expect(setMode).not.toHaveBeenCalled();

    gateway.loadSettings.mockResolvedValueOnce(null);
    await themeStore.init();
    expect(setMode).not.toHaveBeenCalled();
  });

  it('persists a theme change and falls back to localStorage when saving fails', async () => {
    await themeStore.init();
    themeStore.setTheme('light');
    await vi.waitFor(() => {
      expect(gateway.updateSettingsPartially).toHaveBeenCalledWith({ theme: 'light' });
    });
    expect(setMode).toHaveBeenCalledWith('light');

    gateway.updateSettingsPartially.mockResolvedValueOnce(null);
    themeStore.setTheme('dark');
    await vi.waitFor(() => {
      expect(localStorage.getItem('flequit-theme')).toBe('dark');
    });

    gateway.updateSettingsPartially.mockRejectedValueOnce('offline');
    themeStore.setTheme('system');
    await vi.waitFor(() => {
      expect(localStorage.getItem('flequit-theme')).toBe('system');
    });
  });

  it('restores a valid theme from localStorage and ignores an unknown value', async () => {
    localStorage.setItem('flequit-theme', 'light');
    gateway.loadSettings.mockRejectedValueOnce(new Error('down'));
    await themeStore.init();
    expect(setMode).toHaveBeenCalledWith('light');

    setMode.mockClear();
    localStorage.setItem('flequit-theme', 'sepia');
    gateway.loadSettings.mockRejectedValueOnce('down');
    await themeStore.init();
    expect(setMode).not.toHaveBeenCalled();

    localStorage.removeItem('flequit-theme');
    gateway.loadSettings.mockRejectedValueOnce(new Error('down'));
    await themeStore.init();
    expect(setMode).not.toHaveBeenCalled();
  });
});
