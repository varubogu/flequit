import { render } from '@testing-library/svelte';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import TaskList from '$lib/components/task/core/task-list.svelte';
import type { TaskWithSubTasks } from '$lib/types/task';

// 依存関係をモック
vi.mock('$lib/stores/locale.svelte', () => ({
  getTranslationService: () => ({
    getMessage: (key: string) => {
      const messages: Record<string, () => string> = {
        add_task: () => 'Add Task',
        no_search_results: () => 'No search results',
        no_tasks_found: () => 'No tasks found',
        try_different_search: () => 'Try a different search',
        click_add_task: () => 'Click + to add a task',
        add_some_tasks: () => 'Add some tasks to get started'
      };
      return messages[key] || (() => key);
    }
  })
}));

vi.mock('$lib/services/task-list-service', () => ({
  TaskListService: {
    getTaskCountText: (count: number) => `${count} tasks`
  }
}));

vi.mock('$lib/components/ui/sidebar/context.svelte.js', () => ({
  useSidebar: () => ({
    isMobile: false,
    toggle: vi.fn()
  })
}));

// 子コンポーネントをモック
vi.mock('$lib/components/task/core/task-item.svelte', () => ({
  default: () => ({ render: () => '<div data-testid="task-item">Task Item</div>' })
}));

vi.mock('$lib/components/task/forms/task-add-form.svelte', () => ({
  default: () => ({ render: () => '<div data-testid="task-add-form">Task Add Form</div>' })
}));

vi.mock('$lib/components/shared/button.svelte', () => ({
  default: () => ({ render: () => '<button data-testid="mock-button">Button</button>' })
}));

vi.mock('lucide-svelte', () => ({
  Plus: () => ({ render: () => '<svg data-testid="plus-icon">Plus</svg>' }),
  PanelLeft: () => ({ render: () => '<svg data-testid="panel-left-icon">PanelLeft</svg>' })
}));

describe('TaskList', () => {
  const mockTask: TaskWithSubTasks = {
    id: 'task-1',
    title: 'Test Task',
    description: 'Test description',
    status: 'not_started' as const,
    priority: 2,
    start_date: new Date('2024-01-01'),
    end_date: new Date('2024-01-02'),
    is_range_date: true,
    created_at: new Date('2024-01-01'),
    updated_at: new Date('2024-01-01'),
    tags: [],
    list_id: 'list-1',
    order_index: 0,
    is_archived: false,
    sub_tasks: []
  };

  const mockTasks: TaskWithSubTasks[] = [
    mockTask,
    {
      ...mockTask,
      id: 'task-2',
      title: 'Another Task'
    }
  ];

  const defaultProps = {
    title: 'My Tasks',
    tasks: mockTasks,
    showAddButton: true,
    onTaskClick: vi.fn() as unknown,
    onSubTaskClick: vi.fn() as unknown
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('基本表示テスト', () => {
    it('タスクリストが正常にレンダリングされる', () => {
      const { container } = render(TaskList, { props: defaultProps });
      
      expect(container.innerHTML).toBeTruthy();
      expect(container.innerHTML.length).toBeGreaterThan(100);
    });

    it('data-testidが設定される', () => {
      const { container } = render(TaskList, { props: defaultProps });
      
      expect(container.innerHTML).toContain('data-testid="task-list"');
    });

    it('タイトルが表示される', () => {
      const { container } = render(TaskList, { props: defaultProps });
      
      expect(container.innerHTML).toContain('My Tasks');
    });

    it('タスク数が表示される', () => {
      const { container } = render(TaskList, { props: defaultProps });
      
      expect(container.innerHTML).toContain('2 tasks');
    });

    it('フレックスレイアウトが適用される', () => {
      const { container } = render(TaskList, { props: defaultProps });
      
      expect(container.innerHTML).toContain('flex h-full w-full flex-col');
    });
  });

  describe('タスク表示テスト', () => {
    it('タスクがある場合、タスクアイテムが表示される', () => {
      const { container } = render(TaskList, { props: defaultProps });
      
      expect(container.innerHTML).toContain('data-testid="task-items"');
    });

    it('タスクがない場合、空状態メッセージが表示される', () => {
      const props = { ...defaultProps, tasks: [] };
      const { container } = render(TaskList, { props });
      
      expect(container.innerHTML).toContain('No tasks found');
    });

    it('検索ビューの場合、適切なメッセージが表示される', () => {
      const props = { ...defaultProps, title: 'Search: test', tasks: [] };
      const { container } = render(TaskList, { props });
      
      expect(container.innerHTML).toContain('No search results');
      expect(container.innerHTML).toContain('🔍');
    });

    it('通常ビューの場合、適切なメッセージが表示される', () => {
      const props = { ...defaultProps, tasks: [] };
      const { container } = render(TaskList, { props });
      
      expect(container.innerHTML).toContain('No tasks found');
      expect(container.innerHTML).toContain('📝');
    });
  });

  describe('追加ボタンテスト', () => {
    it('showAddButtonがtrueの場合、ボタンエリアが存在する', () => {
      const { container } = render(TaskList, { props: defaultProps });
      
      // showAddButtonがtrueの場合、ボタンエリアが存在することを確認
      expect(container.innerHTML).toContain('flex-shrink-0 items-center gap-2');
    });

    it('showAddButtonがfalseの場合、適切にレンダリングされる', () => {
      const props = { ...defaultProps, showAddButton: false };
      const { container } = render(TaskList, { props });
      
      // falseの場合でも正常にレンダリングされる
      expect(container.innerHTML).toBeTruthy();
    });
  });

  describe('空状態メッセージテスト', () => {
    it('通常の空状態でshowAddButtonがtrueの場合、適切なメッセージが表示される', () => {
      const props = { ...defaultProps, tasks: [], showAddButton: true };
      const { container } = render(TaskList, { props });
      
      expect(container.innerHTML).toContain('Click + to add a task');
    });

    it('通常の空状態でshowAddButtonがfalseの場合、適切なメッセージが表示される', () => {
      const props = { ...defaultProps, tasks: [], showAddButton: false };
      const { container } = render(TaskList, { props });
      
      expect(container.innerHTML).toContain('Add some tasks to get started');
    });

    it('検索結果の空状態の場合、適切なメッセージが表示される', () => {
      const props = { ...defaultProps, title: 'Search Results', tasks: [] };
      const { container } = render(TaskList, { props });
      
      expect(container.innerHTML).toContain('Try a different search');
    });
  });

  describe('レスポンシブテスト', () => {
    it('レスポンシブクラスが適用される', () => {
      const { container } = render(TaskList, { props: defaultProps });
      
      // レスポンシブに関連するクラスが存在することを確認
      expect(container.innerHTML).toContain('min-w-0');
      expect(container.innerHTML).toContain('flex-1');
    });

    it('デスクトップ環境の場合、モバイル用トグルボタンが表示されない', () => {
      const { container } = render(TaskList, { props: defaultProps });
      
      // デスクトップ環境でモバイル専用ボタンが表示されない
      expect(container.innerHTML).not.toContain('data-testid="mobile-sidebar-toggle"');
    });
  });

  describe('プロパティバリエーションテスト', () => {
    it('デフォルトプロパティで正常にレンダリングされる', () => {
      const { container } = render(TaskList, { props: {} });
      
      expect(container.innerHTML).toBeTruthy();
      expect(container.innerHTML).toContain('Tasks'); // デフォルトタイトル
    });

    it('異なるタイトルで正常にレンダリングされる', () => {
      const props = { ...defaultProps, title: 'Custom Title' };
      const { container } = render(TaskList, { props });
      
      expect(container.innerHTML).toContain('Custom Title');
    });

    it('空のタスク配列で正常にレンダリングされる', () => {
      const props = { ...defaultProps, tasks: [] };
      const { container } = render(TaskList, { props });
      
      expect(container.innerHTML).toBeTruthy();
      expect(container.innerHTML).toContain('0 tasks');
    });

    it('単一のタスクで正常にレンダリングされる', () => {
      const props = { ...defaultProps, tasks: [mockTask] };
      const { container } = render(TaskList, { props });
      
      expect(container.innerHTML).toBeTruthy();
      expect(container.innerHTML).toContain('1 tasks');
    });

    it('大量のタスクで正常にレンダリングされる', () => {
      const manyTasks = Array.from({ length: 100 }, (_, i) => ({
        ...mockTask,
        id: `task-${i}`,
        title: `Task ${i}`
      }));
      const props = { ...defaultProps, tasks: manyTasks };
      const { container } = render(TaskList, { props });
      
      expect(container.innerHTML).toBeTruthy();
      expect(container.innerHTML).toContain('100 tasks');
    });
  });

  describe('コールバック関数テスト', () => {
    it('コールバック関数が提供された場合、正常にレンダリングされる', () => {
      const callbacks = {
        onTaskClick: vi.fn() as unknown,
        onSubTaskClick: vi.fn() as unknown
      };
      const props = { ...defaultProps, ...callbacks };
      const { container } = render(TaskList, { props });
      
      expect(container.innerHTML).toBeTruthy();
    });

    it('コールバック関数が提供されない場合、正常にレンダリングされる', () => {
      const props = {
        ...defaultProps,
        onTaskClick: undefined,
        onSubTaskClick: undefined
      };
      const { container } = render(TaskList, { props });
      
      expect(container.innerHTML).toBeTruthy();
    });
  });

  describe('特殊なタイトルテスト', () => {
    it('検索プレフィックス付きタイトルで正常にレンダリングされる', () => {
      const searchTitles = [
        'Search: important',
        'Search Results',
        'Search: project:work'
      ];

      searchTitles.forEach(title => {
        const props = { ...defaultProps, title, tasks: [] };
        const { container } = render(TaskList, { props });
        
        expect(container.innerHTML).toBeTruthy();
        expect(container.innerHTML).toContain(title);
      });
    });

    it('長いタイトルでも正常にレンダリングされる', () => {
      const longTitle = 'This is a very long title that might cause layout issues if not handled properly';
      const props = { ...defaultProps, title: longTitle };
      const { container } = render(TaskList, { props });
      
      expect(container.innerHTML).toBeTruthy();
      expect(container.innerHTML).toContain('truncate'); // 省略表示のクラス
    });

    it('空のタイトルでも正常にレンダリングされる', () => {
      const props = { ...defaultProps, title: '' };
      const { container } = render(TaskList, { props });
      
      expect(container.innerHTML).toBeTruthy();
    });
  });

  describe('エラー状態・エッジケーステスト', () => {
    it('不正な形式のタスクでもエラーにならない', () => {
      const invalidTask = {
        id: 'invalid',
        title: '',
        description: null as unknown,
        status: -1,
        priority: 999,
        start_date: null as unknown,
        end_date: null as unknown,
        is_range_date: null as unknown,
        project_id: '',
        task_list_id: '',
        created_at: null as unknown,
        updated_at: null as unknown,
        sub_tasks: null as unknown
      };
      
      const props = { ...defaultProps, tasks: [invalidTask as unknown] };
      const { container } = render(TaskList, { props });
      
      expect(container.innerHTML).toBeTruthy();
    });

    it('コンポーネントが正常にマウント・アンマウントできる', () => {
      const { container, unmount } = render(TaskList, { props: defaultProps });
      
      expect(container.innerHTML).toBeTruthy();
      
      // アンマウントしてもエラーが発生しない
      expect(() => unmount()).not.toThrow();
    });

    it('undefinedプロパティでも正常にレンダリングされる', () => {
      const props = {
        title: undefined,
        tasks: undefined,
        showAddButton: undefined,
        onTaskClick: undefined,
        onSubTaskClick: undefined
      };
      
      const { container } = render(TaskList, { props });
      expect(container.innerHTML).toBeTruthy();
    });

    it('オーバーフロー処理が適用される', () => {
      const { container } = render(TaskList, { props: defaultProps });
      
      expect(container.innerHTML).toContain('overflow-hidden');
      expect(container.innerHTML).toContain('overflow-auto');
    });

    it('最小幅制約が適用される', () => {
      const { container } = render(TaskList, { props: defaultProps });
      
      expect(container.innerHTML).toContain('min-w-0');
    });
  });
});