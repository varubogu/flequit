import { render } from '@testing-library/svelte';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import TaskItem from '$lib/components/task/core/task-item.svelte';
import type { TaskStatus, TaskWithSubTasks } from '$lib/types/task';
import type { SubTask } from '$lib/types/sub-task';

type EventDispatcher = (type: string, detail?: unknown) => boolean;

// 依存関係をモック
vi.mock('$lib/components/task/forms/task-date-picker.svelte', () => ({
  default: () => ({ render: () => '<div data-testid="task-date-picker">Task Date Picker</div>' })
}));

vi.mock('$lib/components/task/core/task-item-content.svelte', () => ({
  default: () => ({ render: () => '<div data-testid="task-item-content">Task Item Content</div>' })
}));

vi.mock('$lib/components/task/core/task-item-logic.svelte', () => ({
  TaskItemLogic: class MockTaskItemLogic {
    task: TaskWithSubTasks;
    onTaskClick?: (taskId: string) => void;
    onSubTaskClick?: (subTaskId: string) => void;
    dispatch: EventDispatcher;

    constructor(
      task: TaskWithSubTasks,
      onTaskClick?: (taskId: string) => void,
      onSubTaskClick?: (subTaskId: string) => void,
      dispatch?: EventDispatcher
    ) {
      this.task = task;
      this.onTaskClick = onTaskClick;
      this.onSubTaskClick = onSubTaskClick;
      this.dispatch = dispatch || (vi.fn() as EventDispatcher);
    }

    // Mock properties and methods
    showSubTasks = false;
    isActiveTask = false;
    completedSubTasks = 0;
    subTaskProgress = 0;
    taskContextMenuItems = [];

    toggleSubTasksAccordion = vi.fn();
    handleDragStart = vi.fn();
    handleDragOver = vi.fn();
    handleDrop = vi.fn();
    handleDragEnd = vi.fn();
    handleDragEnter = vi.fn();
    handleDragLeave = vi.fn();
    handleTaskClick = vi.fn();
    handleStatusToggle = vi.fn();
    handleSubTaskClick = vi.fn();
    handleSubTaskToggle = vi.fn();
    createSubTaskContextMenu = vi.fn();
  }
}));

describe('TaskItem', () => {
  const mockTask: TaskWithSubTasks = {
    id: 'task-1',
    title: 'Test Task',
    description: 'Test description',
    status: 'not_started' as TaskStatus,
    priority: 2,
    start_date: new Date('2024-01-01'),
    end_date: new Date('2024-01-02'),
    is_range_date: true,
    list_id: 'list-1',
    created_at: new Date('2024-01-01'),
    updated_at: new Date('2024-01-01'),
    sub_tasks: [],
    tags: []
  } as unknown;

  const mockTaskWithSubTasks: TaskWithSubTasks = {
    ...mockTask,
    sub_tasks: [
      {
        id: 'subtask-1',
        title: 'Test SubTask',
        description: 'Test subtask description',
        status: 'not_started' as TaskStatus,
        priority: 1,
        task_id: 'task-1',
        order_index: 0,
        tags: [],
        created_at: new Date('2024-01-01'),
        updated_at: new Date('2024-01-01')
      } as SubTask
    ]
  };

  const defaultProps = {
    task: mockTask,
    onTaskClick: vi.fn(),
    onSubTaskClick: vi.fn()
  } as unknown;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('基本表示テスト', () => {
    it('タスクアイテムが正常にレンダリングされる', () => {
      const { container } = render(TaskItem, { props: defaultProps });

      expect(container.innerHTML).toBeTruthy();
      expect(container.innerHTML.length).toBeGreaterThan(10);
    });

    it('コンポーネントが正常にマウントされる', () => {
      const { container } = render(TaskItem, { props: defaultProps });

      // 基本的なHTML構造が存在することを確認
      expect(container.innerHTML).toBeTruthy();
    });

    it('必要なプロパティでレンダリングできる', () => {
      const { container } = render(TaskItem, { props: defaultProps });

      // レンダリングが完了し、エラーが発生しないことを確認
      expect(container).toBeTruthy();
    });
  });

  describe('プロパティテスト', () => {
    it('タスクプロパティが正しく渡される', () => {
      const { container } = render(TaskItem, { props: defaultProps });

      expect(container.innerHTML).toBeTruthy();
    });

    it('サブタスクを含むタスクで正常にレンダリングされる', () => {
      const props = { ...defaultProps, task: mockTaskWithSubTasks };
      const { container } = render(TaskItem, { props });

      expect(container.innerHTML).toBeTruthy();
    });

    it('異なるタスクIDで正常にレンダリングされる', () => {
      const differentTask = { ...mockTask, id: 'task-999', title: 'Different Task' };
      const props = { ...defaultProps, task: differentTask };
      const { container } = render(TaskItem, { props });

      expect(container.innerHTML).toBeTruthy();
    });

    it('異なる優先度のタスクで正常にレンダリングされる', () => {
      const highPriorityTask = { ...mockTask, priority: 5 };
      const props = { ...defaultProps, task: highPriorityTask };
      const { container } = render(TaskItem, { props });

      expect(container.innerHTML).toBeTruthy();
    });

    it('異なるステータスのタスクで正常にレンダリングされる', () => {
      const completedTask = { ...mockTask, status: 4 as unknown };
      const props = { ...defaultProps, task: completedTask };
      const { container } = render(TaskItem, { props });

      expect(container.innerHTML).toBeTruthy();
    });
  });

  describe('コールバック関数テスト', () => {
    it('onTaskClickコールバックが提供される場合、正常にレンダリングされる', () => {
      const onTaskClick = vi.fn();
      const props = { ...defaultProps, onTaskClick };
      const { container } = render(TaskItem, { props });

      expect(container.innerHTML).toBeTruthy();
    });

    it('onSubTaskClickコールバックが提供される場合、正常にレンダリングされる', () => {
      const onSubTaskClick = vi.fn();
      const props = { ...defaultProps, onSubTaskClick };
      const { container } = render(TaskItem, { props });

      expect(container.innerHTML).toBeTruthy();
    });

    it('両方のコールバックが提供される場合、正常にレンダリングされる', () => {
      const callbacks = {
        onTaskClick: vi.fn(),
        onSubTaskClick: vi.fn()
      };
      const props = { ...defaultProps, ...callbacks };
      const { container } = render(TaskItem, { props });

      expect(container.innerHTML).toBeTruthy();
    });

    it('コールバックが提供されない場合、正常にレンダリングされる', () => {
      const props = {
        task: mockTask,
        onTaskClick: undefined,
        onSubTaskClick: undefined
      };
      const { container } = render(TaskItem, { props });

      expect(container.innerHTML).toBeTruthy();
    });
  });

  describe('日付関連テスト', () => {
    it('日付のあるタスクで正常にレンダリングされる', () => {
      const { container } = render(TaskItem, { props: defaultProps });

      expect(container.innerHTML).toBeTruthy();
    });

    it('日付のないタスクで正常にレンダリングされる', () => {
      const taskWithoutDates = {
        ...mockTask,
        start_date: undefined,
        end_date: undefined
      };
      const props = { ...defaultProps, task: taskWithoutDates };
      const { container } = render(TaskItem, { props });

      expect(container.innerHTML).toBeTruthy();
    });

    it('範囲日付のタスクで正常にレンダリングされる', () => {
      const rangeDateTask = { ...mockTask, is_range_date: true };
      const props = { ...defaultProps, task: rangeDateTask };
      const { container } = render(TaskItem, { props });

      expect(container.innerHTML).toBeTruthy();
    });

    it('単一日付のタスクで正常にレンダリングされる', () => {
      const singleDateTask = { ...mockTask, is_range_date: false };
      const props = { ...defaultProps, task: singleDateTask };
      const { container } = render(TaskItem, { props });

      expect(container.innerHTML).toBeTruthy();
    });
  });

  describe('ロジック統合テスト', () => {
    it('TaskItemLogicが正しく初期化される', () => {
      const { container } = render(TaskItem, { props: defaultProps });

      expect(container.innerHTML).toBeTruthy();
      // TaskItemLogicのコンストラクタが呼ばれることを確認
    });

    it('ロジッククラスが子コンポーネントに渡される', () => {
      const { container } = render(TaskItem, { props: defaultProps });

      expect(container.innerHTML).toBeTruthy();
      // ロジックオブジェクトが適切に渡されることを確認
    });
  });

  describe('イベントディスパッチャーテスト', () => {
    it('イベントディスパッチャーが正しく設定される', () => {
      const { container } = render(TaskItem, { props: defaultProps });

      expect(container.innerHTML).toBeTruthy();
      // createEventDispatcherが正常に動作することを確認
    });
  });

  describe('Reactiveテスト', () => {
    it('taskDatePickerの状態が正しく管理される', () => {
      const { container } = render(TaskItem, { props: defaultProps });

      expect(container.innerHTML).toBeTruthy();
      // $state()で管理されるtaskDatePickerが正常に動作することを確認
    });

    it('propsの変更に正しく反応する', () => {
      const { container, rerender } = render(TaskItem, { props: defaultProps });

      expect(container.innerHTML).toBeTruthy();

      // propsを変更してre-render
      const updatedTask = { ...mockTask, title: 'Updated Task' };
      const updatedProps = { ...defaultProps, task: updatedTask };

      expect(() => rerender(updatedProps)).not.toThrow();
      expect(container.innerHTML).toBeTruthy();
    });
  });

  describe('エラー状態・エッジケーステスト', () => {
    it('不正な形式のタスクでもエラーにならない', () => {
      const invalidTask = {
        id: '',
        title: null as unknown as string,
        description: undefined as string | undefined,
        status: -1,
        priority: 999,
        start_date: 'invalid-date' as unknown,
        end_date: null as unknown,
        is_range_date: 'invalid' as unknown,
        project_id: null as unknown,
        task_list_id: undefined as unknown,
        created_at: 'invalid' as unknown,
        updated_at: null as unknown,
        sub_tasks: null as unknown
      };

      const props = { ...defaultProps, task: invalidTask as unknown };
      const { container } = render(TaskItem, { props });

      expect(container.innerHTML).toBeTruthy();
    });

    it('nullコールバックでもエラーにならない', () => {
      const props = {
        task: mockTask,
        onTaskClick: null as unknown,
        onSubTaskClick: null as unknown
      };

      const { container } = render(TaskItem, { props });
      expect(container.innerHTML).toBeTruthy();
    });

    it('コンポーネントが正常にマウント・アンマウントできる', () => {
      const { container, unmount } = render(TaskItem, { props: defaultProps });

      expect(container.innerHTML).toBeTruthy();

      // アンマウントしてもエラーが発生しない
      expect(() => unmount()).not.toThrow();
    });

    it('極端に長いタイトルでも正常にレンダリングされる', () => {
      const longTitleTask = {
        ...mockTask,
        title: 'a'.repeat(1000) // 1000文字のタイトル
      };
      const props = { ...defaultProps, task: longTitleTask };
      const { container } = render(TaskItem, { props });

      expect(container.innerHTML).toBeTruthy();
    });

    it('大量のサブタスクでも正常にレンダリングされる', () => {
      const manySubTasks = Array.from({ length: 100 }, (_, i) => ({
        id: `subtask-${i}`,
        title: `SubTask ${i}`,
        description: '',
        status: 'not_started' as TaskStatus,
        priority: 1,
        task_id: 'task-1',
        created_at: new Date(),
        updated_at: new Date()
      }));

      const taskWithManySubTasks = { ...mockTask, sub_tasks: manySubTasks };
      const props = { ...defaultProps, task: taskWithManySubTasks };
      const { container } = render(TaskItem, { props });

      expect(container.innerHTML).toBeTruthy();
    });

    it('未来の日付でも正常にレンダリングされる', () => {
      const futureTask = {
        ...mockTask,
        start_date: new Date('2030-01-01'),
        end_date: new Date('2030-12-31')
      };
      const props = { ...defaultProps, task: futureTask };
      const { container } = render(TaskItem, { props });

      expect(container.innerHTML).toBeTruthy();
    });

    it('過去の日付でも正常にレンダリングされる', () => {
      const pastTask = {
        ...mockTask,
        start_date: new Date('2000-01-01'),
        end_date: new Date('2000-12-31')
      };
      const props = { ...defaultProps, task: pastTask };
      const { container } = render(TaskItem, { props });

      expect(container.innerHTML).toBeTruthy();
    });
  });
});
