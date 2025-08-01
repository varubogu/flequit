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

vi.mock('$lib/stores/locale.svelte', () => ({
  reactiveMessage: (fn: () => string) => fn
}));

}));

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
});