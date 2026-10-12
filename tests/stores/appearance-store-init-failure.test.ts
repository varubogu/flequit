import { describe, expect, test, vi } from 'vitest';

async function importStoreAfterInitRejects(reason: unknown) {
  vi.resetModules();
  const recorded: Array<{ message: string; details?: string }> = [];
  let failed = false;

  vi.doMock('$lib/stores/error-handler.svelte', () => ({
    errorHandler: {
      addError(error: { message: string; details?: string }) {
        if (!failed) {
          failed = true;
          throw reason;
        }
        recorded.push(error);
      },
      clearAllErrors() {
        recorded.length = 0;
      },
      get errors() {
        return recorded;
      }
    }
  }));

  vi.doMock('$lib/dependencies/settings', () => ({
    resolveSettingsGateway: () => ({
      loadSettings: () => Promise.reject(new Error('settings down')),
      updateSettingsPartially: async () => null
    })
  }));

  await import('$lib/stores/appearance-store.svelte');
  await vi.waitFor(() => {
    expect(recorded.some((error) => error.message === '外観ストアの初期化に失敗しました')).toBe(true);
  });
  return recorded.find((error) => error.message === '外観ストアの初期化に失敗しました');
}

describe('appearance store module initialization', () => {
  test('records the error message when the first report throws an Error', async () => {
    const recorded = await importStoreAfterInitRejects(new Error('handler failed'));
    expect(recorded?.details).toBe('handler failed');
  });

  test('stringifies a non-Error thrown while reporting initialization failure', async () => {
    const recorded = await importStoreAfterInitRejects('plain failure');
    expect(recorded?.details).toBe('plain failure');
  });
});
