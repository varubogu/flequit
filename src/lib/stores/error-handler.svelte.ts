import { SvelteDate } from 'svelte/reactivity';

export interface ErrorInfo {
  id: string;
  type: 'sync' | 'validation' | 'network' | 'general';
  message: string;
  details?: string;
  retryable: boolean;
  timestamp: SvelteDate;
  context?: {
    operation?: string;
    resourceId?: string;
    resourceType?: 'project' | 'taskList' | 'task' | 'subtask';
  };
}

export class ErrorHandler {
  errors = $state<ErrorInfo[]>([]);

  addError(error: Omit<ErrorInfo, 'id' | 'timestamp'>): string {
    const errorInfo: ErrorInfo = {
      ...error,
      id: crypto.randomUUID(),
      timestamp: new SvelteDate()
    };

    this.errors.push(errorInfo);

    // 5秒後に自動的にエラーを削除（retryableでない場合）
    if (!errorInfo.retryable) {
      setTimeout(() => {
        this.removeError(errorInfo.id);
      }, 5000);
    }

    return errorInfo.id;
  }

  removeError(errorId: string) {
    const index = this.errors.findIndex((e) => e.id === errorId);
    if (index !== -1) {
      this.errors.splice(index, 1);
    }
  }

  clearAllErrors() {
    this.errors = [];
  }

  getErrorsByType(type: ErrorInfo['type']): ErrorInfo[] {
    return this.errors.filter((e) => e.type === type);
  }

  hasErrors(): boolean {
    return this.errors.length > 0;
  }

  hasSyncErrors(): boolean {
    return this.errors.some((e) => e.type === 'sync');
  }

  // 同期エラー用のヘルパー
  addSyncError(
    operation: string,
    resourceType: string,
    resourceId: string,
    originalError: unknown
  ): string {
    const message = `${operation}の同期に失敗しました`;
    let details = '';

    if (originalError instanceof Error) {
      details = originalError.message;
    } else {
      details = String(originalError);
    }

    return this.addError({
      type: 'sync',
      message,
      details,
      retryable: true,
      context: {
        operation,
        resourceId,
        resourceType: resourceType as 'project' | 'taskList' | 'task' | 'subtask'
      }
    });
  }

  // バリデーションエラー用のヘルパー
  addValidationError(message: string, details?: string): string {
    return this.addError({
      type: 'validation',
      message,
      details,
      retryable: false
    });
  }

  // ネットワークエラー用のヘルパー
  addNetworkError(operation: string, originalError: unknown): string {
    let details = '';
    if (originalError instanceof Error) {
      details = originalError.message;
    } else {
      details = String(originalError);
    }

    return this.addError({
      type: 'network',
      message: `ネットワークエラー: ${operation}`,
      details,
      retryable: true,
      context: { operation }
    });
  }

  // リトライ機能
  async retryOperation(errorId: string, retryFunction: () => Promise<void>): Promise<boolean> {
    const error = this.errors.find((e) => e.id === errorId);
    if (!error || !error.retryable) {
      return false;
    }

    try {
      await retryFunction();
      this.removeError(errorId);
      return true;
    } catch (retryError) {
      // リトライ失敗時は新しいエラーとして追加
      if (error.context) {
        this.addSyncError(
          error.context.operation || 'リトライ操作',
          error.context.resourceType || 'unknown',
          error.context.resourceId || 'unknown',
          retryError
        );
      }
      return false;
    }
  }

  // すべてのリトライ可能なエラーを再試行
  async retryAllErrors(retryFunctions: Map<string, () => Promise<void>>): Promise<number> {
    const retryableErrors = this.errors.filter((e) => e.retryable);
    let successCount = 0;

    for (const error of retryableErrors) {
      const retryFunction = retryFunctions.get(error.id);
      if (retryFunction) {
        const success = await this.retryOperation(error.id, retryFunction);
        if (success) {
          successCount++;
        }
      }
    }

    return successCount;
  }
}

export const errorHandler = new ErrorHandler();

// グローバルエラーハンドラー
if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
    errorHandler.addError({
      type: 'general',
      message: '予期しないエラーが発生しました',
      details: event.reason?.message || String(event.reason),
      retryable: false
    });
  });

  window.addEventListener('error', (event) => {
    console.error('Unhandled error:', event.error);
    errorHandler.addError({
      type: 'general',
      message: 'アプリケーションエラーが発生しました',
      details: event.error?.message || event.message,
      retryable: false
    });
  });
}
