import { test, expect, vi, beforeEach } from 'vitest';
import { TaskListService } from '../../src/lib/services/task-list-service';

// Mock the imports
vi.mock('../../src/lib/stores/tasks.svelte', () => ({
  taskStore: {
    projects: [
      {
        id: 'project-1',
        name: 'Project 1',
        task_lists: [
          {
            id: 'list-1',
            name: 'First List',
            tasks: []
          }
        ]
      }
    ]
  }
}));

vi.mock('../../src/lib/services/task-service', () => ({
  TaskService: {
    addTask: vi.fn()
  }
}));

// Get the mocked dependencies for use in tests
const mockTaskStore = vi.mocked(await import('../../src/lib/stores/tasks.svelte')).taskStore;
const mockTaskService = vi.mocked(await import('../../src/lib/services/task-service')).TaskService;

beforeEach(() => {
  vi.clearAllMocks();

  // Reset mock store to default state
  mockTaskStore.projects = [
    {
      id: 'project-1',
      name: 'Project 1',
      order_index: 0,
      is_archived: false,
      created_at: new Date(),
      updated_at: new Date(),
      task_lists: [
        {
          id: 'list-1',
          project_id: 'project-1',
          name: 'First List',
          order_index: 0,
          is_archived: false,
          created_at: new Date(),
          updated_at: new Date(),
          tasks: []
        }
      ]
    }
  ];
});

test('TaskListService.addNewTask: creates task successfully', () => {
  const title = 'New Task Title';
  const mockNewTask = { id: 'task-123', title: 'New Task Title' };
  vi.mocked(mockTaskService.addTask).mockImplementation(() => mockNewTask);

  const result = TaskListService.addNewTask(title);

  expect(mockTaskService.addTask).toHaveBeenCalledWith('list-1', {
    title: 'New Task Title'
  });
  expect(result).toBe('task-123');
});

test('TaskListService.addNewTask: trims whitespace from title', () => {
  const title = '  Task with spaces  ';
  const mockNewTask = { id: 'task-123', title: 'Task with spaces' };
  vi.mocked(mockTaskService.addTask).mockImplementation(() => mockNewTask);

  const result = TaskListService.addNewTask(title);

  expect(mockTaskService.addTask).toHaveBeenCalledWith('list-1', {
    title: 'Task with spaces'
  });
  expect(result).toBe('task-123');
});

test('TaskListService.addNewTask: returns null for empty title', () => {
  const result = TaskListService.addNewTask('');

  expect(mockTaskService.addTask).not.toHaveBeenCalled();
  expect(result).toBeNull();
});

test('TaskListService.addNewTask: returns null for whitespace-only title', () => {
  const result = TaskListService.addNewTask('   ');

  expect(mockTaskService.addTask).not.toHaveBeenCalled();
  expect(result).toBeNull();
});

test('TaskListService.addNewTask: returns null when no projects exist', () => {
  mockTaskStore.projects = [];

  const result = TaskListService.addNewTask('Valid Title');

  expect(mockTaskService.addTask).not.toHaveBeenCalled();
  expect(result).toBeNull();
});

test('TaskListService.addNewTask: returns null when no task lists exist', () => {
  mockTaskStore.projects = [
    {
      id: 'project-1',
      name: 'Project 1',
      order_index: 0,
      is_archived: false,
      created_at: new Date(),
      updated_at: new Date(),
      task_lists: []
    }
  ];

  const result = TaskListService.addNewTask('Valid Title');

  expect(mockTaskService.addTask).not.toHaveBeenCalled();
  expect(result).toBeNull();
});

test('TaskListService.addNewTask: returns null when TaskService.addTask returns null', () => {
  vi.mocked(mockTaskService.addTask).mockImplementation(() => null);

  const result = TaskListService.addNewTask('Valid Title');

  expect(mockTaskService.addTask).toHaveBeenCalled();
  expect(result).toBeNull();
});

test('TaskListService.getTaskCountText: returns correct text for singular', () => {
  expect(TaskListService.getTaskCountText(1)).toBe('1 task');
});

test('TaskListService.getTaskCountText: returns correct text for plural', () => {
  expect(TaskListService.getTaskCountText(0)).toBe('0 tasks');
  expect(TaskListService.getTaskCountText(2)).toBe('2 tasks');
  expect(TaskListService.getTaskCountText(10)).toBe('10 tasks');
});

test('TaskListService.getTaskCountText: handles edge cases', () => {
  expect(TaskListService.getTaskCountText(-1)).toBe('-1 tasks');
  expect(TaskListService.getTaskCountText(1.5)).toBe('1.5 tasks');
});
