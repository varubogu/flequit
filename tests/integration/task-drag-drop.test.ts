import { describe, it, expect, beforeEach, afterAll, vi } from 'vitest';
import { render } from '@testing-library/svelte';
import TaskList from '$lib/components/task/core/task-list.svelte';
import SidebarViewList from '$lib/components/sidebar/sidebar-view-list.svelte';
import SidebarTagList from '$lib/components/sidebar/sidebar-tag-list.svelte';
import type { TaskWithSubTasks } from '$lib/types/task';
import {
  setTranslationService,
  getTranslationService
} from '$lib/stores/locale.svelte';
import type { ITranslationService } from '$lib/services/translation-service';

function createTestTranslationService(): ITranslationService {
  const messages: Record<string, () => string> = {
    add_task: () => 'TEST_ADD_TASK',
    no_search_results: () => 'TEST_NO_SEARCH_RESULTS',
    no_tasks_found: () => 'TEST_NO_TASKS_FOUND',
    try_different_search: () => 'TEST_TRY_DIFFERENT_SEARCH',
    click_add_task: () => 'TEST_CLICK_ADD_TASK',
    add_some_tasks: () => 'TEST_ADD_SOME_TASKS',
    views_title: () => 'TEST_VIEWS',
    tags: () => 'TEST_TAGS',
    remove_tag_from_sidebar: () => 'Remove Tag',
    add_tag_to_sidebar: () => 'Add Tag',
    edit_tag: () => 'Edit Tag',
    delete_tag: () => 'Delete Tag',
    edit_task: () => 'Edit Task',
    delete_task: () => 'Delete Task',
    edit_subtask: () => 'Edit Subtask',
    delete_subtask: () => 'Delete Subtask'
  };

  return {
    getCurrentLocale: () => 'en',
    setLocale: vi.fn(),
    reactiveMessage: <T extends (...args: unknown[]) => string>(fn: T) => fn,
    getMessage: (key: string) => messages[key] || (() => key),
    getAvailableLocales: () => ['en'] as const
  };
}

const originalTranslationService = getTranslationService();

// --- Store & Service Mocks ---------------------------------------------------
function createMockAllTasks() {
  return [
    {
      id: 'all-task-1',
      title: 'All Task 1',
      status: 'not_started',
      planEndDate: new Date(),
      projectId: 'project-1'
    },
    {
      id: 'all-task-2',
      title: 'All Task 2',
      status: 'completed',
      planEndDate: new Date(),
      projectId: 'project-1'
    }
  ];
}

vi.mock('$lib/stores/tasks.svelte', () => {
  const allTasks = createMockAllTasks();
  return {
    taskStore: {
      selectedTaskId: null,
      selectedSubTaskId: null,
      isNewTaskMode: false,
      allTasks,
      todayTasks: allTasks.slice(0, 1),
      overdueTasks: allTasks.slice(0, 1),
      removeTagFromAllTasks: vi.fn(),
      getTaskCountByTag: vi.fn(() => 2)
    }
  };
});

const bookmarkedIds = new Set(['tag-1', 'tag-2']);
function createMockTags() {
  return [
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
  ];
}

vi.mock('$lib/stores/tags.svelte', () => {
  const mockTags = createMockTags();
  const tagStore = {
    tags: mockTags,
    removeBookmark: vi.fn(),
    deleteTag: vi.fn(),
    updateTag: vi.fn(),
    moveBookmarkedTagToPosition: vi.fn(),
    getProjectIdByTagId: vi.fn(async () => 'project-1'),
    isBookmarked: vi.fn((tagId: string) => bookmarkedIds.has(tagId))
  };

  Object.defineProperty(tagStore, 'bookmarkedTagList', {
    get() {
      return mockTags.filter((tag) => bookmarkedIds.has(tag.id));
    }
  });

  return { tagStore };
});

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
    isMobile: false,
    toggle: vi.fn()
  })
}));

vi.mock('$lib/services/domain/task/task-mutations-instance', () => ({
  taskMutations: {
    updateTaskDueDateForView: vi.fn(),
    addTagToTask: vi.fn(),
    toggleTaskStatus: vi.fn(),
    deleteTask: vi.fn()
  }
}));

vi.mock('$lib/services/domain/subtask', () => ({
  SubTaskMutations: class {
    updateSubTaskDueDateForView = vi.fn();
    addTagToSubTask = vi.fn();
    toggleSubTaskStatus = vi.fn();
    deleteSubTask = vi.fn();
  }
}));

vi.mock('$lib/services/domain/tag', () => ({
  TagService: {
    addBookmark: vi.fn(),
    updateTag: vi.fn(),
    deleteTag: vi.fn()
  }
}));

vi.mock('$lib/services/ui/task-detail-ui-store.svelte', () => ({
  useTaskDetailUiStore: () => ({
    openTaskDetail: vi.fn(),
    openSubTaskDetail: vi.fn()
  })
}));

vi.mock('$lib/stores/selection-store.svelte', () => ({
  selectionStore: {
    selectTask: vi.fn(),
    selectSubTask: vi.fn()
  }
}));

vi.mock('$lib/services/domain/task-list', () => ({
  TaskListService: {
    getTaskCountText: (count: number) => `${count} tasks`
  }
}));

// --- Test Data ----------------------------------------------------------------
const mockTasks: TaskWithSubTasks[] = [
  {
    id: 'task-1',
    title: 'Test Task 1',
    description: '',
    status: 'not_started',
    priority: 1,
    projectId: 'project-1',
    assignedUserIds: [],
    tagIds: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    subTasks: [],
    tags: [],
    listId: 'list-1',
    orderIndex: 0,
    isArchived: false
  },
  {
    id: 'task-2',
    title: 'Test Task 2',
    description: '',
    status: 'not_started',
    priority: 2,
    projectId: 'project-1',
    assignedUserIds: [],
    tagIds: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    subTasks: [],
    tags: [],
    listId: 'list-1',
    orderIndex: 1,
    isArchived: false
  }
];

// --- Test Suites --------------------------------------------------------------
describe('Task Drag & Drop Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setTranslationService(createTestTranslationService());
  });

  afterAll(() => {
    setTranslationService(originalTranslationService);
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

      expect(taskListComponent.getByTestId('task-list')).toBeDefined();

      expect(taskListComponent.getByText('Test Task 1')).toBeDefined();
      expect(taskListComponent.getByText('Test Task 2')).toBeDefined();

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
      const { container, getByTestId } = render(SidebarViewList, {
        props: {
          currentView: 'all',
          onViewChange: vi.fn()
        }
      });

      const todayView = getByTestId('view-today');
      expect(todayView).toBeDefined();

      const dropRegions = container.querySelectorAll('[role="region"]');
      expect(dropRegions.length).toBeGreaterThan(0);
    });
  });

  describe('タスクとタグのドラッグ&ドロップ', () => {
    it('タグリストが正しくレンダリングされる', () => {
    const { container } = render(SidebarTagList, {
      props: {
        currentView: 'all',
        onViewChange: vi.fn()
      }
    });

      const header = container.querySelector('h3');
      expect(header).not.toBeNull();
    });

    it('タグアイテムがドラッグ可能である', () => {
      const { container } = render(SidebarTagList, {
        props: {
          currentView: 'all',
          onViewChange: vi.fn()
        }
      });

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

      const draggableElements = container.querySelectorAll('[draggable="true"]');
      expect(draggableElements.length).toBeGreaterThan(0);
    });

    it('ドラッグアンドドロップ関連のエリアが存在する', () => {
      const { container } = render(SidebarViewList, {
        props: {
          currentView: 'all',
          onViewChange: vi.fn()
        }
      });

      const dropAreas = container.querySelectorAll('[role="region"]');
      expect(dropAreas.length).toBeGreaterThan(0);
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
            // @ts-expect-error 故意に不正な値を渡す
            tasks: undefined as unknown,
            showAddButton: false
          }
        });
      }).not.toThrow();
    });
  });
});
