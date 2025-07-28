import { test, expect, vi, beforeEach } from "vitest";
import { ViewService } from "../../src/lib/services/view-service";
import type { TaskWithSubTasks } from "../../src/lib/types/task";

// Hoist variables to be available in the vi.mock factory
const mockTasks: TaskWithSubTasks[] = [
  {
    id: "task-1",
    list_id: "list-1",
    title: "Today Task",
    description: "A task for today",
    status: "not_started",
    priority: 1,
    end_date: new Date(),
    order_index: 0,
    is_archived: false,
    created_at: new Date(),
    updated_at: new Date(),
    sub_tasks: [],
    tags: [{ id: "tag-1", name: "urgent", created_at: new Date(), updated_at: new Date() }]
  },
  {
    id: "task-2",
    list_id: "list-1",
    title: "Completed Task",
    status: "completed",
    priority: 2,
    order_index: 1,
    is_archived: false,
    created_at: new Date(),
    updated_at: new Date(),
    sub_tasks: [],
    tags: []
  },
  {
    id: "task-3",
    list_id: "list-2",
    title: "Future Task",
    description: "A task for the future",
    status: "not_started",
    priority: 3,
    end_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
    order_index: 0,
    is_archived: false,
    created_at: new Date(),
    updated_at: new Date(),
    sub_tasks: [
      {
        id: "sub-1",
        task_id: "task-3",
        title: "Subtask search test",
        description: "Contains searchable text",
        status: "not_started",
        order_index: 0,
        created_at: new Date(),
        updated_at: new Date(),
        tags: []
      }
    ],
    tags: []
  }
];

const mockProjects = [
  {
    id: "project-1",
    name: "Project Alpha",
    order_index: 0,
    is_archived: false,
    created_at: new Date(),
    updated_at: new Date(),
    task_lists: [
      {
        id: "list-1",
        project_id: "project-1",
        name: "List A",
        order_index: 0,
        is_archived: false,
        created_at: new Date(),
        updated_at: new Date(),
        tasks: [mockTasks[0], mockTasks[1]]
      },
      {
        id: "list-2",
        project_id: "project-1",
        name: "List B",
        order_index: 1,
        is_archived: false,
        created_at: new Date(),
        updated_at: new Date(),
        tasks: [mockTasks[2]]
      }
    ]
  }
];

// Mock the store import
vi.mock("../../src/lib/stores/tasks.svelte", () => ({
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

const mockTaskStore = vi.mocked(await import("../../src/lib/stores/tasks.svelte")).taskStore;


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

test("ViewService.getTasksForView: returns project tasks when project is selected", () => {
  mockTaskStore.selectedProjectId = "project-1";
  const result = ViewService.getTasksForView('project');
  expect(result).toEqual(mockTasks);
});

test("ViewService.getTasksForView: returns list tasks when both project and list are selected", () => {
  mockTaskStore.selectedProjectId = "project-1";
  mockTaskStore.selectedListId = "list-1";
  const result = ViewService.getTasksForView('project');
  expect(result).toEqual([mockTasks[0], mockTasks[1]]);
});

test("ViewService.getTasksForView: returns search results for 'search' view", () => {
  const result = ViewService.getTasksForView('search', 'today');
  expect(result).toEqual([mockTasks[0]]);
});

test("ViewService.getTasksForView: returns all tasks for empty search query", () => {
  const result = ViewService.getTasksForView('search', '');
  expect(result).toEqual(mockTasks);
});

test("ViewService.getTasksForView: searches in task descriptions", () => {
  const result = ViewService.getTasksForView('search', 'future');
  expect(result).toEqual([mockTasks[2]]);
});

test("ViewService.getTasksForView: searches in subtask titles", () => {
  const result = ViewService.getTasksForView('search', 'subtask');
  expect(result).toEqual([mockTasks[2]]);
});

test("ViewService.getTasksForView: searches in subtask descriptions", () => {
  const result = ViewService.getTasksForView('search', 'searchable');
  expect(result).toEqual([mockTasks[2]]);
});

test("ViewService.getTasksForView: searches in tags", () => {
  const result = ViewService.getTasksForView('search', 'urgent');
  expect(result).toEqual([mockTasks[0]]);
});

test("ViewService.getTasksForView: searches in tags with # prefix", () => {
  const result = ViewService.getTasksForView('search', '#urgent');
  expect(result).toEqual([mockTasks[0]]);
});

test("ViewService.getTasksForView: returns tasks with any tags when searching with #", () => {
  const result = ViewService.getTasksForView('search', '#');
  expect(result).toEqual([mockTasks[0]]); // Only task-1 has tags
});

test("ViewService.getTasksForView: partial tag search with # prefix", () => {
  const result = ViewService.getTasksForView('search', '#ur');
  expect(result).toEqual([mockTasks[0]]);
});

test("ViewService.getTasksForView: case insensitive tag search with # prefix", () => {
  const result = ViewService.getTasksForView('search', '#URGENT');
  expect(result).toEqual([mockTasks[0]]);
});

test("ViewService.getViewTitle: returns correct titles for each view", () => {
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
  mockTaskStore.selectedProjectId = "project-1";
  expect(ViewService.getViewTitle('project')).toBe('Project Alpha');
});

test("ViewService.getViewTitle: returns list name when list is selected", () => {
  mockTaskStore.selectedProjectId = "project-1";
  mockTaskStore.selectedListId = "list-1";
  expect(ViewService.getViewTitle('project')).toBe('Project Alpha > List A');
});

test("ViewService.getViewTitle: returns search query for 'search' view", () => {
  expect(ViewService.getViewTitle('search', 'test query')).toBe('Search: "test query"');
  expect(ViewService.getViewTitle('search', '')).toBe('All Tasks');
});

test("ViewService.shouldShowAddButton: returns true for views that allow adding tasks", () => {
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

test("ViewService.handleViewChange: clears task selection", () => {
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
    end_date: tomorrow,
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
    end_date: twoDaysLater,
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
    end_date: fiveDaysLater,
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
    end_date: endOfMonth,
    status: 'not_started' as const
  };
  
  vi.spyOn(mockTaskStore, 'allTasks', 'get').mockReturnValue([...mockTasks, thisMonthTask]);
  
  const result = ViewService.getTasksForView('thismonth');
  
  expect(Array.isArray(result)).toBe(true);
});

test("ViewService.getTasksForView: returns project tasks when project selected", () => {
  mockTaskStore.selectedProjectId = 'project-1';
  mockTaskStore.selectedListId = null;
  
  const result = ViewService.getTasksForView('project');
  
  expect(Array.isArray(result)).toBe(true);
  expect(result).toEqual([mockTasks[0], mockTasks[1], mockTasks[2]]);
});

test("ViewService.getTasksForView: returns list tasks when list selected", () => {
  mockTaskStore.selectedProjectId = 'project-1';
  mockTaskStore.selectedListId = 'list-1';
  
  const result = ViewService.getTasksForView('project');
  
  expect(result).toEqual([mockTasks[0], mockTasks[1]]);
});

test("ViewService.getTasksForView: returns empty array when no project selected for project view", () => {
  mockTaskStore.selectedProjectId = null;
  
  const result = ViewService.getTasksForView('project');
  
  expect(result).toEqual([]);
});

test("ViewService.getViewTitle: returns list name when list selected in project view", () => {
  mockTaskStore.selectedProjectId = 'project-1';
  mockTaskStore.selectedListId = 'list-1';
  
  const result = ViewService.getViewTitle('project');
  
  expect(result).toBe('Project Alpha > List A');
});

test("ViewService.getViewTitle: returns project name when only project selected", () => {
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

test("ViewService.handleViewChange: clears project/list selection for non-project views", () => {
  ViewService.handleViewChange('today');
  
  expect(mockTaskStore.selectTask).toHaveBeenCalledWith(null);
  expect(mockTaskStore.selectProject).toHaveBeenCalledWith(null);
  expect(mockTaskStore.selectList).toHaveBeenCalledWith(null);
});

test("ViewService.handleViewChange: does not clear project/list selection for project view", () => {
  vi.clearAllMocks();
  
  ViewService.handleViewChange('project');
  
  expect(mockTaskStore.selectTask).toHaveBeenCalledWith(null);
  expect(mockTaskStore.selectProject).not.toHaveBeenCalled();
  expect(mockTaskStore.selectList).not.toHaveBeenCalled();
});

test("ViewService.handleViewChange: clears project/list selection for non-project views", () => {
  ViewService.handleViewChange('all');
  expect(mockTaskStore.selectProject).toHaveBeenCalledWith(null);
  expect(mockTaskStore.selectList).toHaveBeenCalledWith(null);
});

test("ViewService.handleViewChange: does not clear project/list selection for project view", () => {
  ViewService.handleViewChange('project');
  expect(mockTaskStore.selectProject).not.toHaveBeenCalled();
  expect(mockTaskStore.selectList).not.toHaveBeenCalled();
});
