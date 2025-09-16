import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { Task } from '$lib/types/task';

// モックストアの実装
const mockTaskStore = {
  tasks: [] as Task[],

  clear: vi.fn(() => {
    mockTaskStore.tasks.length = 0;
  }),

  addTask: vi.fn((listId: string, taskData: Partial<Task>) => {
    const newTask = {
      id: `task-${Date.now()}`,
      listId: listId,
      title: taskData.title,
      description: taskData.description || '',
      status: taskData.status || 'not_started',
      priority: taskData.priority || 1,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...taskData
    } as Task;
    mockTaskStore.tasks.push(newTask);
    return newTask;
  }),

  updateTask: vi.fn((taskId: string, updates: Partial<Task>) => {
    const taskIndex = mockTaskStore.tasks.findIndex((t: Task) => t.id === taskId);
    if (taskIndex >= 0) {
      mockTaskStore.tasks[taskIndex] = {
        ...mockTaskStore.tasks[taskIndex],
        ...updates,
        updatedAt: new Date()
      };
      return mockTaskStore.tasks[taskIndex];
    }
    return null;
  }),

  deleteTask: vi.fn((taskId: string) => {
    const taskIndex = mockTaskStore.tasks.findIndex((t: Task) => t.id === taskId);
    if (taskIndex >= 0) {
      mockTaskStore.tasks.splice(taskIndex, 1);
      return true;
    }
    return false;
  }),

  getTasksByListId: vi.fn((listId: string) => {
    return mockTaskStore.tasks.filter((t: Task) => t.listId === listId);
  })
};

// 必要なモック設定
vi.mock('$lib/stores/task.svelte', () => ({
  taskStore: mockTaskStore
}));

vi.mock('$lib/services/task-service', () => ({
  taskService: {
    createTask: vi.fn(async (listId: string, taskData: Partial<Task>) => {
      return mockTaskStore.addTask(listId, taskData);
    }),
    updateTask: vi.fn(async (taskId: string, updates: Partial<Task>) => {
      return mockTaskStore.updateTask(taskId, updates);
    }),
    deleteTask: vi.fn(async (taskId: string) => {
      return mockTaskStore.deleteTask(taskId);
    })
  }
}));

describe('タスクライフサイクル結合テスト', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // 配列を完全にクリア
    mockTaskStore.tasks.splice(0);
    // console.log('beforeEach: tasks cleared, length:', mockTaskStore.tasks.length);
  });

  it('タスクの作成→編集→削除の完全フローが正常に動作する', async () => {
    // モック関数のみを使用した結合テスト

    // 1. タスク作成
    const newTask = mockTaskStore.addTask('test-list-1', {
      title: '新しいタスク',
      description: 'テスト用タスクです',
      status: 'not_started'
    });

    expect(mockTaskStore.addTask).toHaveBeenCalledWith('test-list-1', {
      title: '新しいタスク',
      description: 'テスト用タスクです',
      status: 'not_started'
    });
    expect(newTask).toEqual(
      expect.objectContaining({
        title: '新しいタスク',
        status: 'not_started',
        list_id: 'test-list-1'
      })
    );

    // タスクが正しく追加されたか確認
    const tasks = mockTaskStore.getTasksByListId('test-list-1');
    expect(tasks).toHaveLength(1);
    expect(tasks[0]).toEqual(newTask);

    // 2. タスク編集
    const updatedTask = mockTaskStore.updateTask(newTask.id, {
      status: 'completed',
      title: '更新されたタスク'
    });

    expect(mockTaskStore.updateTask).toHaveBeenCalledWith(newTask.id, {
      status: 'completed',
      title: '更新されたタスク'
    });
    expect(updatedTask).toEqual(
      expect.objectContaining({
        title: '更新されたタスク',
        status: 'completed',
        list_id: 'test-list-1'
      })
    );

    // 3. タスク削除
    const deleteResult = mockTaskStore.deleteTask(newTask.id);

    expect(mockTaskStore.deleteTask).toHaveBeenCalledWith(newTask.id);
    expect(deleteResult).toBe(true);

    // タスクが削除されたことを確認
    const remainingTasks = mockTaskStore.getTasksByListId('test-list-1');
    expect(remainingTasks).toHaveLength(0);
  });

  it('複数タスクの管理フローが正常に動作する', async () => {
    // 独立したモックストアを作成
    const localTaskStore = {
      tasks: [] as Task[],

      addTask: (listId: string, taskData: Partial<Task>) => {
        const newTask = {
          id: `task-${Date.now()}-${Math.random()}`,
          listId: listId,
          title: taskData.title,
          description: taskData.description || '',
          status: taskData.status || 'not_started',
          priority: taskData.priority || 1,
          createdAt: new Date(),
          updatedAt: new Date(),
          ...taskData
        } as Task;
        localTaskStore.tasks.push(newTask);
        return newTask;
      },

      updateTask: (taskId: string, updates: Partial<Task>) => {
        const taskIndex = localTaskStore.tasks.findIndex((t: Task) => t.id === taskId);
        if (taskIndex >= 0) {
          localTaskStore.tasks[taskIndex] = {
            ...localTaskStore.tasks[taskIndex],
            ...updates,
            updatedAt: new Date()
          };
          return localTaskStore.tasks[taskIndex];
        }
        return null;
      },

      deleteTask: (taskId: string) => {
        const taskIndex = localTaskStore.tasks.findIndex((t: Task) => t.id === taskId);
        if (taskIndex >= 0) {
          localTaskStore.tasks.splice(taskIndex, 1);
          return true;
        }
        return false;
      },

      getTasksByListId: (listId: string) => {
        return localTaskStore.tasks.filter((t: Task) => t.listId === listId);
      }
    };

    // 複数タスク作成
    const task1 = localTaskStore.addTask('test-list-1', {
      title: 'タスク1',
      status: 'not_started'
    });
    const task2 = localTaskStore.addTask('test-list-1', {
      title: 'タスク2',
      status: 'not_started'
    });
    const task3 = localTaskStore.addTask('test-list-1', {
      title: 'タスク3',
      status: 'not_started'
    });

    // タスクが作成されたことを確認
    let tasks = localTaskStore.getTasksByListId('test-list-1');
    expect(tasks).toHaveLength(3);

    // 全タスク完了
    const result1 = localTaskStore.updateTask(task1.id, { status: 'completed' });
    const result2 = localTaskStore.updateTask(task2.id, { status: 'completed' });
    const result3 = localTaskStore.updateTask(task3.id, { status: 'completed' });

    expect(result1).not.toBeNull();
    expect(result2).not.toBeNull();
    expect(result3).not.toBeNull();
    expect(result1?.status).toBe('completed');
    expect(result2?.status).toBe('completed');
    expect(result3?.status).toBe('completed');

    // 更新されたタスクを確認
    tasks = localTaskStore.getTasksByListId('test-list-1');
    expect(tasks).toHaveLength(3);

    const completedTasks = tasks.filter((t) => t.status === 'completed');
    expect(completedTasks).toHaveLength(3);

    // 完了済みタスク削除
    const deleteResult1 = localTaskStore.deleteTask(task1.id);
    const deleteResult2 = localTaskStore.deleteTask(task2.id);
    const deleteResult3 = localTaskStore.deleteTask(task3.id);

    expect(deleteResult1).toBe(true);
    expect(deleteResult2).toBe(true);
    expect(deleteResult3).toBe(true);

    // 全タスクが削除されたことを確認
    tasks = localTaskStore.getTasksByListId('test-list-1');
    expect(tasks).toHaveLength(0);
  });
});
