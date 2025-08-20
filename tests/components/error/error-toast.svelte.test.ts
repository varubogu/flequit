import { describe, it, expect, beforeEach } from 'vitest';
import { errorHandler } from '$lib/stores/error-handler.svelte';

// Test the ErrorToast functionality through error handler store
describe('ErrorToast (Store Integration)', () => {
  beforeEach(() => {
    // Clear all errors before each test
    errorHandler.clearAllErrors();
  });

  describe('ErrorToast Logic Functions', () => {
    // Test the logic functions that would be used in the ErrorToast component

    function getIcon(type: 'sync' | 'validation' | 'network' | 'general') {
      switch (type) {
        case 'sync':
          return 'RefreshCw';
        case 'network':
          return 'Wifi';
        case 'validation':
          return 'AlertTriangle';
        default:
          return 'AlertCircle';
      }
    }

    function getBgColor(type: 'sync' | 'validation' | 'network' | 'general') {
      switch (type) {
        case 'validation':
          return 'bg-destructive/10 border-destructive/20 text-destructive';
        case 'network':
          return 'bg-yellow-50 border-yellow-200 text-yellow-800 dark:bg-yellow-900/10 dark:border-yellow-700 dark:text-yellow-300';
        case 'sync':
          return 'bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-900/10 dark:border-blue-700 dark:text-blue-300';
        default:
          return 'bg-destructive/10 border-destructive/20 text-destructive';
      }
    }

    function handleDismiss(errorId: string) {
      errorHandler.removeError(errorId);
    }

    function handleRetry(errorId: string) {
      // リトライ機能は将来的に実装
      handleDismiss(errorId);
    }

    it('should return correct icon for validation errors', () => {
      expect(getIcon('validation')).toBe('AlertTriangle');
    });

    it('should return correct icon for network errors', () => {
      expect(getIcon('network')).toBe('Wifi');
    });

    it('should return correct icon for sync errors', () => {
      expect(getIcon('sync')).toBe('RefreshCw');
    });

    it('should return correct icon for general errors', () => {
      expect(getIcon('general')).toBe('AlertCircle');
    });

    it('should return correct background color for validation errors', () => {
      const color = getBgColor('validation');
      expect(color).toBe('bg-destructive/10 border-destructive/20 text-destructive');
    });

    it('should return correct background color for network errors', () => {
      const color = getBgColor('network');
      expect(color).toBe(
        'bg-yellow-50 border-yellow-200 text-yellow-800 dark:bg-yellow-900/10 dark:border-yellow-700 dark:text-yellow-300'
      );
    });

    it('should return correct background color for sync errors', () => {
      const color = getBgColor('sync');
      expect(color).toBe(
        'bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-900/10 dark:border-blue-700 dark:text-blue-300'
      );
    });

    it('should return correct background color for general errors', () => {
      const color = getBgColor('general');
      expect(color).toBe('bg-destructive/10 border-destructive/20 text-destructive');
    });

    it('should remove error when handleDismiss is called', () => {
      const errorId = errorHandler.addError({
        type: 'validation',
        message: 'Test error',
        retryable: false
      });

      expect(errorHandler.errors.length).toBe(1);

      handleDismiss(errorId);

      expect(errorHandler.errors.length).toBe(0);
    });

    it('should remove error when handleRetry is called', () => {
      const errorId = errorHandler.addError({
        type: 'network',
        message: 'Network error',
        retryable: true
      });

      expect(errorHandler.errors.length).toBe(1);

      handleRetry(errorId);

      expect(errorHandler.errors.length).toBe(0);
    });
  });

  describe('Error Information Display', () => {
    it('should handle error with all information fields', () => {
      errorHandler.addError({
        type: 'validation',
        message: 'Field validation failed',
        details: 'Email address is required',
        retryable: false,
        context: {
          operation: 'create_user',
          resourceType: 'task',
          resourceId: 'task-789'
        }
      });

      const error = errorHandler.errors[0];

      expect(error.type).toBe('validation');
      expect(error.message).toBe('Field validation failed');
      expect(error.details).toBe('Email address is required');
      expect(error.retryable).toBe(false);
      expect(error.context?.operation).toBe('create_user');
      expect(error.context?.resourceType).toBe('task');
      expect(error.context?.resourceId).toBe('task-789');
    });

    it('should handle error with minimal information', () => {
      errorHandler.addError({
        type: 'general',
        message: 'Something went wrong',
        retryable: false
      });

      const error = errorHandler.errors[0];

      expect(error.type).toBe('general');
      expect(error.message).toBe('Something went wrong');
      expect(error.retryable).toBe(false);
      expect(error.details).toBeUndefined();
      expect(error.context).toBeUndefined();
    });

    it('should handle retryable network error', () => {
      errorHandler.addError({
        type: 'network',
        message: 'Connection timeout',
        details: 'Unable to reach server',
        retryable: true,
        context: {
          operation: 'sync_data'
        }
      });

      const error = errorHandler.errors[0];

      expect(error.type).toBe('network');
      expect(error.message).toBe('Connection timeout');
      expect(error.details).toBe('Unable to reach server');
      expect(error.retryable).toBe(true);
      expect(error.context?.operation).toBe('sync_data');
    });

    it('should handle sync error with context', () => {
      errorHandler.addError({
        type: 'sync',
        message: 'Sync conflict detected',
        details: 'Local and remote versions differ',
        retryable: true,
        context: {
          operation: 'sync_tasks',
          resourceType: 'task',
          resourceId: 'task-conflict-123'
        }
      });

      const error = errorHandler.errors[0];

      expect(error.type).toBe('sync');
      expect(error.message).toBe('Sync conflict detected');
      expect(error.details).toBe('Local and remote versions differ');
      expect(error.retryable).toBe(true);
      expect(error.context?.operation).toBe('sync_tasks');
      expect(error.context?.resourceType).toBe('task');
      expect(error.context?.resourceId).toBe('task-conflict-123');
    });
  });

  describe('Error Interaction Patterns', () => {
    it('should handle multiple errors with different properties', () => {
      errorHandler.addError({
        type: 'validation',
        message: 'Validation error',
        retryable: false
      });

      const errorId2 = errorHandler.addError({
        type: 'network',
        message: 'Network error',
        retryable: true
      });

      errorHandler.addError({
        type: 'sync',
        message: 'Sync error',
        retryable: true
      });

      expect(errorHandler.errors.length).toBe(3);

      // Remove the network error (middle one)
      errorHandler.removeError(errorId2);

      expect(errorHandler.errors.length).toBe(2);
      expect(errorHandler.errors[0].type).toBe('validation');
      expect(errorHandler.errors[1].type).toBe('sync');
    });

    it('should provide consistent timestamps', () => {
      const beforeTime = new Date();

      errorHandler.addError({
        type: 'general',
        message: 'Test error',
        retryable: false
      });

      const afterTime = new Date();
      const error = errorHandler.errors[0];

      expect(error.timestamp.getTime()).toBeGreaterThanOrEqual(beforeTime.getTime());
      expect(error.timestamp.getTime()).toBeLessThanOrEqual(afterTime.getTime());
    });

    it('should generate unique error IDs', () => {
      const errorId1 = errorHandler.addError({
        type: 'validation',
        message: 'Error 1',
        retryable: false
      });

      const errorId2 = errorHandler.addError({
        type: 'validation',
        message: 'Error 2',
        retryable: false
      });

      expect(errorId1).not.toBe(errorId2);
      expect(errorHandler.errors[0].id).toBe(errorId1);
      expect(errorHandler.errors[1].id).toBe(errorId2);
    });
  });
});
