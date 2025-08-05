import { describe, test, expect, beforeEach, vi } from 'vitest';
import { ErrorHandler } from '../../src/lib/stores/error-handler.svelte';

describe('ErrorHandler', () => {
  let errorHandler: ErrorHandler;

  beforeEach(() => {
    errorHandler = new ErrorHandler();
  });

  describe('基本的なエラー管理', () => {
    test('addError should add error with unique ID and timestamp', () => {
      const errorId = errorHandler.addError({
        type: 'general',
        message: 'Test error',
        details: 'Test details',
        retryable: false
      });

      expect(errorId).toBeDefined();
      expect(errorHandler.errors).toHaveLength(1);
      expect(errorHandler.errors[0].id).toBe(errorId);
      expect(errorHandler.errors[0].message).toBe('Test error');
      expect(errorHandler.errors[0].details).toBe('Test details');
      expect(errorHandler.errors[0].retryable).toBe(false);
      expect(errorHandler.errors[0].timestamp).toBeInstanceOf(Date);
    });

    test('removeError should remove error by ID', () => {
      const errorId = errorHandler.addError({
        type: 'general',
        message: 'Test error',
        retryable: false
      });

      expect(errorHandler.errors).toHaveLength(1);

      errorHandler.removeError(errorId);

      expect(errorHandler.errors).toHaveLength(0);
    });

    test('clearAllErrors should remove all errors', () => {
      errorHandler.addError({ type: 'general', message: 'Error 1', retryable: false });
      errorHandler.addError({ type: 'sync', message: 'Error 2', retryable: true });

      expect(errorHandler.errors).toHaveLength(2);

      errorHandler.clearAllErrors();

      expect(errorHandler.errors).toHaveLength(0);
    });

    test('getErrorsByType should filter errors by type', () => {
      errorHandler.addError({ type: 'general', message: 'General error', retryable: false });
      errorHandler.addError({ type: 'sync', message: 'Sync error', retryable: true });
      errorHandler.addError({ type: 'validation', message: 'Validation error', retryable: false });

      const syncErrors = errorHandler.getErrorsByType('sync');
      const generalErrors = errorHandler.getErrorsByType('general');

      expect(syncErrors).toHaveLength(1);
      expect(syncErrors[0].message).toBe('Sync error');
      expect(generalErrors).toHaveLength(1);
      expect(generalErrors[0].message).toBe('General error');
    });

    test('hasErrors should return correct boolean', () => {
      expect(errorHandler.hasErrors()).toBe(false);

      errorHandler.addError({ type: 'general', message: 'Test error', retryable: false });

      expect(errorHandler.hasErrors()).toBe(true);
    });

    test('hasSyncErrors should return correct boolean', () => {
      expect(errorHandler.hasSyncErrors()).toBe(false);

      errorHandler.addError({ type: 'general', message: 'General error', retryable: false });
      expect(errorHandler.hasSyncErrors()).toBe(false);

      errorHandler.addError({ type: 'sync', message: 'Sync error', retryable: true });
      expect(errorHandler.hasSyncErrors()).toBe(true);
    });
  });

  describe('専用エラーヘルパー', () => {
    test('addSyncError should create sync error with context', () => {
      errorHandler.addSyncError('タスク作成', 'task', 'task-123', new Error('Backend failed'));

      expect(errorHandler.errors).toHaveLength(1);
      const error = errorHandler.errors[0];

      expect(error.type).toBe('sync');
      expect(error.message).toBe('タスク作成の同期に失敗しました');
      expect(error.details).toBe('Backend failed');
      expect(error.retryable).toBe(true);
      expect(error.context?.operation).toBe('タスク作成');
      expect(error.context?.resourceType).toBe('task');
      expect(error.context?.resourceId).toBe('task-123');
    });

    test('addSyncError should handle subtask resource type', () => {
      errorHandler.addSyncError('サブタスク更新', 'subtask', 'subtask-456', 'Connection timeout');

      const error = errorHandler.errors[0];
      expect(error.context?.resourceType).toBe('subtask');
      expect(error.context?.resourceId).toBe('subtask-456');
      expect(error.details).toBe('Connection timeout');
    });

    test('addValidationError should create validation error', () => {
      errorHandler.addValidationError('必須項目が入力されていません', 'タイトルは必須です');

      const error = errorHandler.errors[0];
      expect(error.type).toBe('validation');
      expect(error.message).toBe('必須項目が入力されていません');
      expect(error.details).toBe('タイトルは必須です');
      expect(error.retryable).toBe(false);
    });

    test('addNetworkError should create network error', () => {
      errorHandler.addNetworkError('データ取得', new Error('Network timeout'));

      const error = errorHandler.errors[0];
      expect(error.type).toBe('network');
      expect(error.message).toBe('ネットワークエラー: データ取得');
      expect(error.details).toBe('Network timeout');
      expect(error.retryable).toBe(true);
      expect(error.context?.operation).toBe('データ取得');
    });
  });

  describe('リトライ機能', () => {
    test('retryOperation should execute retry function and remove error on success', async () => {
      const retryFunction = vi.fn().mockResolvedValue(undefined);

      const errorId = errorHandler.addError({
        type: 'sync',
        message: 'Sync failed',
        retryable: true
      });

      expect(errorHandler.errors).toHaveLength(1);

      const result = await errorHandler.retryOperation(errorId, retryFunction);

      expect(result).toBe(true);
      expect(retryFunction).toHaveBeenCalledTimes(1);
      expect(errorHandler.errors).toHaveLength(0);
    });

    test('retryOperation should add new error on retry failure', async () => {
      const retryError = new Error('Retry failed');
      const retryFunction = vi.fn().mockRejectedValue(retryError);

      const errorId = errorHandler.addSyncError('テスト操作', 'task', 'task-123', 'Original error');

      expect(errorHandler.errors).toHaveLength(1);

      const result = await errorHandler.retryOperation(errorId, retryFunction);

      expect(result).toBe(false);
      expect(retryFunction).toHaveBeenCalledTimes(1);
      expect(errorHandler.errors).toHaveLength(2); // Original + new retry error

      const retryErrorInfo = errorHandler.errors.find((e) => e.details === 'Retry failed');
      expect(retryErrorInfo).toBeDefined();
    });

    test('retryOperation should return false for non-retryable errors', async () => {
      const retryFunction = vi.fn();

      const errorId = errorHandler.addError({
        type: 'validation',
        message: 'Validation error',
        retryable: false
      });

      const result = await errorHandler.retryOperation(errorId, retryFunction);

      expect(result).toBe(false);
      expect(retryFunction).not.toHaveBeenCalled();
      expect(errorHandler.errors).toHaveLength(1); // Error should remain
    });

    test('retryOperation should return false for non-existent error', async () => {
      const retryFunction = vi.fn();

      const result = await errorHandler.retryOperation('non-existent-id', retryFunction);

      expect(result).toBe(false);
      expect(retryFunction).not.toHaveBeenCalled();
    });

    test('retryAllErrors should retry all retryable errors', async () => {
      const retryFunction1 = vi.fn().mockResolvedValue(undefined);
      const retryFunction2 = vi.fn().mockResolvedValue(undefined);
      const retryFunction3 = vi.fn().mockRejectedValue(new Error('Failed'));

      const errorId1 = errorHandler.addError({ type: 'sync', message: 'Error 1', retryable: true });
      errorHandler.addError({ type: 'validation', message: 'Error 2', retryable: false });
      const errorId3 = errorHandler.addError({
        type: 'network',
        message: 'Error 3',
        retryable: true
      });

      const retryFunctions = new Map([
        [errorId1, retryFunction1],
        [errorId3, retryFunction3]
      ]);

      const successCount = await errorHandler.retryAllErrors(retryFunctions);

      expect(successCount).toBe(1); // Only errorId1 should succeed
      expect(retryFunction1).toHaveBeenCalledTimes(1);
      expect(retryFunction2).not.toHaveBeenCalled(); // Non-retryable error
      expect(retryFunction3).toHaveBeenCalledTimes(1);

      // Should have validation error + failed network retry error
      expect(errorHandler.errors.length).toBeGreaterThan(1);
    });
  });

  describe('自動削除機能', () => {
    test('non-retryable errors should be auto-removed after timeout', async () => {
      vi.useFakeTimers();

      errorHandler.addError({
        type: 'validation',
        message: 'Validation error',
        retryable: false
      });

      expect(errorHandler.errors).toHaveLength(1);

      // Fast-forward time by 5 seconds
      vi.advanceTimersByTime(5000);

      // Wait for setTimeout to execute
      await vi.runAllTimersAsync();

      expect(errorHandler.errors).toHaveLength(0);

      vi.useRealTimers();
    });

    test('retryable errors should not be auto-removed', async () => {
      vi.useFakeTimers();

      errorHandler.addError({
        type: 'sync',
        message: 'Sync error',
        retryable: true
      });

      expect(errorHandler.errors).toHaveLength(1);

      // Fast-forward time by 5 seconds
      vi.advanceTimersByTime(5000);
      await vi.runAllTimersAsync();

      expect(errorHandler.errors).toHaveLength(1); // Should still be there

      vi.useRealTimers();
    });
  });
});
