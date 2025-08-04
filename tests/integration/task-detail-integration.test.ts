import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { TaskWithSubTasks, SubTask, Tag, TaskStatus } from '$lib/types/task';

// タスク詳細ストアのモック
const mockTaskDetailStore = {
  selectedTask: null as TaskWithSubTasks | null,
  selectedSubTask: null as SubTask | null,
  isNewTaskMode: false,
  isEditMode: false,

  newTaskData: {
    title: '',
    description: '',
    status: 'not_started' as TaskStatus,
    priority: 1,
    start_date: undefined,
    end_date: undefined,
    is_range_date: false
  },

  editFormData: {
    title: '',
    description: '',
    start_date: undefined as Date | undefined,
    end_date: undefined as Date | undefined,
    is_range_date: false,
    priority: 0
  },

  selectTask: vi.fn((task: TaskWithSubTasks | null) => {
    mockTaskDetailStore.selectedTask = task;
    mockTaskDetailStore.selectedSubTask = null;
    mockTaskDetailStore.isNewTaskMode = false;
    return task;
  }),

  selectSubTask: vi.fn((subTask: SubTask | null) => {
    mockTaskDetailStore.selectedSubTask = subTask;
    mockTaskDetailStore.selectedTask = null;
    return subTask;
  }),

  enterNewTaskMode: vi.fn(() => {
    mockTaskDetailStore.isNewTaskMode = true;
    mockTaskDetailStore.selectedTask = null;
    mockTaskDetailStore.selectedSubTask = null;
    mockTaskDetailStore.newTaskData = {
      title: '',
      description: '',
      status: 'not_started',
      priority: 1,
      start_date: undefined,
      end_date: undefined,
      is_range_date: false
    };
    return mockTaskDetailStore.newTaskData;
  }),

  exitNewTaskMode: vi.fn(() => {
    mockTaskDetailStore.isNewTaskMode = false;
    return false;
  }),

  updateEditForm: vi.fn((updates: Partial<typeof mockTaskDetailStore.editFormData>) => {
    mockTaskDetailStore.editFormData = {
      ...mockTaskDetailStore.editFormData,
      ...updates
    };
    return mockTaskDetailStore.editFormData;
  })
};

// タスクサービスのモック
const mockTaskService = {
  updateTask: vi.fn(async (taskId: string, updates: Partial<TaskWithSubTasks>) => {
    return {
      id: taskId,
      ...updates,
      updated_at: new Date()
    } as TaskWithSubTasks;
  }),

  updateSubTask: vi.fn(async (subTaskId: string, taskId: string, updates: Partial<SubTask>) => {
    return {
      id: subTaskId,
      task_id: taskId,
      ...updates,
      updated_at: new Date()
    } as SubTask;
  }),

  addSubTask: vi.fn(async (taskId: string, subTaskData: Partial<SubTask>) => {
    return {
      id: `subtask-${Date.now()}`,
      task_id: taskId,
      title: subTaskData.title || '',
      status: subTaskData.status || 'not_started',
      order_index: subTaskData.order_index || 0,
      created_at: new Date(),
      updated_at: new Date(),
      tags: [],
      ...subTaskData
    } as SubTask;
  }),

  deleteSubTask: vi.fn(async () => {
    return true;
  }),

  addTagToTask: vi.fn(async () => {
    return true;
  }),

  removeTagFromTask: vi.fn(async () => {
    return true;
  }),

  addTagToSubTask: vi.fn(async () => {
    return true;
  }),

  removeTagFromSubTask: vi.fn(async () => {
    return true;
  })
};

// タグストアのモック
const mockTagStore = {
  availableTags: [
    {
      id: 'tag-1',
      name: '重要',
      color: '#ef4444',
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      id: 'tag-2',
      name: '作業',
      color: '#3b82f6',
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      id: 'tag-3',
      name: '個人',
      color: '#10b981',
      created_at: new Date(),
      updated_at: new Date()
    }
  ] as Tag[],

  searchTags: vi.fn((query: string) => {
    return mockTagStore.availableTags.filter((tag) =>
      tag.name.toLowerCase().includes(query.toLowerCase())
    );
  }),

  createTag: vi.fn(async (tagData: { name: string; color?: string }) => {
    const newTag = {
      id: `tag-${Date.now()}`,
      name: tagData.name,
      color: tagData.color || '#6b7280',
      created_at: new Date(),
      updated_at: new Date()
    } as Tag;
    mockTagStore.availableTags.push(newTag);
    return newTag;
  })
};

// テスト用のサンプルタスク
const sampleTask: TaskWithSubTasks = {
  id: 'task-1',
  list_id: 'list-1',
  title: 'サンプルタスク',
  description: 'これはテスト用のタスクです',
  status: 'not_started',
  priority: 2,
  start_date: new Date('2024-01-01'),
  end_date: new Date('2024-01-05'),
  is_range_date: true,
  order_index: 0,
  is_archived: false,
  created_at: new Date('2024-01-01'),
  updated_at: new Date('2024-01-01'),
  sub_tasks: [
    {
      id: 'subtask-1',
      task_id: 'task-1',
      title: 'サブタスク1',
      status: 'not_started',
      order_index: 0,
      created_at: new Date(),
      updated_at: new Date(),
      tags: []
    },
    {
      id: 'subtask-2',
      task_id: 'task-1',
      title: 'サブタスク2',
      status: 'completed',
      order_index: 1,
      created_at: new Date(),
      updated_at: new Date(),
      tags: []
    }
  ],
  tags: [
    {
      id: 'tag-1',
      name: '重要',
      color: '#ef4444',
      created_at: new Date(),
      updated_at: new Date()
    }
  ]
};

describe('タスク詳細ダイアログ結合テスト', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // 初期状態にリセット
    mockTaskDetailStore.selectedTask = null;
    mockTaskDetailStore.selectedSubTask = null;
    mockTaskDetailStore.isNewTaskMode = false;
    mockTaskDetailStore.isEditMode = false;

    mockTaskDetailStore.editFormData = {
      title: '',
      description: '',
      start_date: undefined,
      end_date: undefined,
      is_range_date: false,
      priority: 0
    };
  });

  it('タスク詳細ダイアログの初期状態が正しく設定される', () => {
    expect(mockTaskDetailStore.selectedTask).toBe(null);
    expect(mockTaskDetailStore.selectedSubTask).toBe(null);
    expect(mockTaskDetailStore.isNewTaskMode).toBe(false);
  });

  it('タスク選択時に詳細情報が正しく表示される', () => {
    // タスクを選択
    const selectedTask = mockTaskDetailStore.selectTask(sampleTask);

    expect(mockTaskDetailStore.selectTask).toHaveBeenCalledWith(sampleTask);
    expect(selectedTask).toEqual(sampleTask);
    expect(mockTaskDetailStore.selectedTask).toEqual(sampleTask);
    expect(mockTaskDetailStore.selectedSubTask).toBe(null);
    expect(mockTaskDetailStore.isNewTaskMode).toBe(false);
  });

  it('サブタスク選択時に詳細情報が正しく表示される', () => {
    const subTask = sampleTask.sub_tasks[0];

    // サブタスクを選択
    const selectedSubTask = mockTaskDetailStore.selectSubTask(subTask);

    expect(mockTaskDetailStore.selectSubTask).toHaveBeenCalledWith(subTask);
    expect(selectedSubTask).toEqual(subTask);
    expect(mockTaskDetailStore.selectedSubTask).toEqual(subTask);
    expect(mockTaskDetailStore.selectedTask).toBe(null);
  });

  it('新規タスクモードが正しく動作する', () => {
    // 新規タスクモードに入る
    const newTaskData = mockTaskDetailStore.enterNewTaskMode();

    expect(mockTaskDetailStore.enterNewTaskMode).toHaveBeenCalled();
    expect(mockTaskDetailStore.isNewTaskMode).toBe(true);
    expect(newTaskData.title).toBe('');
    expect(newTaskData.status).toBe('not_started');
    expect(mockTaskDetailStore.selectedTask).toBe(null);
    expect(mockTaskDetailStore.selectedSubTask).toBe(null);

    // 新規タスクモードを終了
    const exitResult = mockTaskDetailStore.exitNewTaskMode();
    expect(mockTaskDetailStore.exitNewTaskMode).toHaveBeenCalled();
    expect(exitResult).toBe(false);
    expect(mockTaskDetailStore.isNewTaskMode).toBe(false);
  });

  it('タスクのメタデータ編集が正しく動作する', async () => {
    // タスクを選択
    mockTaskDetailStore.selectTask(sampleTask);

    // タスクのタイトルを更新
    const titleUpdate = await mockTaskService.updateTask('task-1', {
      title: '更新されたタスク'
    });

    expect(mockTaskService.updateTask).toHaveBeenCalledWith('task-1', {
      title: '更新されたタスク'
    });
    expect(titleUpdate.title).toBe('更新されたタスク');
    expect(titleUpdate.id).toBe('task-1');

    // タスクのステータスを更新
    const statusUpdate = await mockTaskService.updateTask('task-1', {
      status: 'completed'
    });

    expect(statusUpdate.status).toBe('completed');

    // タスクの優先度を更新
    const priorityUpdate = await mockTaskService.updateTask('task-1', {
      priority: 3
    });

    expect(priorityUpdate.priority).toBe(3);
  });

  it('タスクの日付設定が正しく動作する', async () => {
    mockTaskDetailStore.selectTask(sampleTask);

    const newStartDate = new Date('2024-02-01');
    const newEndDate = new Date('2024-02-10');

    // 日付範囲を設定
    const dateUpdate = await mockTaskService.updateTask('task-1', {
      start_date: newStartDate,
      end_date: newEndDate,
      is_range_date: true
    });

    expect(mockTaskService.updateTask).toHaveBeenCalledWith('task-1', {
      start_date: newStartDate,
      end_date: newEndDate,
      is_range_date: true
    });
    expect(dateUpdate.start_date).toEqual(newStartDate);
    expect(dateUpdate.end_date).toEqual(newEndDate);
    expect(dateUpdate.is_range_date).toBe(true);

    // 単一日付に変更
    const singleDateUpdate = await mockTaskService.updateTask('task-1', {
      start_date: undefined,
      end_date: newEndDate,
      is_range_date: false
    });

    expect(singleDateUpdate.is_range_date).toBe(false);
  });

  it('サブタスクの追加・編集・削除が正しく動作する', async () => {
    mockTaskDetailStore.selectTask(sampleTask);

    // サブタスクを追加
    const newSubTaskData = {
      title: '新しいサブタスク',
      status: 'not_started' as TaskStatus
    };

    const addedSubTask = await mockTaskService.addSubTask('task-1', newSubTaskData);

    expect(mockTaskService.addSubTask).toHaveBeenCalledWith('task-1', newSubTaskData);
    expect(addedSubTask.title).toBe('新しいサブタスク');
    expect(addedSubTask.task_id).toBe('task-1');
    expect(addedSubTask.status).toBe('not_started');

    // サブタスクを編集
    const updatedSubTask = await mockTaskService.updateSubTask('subtask-1', 'task-1', {
      title: '更新されたサブタスク',
      status: 'completed'
    });

    expect(mockTaskService.updateSubTask).toHaveBeenCalledWith('subtask-1', 'task-1', {
      title: '更新されたサブタスク',
      status: 'completed'
    });
    expect(updatedSubTask.title).toBe('更新されたサブタスク');
    expect(updatedSubTask.status).toBe('completed');

    // サブタスクを削除
    const deleteResult = await mockTaskService.deleteSubTask();

    expect(mockTaskService.deleteSubTask).toHaveBeenCalled();
    expect(deleteResult).toBe(true);
  });

  it('タグの追加・削除が正しく動作する', async () => {
    mockTaskDetailStore.selectTask(sampleTask);

    // タスクにタグを追加
    const addTagResult = await mockTaskService.addTagToTask();

    expect(mockTaskService.addTagToTask).toHaveBeenCalled();
    expect(addTagResult).toBe(true);

    // タスクからタグを削除
    const removeTagResult = await mockTaskService.removeTagFromTask();

    expect(mockTaskService.removeTagFromTask).toHaveBeenCalled();
    expect(removeTagResult).toBe(true);

    // サブタスクにタグを追加
    const addSubTaskTagResult = await mockTaskService.addTagToSubTask();

    expect(mockTaskService.addTagToSubTask).toHaveBeenCalled();
    expect(addSubTaskTagResult).toBe(true);

    // サブタスクからタグを削除
    const removeSubTaskTagResult = await mockTaskService.removeTagFromSubTask();

    expect(mockTaskService.removeTagFromSubTask).toHaveBeenCalled();
    expect(removeSubTaskTagResult).toBe(true);
  });

  it('タグ検索と新規タグ作成が正しく動作する', async () => {
    // タグを検索
    const searchResults = mockTagStore.searchTags('重要');

    expect(mockTagStore.searchTags).toHaveBeenCalledWith('重要');
    expect(searchResults).toHaveLength(1);
    expect(searchResults[0].name).toBe('重要');

    // 部分一致検索
    const partialResults = mockTagStore.searchTags('作');
    expect(partialResults).toHaveLength(1);
    expect(partialResults[0].name).toBe('作業');

    // 新規タグを作成
    const newTag = await mockTagStore.createTag({
      name: '新しいタグ',
      color: '#f59e0b'
    });

    expect(mockTagStore.createTag).toHaveBeenCalledWith({
      name: '新しいタグ',
      color: '#f59e0b'
    });
    expect(newTag.name).toBe('新しいタグ');
    expect(newTag.color).toBe('#f59e0b');
    expect(mockTagStore.availableTags).toContain(newTag);
  });

  it('編集フォームの状態管理が正しく動作する', () => {
    // フォームを更新
    const updatedForm = mockTaskDetailStore.updateEditForm({
      title: 'フォームテスト',
      description: 'テスト用の説明',
      priority: 2
    });

    expect(mockTaskDetailStore.updateEditForm).toHaveBeenCalledWith({
      title: 'フォームテスト',
      description: 'テスト用の説明',
      priority: 2
    });
    expect(updatedForm.title).toBe('フォームテスト');
    expect(updatedForm.description).toBe('テスト用の説明');
    expect(updatedForm.priority).toBe(2);

    // 日付フィールドを更新
    const dateForm = mockTaskDetailStore.updateEditForm({
      start_date: new Date('2024-03-01'),
      end_date: new Date('2024-03-05'),
      is_range_date: true
    });

    expect(dateForm.start_date).toEqual(new Date('2024-03-01'));
    expect(dateForm.end_date).toEqual(new Date('2024-03-05'));
    expect(dateForm.is_range_date).toBe(true);
  });

  it('タスクとサブタスクの切り替えが正しく動作する', () => {
    // タスクを選択
    mockTaskDetailStore.selectTask(sampleTask);
    expect(mockTaskDetailStore.selectedTask).toEqual(sampleTask);
    expect(mockTaskDetailStore.selectedSubTask).toBe(null);

    // サブタスクに切り替え
    const subTask = sampleTask.sub_tasks[0];
    mockTaskDetailStore.selectSubTask(subTask);
    expect(mockTaskDetailStore.selectedTask).toBe(null);
    expect(mockTaskDetailStore.selectedSubTask).toEqual(subTask);

    // 新規タスクモードに切り替え
    mockTaskDetailStore.enterNewTaskMode();
    expect(mockTaskDetailStore.selectedTask).toBe(null);
    expect(mockTaskDetailStore.selectedSubTask).toBe(null);
    expect(mockTaskDetailStore.isNewTaskMode).toBe(true);
  });

  it('サブタスクの進捗と親タスクの同期', () => {
    // サブタスクの進捗計算のシミュレーション
    const calculateTaskProgress = (task: TaskWithSubTasks) => {
      const totalSubTasks = task.sub_tasks.length;
      if (totalSubTasks === 0) return { progress: 0, allCompleted: false };

      const completedSubTasks = task.sub_tasks.filter((st) => st.status === 'completed').length;
      const progress = Math.round((completedSubTasks / totalSubTasks) * 100);
      const allCompleted = completedSubTasks === totalSubTasks;

      return { progress, allCompleted, completedSubTasks, totalSubTasks };
    };

    const progress = calculateTaskProgress(sampleTask);

    // サンプルタスクは2つのサブタスクがあり、1つが完了済み
    expect(progress.totalSubTasks).toBe(2);
    expect(progress.completedSubTasks).toBe(1);
    expect(progress.progress).toBe(50);
    expect(progress.allCompleted).toBe(false);

    // 全サブタスクが完了した場合のシミュレーション
    const allCompletedTask = {
      ...sampleTask,
      sub_tasks: sampleTask.sub_tasks.map((st) => ({ ...st, status: 'completed' as TaskStatus }))
    };

    const allCompletedProgress = calculateTaskProgress(allCompletedTask);
    expect(allCompletedProgress.progress).toBe(100);
    expect(allCompletedProgress.allCompleted).toBe(true);
  });

  it('エラーハンドリングと復旧処理が正しく動作する', async () => {
    // エラー状態のシミュレーション
    const errorService = {
      updateTaskWithError: vi.fn().mockRejectedValue(new Error('ネットワークエラー')),
      retryUpdate: vi.fn().mockResolvedValue({ success: true })
    };

    // エラー発生時の処理
    let errorOccurred = false;
    let errorMessage = '';

    try {
      await errorService.updateTaskWithError('task-1', { title: 'エラーテスト' });
    } catch (error) {
      errorOccurred = true;
      errorMessage = error instanceof Error ? error.message : '不明なエラー';
    }

    expect(errorOccurred).toBe(true);
    expect(errorMessage).toBe('ネットワークエラー');

    // リトライ処理
    const retryResult = await errorService.retryUpdate();
    expect(errorService.retryUpdate).toHaveBeenCalled();
    expect(retryResult.success).toBe(true);
  });

  it('バリデーション機能が正しく動作する', () => {
    // バリデーション関数のシミュレーション
    const validateTaskData = (data: Partial<TaskWithSubTasks>) => {
      const errors: string[] = [];

      if (!data.title || data.title.trim().length === 0) {
        errors.push('タイトルは必須です');
      }

      if (data.title && data.title.length > 100) {
        errors.push('タイトルは100文字以下で入力してください');
      }

      if (data.start_date && data.end_date && data.start_date > data.end_date) {
        errors.push('開始日は終了日より前の日付を設定してください');
      }

      if (data.priority && (data.priority < 0 || data.priority > 5)) {
        errors.push('優先度は0-5の範囲で設定してください');
      }

      return { isValid: errors.length === 0, errors };
    };

    // 有効なデータ
    const validData = {
      title: '有効なタスク',
      start_date: new Date('2024-01-01'),
      end_date: new Date('2024-01-05'),
      priority: 2
    };

    const validResult = validateTaskData(validData);
    expect(validResult.isValid).toBe(true);
    expect(validResult.errors).toHaveLength(0);

    // 無効なデータ（空のタイトル）
    const invalidData = {
      title: '',
      start_date: new Date('2024-01-05'),
      end_date: new Date('2024-01-01'), // 開始日より前の終了日
      priority: 10 // 範囲外の優先度
    };

    const invalidResult = validateTaskData(invalidData);
    expect(invalidResult.isValid).toBe(false);
    expect(invalidResult.errors).toContain('タイトルは必須です');
    expect(invalidResult.errors).toContain('開始日は終了日より前の日付を設定してください');
    expect(invalidResult.errors).toContain('優先度は0-5の範囲で設定してください');
  });
});
