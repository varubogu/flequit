import { describe, test, expect, beforeEach, vi, afterEach } from 'vitest';
import { autoSaveService } from '../../src/lib/services/auto-save-service';
import { dataService } from '../../src/lib/services/data-service';

// データサービスをモック化
vi.mock('../../src/lib/services/data-service');

describe('AutoSaveService', () => {
  beforeEach(() => {
    // AutoSaveServiceの状態をリセット
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (autoSaveService as any).lastSaveTime = null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (autoSaveService as any).isSaving = false;

    // モックの設定
    vi.mocked(dataService.autoSave).mockResolvedValue();

    // コンソールをモック化
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});

    // 自動保存を有効にリセット
    autoSaveService.enable();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('初期状態', () => {
    test('自動保存が有効になっている', () => {
      expect(autoSaveService.isEnabled).toBe(true);
    });

    test('最後の保存時刻はnull', () => {
      expect(autoSaveService.lastSave).toBeNull();
    });

    test('保存中ではない', () => {
      expect(autoSaveService.saving).toBe(false);
    });
  });

  describe('自動保存の有効/無効切り替え', () => {
    test('disable()で自動保存を無効にできる', () => {
      autoSaveService.disable();
      expect(autoSaveService.isEnabled).toBe(false);
    });

    test('enable()で自動保存を有効にできる', () => {
      autoSaveService.disable();
      autoSaveService.enable();
      expect(autoSaveService.isEnabled).toBe(true);
    });
  });

  describe('performAutoSave', () => {
    test('正常に自動保存が実行される', async () => {
      const beforeSave = new Date();

      await autoSaveService.performAutoSave();

      const afterSave = new Date();

      expect(dataService.autoSave).toHaveBeenCalledOnce();
      expect(autoSaveService.lastSave).not.toBeNull();
      expect(autoSaveService.lastSave!.getTime()).toBeGreaterThanOrEqual(beforeSave.getTime());
      expect(autoSaveService.lastSave!.getTime()).toBeLessThanOrEqual(afterSave.getTime());
      expect(console.log).toHaveBeenCalledWith(
        'Auto-save completed at:',
        autoSaveService.lastSave!.toISOString()
      );
    });

    test('自動保存が無効の場合は実行されない', async () => {
      autoSaveService.disable();

      await autoSaveService.performAutoSave();

      expect(dataService.autoSave).not.toHaveBeenCalled();
      expect(autoSaveService.lastSave).toBeNull();
    });

    test('保存中の場合は実行されない', async () => {
      // 最初の自動保存を開始（完了させない）
      let resolveFirstSave: () => void;
      const firstSavePromise = new Promise<void>((resolve) => {
        resolveFirstSave = resolve;
      });

      vi.mocked(dataService.autoSave).mockReturnValue(firstSavePromise);

      // 最初の保存を開始
      const firstSave = autoSaveService.performAutoSave();
      expect(autoSaveService.saving).toBe(true);

      // 2回目の保存を試行
      await autoSaveService.performAutoSave();

      // dataService.autoSaveは1回だけ呼ばれている（2回目は無視される）
      expect(dataService.autoSave).toHaveBeenCalledOnce();

      // 最初の保存を完了
      resolveFirstSave!();
      await firstSave;

      expect(autoSaveService.saving).toBe(false);
    });

    test('保存でエラーが発生した場合、エラーがスローされる', async () => {
      const error = new Error('Save failed');
      vi.mocked(dataService.autoSave).mockRejectedValue(error);

      await expect(autoSaveService.performAutoSave()).rejects.toThrow('Save failed');

      expect(console.error).toHaveBeenCalledWith('Auto-save failed:', error);
      expect(autoSaveService.saving).toBe(false);
      expect(autoSaveService.lastSave).toBeNull();
    });
  });

  describe('forceSave', () => {
    test('forceSaveはperformAutoSaveを呼び出す', async () => {
      const spy = vi.spyOn(autoSaveService, 'performAutoSave');

      await autoSaveService.forceSave();

      expect(spy).toHaveBeenCalledOnce();
    });
  });
});
