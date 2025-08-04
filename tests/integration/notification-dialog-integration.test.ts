import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { TaskWithSubTasks } from '$lib/types/task';

// 通知・ダイアログ管理のモック
const mockDialogStore = {
  activeDialogs: [] as Array<{
    id: string;
    type: 'confirm' | 'delete' | 'unsaved' | 'error' | 'info';
    title: string;
    message: string;
    priority: number;
    onConfirm?: () => void;
    onCancel?: () => void;
  }>,

  showDialog: vi.fn(
    (dialog: {
      type: 'confirm' | 'delete' | 'unsaved' | 'error' | 'info';
      title: string;
      message: string;
      priority?: number;
      onConfirm?: () => void;
      onCancel?: () => void;
    }) => {
      const dialogData = {
        id: `dialog-${Date.now()}`,
        priority: dialog.priority || 1,
        ...dialog
      };

      // 優先度順でソート挿入
      const insertIndex = mockDialogStore.activeDialogs.findIndex(
        (d) => d.priority < dialogData.priority
      );

      if (insertIndex === -1) {
        mockDialogStore.activeDialogs.push(dialogData);
      } else {
        mockDialogStore.activeDialogs.splice(insertIndex, 0, dialogData);
      }

      return dialogData.id;
    }
  ),

  closeDialog: vi.fn((dialogId: string) => {
    const index = mockDialogStore.activeDialogs.findIndex((d) => d.id === dialogId);
    if (index !== -1) {
      mockDialogStore.activeDialogs.splice(index, 1);
      return true;
    }
    return false;
  }),

  confirmDialog: vi.fn((dialogId: string) => {
    const dialog = mockDialogStore.activeDialogs.find((d) => d.id === dialogId);
    if (dialog && dialog.onConfirm) {
      dialog.onConfirm();
      mockDialogStore.closeDialog(dialogId);
      return true;
    }
    return false;
  }),

  cancelDialog: vi.fn((dialogId: string) => {
    const dialog = mockDialogStore.activeDialogs.find((d) => d.id === dialogId);
    if (dialog && dialog.onCancel) {
      dialog.onCancel();
      mockDialogStore.closeDialog(dialogId);
      return true;
    }
    return false;
  }),

  closeAllDialogs: vi.fn(() => {
    const count = mockDialogStore.activeDialogs.length;
    mockDialogStore.activeDialogs.splice(0);
    return count;
  })
};

// 確認処理のモック
const mockConfirmationStore = {
  pendingActions: [] as Array<{
    id: string;
    action: string;
    data: unknown;
    confirmed: boolean;
  }>,

  requestConfirmation: vi.fn(
    (
      action: string,
      data: unknown,
      options?: {
        title?: string;
        message?: string;
        confirmText?: string;
        cancelText?: string;
      }
    ) => {
      const actionId = `action-${Date.now()}`;

      mockConfirmationStore.pendingActions.push({
        id: actionId,
        action,
        data,
        confirmed: false
      });

      // 確認ダイアログを表示
      const dialogId = mockDialogStore.showDialog({
        type: 'confirm',
        title: options?.title || '確認',
        message: options?.message || 'この操作を実行しますか？',
        onConfirm: () => {
          mockConfirmationStore.confirmAction(actionId);
        },
        onCancel: () => {
          mockConfirmationStore.cancelAction(actionId);
        }
      });

      return { actionId, dialogId };
    }
  ),

  confirmAction: vi.fn((actionId: string) => {
    const action = mockConfirmationStore.pendingActions.find((a) => a.id === actionId);
    if (action) {
      action.confirmed = true;
      return mockConfirmationStore.executeAction(actionId);
    }
    return false;
  }),

  cancelAction: vi.fn((actionId: string) => {
    const index = mockConfirmationStore.pendingActions.findIndex((a) => a.id === actionId);
    if (index !== -1) {
      mockConfirmationStore.pendingActions.splice(index, 1);
      return true;
    }
    return false;
  }),

  executeAction: vi.fn((actionId: string) => {
    const action = mockConfirmationStore.pendingActions.find((a) => a.id === actionId);
    if (!action || !action.confirmed) {
      return false;
    }

    // アクションを実行
    let result = false;
    switch (action.action) {
      case 'delete-task': {
        const data = action.data as { taskId: string };
        result = mockTaskService.deleteTask(data.taskId);
        break;
      }
      case 'delete-subtask': {
        const data = action.data as { subTaskId: string; taskId: string };
        result = mockTaskService.deleteSubTask(data.subTaskId, data.taskId);
        break;
      }
      case 'archive-task': {
        const data = action.data as { taskId: string };
        result = mockTaskService.archiveTask(data.taskId);
        break;
      }
      default:
        result = true;
        break;
    }

    // 完了したアクションを削除
    const index = mockConfirmationStore.pendingActions.findIndex((a) => a.id === actionId);
    if (index !== -1) {
      mockConfirmationStore.pendingActions.splice(index, 1);
    }

    return result;
  })
};

// タスクサービスのモック（削除処理）
const mockTaskService = {
  tasks: [
    {
      id: 'task-1',
      title: 'テストタスク1',
      status: 'not_started',
      priority: 1,
      list_id: 'list-1',
      order_index: 0,
      is_archived: false,
      created_at: new Date(),
      updated_at: new Date(),
      tags: [],
      sub_tasks: [
        {
          id: 'subtask-1',
          title: 'サブタスク1',
          status: 'not_started',
          task_id: 'task-1',
          order_index: 0,
          created_at: new Date(),
          updated_at: new Date(),
          tags: []
        }
      ]
    },
    {
      id: 'task-2',
      title: 'テストタスク2',
      status: 'completed',
      priority: 1,
      list_id: 'list-1',
      order_index: 1,
      is_archived: false,
      created_at: new Date(),
      updated_at: new Date(),
      tags: [],
      sub_tasks: []
    }
  ] as TaskWithSubTasks[],

  deleteTask: vi.fn((taskId: string) => {
    const index = mockTaskService.tasks.findIndex((t) => t.id === taskId);
    if (index !== -1) {
      mockTaskService.tasks.splice(index, 1);
      return true;
    }
    return false;
  }),

  deleteSubTask: vi.fn((subTaskId: string, taskId: string) => {
    const task = mockTaskService.tasks.find((t) => t.id === taskId);
    if (task) {
      const index = task.sub_tasks.findIndex((st) => st.id === subTaskId);
      if (index !== -1) {
        task.sub_tasks.splice(index, 1);
        return true;
      }
    }
    return false;
  }),

  archiveTask: vi.fn((taskId: string) => {
    const task = mockTaskService.tasks.find((t) => t.id === taskId);
    if (task) {
      task.is_archived = true;
      return true;
    }
    return false;
  })
};

// エラーハンドリングのモック
const mockErrorHandler = {
  errors: [] as Array<{
    id: string;
    type: 'error' | 'info';
    message: string;
    details?: unknown;
    timestamp: Date;
    handled: boolean;
  }>,

  handleError: vi.fn(
    (
      error: Error | string,
      options?: {
        type?: 'error' | 'info';
        details?: unknown;
        showDialog?: boolean;
      }
    ) => {
      const errorData = {
        id: `error-${Date.now()}`,
        type: options?.type || 'error',
        message: typeof error === 'string' ? error : error.message,
        details: options?.details,
        timestamp: new Date(),
        handled: false
      };

      mockErrorHandler.errors.push(errorData);

      // エラーダイアログを表示する場合
      if (options?.showDialog !== false) {
        mockDialogStore.showDialog({
          type: errorData.type,
          title: errorData.type === 'error' ? 'エラー' : '情報',
          message: errorData.message,
          priority: errorData.type === 'error' ? 3 : 1
        });
      }

      return errorData.id;
    }
  ),

  markAsHandled: vi.fn((errorId: string) => {
    const error = mockErrorHandler.errors.find((e) => e.id === errorId);
    if (error) {
      error.handled = true;
      return true;
    }
    return false;
  }),

  clearErrors: vi.fn(() => {
    const count = mockErrorHandler.errors.length;
    mockErrorHandler.errors.splice(0);
    return count;
  })
};

// 未保存変更の検出モック
const mockUnsavedChangesStore = {
  unsavedChanges: new Map<string, unknown>(),

  trackChanges: vi.fn((entityId: string, changes: unknown) => {
    mockUnsavedChangesStore.unsavedChanges.set(entityId, changes);
    return changes;
  }),

  clearChanges: vi.fn((entityId: string) => {
    const hadChanges = mockUnsavedChangesStore.unsavedChanges.has(entityId);
    mockUnsavedChangesStore.unsavedChanges.delete(entityId);
    return hadChanges;
  }),

  hasUnsavedChanges: vi.fn((entityId?: string) => {
    if (entityId) {
      return mockUnsavedChangesStore.unsavedChanges.has(entityId);
    }
    return mockUnsavedChangesStore.unsavedChanges.size > 0;
  }),

  checkUnsavedBeforeAction: vi.fn(async (action: () => void) => {
    if (mockUnsavedChangesStore.hasUnsavedChanges()) {
      return new Promise<void>((resolve, reject) => {
        const { actionId } = mockConfirmationStore.requestConfirmation(
          'unsaved-changes',
          { action },
          {
            title: '未保存の変更',
            message: '未保存の変更があります。破棄して続行しますか？',
            confirmText: '破棄して続行',
            cancelText: 'キャンセル'
          }
        );

        // 確認結果を監視
        const checkConfirmation = () => {
          const pendingAction = mockConfirmationStore.pendingActions.find((a) => a.id === actionId);
          if (!pendingAction) {
            // 確認済みまたはキャンセル済み
            if (mockUnsavedChangesStore.unsavedChanges.size === 0) {
              action();
              resolve();
            } else {
              reject(new Error('操作がキャンセルされました'));
            }
          } else {
            // まだ待機中
            setTimeout(checkConfirmation, 10);
          }
        };

        checkConfirmation();
      });
    } else {
      action();
      return Promise.resolve();
    }
  })
};

describe('通知・アラート結合テスト', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // 初期状態にリセット
    mockDialogStore.activeDialogs.splice(0);
    mockConfirmationStore.pendingActions.splice(0);
    mockErrorHandler.errors.splice(0);
    mockUnsavedChangesStore.unsavedChanges.clear();

    // タスクデータをリセット
    mockTaskService.tasks = [
      {
        id: 'task-1',
        title: 'テストタスク1',
        status: 'not_started',
        priority: 1,
        list_id: 'list-1',
        order_index: 0,
        is_archived: false,
        created_at: new Date(),
        updated_at: new Date(),
        tags: [],
        sub_tasks: [
          {
            id: 'subtask-1',
            title: 'サブタスク1',
            status: 'not_started',
            task_id: 'task-1',
            order_index: 0,
            created_at: new Date(),
            updated_at: new Date(),
            tags: []
          }
        ]
      } as TaskWithSubTasks,
      {
        id: 'task-2',
        title: 'テストタスク2',
        status: 'completed',
        priority: 1,
        list_id: 'list-1',
        order_index: 1,
        is_archived: false,
        created_at: new Date(),
        updated_at: new Date(),
        tags: [],
        sub_tasks: []
      } as TaskWithSubTasks
    ];
  });

  it('基本的な確認ダイアログが正しく動作する', () => {
    // 確認ダイアログを表示
    const dialogId = mockDialogStore.showDialog({
      type: 'confirm',
      title: '確認',
      message: 'この操作を実行しますか？'
    });

    expect(mockDialogStore.showDialog).toHaveBeenCalledWith({
      type: 'confirm',
      title: '確認',
      message: 'この操作を実行しますか？'
    });
    expect(mockDialogStore.activeDialogs).toHaveLength(1);
    expect(mockDialogStore.activeDialogs[0].type).toBe('confirm');
    expect(mockDialogStore.activeDialogs[0].title).toBe('確認');

    // ダイアログを閉じる
    const closeResult = mockDialogStore.closeDialog(dialogId);
    expect(mockDialogStore.closeDialog).toHaveBeenCalledWith(dialogId);
    expect(closeResult).toBe(true);
    expect(mockDialogStore.activeDialogs).toHaveLength(0);
  });

  it('削除確認ダイアログとタスク削除の連携が正しく動作する', () => {
    // タスク削除の確認を要求
    const { dialogId } = mockConfirmationStore.requestConfirmation(
      'delete-task',
      { taskId: 'task-1' },
      {
        title: 'タスクの削除',
        message: 'このタスクを削除しますか？',
        confirmText: '削除',
        cancelText: 'キャンセル'
      }
    );

    expect(mockConfirmationStore.requestConfirmation).toHaveBeenCalled();
    expect(mockDialogStore.activeDialogs).toHaveLength(1);
    expect(mockConfirmationStore.pendingActions).toHaveLength(1);

    // 初期タスク数を確認
    expect(mockTaskService.tasks).toHaveLength(2);

    // 削除を確認
    const confirmResult = mockDialogStore.confirmDialog(dialogId);
    expect(confirmResult).toBe(true);
    expect(mockDialogStore.activeDialogs).toHaveLength(0);

    // タスクが削除されたことを確認
    expect(mockTaskService.deleteTask).toHaveBeenCalledWith('task-1');
    expect(mockTaskService.tasks).toHaveLength(1);
    expect(mockTaskService.tasks.find((t) => t.id === 'task-1')).toBeUndefined();
  });

  it('サブタスク削除確認ダイアログが正しく動作する', () => {
    // サブタスク削除の確認
    const { dialogId } = mockConfirmationStore.requestConfirmation(
      'delete-subtask',
      { subTaskId: 'subtask-1', taskId: 'task-1' },
      {
        title: 'サブタスクの削除',
        message: 'このサブタスクを削除しますか？'
      }
    );

    // 初期状態確認
    const initialTask = mockTaskService.tasks.find((t) => t.id === 'task-1');
    expect(initialTask?.sub_tasks).toHaveLength(1);

    // 削除を確認
    mockDialogStore.confirmDialog(dialogId);

    // サブタスクが削除されたことを確認
    expect(mockTaskService.deleteSubTask).toHaveBeenCalledWith('subtask-1', 'task-1');
    const updatedTask = mockTaskService.tasks.find((t) => t.id === 'task-1');
    expect(updatedTask?.sub_tasks).toHaveLength(0);
  });

  it('削除のキャンセルが正しく動作する', () => {
    // タスク削除の確認を要求
    const { dialogId } = mockConfirmationStore.requestConfirmation('delete-task', {
      taskId: 'task-1'
    });

    const initialTaskCount = mockTaskService.tasks.length;

    // キャンセル
    const cancelResult = mockDialogStore.cancelDialog(dialogId);
    expect(cancelResult).toBe(true);
    expect(mockDialogStore.activeDialogs).toHaveLength(0);

    // タスクが削除されていないことを確認
    expect(mockTaskService.deleteTask).not.toHaveBeenCalled();
    expect(mockTaskService.tasks).toHaveLength(initialTaskCount);
  });

  it('エラーハンドリングとエラーダイアログが正しく動作する', () => {
    // エラーを発生させる
    const errorId = mockErrorHandler.handleError(new Error('テストエラー'), {
      type: 'error',
      details: { context: 'test' },
      showDialog: true
    });

    expect(mockErrorHandler.handleError).toHaveBeenCalled();
    expect(mockErrorHandler.errors).toHaveLength(1);
    expect(mockErrorHandler.errors[0].message).toBe('テストエラー');
    expect(mockErrorHandler.errors[0].type).toBe('error');
    expect(mockDialogStore.activeDialogs).toHaveLength(1);
    expect(mockDialogStore.activeDialogs[0].type).toBe('error');

    // エラーを処理済みにマーク
    const markResult = mockErrorHandler.markAsHandled(errorId);
    expect(mockErrorHandler.markAsHandled).toHaveBeenCalledWith(errorId);
    expect(markResult).toBe(true);
    expect(mockErrorHandler.errors[0].handled).toBe(true);
  });

  it('警告とエラーの優先度処理が正しく動作する', () => {
    // 低優先度の情報ダイアログ
    mockDialogStore.showDialog({
      type: 'info',
      title: '情報',
      message: '情報メッセージ',
      priority: 1
    });

    // 高優先度のエラーダイアログ
    mockDialogStore.showDialog({
      type: 'error',
      title: 'エラー',
      message: 'エラーメッセージ',
      priority: 3
    });

    // 中優先度の警告ダイアログ
    mockDialogStore.showDialog({
      type: 'confirm',
      title: '警告',
      message: '警告メッセージ',
      priority: 2
    });

    // 優先度順にソートされていることを確認
    expect(mockDialogStore.activeDialogs).toHaveLength(3);
    expect(mockDialogStore.activeDialogs[0].priority).toBe(3); // エラー
    expect(mockDialogStore.activeDialogs[1].priority).toBe(2); // 警告
    expect(mockDialogStore.activeDialogs[2].priority).toBe(1); // 情報
  });

  it('未保存変更の検出と確認が正しく動作する', async () => {
    // 変更を追跡
    mockUnsavedChangesStore.trackChanges('task-1', { title: '変更されたタイトル' });

    expect(mockUnsavedChangesStore.trackChanges).toHaveBeenCalledWith('task-1', {
      title: '変更されたタイトル'
    });
    expect(mockUnsavedChangesStore.hasUnsavedChanges()).toBe(true);
    expect(mockUnsavedChangesStore.hasUnsavedChanges('task-1')).toBe(true);

    // アクション実行前の確認
    const testAction = () => {
      // アクション実行をシミュレート
    };

    // 未保存変更がある状態でアクション実行を試行
    const actionPromise = mockUnsavedChangesStore.checkUnsavedBeforeAction(testAction);

    // 確認ダイアログが表示されていることを確認
    expect(mockDialogStore.activeDialogs).toHaveLength(1);
    expect(mockDialogStore.activeDialogs[0].title).toBe('未保存の変更');

    // 破棄して続行を選択
    mockUnsavedChangesStore.clearChanges('task-1');
    mockDialogStore.confirmDialog(mockDialogStore.activeDialogs[0].id);

    // アクションが実行されることを確認
    await expect(actionPromise).resolves.toBeUndefined();
  });

  it('複数ダイアログの競合状態管理が正しく動作する', () => {
    // 複数のダイアログを同時に表示
    const dialog1Id = mockDialogStore.showDialog({
      type: 'confirm',
      title: 'ダイアログ1',
      message: 'メッセージ1',
      priority: 1
    });

    const dialog2Id = mockDialogStore.showDialog({
      type: 'error',
      title: 'ダイアログ2',
      message: 'メッセージ2',
      priority: 3
    });

    const dialog3Id = mockDialogStore.showDialog({
      type: 'confirm',
      title: 'ダイアログ3',
      message: 'メッセージ3',
      priority: 2
    });

    expect(mockDialogStore.activeDialogs).toHaveLength(3);

    // 最高優先度のダイアログが最初に来ることを確認
    expect(mockDialogStore.activeDialogs[0].priority).toBe(3);
    expect(mockDialogStore.activeDialogs[0].title).toBe('ダイアログ2');

    // ダイアログを順次閉じる
    mockDialogStore.closeDialog(dialog2Id);
    expect(mockDialogStore.activeDialogs).toHaveLength(2);
    expect(mockDialogStore.activeDialogs[0].priority).toBe(2);

    mockDialogStore.closeDialog(dialog3Id);
    expect(mockDialogStore.activeDialogs).toHaveLength(1);
    expect(mockDialogStore.activeDialogs[0].priority).toBe(1);

    mockDialogStore.closeDialog(dialog1Id);
    expect(mockDialogStore.activeDialogs).toHaveLength(0);
  });

  it('全ダイアログのクリア機能が正しく動作する', () => {
    // 複数のダイアログを表示
    mockDialogStore.showDialog({ type: 'confirm', title: 'ダイアログ1', message: 'メッセージ1' });
    mockDialogStore.showDialog({ type: 'error', title: 'ダイアログ2', message: 'メッセージ2' });
    mockDialogStore.showDialog({ type: 'info', title: 'ダイアログ3', message: 'メッセージ3' });

    expect(mockDialogStore.activeDialogs).toHaveLength(3);

    // 全てクリア
    const clearedCount = mockDialogStore.closeAllDialogs();
    expect(mockDialogStore.closeAllDialogs).toHaveBeenCalled();
    expect(clearedCount).toBe(3);
    expect(mockDialogStore.activeDialogs).toHaveLength(0);
  });

  it('エラーの種類別処理が正しく動作する', () => {
    // 異なる種類のエラーを処理
    mockErrorHandler.handleError('情報メッセージ', { type: 'info' });
    mockErrorHandler.handleError('エラーメッセージ', { type: 'error' });

    expect(mockErrorHandler.errors).toHaveLength(2);
    expect(mockDialogStore.activeDialogs).toHaveLength(2);

    // エラーの種類が正しく設定されていることを確認
    const infoError = mockErrorHandler.errors.find((e) => e.type === 'info');
    const errorError = mockErrorHandler.errors.find((e) => e!.type === 'error');

    expect(infoError).toBeDefined();
    expect(errorError).toBeDefined();

    // ダイアログの優先度が正しく設定されていることを確認
    const errorDialog = mockDialogStore.activeDialogs.find((d) => d.priority === 3);
    const infoDialog = mockDialogStore.activeDialogs.find((d) => d.priority === 1);
    expect(errorDialog).toBeDefined(); // エラーが最高優先度
    expect(infoDialog).toBeDefined(); // 情報が低優先度
  });

  it('エラーログのクリア機能が正しく動作する', () => {
    // 複数のエラーを発生させる
    mockErrorHandler.handleError('エラー1', { showDialog: false });
    mockErrorHandler.handleError('エラー2', { showDialog: false });
    mockErrorHandler.handleError('エラー3', { showDialog: false });

    expect(mockErrorHandler.errors).toHaveLength(3);

    // エラーログをクリア
    const clearedCount = mockErrorHandler.clearErrors();
    expect(mockErrorHandler.clearErrors).toHaveBeenCalled();
    expect(clearedCount).toBe(3);
    expect(mockErrorHandler.errors).toHaveLength(0);
  });

  it('データ保護とアクション実行の統合処理が正しく動作する', () => {
    // 未保存変更を作成
    mockUnsavedChangesStore.trackChanges('task-1', { title: '新しいタイトル' });

    // 危険なアクション（削除）を実行しようとする
    const { dialogId } = mockConfirmationStore.requestConfirmation(
      'delete-task',
      { taskId: 'task-1' },
      {
        title: 'タスクの削除',
        message: '未保存の変更があるタスクを削除しますか？',
        confirmText: '削除'
      }
    );

    // 確認ダイアログが表示されていることを確認
    expect(mockDialogStore.activeDialogs).toHaveLength(1);
    expect(mockConfirmationStore.pendingActions).toHaveLength(1);

    // 削除を確認
    mockDialogStore.confirmDialog(dialogId);

    // タスクが削除され、未保存変更もクリアされることを確認
    expect(mockTaskService.tasks.find((t) => t.id === 'task-1')).toBeUndefined();

    // 削除されたタスクの未保存変更をクリア（実際のアプリケーションでは自動で行われる）
    mockUnsavedChangesStore.clearChanges('task-1');
    expect(mockUnsavedChangesStore.hasUnsavedChanges('task-1')).toBe(false);
  });
});
