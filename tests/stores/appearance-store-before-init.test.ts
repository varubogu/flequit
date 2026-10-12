import { beforeEach, describe, expect, test, vi } from 'vitest';

const gateway = vi.hoisted(() => ({
  loadSettings: vi.fn(async () => null as Record<string, unknown> | null),
  updateSettingsPartially: vi.fn(async () => ({ font: 'default' }) as Record<string, unknown> | null)
}));

vi.mock('$lib/dependencies/settings', () => ({
  resolveSettingsGateway: () => gateway
}));

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

describe('appearance store initialization edges', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubGlobal('localStorage', memoryStorage());
    gateway.loadSettings.mockReset();
    gateway.loadSettings.mockResolvedValue(null);
    gateway.updateSettingsPartially.mockReset();
    gateway.updateSettingsPartially.mockResolvedValue({ font: 'default' });
  });

  test('does not persist a change made before settings finish loading', async () => {
    let resolveLoad: (value: Record<string, unknown> | null) => void = () => {};
    gateway.loadSettings.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveLoad = resolve;
        })
    );

    const { appearanceStore } = await import('$lib/stores/appearance-store.svelte');
    appearanceStore.setFont('early');
    expect(gateway.updateSettingsPartially).not.toHaveBeenCalled();

    resolveLoad({ fontColor: 'ink', backgroundColor: 'paper' });
    await vi.waitFor(() => {
      expect(appearanceStore.settings.fontColor).toBe('ink');
      expect(appearanceStore.settings.backgroundColor).toBe('paper');
    });
    expect(appearanceStore.settings.font).toBe('early');
    expect(appearanceStore.settings.fontSize).toBe(13);

    appearanceStore.setBackgroundColor('night');
    await vi.waitFor(() => {
      expect(gateway.updateSettingsPartially).toHaveBeenCalledWith({ backgroundColor: 'night' });
    });
  });

  test('records a non-Error failure while restoring appearance from localStorage', async () => {
    gateway.loadSettings.mockRejectedValueOnce(new Error('settings down'));
    localStorage.setItem('flequit-appearance', '{');
    vi.spyOn(JSON, 'parse').mockImplementationOnce(() => {
      throw 'plain failure';
    });

    const { appearanceStore } = await import('$lib/stores/appearance-store.svelte');
    const { errorHandler } = await import('$lib/stores/error-handler.svelte');
    await appearanceStore.init();

    await vi.waitFor(() => {
      expect(
        errorHandler.errors.some(
          (error) => error.message === '外観設定の復元に失敗しました' && error.details === 'plain failure'
        )
      ).toBe(true);
    });
  });
});
