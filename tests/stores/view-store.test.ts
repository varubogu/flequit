import { describe, test, expect, beforeEach, vi } from 'vitest';
import {
  ViewStore,
  type ViewStoreDependencies
} from '../../src/lib/stores/view-store.svelte';
import type { TaskWithSubTasks } from '$lib/types/task';

const createTask = (overrides: Partial<TaskWithSubTasks> = {}): TaskWithSubTasks => ({
  id: overrides.id ?? 'task-1',
  projectId: overrides.projectId ?? 'proj-1',
  listId: overrides.listId ?? 'list-1',
  title: overrides.title ?? 'Task',
  description: overrides.description ?? 'description',
  status: overrides.status ?? 'not_started',
  priority: overrides.priority ?? 0,
  planEndDate: overrides.planEndDate ?? undefined,
  planStartDate: overrides.planStartDate,
  isRangeDate: overrides.isRangeDate ?? false,
  orderIndex: overrides.orderIndex ?? 0,
  isArchived: overrides.isArchived ?? false,
  createdAt: overrides.createdAt ?? new Date(),
  updatedAt: overrides.updatedAt ?? new Date(),
  assignedUserIds: overrides.assignedUserIds ?? [],
  tagIds: overrides.tagIds ?? [],
  tags: overrides.tags ?? [],
  subTasks: overrides.subTasks ?? [],
  recurrenceRule: overrides.recurrenceRule
});

const createDeps = () => {
  const todayTasks: TaskWithSubTasks[] = [];
  const overdueTasks: TaskWithSubTasks[] = [];
  const allTasks: TaskWithSubTasks[] = [];

  const deps: ViewStoreDependencies = {
    taskStore: {
      get todayTasks() {
        return todayTasks;
      },
      get overdueTasks() {
        return overdueTasks;
      },
      get allTasks() {
        return allTasks;
      },
      projects: [],
      selectedProjectId: null,
      selectedListId: null,
      isNewTaskMode: false
    } as ViewStoreDependencies['taskStore'],
    taskInteractions: {
      cancelNewTaskMode: vi.fn()
    },
    selectionStore: {
      selectTask: vi.fn(),
      selectProject: vi.fn(),
      selectList: vi.fn()
    },
    translationService: {
      getMessage: vi.fn((key: string) => {
        const messages: Record<string, () => string> = {
          all_tasks: () => 'All Tasks',
          today: () => 'Today',
          overdue: () => 'Overdue',
          completed: () => 'Completed',
          tomorrow: () => 'Tomorrow',
          next_3_days: () => 'Next 3 Days',
          next_week: () => 'Next Week',
          this_month: () => 'This Month'
        };
        return messages[key] ?? (() => key);
      })
    }
  };

  return { deps, todayTasks };
};

describe('ViewStore', () => {
  let deps: ViewStoreDependencies;
  let todayTasks: TaskWithSubTasks[];
  let store: ViewStore;

  beforeEach(() => {
    const context = createDeps();
    deps = context.deps;
    todayTasks = context.todayTasks;
    store = new ViewStore(deps);
  });

  test('initialization sets default state', () => {
    expect(store.currentView).toBe('all');
    expect(store.searchQuery).toBe('');
  });

  describe('computed properties', () => {
    test('tasks returns today tasks when view is today', () => {
      const todayTask = createTask({ id: 'today-task' });
      todayTasks.splice(0, todayTasks.length, todayTask);
      store.currentView = 'today';

      expect(store.tasks).toEqual([todayTask]);
    });

    test('viewTitle uses translation service', () => {
      store.currentView = 'today';
      const title = store.viewTitle;

      expect(deps.translationService.getMessage).toHaveBeenCalledWith('today');
      expect(title).toBe('Today');
    });

    test('showAddButton returns false for completed view', () => {
      store.currentView = 'completed';

      expect(store.showAddButton).toBe(false);
    });
  });

  describe('changeView', () => {
    test('updates view and clears selections when allowed', () => {
      store.searchQuery = 'query';
      store.changeView('today');

      expect(store.currentView).toBe('today');
      expect(store.searchQuery).toBe('');
      expect(deps.selectionStore.selectTask).toHaveBeenCalledWith(null);
      expect(deps.selectionStore.selectProject).toHaveBeenCalledWith(null);
      expect(deps.selectionStore.selectList).toHaveBeenCalledWith(null);
    });

    test('does not clear project or list when switching to project view', () => {
      store.changeView('project');

      expect(deps.selectionStore.selectProject).not.toHaveBeenCalled();
      expect(deps.selectionStore.selectList).not.toHaveBeenCalled();
    });

    test('aborts when new task mode is active', () => {
      deps.taskStore.isNewTaskMode = true;
      store.currentView = 'all';
      store.searchQuery = 'keep';

      store.changeView('today');

      expect(store.currentView).toBe('all');
      expect(store.searchQuery).toBe('keep');
      expect(deps.selectionStore.selectTask).not.toHaveBeenCalled();
    });
  });

  describe('performSearch', () => {
    test('sets search query and switches to search view', () => {
      store.performSearch('keyword');

      expect(store.searchQuery).toBe('keyword');
      expect(store.currentView).toBe('search');
    });

    test('overwrites existing search query', () => {
      store.performSearch('first');
      store.performSearch('second');

      expect(store.searchQuery).toBe('second');
    });
  });
});
