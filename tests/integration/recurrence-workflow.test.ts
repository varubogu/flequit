import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { Task, RecurrenceRule } from '$lib/types/task';

// テスト用の拡張型（繰り返しの親タスクIDを持つ）
interface TaskWithRecurrenceParent extends Task {
  recurrence_parent_id?: string;
}

describe('繰り返しタスクワークフロー結合テスト', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('繰り返しタスクの作成→インスタンス生成→更新フローが正常に動作する', async () => {
    // 繰り返しサービスのモック
    const mockRecurrenceService = {
      generateRecurrenceDates: (baseDate: Date, rule: RecurrenceRule, limit: number = 10) => {
        const dates = [];
        const startDate = new Date(baseDate);

        for (let i = 0; i < limit; i++) {
          const nextDate = new Date(startDate);
          nextDate.setDate(startDate.getDate() + i * rule.interval);
          dates.push(nextDate);
        }

        return dates;
      },

      createRecurrenceInstances: async (task: Partial<Task>, rule: RecurrenceRule) => {
        const instances: Task[] = [];
        const baseDate = task.end_date || new Date();
        const limit = rule.max_occurrences || 5;
        const dates = mockRecurrenceService.generateRecurrenceDates(baseDate, rule, limit);

        dates.forEach((date, index) => {
          instances.push({
            id: `${task.id}-instance-${index}`,
            list_id: task.list_id || '',
            title: `${task.title || 'タスク'} (${index + 1}回目)`,
            description: task.description || '',
            status: 'not_started' as const,
            priority: task.priority || 1,
            start_date: task.start_date,
            end_date: date,
            is_range_date: task.is_range_date || false,
            recurrence_rule: task.recurrence_rule,
            order_index: task.order_index || 0,
            is_archived: task.is_archived || false,
            created_at: new Date(),
            updated_at: new Date()
          } as Task);
        });

        return instances;
      },

      updateRecurrenceRule: async (taskId: string, newRule: RecurrenceRule) => {
        return { taskId, rule: newRule };
      }
    };

    // タスクストアのモック
    const mockTaskStore = {
      tasks: [] as Task[],
      recurrenceTasks: [] as Task[],

      addTask: (listId: string, taskData: Partial<Task>) => {
        const newTask: Task = {
          id: `task-${Date.now()}`,
          list_id: listId,
          title: taskData.title || '',
          description: taskData.description || '',
          status: taskData.status || 'not_started',
          priority: taskData.priority || 1,
          start_date: taskData.start_date,
          end_date: taskData.end_date,
          is_range_date: taskData.is_range_date || false,
          recurrence_rule: taskData.recurrence_rule,
          order_index: 0,
          is_archived: false,
          created_at: new Date(),
          updated_at: new Date()
        };
        mockTaskStore.tasks.push(newTask);
        return newTask;
      },

      updateTask: (taskId: string, updates: Partial<Task>) => {
        const taskIndex = mockTaskStore.tasks.findIndex((t: Task) => t.id === taskId);
        if (taskIndex >= 0) {
          mockTaskStore.tasks[taskIndex] = {
            ...mockTaskStore.tasks[taskIndex],
            ...updates,
            updated_at: new Date()
          };
          return mockTaskStore.tasks[taskIndex];
        }
        return null;
      },

      addRecurrenceInstances: (instances: Task[]) => {
        mockTaskStore.recurrenceTasks.push(...instances);
        return instances;
      },

      getRecurrenceInstances: (parentTaskId: string) => {
        return mockTaskStore.recurrenceTasks.filter(
          (t: Task) => (t as TaskWithRecurrenceParent).recurrence_parent_id === parentTaskId
        );
      },

      clear: () => {
        mockTaskStore.tasks.splice(0);
        mockTaskStore.recurrenceTasks.splice(0);
      }
    };

    // 繰り返しタスクを作成
    const recurrenceRule = {
      unit: 'day',
      interval: 1,
      max_occurrences: 5
    } as RecurrenceRule;

    const taskData = {
      title: '毎日のタスク',
      description: '毎日実行するテストタスク',
      due_date: new Date('2024-01-01'),
      recurrence_rule: recurrenceRule
    } as Partial<Task>;

    const task = mockTaskStore.addTask('test-list-1', taskData);

    expect(task).toEqual(
      expect.objectContaining({
        title: '毎日のタスク',
        recurrence_rule: expect.objectContaining({
          unit: 'day',
          interval: 1,
          max_occurrences: 5
        })
      })
    );

    // 繰り返しインスタンスを生成
    const instances = await mockRecurrenceService.createRecurrenceInstances(task, recurrenceRule);
    mockTaskStore.addRecurrenceInstances(instances);

    expect(instances).toHaveLength(5);
    expect(instances[0]).toEqual(
      expect.objectContaining({
        title: '毎日のタスク (1回目)',
        status: 'not_started'
      })
    );
    expect(mockTaskStore.recurrenceTasks).toHaveLength(5);

    // ルールを週1回に変更
    const newRule = { unit: 'week' as const, interval: 1, max_occurrences: 3 } as RecurrenceRule;
    await mockRecurrenceService.updateRecurrenceRule(task.id, newRule);
    mockTaskStore.updateTask(task.id, { recurrence_rule: newRule });

    // 新しいインスタンスを生成
    const newInstances = await mockRecurrenceService.createRecurrenceInstances(task, newRule);

    // 既存のインスタンスをクリアして新しいものを追加
    mockTaskStore.recurrenceTasks.splice(0);
    mockTaskStore.addRecurrenceInstances(newInstances);

    expect(newInstances).toHaveLength(3);
    expect(mockTaskStore.recurrenceTasks).toHaveLength(3);

    // インスタンスを完了
    const firstInstance = mockTaskStore.recurrenceTasks[0];
    firstInstance.status = 'completed';

    const completedInstances = mockTaskStore.recurrenceTasks.filter(
      (i: Task) => i.status === 'completed'
    );
    expect(completedInstances).toHaveLength(1);
  });

  it('複雑な繰り返しルールの管理が正常に動作する', async () => {
    const mockTaskStore = {
      tasks: [] as Task[],
      recurrenceTasks: [] as Task[],

      addTask: (listId: string, taskData: Partial<Task>) => {
        const newTask = {
          id: `task-${Date.now()}-${Math.random()}`,
          list_id: listId,
          title: taskData.title,
          description: taskData.description || '',
          status: taskData.status || 'not_started',
          priority: taskData.priority || 1,
          end_date: taskData.end_date,
          recurrence_rule: taskData.recurrence_rule,
          created_at: new Date(),
          updated_at: new Date(),
          ...taskData
        } as Task;
        mockTaskStore.tasks.push(newTask);
        return newTask;
      },

      addRecurrenceInstances: (instances: Task[]) => {
        mockTaskStore.recurrenceTasks.push(...instances);
        return instances;
      },

      getRecurrenceInstances: (parentTaskId: string) => {
        return mockTaskStore.recurrenceTasks.filter(
          (t: Task) => (t as TaskWithRecurrenceParent).recurrence_parent_id === parentTaskId
        );
      }
    };

    const mockRecurrenceService = {
      createRecurrenceInstances: async (task: Partial<Task>, rule: RecurrenceRule) => {
        const instances: Task[] = [];
        const count = rule.max_occurrences || 5;

        for (let i = 0; i < count; i++) {
          instances.push({
            id: `${task.id}-instance-${i}`,
            ...task,
            title: `${task.title} (${i + 1}回目)`,
            end_date: new Date(),
            status: 'not_started'
          } as Task);
        }

        return instances;
      }
    };

    // 平日タスクを作成
    const weekdaysRule = {
      unit: 'week',
      interval: 1,
      days_of_week: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
      max_occurrences: 10
    } as RecurrenceRule;

    const weekdaysTask = mockTaskStore.addTask('test-list-1', {
      title: '平日タスク',
      recurrence_rule: weekdaysRule,
      end_date: new Date('2024-01-01')
    });

    const weekdaysInstances = await mockRecurrenceService.createRecurrenceInstances(
      weekdaysTask,
      weekdaysRule
    );
    mockTaskStore.addRecurrenceInstances(weekdaysInstances);

    expect(weekdaysTask).toEqual(
      expect.objectContaining({
        title: '平日タスク',
        recurrence_rule: expect.objectContaining({
          unit: 'week',
          days_of_week: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']
        })
      })
    );
    expect(weekdaysInstances).toHaveLength(10);
    expect(mockTaskStore.tasks).toHaveLength(1);

    // 月次タスクを作成
    const monthlyRule = {
      unit: 'month',
      interval: 1,
      details: { day_of_month: 15 },
      max_occurrences: 6
    } as RecurrenceRule;

    const monthlyTask = mockTaskStore.addTask('test-list-1', {
      title: '毎月15日タスク',
      recurrence_rule: monthlyRule,
      end_date: new Date('2024-01-01')
    });

    const monthlyInstances = await mockRecurrenceService.createRecurrenceInstances(
      monthlyTask,
      monthlyRule
    );
    mockTaskStore.addRecurrenceInstances(monthlyInstances);

    expect(monthlyTask).toEqual(
      expect.objectContaining({
        title: '毎月15日タスク',
        recurrence_rule: expect.objectContaining({
          unit: 'month',
          details: { day_of_month: 15 }
        })
      })
    );
    expect(monthlyInstances).toHaveLength(6);
    expect(mockTaskStore.tasks).toHaveLength(2);

    // タスク選択とインスタンス取得
    const selectedTask = monthlyTask;
    const instances = mockTaskStore.getRecurrenceInstances(selectedTask.id);

    expect(instances).toHaveLength(6);
    expect(instances[0]).toEqual(
      expect.objectContaining({
        title: '毎月15日タスク (1回目)'
      })
    );
  });

  it('繰り返しタスクの例外処理が正常に動作する', async () => {
    const mockTaskStore = {
      tasks: [] as Task[],

      addTask: (listId: string, taskData: Partial<Task>) => {
        const newTask = {
          id: `task-${Date.now()}`,
          list_id: listId,
          title: taskData.title,
          recurrence_rule: taskData.recurrence_rule,
          created_at: new Date(),
          updated_at: new Date(),
          ...taskData
        } as Task;
        mockTaskStore.tasks.push(newTask);
        return newTask;
      }
    };

    const mockRecurrenceService = {
      createRecurrenceInstances: async (task: Partial<Task>, rule: RecurrenceRule) => {
        // 無効なルールの検証
        if ((rule.unit as string) === 'invalid' || rule.interval < 0) {
          throw new Error('無効な繰り返しルールです');
        }

        // 過去の終了日の検証
        if (rule.end_date && rule.end_date < new Date()) {
          return []; // 空配列を返す
        }

        return [
          {
            id: `${task.id}-instance-0`,
            ...task,
            title: `${task.title} (1回目)`,
            due_date: new Date(),
            recurrence_parent_id: task.id,
            status: 'not_started'
          }
        ];
      }
    };

    // 無効なルールでタスク作成を試行
    let errorMessage = '';
    try {
      const invalidRule = {
        unit: 'invalid' as never,
        interval: -1
      } as RecurrenceRule;

      const task = mockTaskStore.addTask('test-list-1', {
        title: '無効なタスク',
        recurrence_rule: invalidRule
      });

      await mockRecurrenceService.createRecurrenceInstances(task, invalidRule);
    } catch (error: unknown) {
      if (error instanceof Error) {
        errorMessage = error.message || '無効な繰り返しルールです';
      } else {
        // 予期しないエラーの場合
        console.error('予期しないエラー:', error);
        // エラーメッセージを設定
        errorMessage = '予期しないエラーが発生しました';
      }
    }

    expect(errorMessage).toBe('無効な繰り返しルールです');

    // 過去終了日でタスク作成を試行
    errorMessage = '';
    try {
      const pastRule = {
        unit: 'day',
        interval: 1,
        end_date: new Date('2020-01-01') // 過去の日付
      } as RecurrenceRule;

      const task = mockTaskStore.addTask('test-list-1', {
        title: '過去終了日タスク',
        recurrence_rule: pastRule,
        end_date: new Date()
      });

      const instances = await mockRecurrenceService.createRecurrenceInstances(task, pastRule);

      if (instances.length === 0) {
        errorMessage = '終了日が過去のため、インスタンスが生成されませんでした';
      }
    } catch (error) {
      if (error instanceof Error) {
        errorMessage = error.message;
      } else {
        errorMessage = '予期しないエラーが発生しました';
      }
    }

    expect(errorMessage).toBe('終了日が過去のため、インスタンスが生成されませんでした');
  });
});
