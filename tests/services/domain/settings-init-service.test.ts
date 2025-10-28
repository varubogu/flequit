import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { BackendService } from '$lib/infrastructure/backends';
import type { Setting, Settings } from '$lib/types/settings';
import { buildSetting } from '../../factories/domain';

const createMockBackend = () => ({
  setting: {
    getAll: vi.fn(),
    update: vi.fn()
  },
  settingsManagement: {
    updateSettingsPartially: vi.fn()
  }
});

const createDeferred = <T>() => {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
};

describe('SettingsInitService', () => {
  let settingsInitService: typeof import('$lib/services/domain/settings').settingsInitService;
  let mockBackend: ReturnType<typeof createMockBackend>;

  const setBackend = (backend: BackendService | null) => {
    (settingsInitService as any).allSettings = null;
    (settingsInitService as any).isLoading = false;
    (settingsInitService as any).loadPromise = null;
    (settingsInitService as any).backendPromise = backend ? Promise.resolve(backend) : null;
    (settingsInitService as any).initBackendService = () => {
      if (!backend) {
        return Promise.resolve(null);
      }
      return Promise.resolve(backend);
    };
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    mockBackend = createMockBackend();
    ({ settingsInitService } = await import('$lib/services/domain/settings'));
    settingsInitService.clearCache();
    setBackend(mockBackend as unknown as BackendService);
  });

  afterEach(() => {
    settingsInitService.clearCache();
    vi.clearAllMocks();
  });

  it('getAllSettingsは結果をキャッシュし、複数呼び出しでも1回だけバックエンドを叩く', async () => {
    const allSettings = [buildSetting({ key: 'general.theme' })];
    mockBackend.setting.getAll.mockResolvedValue(allSettings);

    const first = await settingsInitService.getAllSettings();
    const second = await settingsInitService.getAllSettings();

    expect(mockBackend.setting.getAll).toHaveBeenCalledTimes(1);
    expect(second).toBe(first);
  });

  it('getAllSettingsは並列呼び出し時も単一のPromiseを共有する', async () => {
    const deferred = createDeferred<Setting[]>();
    mockBackend.setting.getAll.mockReturnValueOnce(deferred.promise);

    const [firstCall, secondCall] = [
      settingsInitService.getAllSettings(),
      settingsInitService.getAllSettings()
    ];

    const payload = [buildSetting({ key: 'general.weekStart' })];
    deferred.resolve(payload);

    const results = await Promise.all([firstCall, secondCall]);
    expect(mockBackend.setting.getAll).toHaveBeenCalledTimes(1);
    expect(results[0]).toEqual(payload);
    expect(results[1]).toEqual(payload);
  });

  it('clearCache後は再度バックエンドへ問い合わせる', async () => {
    mockBackend.setting.getAll.mockResolvedValueOnce([buildSetting({ key: 'a' })]);
    await settingsInitService.getAllSettings();

    settingsInitService.clearCache();
    setBackend(mockBackend as unknown as BackendService);
    mockBackend.setting.getAll.mockResolvedValueOnce([buildSetting({ key: 'b' })]);
    await settingsInitService.getAllSettings();

    expect(mockBackend.setting.getAll).toHaveBeenCalledTimes(2);
  });

  it('バックエンドが利用できない場合は空配列を返し警告を出す', async () => {
    setBackend(null);
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const result = await settingsInitService.getAllSettings();

    expect(result).toEqual([]);
    expect(warnSpy).toHaveBeenCalledWith('Backend service not available, using empty settings');
    warnSpy.mockRestore();
  });

  it('getAllSettings失敗時はエラーをログ出力し空配列を返す', async () => {
    const error = new Error('boom');
    mockBackend.setting.getAll.mockRejectedValueOnce(error);
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const result = await settingsInitService.getAllSettings();

    expect(result).toEqual([]);
    expect(errorSpy).toHaveBeenCalledWith('Failed to load settings from backends:', error);
    errorSpy.mockRestore();
  });

  it('getSettingByKeyで指定キーの設定を返す', () => {
    const list = [buildSetting({ key: 'general.theme', value: 'dark' })];
    const found = settingsInitService.getSettingByKey(list, 'general.theme');

    expect(found).toEqual(list[0]);
  });

  it('getSettingsByKeyPatternでプレフィックス一致の設定を返す', () => {
    const list = [
      buildSetting({ key: 'general.theme' }),
      buildSetting({ key: 'general.font' }),
      buildSetting({ key: 'notifications.enabled' })
    ];

    const results = settingsInitService.getSettingsByKeyPattern(list, 'general.');

    expect(results).toHaveLength(2);
    expect(results.every((s) => s.key.startsWith('general.'))).toBe(true);
  });

  it('updateSettingsPartiallyはバックエンドに部分更新を委譲する', async () => {
    const partial: Partial<Settings> = { theme: 'dark' };

    await settingsInitService.updateSettingsPartially(partial);

    expect(mockBackend.settingsManagement.updateSettingsPartially).toHaveBeenCalledWith(partial);
  });

  it('updateSettingは単一設定を更新する', async () => {
    const setting = buildSetting();

    await settingsInitService.updateSetting(setting);

    expect(mockBackend.setting.update).toHaveBeenCalledWith(setting);
  });

  it('バックエンド未取得時のupdateSettingsPartiallyは例外を投げる', async () => {
    setBackend(null);

    await expect(settingsInitService.updateSettingsPartially({ theme: 'dark' })).rejects.toThrow(
      'Backend service not available'
    );
  });

  it('バックエンド未取得時のupdateSettingは例外を投げる', async () => {
    setBackend(null);

    await expect(settingsInitService.updateSetting(buildSetting())).rejects.toThrow(
      'Backend service not available'
    );
  });
});
