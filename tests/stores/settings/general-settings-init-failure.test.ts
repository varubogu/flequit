import { describe, expect, test, vi } from 'vitest';

async function importStoreAfterRejectedLoad(reason: unknown) {
  vi.resetModules();
  vi.doMock('../../../src/lib/stores/settings/settings-persistence', () => ({
    SettingsPersistence: class {
      load() {
        return Promise.reject(reason);
      }
      markInitialized() {}
      save() {
        return Promise.resolve();
      }
    }
  }));

  const { errorHandler } = await import('../../../src/lib/stores/error-handler.svelte');
  errorHandler.clearAllErrors();
  await import('../../../src/lib/stores/settings/general-settings-store.svelte');
  return errorHandler;
}

describe('GeneralSettingsStore module initialization', () => {
  test('records an Error thrown while the singleton initializes', async () => {
    const errorHandler = await importStoreAfterRejectedLoad(new Error('load failed'));

    await vi.waitFor(() => {
      expect(
        errorHandler.errors.some(
          (error) =>
            error.message === '一般設定ストアの初期化に失敗しました' && error.details === 'load failed'
        )
      ).toBe(true);
    });
  });

  test('stringifies a non-Error thrown while the singleton initializes', async () => {
    const errorHandler = await importStoreAfterRejectedLoad('plain failure');

    await vi.waitFor(() => {
      expect(
        errorHandler.errors.some(
          (error) =>
            error.message === '一般設定ストアの初期化に失敗しました' &&
            error.details === 'plain failure'
        )
      ).toBe(true);
    });
  });
});
