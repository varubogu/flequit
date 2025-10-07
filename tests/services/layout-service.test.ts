import { beforeEach, describe, expect, test, vi } from 'vitest';
import {
  createLayoutPreferencesStore,
  LayoutPreferencesStore
} from '../../src/lib/services/ui/layout';

const STORAGE_KEY = 'flequit-layout-preferences';

type MockStorage = {
  getItem: ReturnType<typeof vi.fn>;
  setItem: ReturnType<typeof vi.fn>;
  store: Map<string, string>;
};

function createMockStorage(): MockStorage {
  const backing = new Map<string, string>();
  return {
    store: backing,
    getItem: vi.fn((key: string) => backing.get(key) ?? null),
    setItem: vi.fn((key: string, value: string) => {
      backing.set(key, value);
    })
  };
}

describe('LayoutPreferencesStore', () => {
  let storage: MockStorage;
  let store: LayoutPreferencesStore;
  const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

  beforeEach(() => {
    vi.clearAllMocks();
    storage = createMockStorage();
    store = createLayoutPreferencesStore({ storage });
  });

  test('初期化時にデフォルト値を設定する', () => {
    expect(store.value).toEqual({
      taskListPaneSize: 30,
      taskDetailPaneSize: 70
    });
    // loadPreferences が実行されて getItem が呼び出されることを確認
    expect(storage.getItem).toHaveBeenCalledWith(STORAGE_KEY);
  });

  test('保存済みプリファレンスをマージして読み込む', () => {
    const persisted = JSON.stringify({ taskListPaneSize: 45 });
    storage.getItem.mockReturnValueOnce(persisted);

    const reloaded = store.loadPreferences();

    expect(reloaded).toEqual({
      taskListPaneSize: 45,
      taskDetailPaneSize: 70
    });
  });

  test('不正なJSONはデフォルトでフォールバックする', () => {
    storage.getItem.mockReturnValueOnce('invalid json');

    const reloaded = store.loadPreferences();

    expect(consoleWarnSpy).toHaveBeenCalled();
    expect(reloaded).toEqual({
      taskListPaneSize: 30,
      taskDetailPaneSize: 70
    });
  });

  test('ストレージ例外は捕捉される', () => {
    storage.getItem.mockImplementationOnce(() => {
      throw new Error('storage unavailable');
    });

    const reloaded = store.loadPreferences();

    expect(consoleWarnSpy).toHaveBeenCalledWith(
      'Failed to load layout preferences:',
      expect.any(Error)
    );
    expect(reloaded).toEqual({
      taskListPaneSize: 30,
      taskDetailPaneSize: 70
    });
  });

  test('プリファレンスを保存する', () => {
    store.savePreferences({ taskListPaneSize: 40, taskDetailPaneSize: 60 });

    expect(storage.setItem).toHaveBeenCalledWith(
      STORAGE_KEY,
      JSON.stringify({ taskListPaneSize: 40, taskDetailPaneSize: 60 })
    );
  });

  test('保存時の例外も捕捉される', () => {
    storage.setItem.mockImplementationOnce(() => {
      throw new Error('quota exceeded');
    });

    store.savePreferences({ taskListPaneSize: 40, taskDetailPaneSize: 60 });

    expect(consoleWarnSpy).toHaveBeenCalledWith(
      'Failed to save layout preferences:',
      expect.any(Error)
    );
  });

  test('updatePreferencesで値を更新し保存する', () => {
    const updated = store.updatePreferences({ taskListPaneSize: 55 });

    expect(updated).toEqual({ taskListPaneSize: 55, taskDetailPaneSize: 70 });
    expect(storage.setItem).toHaveBeenCalledWith(
      STORAGE_KEY,
      JSON.stringify({ taskListPaneSize: 55, taskDetailPaneSize: 70 })
    );
  });

  test('updatePaneSizesで両方のサイズを更新する', () => {
    const updated = store.updatePaneSizes(20, 80);

    expect(updated).toEqual({ taskListPaneSize: 20, taskDetailPaneSize: 80 });
    expect(storage.setItem).toHaveBeenCalledWith(
      STORAGE_KEY,
      JSON.stringify({ taskListPaneSize: 20, taskDetailPaneSize: 80 })
    );
  });
});
