import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { getTasksForView } from '$lib/services/ui/view/view-queries';
import type { TaskWithSubTasks } from '$lib/types/task';
import type { ViewStoreDependencies } from '$lib/services/ui/view/types';
import * as viewDependencies from '$lib/services/ui/view/view-dependencies';
import {
  createMockProjectTree,
  createMockTaskListWithTasks,
  createMockTaskWithSubTasks
} from '../../../utils/mock-factories';

describe('ViewQueries', () => {
  const today = new Date('2024-01-15T12:00:00Z');
  const yesterday = new Date('2024-01-14T12:00:00Z');
  const tomorrow = new Date('2024-01-16T12:00:00Z');
  const threeDaysLater = new Date('2024-01-18T12:00:00Z');
  const oneWeekLater = new Date('2024-01-22T12:00:00Z');
  const endOfMonth = new Date('2024-01-31T23:59:59Z');

  let mockTasks: TaskWithSubTasks[];
  let mockDeps: ViewStoreDependencies;

  beforeEach(() => {
    // Mock current date
    vi.useFakeTimers();
    vi.setSystemTime(today);

    mockTasks = [
      createMockTaskWithSubTasks({
        id: 'task-1',
        title: 'Overdue Task',
        description: 'This is overdue',
        status: 'not_started',
        planEndDate: yesterday,
        orderIndex: 0
      }),
      createMockTaskWithSubTasks({
        id: 'task-2',
        title: 'Today Task',
        description: 'Due today',
        status: 'in_progress',
        planEndDate: today,
        tags: [
          {
            id: 't1',
            name: 'urgent',
            color: '#ff0000',
            createdAt: new Date('2024-01-01'),
            updatedAt: new Date('2024-01-01')
          }
        ],
        orderIndex: 1
      }),
      createMockTaskWithSubTasks({
        id: 'task-3',
        title: 'Tomorrow Task',
        description: '',
        status: 'not_started',
        planEndDate: tomorrow,
        orderIndex: 2
      }),
      createMockTaskWithSubTasks({
        id: 'task-4',
        title: 'Three Days Task',
        description: '',
        status: 'waiting',
        planEndDate: threeDaysLater,
        tags: [
          {
            id: 't2',
            name: 'work',
            color: '#0000ff',
            createdAt: new Date('2024-01-01'),
            updatedAt: new Date('2024-01-01')
          }
        ],
        orderIndex: 3
      }),
      createMockTaskWithSubTasks({
        id: 'task-5',
        title: 'Next Week Task',
        description: '',
        status: 'not_started',
        planEndDate: oneWeekLater,
        orderIndex: 4
      }),
      createMockTaskWithSubTasks({
        id: 'task-6',
        title: 'End of Month Task',
        description: '',
        status: 'not_started',
        planEndDate: endOfMonth,
        orderIndex: 5
      }),
      createMockTaskWithSubTasks({
        id: 'task-7',
        title: 'Completed Task',
        description: 'Already done',
        status: 'completed',
        planEndDate: yesterday,
        orderIndex: 6
      }),
      createMockTaskWithSubTasks({
        id: 'task-8',
        title: 'No Due Date',
        description: '',
        status: 'not_started',
        planEndDate: undefined,
        subTasks: [
          {
            id: 'sub-1',
            taskId: 'task-8',
            title: 'SubTask with keyword',
            description: 'Contains urgent info',
            status: 'not_started',
            priority: 0,
            orderIndex: 0,
            completed: false,
            assignedUserIds: [],
            tagIds: [],
            tags: [],
            createdAt: new Date('2024-01-01'),
            updatedAt: new Date('2024-01-01')
          }
        ],
        orderIndex: 7
      })
    ];

    mockDeps = {
      taskStore: {
        allTasks: mockTasks,
        todayTasks: [mockTasks[1]],
        overdueTasks: [mockTasks[0]],
        isNewTaskMode: false,
        selectedProjectId: null,
        selectedListId: null,
        projects: []
      },
      taskInteractions: {
        cancelNewTaskMode: vi.fn()
      },
      selectionStore: {
        selectTask: vi.fn(),
        selectProject: vi.fn(),
        selectList: vi.fn()
      },
      translationService: {
        getMessage: vi.fn(() => () => '')
      }
    };
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('getTasksForView - basic views', () => {
    it('should return all tasks for "all" view', () => {
      const result = getTasksForView('all', '', mockDeps);
      expect(result).toHaveLength(8);
    });

    it('should return today tasks', () => {
      const result = getTasksForView('today', '', mockDeps);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('task-2');
    });

    it('should return overdue tasks', () => {
      const result = getTasksForView('overdue', '', mockDeps);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('task-1');
    });

    it('should return completed tasks', () => {
      const result = getTasksForView('completed', '', mockDeps);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('task-7');
      expect(result[0].status).toBe('completed');
    });
  });

  describe('getTasksForView - date range views', () => {
    it('should return tomorrow tasks', () => {
      const result = getTasksForView('tomorrow', '', mockDeps);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('task-3');
    });

    it('should return next 3 days tasks', () => {
      const result = getTasksForView('next3days', '', mockDeps);
      expect(result.length).toBeGreaterThanOrEqual(1);
      // Should include tomorrow and three days later
      const ids = result.map((t) => t.id);
      expect(ids).toContain('task-3'); // tomorrow
    });

    it('should return next week tasks', () => {
      const result = getTasksForView('nextweek', '', mockDeps);
      // Should include tasks within a week
      expect(result.length).toBeGreaterThanOrEqual(2);
    });

    it('should return this month tasks', () => {
      const result = getTasksForView('thismonth', '', mockDeps);
      // Should include all future tasks in January
      expect(result.length).toBeGreaterThanOrEqual(4);
    });

    it('should exclude tasks scheduled for next month', () => {
      const nextMonthTask = createMockTaskWithSubTasks({
        id: 'task-next-month',
        title: 'Next Month Task',
        planEndDate: new Date('2024-02-02T00:00:00Z'),
        orderIndex: 99
      });
      const depsWithFutureTask: ViewStoreDependencies = {
        ...mockDeps,
        taskStore: {
          ...mockDeps.taskStore,
          allTasks: [...mockDeps.taskStore.allTasks, nextMonthTask]
        }
      };

      const result = getTasksForView('thismonth', '', depsWithFutureTask);

      const ids = result.map((task) => task.id);
      expect(ids).not.toContain('task-next-month');
    });

    it('should exclude completed tasks from date range views', () => {
      const tomorrowTasks = getTasksForView('tomorrow', '', mockDeps);
      const completedIds = tomorrowTasks.filter((t) => t.status === 'completed').map((t) => t.id);
      expect(completedIds).toHaveLength(0);
    });

    it('should exclude tasks without due date from date range views', () => {
      const next3DaysTasks = getTasksForView('next3days', '', mockDeps);
      const noDueDateIds = next3DaysTasks.filter((t) => !t.planEndDate).map((t) => t.id);
      expect(noDueDateIds).toHaveLength(0);
    });
  });

  describe('getTasksForView - project/tasklist views', () => {
    it('should return tasks for selected project', () => {
      const projectTasks = [mockTasks[0], mockTasks[1]];
      const depsWithProject: ViewStoreDependencies = {
        ...mockDeps,
        taskStore: {
          ...mockDeps.taskStore,
          selectedProjectId: 'project-1',
          projects: [
            createMockProjectTree({
              id: 'project-1',
              taskLists: [
                createMockTaskListWithTasks({
                  id: 'list-1',
                  projectId: 'project-1',
                  tasks: projectTasks
                })
              ]
            })
          ]
        }
      };

      const result = getTasksForView('project', '', depsWithProject);
      expect(result).toHaveLength(2);
    });

    it('should return tasks for selected list', () => {
      const listTasks = [mockTasks[2]];
      const depsWithList: ViewStoreDependencies = {
        ...mockDeps,
        taskStore: {
          ...mockDeps.taskStore,
          selectedListId: 'list-2',
          projects: [
            createMockProjectTree({
              id: 'project-1',
              taskLists: [
                createMockTaskListWithTasks({
                  id: 'list-2',
                  projectId: 'project-1',
                  tasks: listTasks
                })
              ]
            })
          ]
        }
      };

      const result = getTasksForView('tasklist', '', depsWithList);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('task-3');
    });

    it('should return empty array if project not found', () => {
      const depsWithProject: ViewStoreDependencies = {
        ...mockDeps,
        taskStore: {
          ...mockDeps.taskStore,
          selectedProjectId: 'non-existent',
          projects: []
        }
      };

      const result = getTasksForView('project', '', depsWithProject);
      expect(result).toHaveLength(0);
    });

    it('should prioritize selected list when both project and list are set', () => {
      const listTasks = [mockTasks[4]];
      const depsWithBoth: ViewStoreDependencies = {
        ...mockDeps,
        taskStore: {
          ...mockDeps.taskStore,
          selectedProjectId: 'project-1',
          selectedListId: 'list-99',
          projects: [
            createMockProjectTree({
              id: 'project-1',
              taskLists: [
                createMockTaskListWithTasks({
                  id: 'list-1',
                  projectId: 'project-1',
                  tasks: [mockTasks[0]]
                }),
                createMockTaskListWithTasks({
                  id: 'list-99',
                  projectId: 'project-1',
                  tasks: listTasks
                })
              ]
            })
          ]
        }
      };

      const result = getTasksForView('project', '', depsWithBoth);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('task-5');
    });
  });

  describe('getTasksForView - search', () => {
    it('should return all tasks for empty search query', () => {
      const result = getTasksForView('search', '', mockDeps);
      expect(result).toHaveLength(8);
    });

    it('should search by title', () => {
      const result = getTasksForView('search', 'overdue', mockDeps);
      expect(result).toHaveLength(1);
      expect(result[0].title).toContain('Overdue');
    });

    it('should search by description', () => {
      const result = getTasksForView('search', 'already done', mockDeps);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('task-7');
    });

    it('should search by tag name', () => {
      const result = getTasksForView('search', 'urgent', mockDeps);
      expect(result.length).toBeGreaterThanOrEqual(1);
      const hasUrgentTag = result.some((t) => t.tags.some((tag) => tag.name === 'urgent'));
      expect(hasUrgentTag).toBe(true);
    });

    it('should search in subtasks', () => {
      const result = getTasksForView('search', 'subtask', mockDeps);
      expect(result.length).toBeGreaterThanOrEqual(1);
      expect(result[0].id).toBe('task-8');
    });

    it('should filter by tag when query starts with #', () => {
      const result = getTasksForView('search', '#urgent', mockDeps);
      expect(result.length).toBeGreaterThanOrEqual(1);
      const allHaveTag = result.every((t) => t.tags.some((tag) => tag.name.includes('urgent')));
      expect(allHaveTag).toBe(true);
    });

    it('should return tasks with any tag when query is just #', () => {
      const result = getTasksForView('search', '#', mockDeps);
      const allHaveTags = result.every((t) => t.tags.length > 0);
      expect(allHaveTags).toBe(true);
    });

    it('should be case insensitive', () => {
      const result = getTasksForView('search', 'OVERDUE', mockDeps);
      expect(result).toHaveLength(1);
      expect(result[0].title).toContain('Overdue');
    });

    it('should trim search query', () => {
      const result = getTasksForView('search', '  overdue  ', mockDeps);
      expect(result).toHaveLength(1);
    });

    it('should trim whitespace for tag queries', () => {
      const result = getTasksForView('search', '  #urgent  ', mockDeps);
      expect(result.length).toBeGreaterThanOrEqual(1);
      const allHaveTag = result.every((task) =>
        task.tags.some((tag) => tag.name.includes('urgent'))
      );
      expect(allHaveTag).toBe(true);
    });
  });

  describe('edge cases', () => {
    it('should handle empty task list', () => {
      const emptyDeps: ViewStoreDependencies = {
        taskStore: {
          allTasks: [],
          todayTasks: [],
          overdueTasks: [],
          selectedProjectId: null,
          selectedListId: null,
          isNewTaskMode: false,
          projects: []
        },
        taskInteractions: {
          cancelNewTaskMode: vi.fn()
        },
        selectionStore: {
          selectTask: vi.fn(),
          selectProject: vi.fn(),
          selectList: vi.fn()
        },
        translationService: {
          getMessage: vi.fn(() => () => '')
        }
      };

      const result = getTasksForView('all', '', emptyDeps);
      expect(result).toHaveLength(0);
    });

    it('should handle undefined dependencies', () => {
      // Should use resolveViewDependencies internally
      const result = getTasksForView('all', '');
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });

    it('should resolve dependencies via resolveViewDependencies when deps omitted', () => {
      const resolverSpy = vi.spyOn(viewDependencies, 'resolveViewDependencies').mockReturnValue({
        taskStore: {
          allTasks: [],
          todayTasks: [mockTasks[1]],
          overdueTasks: [],
          selectedProjectId: null,
          selectedListId: null,
          isNewTaskMode: false,
          projects: []
        },
        taskInteractions: {
          cancelNewTaskMode: vi.fn()
        },
        selectionStore: {
          selectTask: vi.fn(),
          selectProject: vi.fn(),
          selectList: vi.fn()
        },
        translationService: {
          getMessage: vi.fn(() => () => '')
        }
      });

      const result = getTasksForView('today');

      expect(resolverSpy).toHaveBeenCalled();
      expect(result).toEqual([mockTasks[1]]);
      resolverSpy.mockRestore();
    });
  });
});
