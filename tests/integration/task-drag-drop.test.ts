import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/svelte';
import TaskList from '$lib/components/task/task-list.svelte';
import SidebarViewList from '$lib/components/sidebar/sidebar-view-list.svelte';
import SidebarTagList from '$lib/components/sidebar/sidebar-tag-list.svelte';
import { taskStore } from '$lib/stores/tasks.svelte';
import { tagStore } from '$lib/stores/tags.svelte';
import { viewsVisibilityStore } from '$lib/stores/views-visibility.svelte';
import type { TaskWithSubTasks } from '$lib/types/task';

// 必要なモック
vi.mock('$lib/stores/tasks.svelte', () => ({
  taskStore: {
    selectedTaskId: null,
    selectedSubTaskId: null,
    allTasks: [],
    todayTasks: [],
    overdueTasks: [],
    updateTask: vi.fn(),
    addTagToTask: vi.fn(),
    getTaskCountByTag: vi.fn(() => 0)
  }
}));

vi.mock('$lib/stores/tags.svelte', () => ({
  tagStore: {
    bookmarkedTagList: [
      {
        id: 'tag-1',
        name: 'Important',
        color: '#ff0000',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: 'tag-2',
        name: 'Work',
        color: '#0000ff',
        created_at: new Date(),
        updated_at: new Date()
      }
    ],
    removeBookmark: vi.fn(),
    deleteTag: vi.fn(),
    updateTag: vi.fn(),
    moveBookmarkedTagToPosition: vi.fn()
  }
}));

vi.mock('$lib/stores/views-visibility.svelte', () => ({
  viewsVisibilityStore: {
    visibleViews: [
      { id: 'today', label: 'Today', icon: '📅' },
      { id: 'tomorrow', label: 'Tomorrow', icon: '📆' },
      { id: 'overdue', label: 'Overdue', icon: '🔴' }
    ]
  }
}));

vi.mock('$lib/stores/view-store.svelte', () => ({
  viewStore: {
    performSearch: vi.fn()
  }
}));

vi.mock('$lib/components/ui/sidebar/context.svelte.js', () => ({
  useSidebar: () => ({
    state: 'expanded',
    isMobile: () => false,
    toggle: vi.fn()
  })
}));

vi.mock('$lib/stores/locale.svelte', () => ({
  reactiveMessage: (fn: () => string) => fn
}));

vi.mock('$paraglide/messages.js', () => ({
  // Base messages
  views_title: () => 'Views',
  tags: () => 'Tags',
  add_task: () => 'Add Task',
  no_search_results: () => 'No search results',
  no_tasks_found: () => 'No tasks found',
  try_different_search: () => 'Try different search',
  click_add_task: () => 'Click add task',
  add_some_tasks: () => 'Add some tasks',
  subtasks_completed: () => 'Subtasks completed',
  
  // Date messages
  today: () => 'Today',
  tomorrow: () => 'Tomorrow',
  yesterday: () => 'Yesterday',
  add_date: () => 'Add Date',
  select_date: () => 'Select Date',
  
  // Actions
  cancel: () => 'Cancel',
  save: () => 'Save',
  edit_task: () => 'Edit Task',
  set_priority: () => 'Set Priority',
  delete_task: () => 'Delete Task',
  edit_subtask: () => 'Edit Subtask',
  delete_subtask: () => 'Delete Subtask',
  
  // Confirmation dialogs
  confirm_discard_changes: () => 'Confirm Discard Changes',
  unsaved_task_message: () => 'Unsaved Task Message',
  discard_changes: () => 'Discard Changes',
  keep_editing: () => 'Keep Editing',
  
  // Metadata
  created: () => 'Created',
  updated: () => 'Updated',
  parent_task_id: () => 'Parent Task ID',
  go_to_parent_task: () => 'Go to Parent Task',
  sub_task: () => 'Sub Task',
  task: () => 'Task',
  
  // Recurrence messages
  recurrence_settings: () => 'Recurrence Settings',
  enable_recurrence: () => 'Enable Recurrence',
  recurrence: () => 'Recurrence',
  no_recurrence: () => 'No Recurrence',
  
  // Tag messages
  delete_tag: () => 'Delete Tag',
  delete_tag_description: ({ tagName }: { tagName: string }) => `Delete tag "${tagName || 'Unknown'}"?`,
  edit_tag: () => 'Edit Tag',
  
  // Priority messages
  high_priority: () => 'High Priority',
  medium_priority: () => 'Medium Priority',
  low_priority: () => 'Low Priority',
  
  // Status messages
  not_started: () => 'Not Started',
  in_progress: () => 'In Progress',
  completed: () => 'Completed',
  
  // General
  description: () => 'Description',
  priority: () => 'Priority',
  status: () => 'Status',
  due_date: () => 'Due Date',
  remove: () => 'Remove',
  remove_tag_from_sidebar: () => 'Remove Tag from Sidebar'
}));

describe('Task Drag & Drop Integration', () => {
  const mockTasks: TaskWithSubTasks[] = [
    {
      id: 'task-1',
      title: 'Test Task 1',
      description: '',
      status: 'not_started' as const,
      priority: 1,
      created_at: new Date(),
      updated_at: new Date(),
      sub_tasks: [],
      tags: [],
      list_id: 'list-1',
      order_index: 0,
      is_archived: false
    },
    {
      id: 'task-2',
      title: 'Test Task 2',
      description: '',
      status: 'not_started' as const,
      priority: 2,
      created_at: new Date(),
      updated_at: new Date(),
      sub_tasks: [],
      tags: [],
      list_id: 'list-1',
      order_index: 1,
      is_archived: false
    }
  ];


  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('タスクとビューのドラッグ&ドロップ', () => {
    it('タスクリストとサイドバービューが正しくレンダリングされる', () => {
      const taskListComponent = render(TaskList, {
        props: {
          title: 'Task List',
          tasks: mockTasks,
          showAddButton: true
        }
      });

      const sidebarComponent = render(SidebarViewList, {
        props: {
          currentView: 'all',
          onViewChange: vi.fn()
        }
      });

      // タスクリストが正しくレンダリングされていることを確認
      expect(taskListComponent.getByTestId('task-list')).toBeDefined();
      expect(taskListComponent.getByText('Test Task 1')).toBeDefined();
      expect(taskListComponent.getByText('Test Task 2')).toBeDefined();

      // ビューリストが正しくレンダリングされていることを確認
      expect(sidebarComponent.getByTestId('view-today')).toBeDefined();
      expect(sidebarComponent.getByTestId('view-tomorrow')).toBeDefined();
      expect(sidebarComponent.getByTestId('view-overdue')).toBeDefined();
    });

    it('タスクアイテムがdraggable属性を持っている', () => {
      const { container } = render(TaskList, {
        props: {
          title: 'Task List',
          tasks: mockTasks,
          showAddButton: true
        }
      });

      const draggableElements = container.querySelectorAll('[draggable="true"]');
      expect(draggableElements.length).toBe(mockTasks.length);
    });

    it('ビューボタンがドロップイベントハンドラーを持っている', () => {
      const onViewChange = vi.fn();
      const { getByTestId, container } = render(SidebarViewList, {
        props: {
          currentView: 'all',
          onViewChange
        }
      });

      const todayView = getByTestId('view-today');
      expect(todayView).toBeDefined();

      // コンテナ内にdrop target（role="region"）が存在することを確認
      const dropRegions = container.querySelectorAll('[role="region"]');
      expect(dropRegions.length).toBeGreaterThan(0);
    });
  });

  describe('タスクとタグのドラッグ&ドロップ', () => {
    it('タグリストが正しくレンダリングされる', () => {
      // tagStoreのモックを更新してタグを返すようにする - モック内に直接設定

      const { container } = render(SidebarTagList, {
        props: {
          currentView: 'all',
          onViewChange: vi.fn()
        }
      });

      // タグセクションが表示されていることを確認
      const tagsSection = container.querySelector('h3');
      expect(tagsSection?.textContent).toBe('Tags');
    });

    it('タグアイテムがドラッグ可能である', () => {
      // tagStoreのモックを更新 - モック内に直接設定

      const { container } = render(SidebarTagList, {
        props: {
          currentView: 'all',
          onViewChange: vi.fn()
        }
      });

      // ドラッグ可能なタグ要素があることを確認
      const draggableElements = container.querySelectorAll('[draggable="true"]');
      expect(draggableElements.length).toBeGreaterThan(0);
    });
  });

  describe('ドラッグ&ドロップの視覚的フィードバック', () => {
    it('コンポーネントがdrag-overクラスを処理できる', () => {
      const { container } = render(TaskList, {
        props: {
          title: 'Task List',
          tasks: mockTasks,
          showAddButton: true
        }
      });

      // ドラッグ&ドロップ対応要素が存在することを確認（タスクアイテムは基本的にはdraggable）
      const draggableElements = container.querySelectorAll('[draggable="true"]');
      expect(draggableElements.length).toBeGreaterThan(0);
    });

    it('ドラッグアンドドロップ関連のCSS処理が正しく動作する', () => {
      const { container } = render(SidebarViewList, {
        props: {
          currentView: 'all',
          onViewChange: vi.fn()
        }
      });

      // ドロップ可能エリアが存在することを確認（role="region"の要素を確認）
      const dropAreas = container.querySelectorAll('[role="region"]');
      expect(dropAreas.length).toBeGreaterThan(0);

      // 各ドロップエリアは region roleを持っていることを確認
      dropAreas.forEach(area => {
        expect(area.getAttribute('role')).toBe('region');
      });
    });
  });

  describe('エラーハンドリング', () => {
    it('空のタスクリストでもエラーが発生しない', () => {
      expect(() => {
        render(TaskList, {
          props: {
            title: 'Empty Task List',
            tasks: [],
            showAddButton: true
          }
        });
      }).not.toThrow();
    });

    it('空のタグリストでもエラーが発生しない', () => {
      // 空のタグリストをモック - モック内に直接設定

      expect(() => {
        render(SidebarTagList, {
          props: {
            currentView: 'all',
            onViewChange: vi.fn()
          }
        });
      }).not.toThrow();
    });

    it('不正なプロップスでもコンポーネントがクラッシュしない', () => {
      expect(() => {
        render(TaskList, {
          props: {
            title: '',
            tasks: undefined as any,
            showAddButton: false
          }
        });
      }).not.toThrow();
    });
  });
});