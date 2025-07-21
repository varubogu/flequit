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
        updated_at: new Date()
      }
    ],
    tags: []
  }
];

const mockProjects = [
  {
    id: "project-1",
    name: "Project Alpha",
    task_lists: [
      {
        id: "list-1",
        name: "List A",
        tasks: [mockTasks[0], mockTasks[1]]
      },
      {
        id: "list-2",
        name: "List B",
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
	mockTaskStore.todayTasks = [mockTasks[0]];
	mockTaskStore.overdueTasks = [];
	mockTaskStore.allTasks = mockTasks;
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
  expect(ViewService.getViewTitle('project')).toBe('List A');
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
