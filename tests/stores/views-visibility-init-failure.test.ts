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
    resolveSettingsInitGateway: () => ({
      getAllSettings: () => Promise.reject(new Error('backend down')),
      getSettingByKey: () => undefined,
      updateSetting: async () => undefined
    })
  }));

  await import('$lib/stores/views-visibility.svelte');
  await vi.waitFor(() => {
    expect(recorded.some((error) => error.message === 'ビュー表示ストアの初期化に失敗しました')).toBe(
      true
    );
  });
  return recorded.find((error) => error.message === 'ビュー表示ストアの初期化に失敗しました');
}

describe('views visibility module initialization', () => {
  test('records an Error when initialization rejects', async () => {
    const error = await importStoreAfterInitRejects(new Error('handler failed'));
    expect(error?.details).toBe('handler failed');
  });

  test('stringifies a non-Error when initialization rejects', async () => {
    const error = await importStoreAfterInitRejects('plain failure');
    expect(error?.details).toBe('plain failure');
  });
});
