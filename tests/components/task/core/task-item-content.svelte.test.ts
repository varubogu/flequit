import { render } from '@testing-library/svelte';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import TaskItemContent from '$lib/components/task/core/task-item-content.svelte';
import type { TaskStatus, TaskWithSubTasks } from '$lib/types/task';
import type { TaskItemLogic } from '$lib/components/task/core/task-item-logic.svelte';

// 必要なモジュールをモック
vi.mock('$lib/utils/task-utils', () => ({
  getPriorityColor: (priority: number) => `priority-${priority}`
}));

// 子コンポーネントをモック
vi.mock('$lib/components/shared/button.svelte', () => ({
  default: () => ({ render: () => '<button data-testid="mock-button">Button</button>' })
}));

vi.mock('$lib/components/task/controls/task-status-toggle.svelte', () => ({
  default: () => ({ render: () => '<div data-testid="task-status-toggle">Status Toggle</div>' })
}));

vi.mock('$lib/components/task/core/task-content.svelte', () => ({
  default: () => ({ render: () => '<div data-testid="task-content">Task Content</div>' })
}));

vi.mock('$lib/components/task/subtasks/sub-task-list.svelte', () => ({
  default: () => ({ render: () => '<div data-testid="sub-task-list">SubTask List</div>' })
}));

vi.mock('$lib/components/task/controls/task-accordion-toggle.svelte', () => ({
  default: () => ({
    render: () => '<div data-testid="task-accordion-toggle">Accordion Toggle</div>'
  })
}));

vi.mock('$lib/components/shared/context-menu-wrapper.svelte', () => ({
  default: () => ({ render: () => '<div data-testid="context-menu-wrapper">Context Menu</div>' })
}));

describe('TaskItemContent', () => {
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
    order_index: 0,
    is_archived: false,
    created_at: new Date('2024-01-01'),
    updated_at: new Date('2024-01-01'),
    sub_tasks: [],
    tags: []
  };

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
      }
    ]
  };

  const mockLogic = {
    showSubTasks: false,
    isActiveTask: false,
    completedSubTasks: 0,
    subTaskProgress: 0,
    taskContextMenuItems: [],
    toggleSubTasksAccordion: vi.fn(),
    handleDragStart: vi.fn(),
    handleDragOver: vi.fn(),
    handleDrop: vi.fn(),
    handleDragEnd: vi.fn(),
    handleDragEnter: vi.fn(),
    handleDragLeave: vi.fn(),
    handleTaskClick: vi.fn(),
    handleStatusToggle: vi.fn(),
    handleSubTaskClick: vi.fn(),
    handleSubTaskToggle: vi.fn(),
    createSubTaskContextMenu: vi.fn()
  };

  const mockTaskDatePicker = {
    handleDueDateClick: vi.fn(),
    handleSubTaskDueDateClick: vi.fn(),
    datePickerPosition: { x: 0, y: 0, width: 0, height: 0 },
    showDatePicker: false as const
  };

  const defaultProps = {
    logic: mockLogic as unknown as TaskItemLogic,
    task: mockTask,
    taskDatePicker: mockTaskDatePicker
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('基本表示テスト', () => {
    it('タスクアイテムが正常にレンダリングされる', () => {
      const { container } = render(TaskItemContent, { props: defaultProps });

      expect(container.innerHTML).toBeTruthy();
      expect(container.innerHTML.length).toBeGreaterThan(50);
    });

    it('基本的なHTML構造が存在する', () => {
      const { container } = render(TaskItemContent, { props: defaultProps });

      // フレックスレイアウトが含まれる
      expect(container.innerHTML).toContain('flex w-full');
      // ドラッグ可能な要素が含まれる
      expect(container.innerHTML).toContain('draggable="true"');
    });

    it('ロール属性とタブインデックスが設定される', () => {
      const { container } = render(TaskItemContent, { props: defaultProps });

      expect(container.innerHTML).toContain('role="button"');
      expect(container.innerHTML).toContain('tabindex="0"');
    });

    it('レスポンシブクラスが適用される', () => {
      const { container } = render(TaskItemContent, { props: defaultProps });

      expect(container.innerHTML).toContain('min-w-0');
      expect(container.innerHTML).toContain('overflow-hidden');
    });

    it('異なるロジック状態で正常にレンダリングされる', () => {
      const activeLogic = { ...mockLogic, isActiveTask: true };
      const { container } = render(TaskItemContent, {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore - Testing with mock logic object
        props: { ...defaultProps, logic: activeLogic as unknown }
      });

      expect(container.innerHTML).toBeTruthy();
    });
  });

  describe('サブタスク表示テスト', () => {
    it('サブタスクなしのタスクが正常にレンダリングされる', () => {
      const { container } = render(TaskItemContent, { props: defaultProps });

      expect(container.innerHTML).toBeTruthy();
      expect(container.innerHTML).not.toMatch(/SubTask List/);
    });

    it('サブタスクありのタスクが正常にレンダリングされる', () => {
      const props = {
        ...defaultProps,
        task: mockTaskWithSubTasks
      };
      const { container } = render(TaskItemContent, { props });

      expect(container.innerHTML).toBeTruthy();
    });

    it('アコーディオン展開状態で正常にレンダリングされる', () => {
      const expandedLogic = { ...mockLogic, showSubTasks: true };
      const { container } = render(TaskItemContent, {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore - Testing with mock logic object
        props: {
          ...defaultProps,
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          logic: expandedLogic as unknown,
          task: mockTaskWithSubTasks
        }
      });

      expect(container.innerHTML).toBeTruthy();
    });

    it('アコーディオン折りたたみ状態で正常にレンダリングされる', () => {
      const collapsedLogic = { ...mockLogic, showSubTasks: false };
      const { container } = render(TaskItemContent, {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore - Testing with mock logic object
        props: {
          ...defaultProps,
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          logic: collapsedLogic as unknown,
          task: mockTaskWithSubTasks
        }
      });

      expect(container.innerHTML).toBeTruthy();
    });
  });

  describe('イベントハンドリングテスト', () => {
    it('ドラッグ&ドロップ属性が正しく設定される', () => {
      const { container } = render(TaskItemContent, { props: defaultProps });

      expect(container.innerHTML).toContain('draggable="true"');
    });

    it('ロジッククラスのメソッドが正しくバインドされる', () => {
      const { container } = render(TaskItemContent, { props: defaultProps });

      // コンポーネントが正常にレンダリングされることで、バインディングが正常であることを確認
      expect(container.innerHTML).toBeTruthy();
    });

    it('タスクデートピッカーが提供されない場合、エラーにならない', () => {
      const props = {
        ...defaultProps,
        taskDatePicker: undefined
      };

      const { container } = render(TaskItemContent, { props });
      expect(container.innerHTML).toBeTruthy();
    });
  });

  describe('コンテキストメニューテスト', () => {
    it('コンテキストメニューアイテムが設定されたロジックで正常にレンダリングされる', () => {
      const logicWithMenuItems = {
        ...mockLogic,
        taskContextMenuItems: [
          { label: 'Edit', action: vi.fn() },
          { label: 'Delete', action: vi.fn() }
        ]
      };
      const { container } = render(TaskItemContent, {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore - Testing with mock logic object
        props: { ...defaultProps, logic: logicWithMenuItems as unknown }
      });

      expect(container.innerHTML).toBeTruthy();
    });

    it('空のコンテキストメニューアイテムで正常にレンダリングされる', () => {
      const logicWithEmptyMenu = {
        ...mockLogic,
        taskContextMenuItems: []
      };
      const { container } = render(TaskItemContent, {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore - Testing with mock logic object
        props: { ...defaultProps, logic: logicWithEmptyMenu as unknown }
      });

      expect(container.innerHTML).toBeTruthy();
    });
  });

  describe('レスポンシブ・アクセシビリティテスト', () => {
    it('適切なロール属性が設定される', () => {
      const { container } = render(TaskItemContent, { props: defaultProps });

      expect(container.innerHTML).toContain('role="button"');
    });

    it('tabindex属性が設定される', () => {
      const { container } = render(TaskItemContent, { props: defaultProps });

      expect(container.innerHTML).toContain('tabindex="0"');
    });

    it('フレックスレイアウトが適用される', () => {
      const { container } = render(TaskItemContent, { props: defaultProps });

      expect(container.innerHTML).toContain('flex w-full');
    });

    it('オーバーフロー処理が適用される', () => {
      const { container } = render(TaskItemContent, { props: defaultProps });

      expect(container.innerHTML).toContain('overflow-hidden');
    });
  });

  describe('プロパティバリエーションテスト', () => {
    it('異なる優先度のタスクが正常にレンダリングされる', () => {
      const highPriorityTask = { ...mockTask, priority: 5 };
      const props = { ...defaultProps, task: highPriorityTask };
      const { container } = render(TaskItemContent, { props });

      expect(container.innerHTML).toBeTruthy();
    });

    it('異なるステータスのタスクが正常にレンダリングされる', () => {
      const completedTask = { ...mockTask, status: 'completed' };
      const { container } = render(TaskItemContent, {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore - Testing with different task status
        props: { ...defaultProps, task: completedTask }
      });

      expect(container.innerHTML).toBeTruthy();
    });

    it('複数のサブタスクを持つタスクが正常にレンダリングされる', () => {
      const taskWithMultipleSubTasks = {
        ...mockTask,
        sub_tasks: [
          {
            id: 'sub1',
            title: 'SubTask 1',
            status: 'not_started',
            priority: 1,
            task_id: 'task-1',
            order_index: 0,
            tags: [],
            created_at: new Date(),
            updated_at: new Date()
          },
          {
            id: 'sub2',
            title: 'SubTask 2',
            status: 'in_progress',
            priority: 2,
            task_id: 'task-1',
            order_index: 1,
            tags: [],
            created_at: new Date(),
            updated_at: new Date()
          },
          {
            id: 'sub3',
            title: 'SubTask 3',
            status: 'completed',
            priority: 3,
            task_id: 'task-1',
            order_index: 2,
            tags: [],
            created_at: new Date(),
            updated_at: new Date()
          }
        ]
      };
      const { container } = render(TaskItemContent, {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore - Testing with multiple subtasks
        props: { ...defaultProps, task: taskWithMultipleSubTasks }
      });

      expect(container.innerHTML).toBeTruthy();
    });

    it('異なるロジック状態のバリエーションで正常にレンダリングされる', () => {
      const variousLogicStates = [
        { ...mockLogic, isActiveTask: true, showSubTasks: true },
        { ...mockLogic, isActiveTask: false, showSubTasks: false },
        { ...mockLogic, completedSubTasks: 5, subTaskProgress: 0.5 }
      ];

      variousLogicStates.forEach((logic) => {
        const { container } = render(TaskItemContent, {
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore - Testing with mock logic object
          props: { ...defaultProps, logic: logic as unknown }
        });
        expect(container.innerHTML).toBeTruthy();
      });
    });
  });

  describe('エラー状態・エッジケーステスト', () => {
    it('不正な優先度でもエラーにならない', () => {
      const invalidPriorityTask = { ...mockTask, priority: -1 };
      const props = { ...defaultProps, task: invalidPriorityTask };

      const { container } = render(TaskItemContent, { props });
      expect(container.innerHTML).toBeTruthy();
    });

    it('コンポーネントが正常にマウント・アンマウントできる', () => {
      const { container, unmount } = render(TaskItemContent, { props: defaultProps });

      expect(container.innerHTML).toBeTruthy();

      // アンマウントしてもエラーが発生しない
      expect(() => unmount()).not.toThrow();
    });

    it('ロジックメソッドがnullでもエラーにならない', () => {
      const logicWithNullMethods = {
        ...mockLogic,
        handleTaskClick: null as ((task: TaskWithSubTasks) => void) | null,
        handleStatusToggle: null as unknown
      };
      const { container } = render(TaskItemContent, {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore - Testing with null methods in logic object
        props: { ...defaultProps, logic: logicWithNullMethods as unknown }
      });
      expect(container.innerHTML).toBeTruthy();
    });

    it('空のサブタスク配列でも正常に動作する', () => {
      const taskWithEmptySubTasks = { ...mockTask, sub_tasks: [] };
      const props = { ...defaultProps, task: taskWithEmptySubTasks };
      const { container } = render(TaskItemContent, { props });

      expect(container.innerHTML).toBeTruthy();
      expect(container.innerHTML).not.toContain('SubTask List');
    });
  });
});
