/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { getTasksForView } from '../../src/lib/services/ui/view/view-queries';
import {
  getViewTitle,
  shouldShowAddButton,
  handleViewChange,
  forceViewChange
} from '../../src/lib/services/ui/view/view-preferences';
import type { ViewStoreDependencies } from '../../src/lib/services/ui/view/types';
import type { TaskWithSubTasks } from '$lib/types/task';

const createTask = (overrides: Partial<TaskWithSubTasks> = {}): TaskWithSubTasks => ({
  id: overrides.id ?? 'task-id',
  projectId: overrides.projectId ?? 'proj-1',
  listId: overrides.listId ?? 'list-1',
  title: overrides.title ?? 'Task',
  description: overrides.description,
  status: overrides.status ?? 'not_started',
  priority: overrides.priority ?? 0,
  planEndDate: overrides.planEndDate,
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

const createDeps = (): ViewStoreDependencies => ({
  taskStore: {
    todayTasks: [],
    overdueTasks: [],
    allTasks: [],
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
});

describe('view helpers', () => {
  let deps: ViewStoreDependencies;
  let taskStore: ViewStoreDependencies['taskStore'];
  let selectionStore: ViewStoreDependencies['selectionStore'];

  let todayTask: TaskWithSubTasks;
  let completedTask: TaskWithSubTasks;
  let futureTask: TaskWithSubTasks;

  beforeEach(() => {
    deps = createDeps();
    taskStore = deps.taskStore;
    selectionStore = deps.selectionStore;

    todayTask = createTask({
      id: 'task-today',
      title: 'Today Task',
      description: 'A task for today',
      planEndDate: new Date(),
      tags: [{ id: 'tag-1', name: 'urgent', createdAt: new Date(), updatedAt: new Date() }],
      tagIds: ['tag-1']
    });

    completedTask = createTask({
      id: 'task-completed',
      title: 'Completed Task',
      status: 'completed'
    });

    futureTask = createTask({
      id: 'task-future',
      title: 'Future Task',
      description: 'A task for the future',
      planEndDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      subTasks: [
        {
          id: 'sub-1',
          taskId: 'task-future',
          title: 'Subtask search test',
          description: 'Contains searchable text',
          status: 'not_started',
          orderIndex: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
          tags: [],
          completed: false,
          assignedUserIds: []
        }
      ]
    });

    taskStore.todayTasks = [todayTask];
    taskStore.overdueTasks = [];
    taskStore.allTasks = [todayTask, completedTask, futureTask];
    taskStore.projects = [
      {
        id: 'project-1',
        name: 'Project Alpha',
        orderIndex: 0,
        isArchived: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        allTags: [],
        taskLists: [
          {
            id: 'list-1',
            projectId: 'project-1',
            name: 'List A',
            description: 'Primary list',
            color: '#fff',
            orderIndex: 0,
            isArchived: false,
            createdAt: new Date(),
            updatedAt: new Date(),
            tasks: [todayTask, completedTask]
          },
          {
            id: 'list-2',
            projectId: 'project-1',
            name: 'List B',
            description: 'Secondary list',
            color: '#eee',
            orderIndex: 1,
            isArchived: false,
            createdAt: new Date(),
            updatedAt: new Date(),
            tasks: [futureTask]
          }
        ]
      }
    ];
  });

  describe('getTasksForView', () => {
    test("returns all tasks for 'all' view", () => {
      expect(getTasksForView('all', '', deps)).toEqual(taskStore.allTasks);
    });

    test("returns today tasks for 'today' view", () => {
      expect(getTasksForView('today', '', deps)).toEqual([todayTask]);
    });

    test("returns overdue tasks for 'overdue' view", () => {
      const overdueTask = createTask({
        id: 'task-overdue',
        planEndDate: new Date(Date.now() - 86400000)
      });
      taskStore.overdueTasks = [overdueTask];

      expect(getTasksForView('overdue', '', deps)).toEqual([overdueTask]);
    });

    test("returns completed tasks for 'completed' view", () => {
      expect(getTasksForView('completed', '', deps)).toEqual([completedTask]);
    });

    test('returns project tasks when project selected', () => {
      taskStore.selectedProjectId = 'project-1';
      expect(getTasksForView('project', '', deps)).toEqual([todayTask, completedTask, futureTask]);
    });

    test('returns list tasks when list selected', () => {
      taskStore.selectedProjectId = 'project-1';
      taskStore.selectedListId = 'list-1';

      expect(getTasksForView('project', '', deps)).toEqual([todayTask, completedTask]);
    });

    test('returns empty array when no selection for project view', () => {
      expect(getTasksForView('project', '', deps)).toEqual([]);
    });

    test('searches title, description, subtasks, and tags', () => {
      expect(getTasksForView('search', 'future', deps)).toEqual([futureTask]);
      expect(getTasksForView('search', 'subtask', deps)).toEqual([futureTask]);
      expect(getTasksForView('search', 'today', deps)).toEqual([todayTask]);
      expect(getTasksForView('search', 'urgent', deps)).toEqual([todayTask]);
    });

    test("supports tag search with '#' prefix", () => {
      expect(getTasksForView('search', '#urgent', deps)).toEqual([todayTask]);
      expect(getTasksForView('search', '#', deps)).toEqual([todayTask]);
    });

    test('returns all tasks for empty search query', () => {
      expect(getTasksForView('search', '', deps)).toEqual(taskStore.allTasks);
    });

    test("returns tomorrow tasks for 'tomorrow' view", () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowTask = createTask({ id: 'task-tomorrow', planEndDate: tomorrow });
      taskStore.allTasks = [...taskStore.allTasks, tomorrowTask];

      const result = getTasksForView('tomorrow', '', deps);
      expect(result).toContain(tomorrowTask);
      expect(result.every((task) => task.status !== 'completed')).toBe(true);
    });

    test('returns tasks due within next 3 days', () => {
      const inTwoDays = new Date();
      inTwoDays.setDate(inTwoDays.getDate() + 2);
      const task = createTask({ id: 'task-next3', planEndDate: inTwoDays });
      taskStore.allTasks = [...taskStore.allTasks, task];

      expect(getTasksForView('next3days', '', deps)).toContain(task);
    });

    test('returns tasks due within next week', () => {
      const inFiveDays = new Date();
      inFiveDays.setDate(inFiveDays.getDate() + 5);
      const task = createTask({ id: 'task-nextweek', planEndDate: inFiveDays });
      taskStore.allTasks = [...taskStore.allTasks, task];

      expect(getTasksForView('nextweek', '', deps)).toContain(task);
    });

    test('returns tasks due within this month', () => {
      const endOfMonth = new Date();
      endOfMonth.setDate(28);
      const task = createTask({ id: 'task-thismonth', planEndDate: endOfMonth });
      taskStore.allTasks = [...taskStore.allTasks, task];

      expect(getTasksForView('thismonth', '', deps)).toContain(task);
    });
  });

  describe('getViewTitle', () => {
    test('returns localized titles', () => {
      expect(getViewTitle('today', '', deps)).toBe('Today');
      expect(getViewTitle('overdue', '', deps)).toBe('Overdue');
    });

    test('returns project title when project selected', () => {
      taskStore.selectedProjectId = 'project-1';
      expect(getViewTitle('project', '', deps)).toBe('Project Alpha');
    });

    test('returns project > list when list selected', () => {
      taskStore.selectedProjectId = 'project-1';
      taskStore.selectedListId = 'list-1';

      expect(getViewTitle('tasklist', '', deps)).toBe('Project Alpha > List A');
    });

    test('returns search query in title', () => {
      expect(getViewTitle('search', 'My Query', deps)).toBe('Search: "My Query"');
      expect(getViewTitle('search', '', deps)).toBe('All Tasks');
    });
  });

  describe('shouldShowAddButton', () => {
    test('returns true for views that allow adding tasks', () => {
      const views: Array<
        'all' | 'project' | 'tasklist' | 'tomorrow' | 'next3days' | 'nextweek' | 'thismonth'
      > = ['all', 'project', 'tasklist', 'tomorrow', 'next3days', 'nextweek', 'thismonth'];

      for (const view of views) {
        expect(shouldShowAddButton(view)).toBe(true);
      }
    });

    test('returns false for read-only views', () => {
      const views: Array<'today' | 'overdue' | 'completed' | 'search'> = [
        'today',
        'overdue',
        'completed',
        'search'
      ];

      for (const view of views) {
        expect(shouldShowAddButton(view)).toBe(false);
      }
    });
  });

  describe('handleViewChange', () => {
    test('clears task selection on change', () => {
      const result = handleViewChange('all', deps);

      expect(result).toBe(true);
      expect(selectionStore.selectTask).toHaveBeenCalledWith(null);
      expect(selectionStore.selectProject).toHaveBeenCalledWith(null);
      expect(selectionStore.selectList).toHaveBeenCalledWith(null);
    });

    test('keeps project and list selection for project view', () => {
      const result = handleViewChange('project', deps);

      expect(result).toBe(true);
      expect(selectionStore.selectProject).not.toHaveBeenCalled();
      expect(selectionStore.selectList).not.toHaveBeenCalled();
    });

    test('returns false when new task mode active', () => {
      taskStore.isNewTaskMode = true;
      const result = handleViewChange('all', deps);

      expect(result).toBe(false);
      expect(selectionStore.selectTask).not.toHaveBeenCalled();
    });
  });

  describe('forceViewChange', () => {
    test('cancels new task mode and clears selections', () => {
      taskStore.isNewTaskMode = true;

      forceViewChange('all', deps);

      expect(deps.taskInteractions.cancelNewTaskMode).toHaveBeenCalled();
      expect(selectionStore.selectTask).toHaveBeenCalledWith(null);
      expect(selectionStore.selectProject).toHaveBeenCalledWith(null);
      expect(selectionStore.selectList).toHaveBeenCalledWith(null);
    });

    test('preserves project selection for project view', () => {
      forceViewChange('project', deps);

      expect(selectionStore.selectProject).not.toHaveBeenCalled();
      expect(selectionStore.selectList).not.toHaveBeenCalled();
    });
  });
});
