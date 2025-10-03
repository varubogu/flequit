import { test, expect, vi, beforeEach } from 'vitest';
import { ViewService } from '../../src/lib/services/ui/view';
import type { TaskWithSubTasks } from '../../src/lib/types/task';

// Hoist variables to be available in the vi.mock factory
const mockTasks: TaskWithSubTasks[] = [
  {
    id: 'task-1',
    projectId: 'proj-1',
    listId: 'list-1',
    title: 'Today Task',
    description: 'A task for today',
    status: 'not_started',
    priority: 1,
    planEndDate: new Date(),
    orderIndex: 0,
    isArchived: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    subTasks: [],
    tags: [{ id: 'tag-1', name: 'urgent', createdAt: new Date(), updatedAt: new Date() }],
    assignedUserIds: [],
    tagIds: ['tag-1']
  },
  {
    id: 'task-2',
    projectId: 'proj-1',
    listId: 'list-1',
    title: 'Completed Task',
    status: 'completed',
    priority: 2,
    orderIndex: 1,
    isArchived: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    subTasks: [],
    tags: [],
    assignedUserIds: [],
    tagIds: []
  },
  {
    id: 'task-3',
    projectId: 'proj-1',
    listId: 'list-2',
    title: 'Future Task',
    description: 'A task for the future',
    status: 'not_started',
    priority: 3,
    planEndDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
    orderIndex: 0,
    isArchived: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    subTasks: [
      {
        id: 'sub-1',
        taskId: 'task-3',
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
    ],
    tags: [],
    assignedUserIds: [],
    tagIds: []
  }
];

const mockProjects = [
  {
    id: 'project-1',
    name: 'Project Alpha',
    orderIndex: 0,
    isArchived: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    taskLists: [
      {
        id: 'list-1',
        projectId: 'project-1',
        name: 'List A',
        orderIndex: 0,
        isArchived: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        tasks: [mockTasks[0], mockTasks[1]]
      },
      {
        id: 'list-2',
        projectId: 'project-1',
        name: 'List B',
        orderIndex: 1,
        isArchived: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        tasks: [mockTasks[2]]
      }
    ]
  }
];

// Mock the store import
vi.mock('../../src/lib/stores/tasks.svelte', () => ({
  taskStore: {
    todayTasks: [],
    overdueTasks: [],
    allTasks: [],
    projects: [],
    selectedProjectId: null,
    selectedListId: null,
    selectTask: vi.fn(),
    selectProject: vi.fn(),
    selectList: vi.fn()
  }
}));

// Mock the translation service
vi.mock('../../src/lib/stores/locale.svelte', () => ({
  getTranslationService: vi.fn(() => ({
    getMessage: vi.fn((key: string) => () => {
      const messages: Record<string, string> = {
        all_tasks: 'All Tasks',
        today: 'Today',
        overdue: 'Overdue',
        completed: 'Completed',
        tomorrow: 'Tomorrow',
        next_3_days: 'Next 3 Days',
        next_week: 'Next Week',
        this_month: 'This Month'
      };
      return messages[key] || key;
    })
  }))
}));

const mockTaskStore = vi.mocked(await import('../../src/lib/stores/tasks.svelte')).taskStore;

beforeEach(() => {
  vi.clearAllMocks();
  // Mock getter properties using spyOn
  vi.spyOn(mockTaskStore, 'todayTasks', 'get').mockReturnValue([mockTasks[0]]);
  vi.spyOn(mockTaskStore, 'overdueTasks', 'get').mockReturnValue([]);
  vi.spyOn(mockTaskStore, 'allTasks', 'get').mockReturnValue(mockTasks);

  mockTaskStore.projects = mockProjects;
  mockTaskStore.selectedProjectId = null;
  mockTaskStore.selectedListId = null;
});

test("ViewService.getTasksForView: returns all tasks for 'all' view", () => {
  const result = ViewService.getTasksForView('all');
  expect(result).toEqual(mockTasks);
});

test("ViewService.getTasksForView: returns today tasks for 'today' view", () => {
  const result = ViewService.getTasksForView('today');
  expect(result).toEqual([mockTasks[0]]);
});

test("ViewService.getTasksForView: returns overdue tasks for 'overdue' view", () => {
  const result = ViewService.getTasksForView('overdue');
  expect(result).toEqual([]);
});

test("ViewService.getTasksForView: returns completed tasks for 'completed' view", () => {
  const result = ViewService.getTasksForView('completed');
  expect(result).toEqual([mockTasks[1]]);
});

test("ViewService.getTasksForView: returns empty array for 'project' view with no selection", () => {
  const result = ViewService.getTasksForView('project');
  expect(result).toEqual([]);
});

test('ViewService.getTasksForView: returns project tasks when project is selected', () => {
  mockTaskStore.selectedProjectId = 'project-1';
  const result = ViewService.getTasksForView('project');
  expect(result).toEqual(mockTasks);
});

test('ViewService.getTasksForView: returns list tasks when both project and list are selected', () => {
  mockTaskStore.selectedProjectId = 'project-1';
  mockTaskStore.selectedListId = 'list-1';
  const result = ViewService.getTasksForView('project');
  expect(result).toEqual([mockTasks[0], mockTasks[1]]);
});

test("ViewService.getTasksForView: returns search results for 'search' view", () => {
  const result = ViewService.getTasksForView('search', 'today');
  expect(result).toEqual([mockTasks[0]]);
});

test('ViewService.getTasksForView: returns all tasks for empty search query', () => {
  const result = ViewService.getTasksForView('search', '');
  expect(result).toEqual(mockTasks);
});

test('ViewService.getTasksForView: searches in task descriptions', () => {
  const result = ViewService.getTasksForView('search', 'future');
  expect(result).toEqual([mockTasks[2]]);
});

test('ViewService.getTasksForView: searches in subtask titles', () => {
  const result = ViewService.getTasksForView('search', 'subtask');
  expect(result).toEqual([mockTasks[2]]);
});

test('ViewService.getTasksForView: searches in subtask descriptions', () => {
  const result = ViewService.getTasksForView('search', 'searchable');
  expect(result).toEqual([mockTasks[2]]);
});

test('ViewService.getTasksForView: searches in tags', () => {
  const result = ViewService.getTasksForView('search', 'urgent');
  expect(result).toEqual([mockTasks[0]]);
});

test('ViewService.getTasksForView: searches in tags with # prefix', () => {
  const result = ViewService.getTasksForView('search', '#urgent');
  expect(result).toEqual([mockTasks[0]]);
});

test('ViewService.getTasksForView: returns tasks with any tags when searching with #', () => {
  const result = ViewService.getTasksForView('search', '#');
  expect(result).toEqual([mockTasks[0]]); // Only task-1 has tags
});

test('ViewService.getTasksForView: partial tag search with # prefix', () => {
  const result = ViewService.getTasksForView('search', '#ur');
  expect(result).toEqual([mockTasks[0]]);
});

test('ViewService.getTasksForView: case insensitive tag search with # prefix', () => {
  const result = ViewService.getTasksForView('search', '#URGENT');
  expect(result).toEqual([mockTasks[0]]);
});

test('ViewService.getViewTitle: returns correct titles for each view', () => {
  expect(ViewService.getViewTitle('all')).toBe('All Tasks');
  expect(ViewService.getViewTitle('today')).toBe('Today');
  expect(ViewService.getViewTitle('overdue')).toBe('Overdue');
  expect(ViewService.getViewTitle('completed')).toBe('Completed');
  expect(ViewService.getViewTitle('tomorrow')).toBe('Tomorrow');
  expect(ViewService.getViewTitle('next3days')).toBe('Next 3 Days');
  expect(ViewService.getViewTitle('nextweek')).toBe('Next Week');
  expect(ViewService.getViewTitle('thismonth')).toBe('This Month');
});

test("ViewService.getViewTitle: returns project name for 'project' view", () => {
  mockTaskStore.selectedProjectId = 'project-1';
  expect(ViewService.getViewTitle('project')).toBe('Project Alpha');
});

test('ViewService.getViewTitle: returns list name when list is selected', () => {
  mockTaskStore.selectedProjectId = 'project-1';
  mockTaskStore.selectedListId = 'list-1';
  expect(ViewService.getViewTitle('project')).toBe('Project Alpha > List A');
});

test("ViewService.getViewTitle: returns search query for 'search' view", () => {
  expect(ViewService.getViewTitle('search', 'test query')).toBe('Search: "test query"');
  expect(ViewService.getViewTitle('search', '')).toBe('All Tasks');
});

test('ViewService.shouldShowAddButton: returns true for views that allow adding tasks', () => {
  expect(ViewService.shouldShowAddButton('all')).toBe(true);
  expect(ViewService.shouldShowAddButton('project')).toBe(true);
  expect(ViewService.shouldShowAddButton('tomorrow')).toBe(true);
  expect(ViewService.shouldShowAddButton('next3days')).toBe(true);
  expect(ViewService.shouldShowAddButton('nextweek')).toBe(true);
  expect(ViewService.shouldShowAddButton('thismonth')).toBe(true);
});

test("ViewService.shouldShowAddButton: returns false for views that don't allow adding tasks", () => {
  expect(ViewService.shouldShowAddButton('today')).toBe(false);
  expect(ViewService.shouldShowAddButton('overdue')).toBe(false);
  expect(ViewService.shouldShowAddButton('completed')).toBe(false);
  expect(ViewService.shouldShowAddButton('search')).toBe(false);
});

test('ViewService.handleViewChange: clears task selection', () => {
  ViewService.handleViewChange('all');
  expect(mockTaskStore.selectTask).toHaveBeenCalledWith(null);
});

// Additional tests for better coverage
test("ViewService.getTasksForView: returns tomorrow tasks for 'tomorrow' view", () => {
  // Create a task for tomorrow
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(12, 0, 0, 0);

  const tomorrowTask = {
    ...mockTasks[0],
    id: 'tomorrow-task',
    projectId: 'proj-1',
    planEndDate: tomorrow,
    status: 'not_started' as const
  };

  vi.spyOn(mockTaskStore, 'allTasks', 'get').mockReturnValue([...mockTasks, tomorrowTask]);

  const result = ViewService.getTasksForView('tomorrow');

  expect(Array.isArray(result)).toBe(true);
});

test("ViewService.getTasksForView: returns next 3 days tasks for 'next3days' view", () => {
  const twoDaysLater = new Date();
  twoDaysLater.setDate(twoDaysLater.getDate() + 2);

  const next3DaysTask = {
    ...mockTasks[0],
    id: 'next3days-task',
    projectId: 'proj-1',
    planEndDate: twoDaysLater,
    status: 'not_started' as const
  };

  vi.spyOn(mockTaskStore, 'allTasks', 'get').mockReturnValue([...mockTasks, next3DaysTask]);

  const result = ViewService.getTasksForView('next3days');

  expect(Array.isArray(result)).toBe(true);
});

test("ViewService.getTasksForView: returns next week tasks for 'nextweek' view", () => {
  const fiveDaysLater = new Date();
  fiveDaysLater.setDate(fiveDaysLater.getDate() + 5);

  const nextWeekTask = {
    ...mockTasks[0],
    id: 'nextweek-task',
    projectId: 'proj-1',
    planEndDate: fiveDaysLater,
    status: 'not_started' as const
  };

  vi.spyOn(mockTaskStore, 'allTasks', 'get').mockReturnValue([...mockTasks, nextWeekTask]);

  const result = ViewService.getTasksForView('nextweek');

  expect(Array.isArray(result)).toBe(true);
});

test("ViewService.getTasksForView: returns this month tasks for 'thismonth' view", () => {
  const endOfMonth = new Date();
  endOfMonth.setDate(endOfMonth.getDate() + 10);

  const thisMonthTask = {
    ...mockTasks[0],
    id: 'thismonth-task',
    projectId: 'proj-1',
    planEndDate: endOfMonth,
    status: 'not_started' as const
  };

  vi.spyOn(mockTaskStore, 'allTasks', 'get').mockReturnValue([...mockTasks, thisMonthTask]);

  const result = ViewService.getTasksForView('thismonth');

  expect(Array.isArray(result)).toBe(true);
});

test('ViewService.getTasksForView: returns project tasks when project selected', () => {
  mockTaskStore.selectedProjectId = 'project-1';
  mockTaskStore.selectedListId = null;

  const result = ViewService.getTasksForView('project');

  expect(Array.isArray(result)).toBe(true);
  expect(result).toEqual([mockTasks[0], mockTasks[1], mockTasks[2]]);
});

test('ViewService.getTasksForView: returns list tasks when list selected', () => {
  mockTaskStore.selectedProjectId = 'project-1';
  mockTaskStore.selectedListId = 'list-1';

  const result = ViewService.getTasksForView('project');

  expect(result).toEqual([mockTasks[0], mockTasks[1]]);
});

test('ViewService.getTasksForView: returns empty array when no project selected for project view', () => {
  mockTaskStore.selectedProjectId = null;

  const result = ViewService.getTasksForView('project');

  expect(result).toEqual([]);
});

test('ViewService.getViewTitle: returns list name when list selected in project view', () => {
  mockTaskStore.selectedProjectId = 'project-1';
  mockTaskStore.selectedListId = 'list-1';

  const result = ViewService.getViewTitle('project');

  expect(result).toBe('Project Alpha > List A');
});

test('ViewService.getViewTitle: returns project name when only project selected', () => {
  mockTaskStore.selectedProjectId = 'project-1';
  mockTaskStore.selectedListId = null;

  const result = ViewService.getViewTitle('project');

  expect(result).toBe('Project Alpha');
});

test("ViewService.getViewTitle: returns 'Project' when no project selected", () => {
  mockTaskStore.selectedProjectId = null;

  const result = ViewService.getViewTitle('project');

  expect(result).toBe('Project');
});

test('ViewService.handleViewChange: clears project/list selection for non-project views', () => {
  ViewService.handleViewChange('today');

  expect(mockTaskStore.selectTask).toHaveBeenCalledWith(null);
  expect(mockTaskStore.selectProject).toHaveBeenCalledWith(null);
  expect(mockTaskStore.selectList).toHaveBeenCalledWith(null);
});

test('ViewService.handleViewChange: does not clear project/list selection for project view', () => {
  vi.clearAllMocks();

  ViewService.handleViewChange('project');

  expect(mockTaskStore.selectTask).toHaveBeenCalledWith(null);
  expect(mockTaskStore.selectProject).not.toHaveBeenCalled();
  expect(mockTaskStore.selectList).not.toHaveBeenCalled();
});

test('ViewService.handleViewChange: clears project/list selection for non-project views', () => {
  ViewService.handleViewChange('all');
  expect(mockTaskStore.selectProject).toHaveBeenCalledWith(null);
  expect(mockTaskStore.selectList).toHaveBeenCalledWith(null);
});

test('ViewService.handleViewChange: does not clear project/list selection for project view', () => {
  ViewService.handleViewChange('project');
  expect(mockTaskStore.selectProject).not.toHaveBeenCalled();
  expect(mockTaskStore.selectList).not.toHaveBeenCalled();
});

// Add mocks for new task mode functionality
Object.assign(mockTaskStore, {
  isNewTaskMode: false,
  cancelNewTaskMode: vi.fn()
});

test('ViewService.handleViewChange: returns false when in new task mode', () => {
  Object.assign(mockTaskStore, { isNewTaskMode: true });

  const result = ViewService.handleViewChange('all');

  expect(result).toBe(false);
  expect(mockTaskStore.selectTask).not.toHaveBeenCalled();
});

test('ViewService.handleViewChange: returns true when not in new task mode', () => {
  Object.assign(mockTaskStore, { isNewTaskMode: false });

  const result = ViewService.handleViewChange('all');

  expect(result).toBe(true);
  expect(mockTaskStore.selectTask).toHaveBeenCalledWith(null);
});

test('ViewService.forceViewChange: cancels new task mode and forces view change', () => {
  Object.assign(mockTaskStore, { isNewTaskMode: true });

  ViewService.forceViewChange('today');

  expect(mockTaskStore.cancelNewTaskMode).toHaveBeenCalledOnce();
  expect(mockTaskStore.selectTask).toHaveBeenCalledWith(null);
  expect(mockTaskStore.selectProject).toHaveBeenCalledWith(null);
  expect(mockTaskStore.selectList).toHaveBeenCalledWith(null);
});

test('ViewService.forceViewChange: works when not in new task mode', () => {
  Object.assign(mockTaskStore, { isNewTaskMode: false });

  ViewService.forceViewChange('today');

  expect(mockTaskStore.cancelNewTaskMode).not.toHaveBeenCalled();
  expect(mockTaskStore.selectTask).toHaveBeenCalledWith(null);
});

test('ViewService.forceViewChange: does not clear project/list for project view', () => {
  Object.assign(mockTaskStore, { isNewTaskMode: false });
  vi.clearAllMocks();

  ViewService.forceViewChange('project');

  expect(mockTaskStore.selectTask).toHaveBeenCalledWith(null);
  expect(mockTaskStore.selectProject).not.toHaveBeenCalled();
  expect(mockTaskStore.selectList).not.toHaveBeenCalled();
});

test('ViewService.forceViewChange: does not clear project/list for tasklist view', () => {
  Object.assign(mockTaskStore, { isNewTaskMode: false });
  vi.clearAllMocks();

  ViewService.forceViewChange('tasklist');

  expect(mockTaskStore.selectTask).toHaveBeenCalledWith(null);
  expect(mockTaskStore.selectProject).not.toHaveBeenCalled();
  expect(mockTaskStore.selectList).not.toHaveBeenCalled();
});

test("ViewService.getTasksForView: handles 'tasklist' view same as 'project'", () => {
  mockTaskStore.selectedProjectId = 'project-1';

  const projectResult = ViewService.getTasksForView('project');
  const tasklistResult = ViewService.getTasksForView('tasklist');

  expect(projectResult).toEqual(tasklistResult);
});

test("ViewService.getViewTitle: handles 'tasklist' view same as 'project'", () => {
  mockTaskStore.selectedProjectId = 'project-1';

  const projectTitle = ViewService.getViewTitle('project');
  const tasklistTitle = ViewService.getViewTitle('tasklist');

  expect(projectTitle).toBe(tasklistTitle);
});

test('ViewService.getTasksForView: handles invalid project selection', () => {
  mockTaskStore.selectedProjectId = 'nonexistent-project';

  const result = ViewService.getTasksForView('project');

  expect(result).toEqual([]);
});

test('ViewService.getTasksForView: handles invalid list selection', () => {
  mockTaskStore.selectedProjectId = 'project-1';
  mockTaskStore.selectedListId = 'nonexistent-list';

  const result = ViewService.getTasksForView('project');

  expect(result).toEqual([]);
});

test('ViewService.getViewTitle: handles invalid project selection', () => {
  mockTaskStore.selectedProjectId = 'nonexistent-project';

  const result = ViewService.getViewTitle('project');

  expect(result).toBe('Project');
});

test('ViewService.getViewTitle: handles invalid list selection', () => {
  mockTaskStore.selectedProjectId = 'project-1';
  mockTaskStore.selectedListId = 'nonexistent-list';

  const result = ViewService.getViewTitle('project');

  expect(result).toBe('Task List');
});

test('ViewService.getTasksForView: filters out completed tasks from time-based views', () => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);

  const completedTomorrowTask = {
    ...mockTasks[0],
    id: 'completed-tomorrow-task',
    projectId: 'proj-1',
    planEndDate: tomorrow,
    status: 'completed' as const
  };

  vi.spyOn(mockTaskStore, 'allTasks', 'get').mockReturnValue([...mockTasks, completedTomorrowTask]);

  const result = ViewService.getTasksForView('tomorrow');

  expect(result).not.toContain(completedTomorrowTask);
});

test('ViewService.getTasksForView: filters out tasks without end_date from time-based views', () => {
  const taskWithoutDate = {
    ...mockTasks[0],
    id: 'no-date-task',
    projectId: 'proj-1',
    planEndDate: undefined
  };

  vi.spyOn(mockTaskStore, 'allTasks', 'get').mockReturnValue([...mockTasks, taskWithoutDate]);

  const result = ViewService.getTasksForView('tomorrow');

  expect(result).not.toContain(taskWithoutDate);
});

test('ViewService.getTasksForView: handles whitespace-only search query', () => {
  const result = ViewService.getTasksForView('search', '   ');

  expect(result).toEqual(mockTasks);
});

test('ViewService.getTasksForView: case insensitive regular search', () => {
  const result = ViewService.getTasksForView('search', 'TODAY');

  expect(result).toEqual([mockTasks[0]]);
});

test('ViewService.getTasksForView: search returns no results for non-matching query', () => {
  const result = ViewService.getTasksForView('search', 'nonexistent');

  expect(result).toEqual([]);
});

test('ViewService.getTasksForView: tag search with non-matching query', () => {
  const result = ViewService.getTasksForView('search', '#nonexistent');

  expect(result).toEqual([]);
});

test('ViewService.shouldShowAddButton: returns true for tasklist view', () => {
  expect(ViewService.shouldShowAddButton('tasklist')).toBe(true);
});

test('ViewService.getTasksForView: date range tests work correctly', () => {
  const today = new Date();

  // Test tomorrow tasks
  const tomorrowStart = new Date(today);
  tomorrowStart.setDate(today.getDate() + 1);
  tomorrowStart.setHours(0, 0, 0, 0);

  const tomorrowEnd = new Date(today);
  tomorrowEnd.setDate(today.getDate() + 2);
  tomorrowEnd.setHours(0, 0, 0, 0);

  const tomorrowTask = {
    ...mockTasks[0],
    id: 'tomorrow-test',
    projectId: 'proj-1',
    planEndDate: new Date(tomorrowStart.getTime() + 12 * 60 * 60 * 1000), // noon tomorrow
    status: 'not_started' as const
  };

  vi.spyOn(mockTaskStore, 'allTasks', 'get').mockReturnValue([tomorrowTask]);

  const result = ViewService.getTasksForView('tomorrow');

  expect(result).toContain(tomorrowTask);
});

test('ViewService.getTasksForView: edge case for end of month calculation', () => {
  const endOfMonth = new Date(2024, 1, 0); // Last day of January

  const taskAtEndOfMonth = {
    ...mockTasks[0],
    id: 'end-of-month-task',
    projectId: 'proj-1',
    planEndDate: endOfMonth,
    status: 'not_started' as const
  };

  vi.spyOn(mockTaskStore, 'allTasks', 'get').mockReturnValue([taskAtEndOfMonth]);

  // Mock Date.now() to return January 31st, 2024
  const originalDate = Date;
  global.Date = class extends originalDate {
    constructor() {
      super(2024, 0, 31);
    }

    static now() {
      return new originalDate(2024, 0, 31).getTime();
    }
  } as DateConstructor;

  const result = ViewService.getTasksForView('thismonth');

  // Restore original Date
  global.Date = originalDate;

  expect(result).toContain(taskAtEndOfMonth);
});
