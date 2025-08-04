import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render } from '@testing-library/svelte';

// 一部のサブコンポーネントをモック
vi.mock('$lib/components/task/task-item.svelte', () => ({ default: () => null }));
vi.mock('$lib/components/task/task-add-form.svelte', () => ({ default: () => null }));

// モック
const mockSidebar = {
  isMobile: false,
  toggle: vi.fn()
};

const mockOnTaskClick = vi.fn();

vi.mock('$lib/components/ui/sidebar/context.svelte.ts', () => ({
  useSidebar: () => mockSidebar
}));

vi.mock('$lib/services/task-list-service', () => ({
  TaskListService: {
    getTaskCountText: vi.fn((count: number) => `${count} items`)
  }
}));

// vitest.setup.tsの統一的なモック化を使用するため、locale.svelteの個別モック化は削除

import TaskList from '$lib/components/task/task-list.svelte';
import type { TaskWithSubTasks } from '$lib/types/task';

describe('TaskList - Responsive Sidebar Toggle', () => {
  const mockTasks: TaskWithSubTasks[] = [
    {
      id: 'task-1',
      title: 'Test Task',
      description: '',
      status: 'not_started',
      priority: 1,
      tags: [],
      list_id: 'list-1',
      order_index: 1,
      is_archived: false,
      created_at: new Date(),
      updated_at: new Date(),
      sub_tasks: []
    }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('モバイル時のサイドバートグルボタン', () => {
    it('モバイル時にはサイドバートグルボタンが表示される', () => {
      // モバイル状態をモック
      mockSidebar.isMobile = true;

      const { getByTestId } = render(TaskList, {
        props: {
          title: 'Test Tasks',
          tasks: mockTasks,
          showAddButton: true,
          onTaskClick: mockOnTaskClick
        }
      });

      const toggleButton = getByTestId('mobile-sidebar-toggle');
      expect(toggleButton).toBeTruthy();
      expect(toggleButton.getAttribute('title')).toBe('Toggle Sidebar');
    });

    it('デスクトップ時にはサイドバートグルボタンが表示されない', () => {
      // デスクトップ状態をモック
      mockSidebar.isMobile = false;

      const { queryByTestId } = render(TaskList, {
        props: {
          title: 'Test Tasks',
          tasks: mockTasks,
          showAddButton: true,
          onTaskClick: mockOnTaskClick
        }
      });

      const toggleButton = queryByTestId('mobile-sidebar-toggle');
      expect(toggleButton).toBeNull();
    });

    it('サイドバートグルボタンクリック時にsidebar.toggleが呼ばれる', () => {
      // モバイル状態をモック
      mockSidebar.isMobile = true;

      const { getByTestId } = render(TaskList, {
        props: {
          title: 'Test Tasks',
          tasks: mockTasks,
          showAddButton: true,
          onTaskClick: mockOnTaskClick
        }
      });

      const toggleButton = getByTestId('mobile-sidebar-toggle');
      toggleButton.click();

      expect(mockSidebar.toggle).toHaveBeenCalledOnce();
    });
  });

  describe('レイアウト', () => {
    it('ヘッダーにタイトルとボタンが正しく配置される', () => {
      // モバイル状態をモック
      mockSidebar.isMobile = true;

      const { container, getByTestId } = render(TaskList, {
        props: {
          title: 'Test Tasks',
          tasks: mockTasks,
          showAddButton: true,
          onTaskClick: mockOnTaskClick
        }
      });

      // ヘッダー要素を確認
      const header = container.querySelector('.border-b');
      expect(header).toBeTruthy();

      // サイドバートグルボタンが左側に配置されている
      const toggleButton = getByTestId('mobile-sidebar-toggle');
      expect(toggleButton).toBeTruthy();

      // タイトルが表示されている
      const title = container.querySelector('h2');
      expect(title?.textContent).toBe('Test Tasks');
    });

    it('空のタスクリストでも正しくレンダリングされる', () => {
      mockSidebar.isMobile = true;

      const { container, getByTestId } = render(TaskList, {
        props: {
          title: 'Empty Tasks',
          tasks: [],
          showAddButton: false,
          onTaskClick: mockOnTaskClick
        }
      });

      // サイドバートグルボタンは表示される
      const toggleButton = getByTestId('mobile-sidebar-toggle');
      expect(toggleButton).toBeTruthy();

      // 空状態のメッセージが表示される
      const emptyMessage = container.querySelector('.text-center');
      expect(emptyMessage).toBeTruthy();
    });
  });

  describe('長文対応とレスポンシブレイアウト', () => {
    it('長いタイトルでも横スクロールが発生しない', () => {
      mockSidebar.isMobile = true;

      const { container } = render(TaskList, {
        props: {
          title:
            'これは非常に長いタイトルです。スマホやタブレットなどの狭い画面でも横スクロールが発生せず、適切に省略表示されることを確認するためのテストケースです。',
          tasks: mockTasks,
          showAddButton: true,
          onTaskClick: mockOnTaskClick
        }
      });

      // TaskListコンテナが適切な制約を持っている
      const taskListContainer = container.querySelector('[data-testid="task-list"]');
      expect(taskListContainer).toBeTruthy();
      expect(taskListContainer).toHaveClass('w-full', 'overflow-hidden');

      // ヘッダーが適切な制約を持っている
      const header = container.querySelector('.border-b');
      expect(header).toBeTruthy();
      expect(header).toHaveClass('w-full', 'min-w-0');
    });

    it('長文タスクを含むリストでもレイアウトが崩れない', () => {
      const longTextTasks: TaskWithSubTasks[] = [
        {
          id: 'long-task-1',
          title:
            'これは非常に長いタスクタイトルです。スマホやタブレットなどの狭い画面でも横スクロールが発生せず、適切に省略表示されることを確認するためのテストケースです。',
          description:
            'これは非常に長いタスクの説明文です。複数行にわたる詳細な説明が含まれており、UI上では適切に省略表示される必要があります。',
          status: 'not_started',
          priority: 1,
          tags: [],
          list_id: 'list-1',
          order_index: 1,
          is_archived: false,
          created_at: new Date(),
          updated_at: new Date(),
          sub_tasks: []
        },
        {
          id: 'long-task-2',
          title:
            'Another very long task title that should be properly handled by the responsive layout system without causing horizontal scrollbar issues',
          description: '',
          status: 'completed',
          priority: 2,
          tags: [],
          list_id: 'list-1',
          order_index: 2,
          is_archived: false,
          created_at: new Date(),
          updated_at: new Date(),
          sub_tasks: []
        }
      ];

      mockSidebar.isMobile = true;

      const { container } = render(TaskList, {
        props: {
          title: 'Long Text Tasks',
          tasks: longTextTasks,
          showAddButton: true,
          onTaskClick: mockOnTaskClick
        }
      });

      // タスクアイテムコンテナが適切な制約を持っている
      const taskItemsContainer = container.querySelector('[data-testid="task-items"]');
      expect(taskItemsContainer).toBeTruthy();
      expect(taskItemsContainer).toHaveClass('min-w-0');
    });

    it('日本語と英語が混在する長文でも適切に処理される', () => {
      const mixedLanguageTasks: TaskWithSubTasks[] = [
        {
          id: 'mixed-1',
          title:
            '日本語タイトル with English mixed content for testing responsive behavior レスポンシブ対応テスト',
          description: 'Mixed language description 日本語説明文 with various characters',
          status: 'not_started',
          priority: 1,
          tags: [],
          list_id: 'list-1',
          order_index: 1,
          is_archived: false,
          created_at: new Date(),
          updated_at: new Date(),
          sub_tasks: []
        }
      ];

      mockSidebar.isMobile = true;

      const { container } = render(TaskList, {
        props: {
          title: 'Mixed Language Tasks 混合言語タスク',
          tasks: mixedLanguageTasks,
          showAddButton: true,
          onTaskClick: mockOnTaskClick
        }
      });

      expect(container.querySelector('[data-testid="task-list"]')).toBeTruthy();
    });

    it('空のタスクリストでも長いタイトルが適切に処理される', () => {
      mockSidebar.isMobile = true;

      const { container } = render(TaskList, {
        props: {
          title:
            'This is an extremely long empty task list title that should be properly truncated and not cause any horizontal overflow issues in mobile responsive design',
          tasks: [],
          showAddButton: false,
          onTaskClick: mockOnTaskClick
        }
      });

      // タイトル要素が適切なクラスを持っている
      const titleElement = container.querySelector('h2');
      expect(titleElement).toBeTruthy();
      expect(titleElement).toHaveClass('truncate');
    });

    it('モバイルとデスクトップでコンテナサイズが適切に設定される', () => {
      const testCases = [
        { isMobile: true, testName: 'モバイル' },
        { isMobile: false, testName: 'デスクトップ' }
      ];

      testCases.forEach(({ isMobile, testName }) => {
        mockSidebar.isMobile = isMobile;

        const { container } = render(TaskList, {
          props: {
            title: `${testName}用テストタスクリスト`,
            tasks: mockTasks,
            showAddButton: true,
            onTaskClick: mockOnTaskClick
          }
        });

        const taskListContainer = container.querySelector('[data-testid="task-list"]');
        expect(taskListContainer).toBeTruthy();
        expect(taskListContainer).toHaveClass('w-full', 'overflow-hidden');
      });
    });
  });
});
