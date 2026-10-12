import { beforeEach, describe, expect, it, vi } from 'vitest';

const gateway = vi.hoisted(() => ({
  loadSettings: vi.fn(async () => null as Record<string, unknown> | null),
  updateSettingsPartially: vi.fn(async () => ({ font: 'default' }) as Record<string, unknown> | null)
}));

vi.mock('$lib/dependencies/settings', () => ({
  resolveSettingsGateway: () => gateway
}));

import { appearanceStore } from '$lib/stores/appearance-store.svelte';
import { errorHandler } from '$lib/stores/error-handler.svelte';

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

describe('appearance store persistence', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    errorHandler.clearAllErrors();
    vi.stubGlobal('localStorage', memoryStorage());
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    gateway.loadSettings.mockResolvedValue(null);
    gateway.updateSettingsPartially.mockResolvedValue({ font: 'default' });
  });

  it('applies only the appearance fields that were loaded', async () => {
    gateway.loadSettings.mockResolvedValueOnce({
      font: 'serif',
      fontSize: 18
    });

    await appearanceStore.init();

    expect(appearanceStore.settings.font).toBe('serif');
    expect(appearanceStore.settings.fontSize).toBe(18);
    expect(appearanceStore.settings.fontColor).toBe('default');
    expect(appearanceStore.settings.backgroundColor).toBe('default');
  });

  it('keeps the current settings when the backend returns nothing', async () => {
    gateway.loadSettings.mockResolvedValueOnce(null);
    await appearanceStore.init();
    expect(appearanceStore.settings.font).toBe('serif');
  });

  it('saves each appearance change and records a sync error when saving fails', async () => {
    await appearanceStore.init();

    appearanceStore.setFont('mono');
    await vi.waitFor(() => {
      expect(gateway.updateSettingsPartially).toHaveBeenCalledWith({ font: 'mono' });
    });

    appearanceStore.setFontSize(20);
    appearanceStore.setFontColor('blue');
    appearanceStore.setBackgroundColor('paper');
    await vi.waitFor(() => {
      expect(gateway.updateSettingsPartially).toHaveBeenCalledWith({ backgroundColor: 'paper' });
    });

    gateway.updateSettingsPartially.mockResolvedValueOnce(null);
    appearanceStore.setFont('broken');
    await vi.waitFor(() => {
      expect(errorHandler.errors.at(-1)?.message).toBe('外観設定の保存に失敗しました');
    });
    expect(localStorage.getItem('flequit-appearance')).toContain('broken');

    gateway.updateSettingsPartially.mockRejectedValueOnce('offline');
    appearanceStore.setFontSize(11);
    await vi.waitFor(() => {
      expect(errorHandler.errors.at(-1)?.details).toBe('offline');
    });
  });

  it('restores appearance from localStorage when loading fails', async () => {
    localStorage.setItem(
      'flequit-appearance',
      JSON.stringify({ font: 'stored', fontSize: 15, fontColor: 'red', backgroundColor: 'ink' })
    );
    gateway.loadSettings.mockRejectedValueOnce(new Error('settings down'));

    await appearanceStore.init();

    expect(appearanceStore.settings.font).toBe('stored');
    expect(appearanceStore.settings.fontSize).toBe(15);
    expect(errorHandler.errors.at(-1)?.message).toBe('外観設定の読み込みに失敗しました');
  });

  it('reports an invalid localStorage payload and ignores a missing one', async () => {
    localStorage.setItem('flequit-appearance', '{');
    gateway.loadSettings.mockRejectedValueOnce('settings down');
    await appearanceStore.init();
    expect(errorHandler.errors.some((error) => error.message === '外観設定の復元に失敗しました')).toBe(
      true
    );

    errorHandler.clearAllErrors();
    localStorage.removeItem('flequit-appearance');
    gateway.loadSettings.mockRejectedValueOnce(new Error('settings down'));
    await appearanceStore.init();
    expect(errorHandler.errors.some((error) => error.message === '外観設定の復元に失敗しました')).toBe(
      false
    );
  });
});
