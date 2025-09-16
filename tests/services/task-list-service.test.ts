import { test, expect, vi, beforeEach } from 'vitest';
import { TaskListService } from '../../src/lib/services/task-list-service';
import type { TaskWithSubTasks } from '$lib/types/task';

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
      orderIndex: 0,
      isArchived: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      taskLists: [
        {
          id: 'list-1',
          projectId: 'project-1',
          name: 'First List',
          orderIndex: 0,
          isArchived: false,
          createdAt: new Date(),
          updatedAt: new Date(),
          tasks: []
        }
      ]
    }
  ];
});

test('TaskListService.addNewTask: creates task successfully', async () => {
  const title = 'New Task Title';
  const mockNewTask = { id: 'task-123', title: 'New Task Title' } as TaskWithSubTasks;
  vi.mocked(mockTaskService.addTask).mockImplementation(() => Promise.resolve(mockNewTask));

  const result = await TaskListService.addNewTask(title);

  expect(mockTaskService.addTask).toHaveBeenCalledWith('list-1', {
    title: 'New Task Title'
  });
  expect(result).toBe('task-123');
});

test('TaskListService.addNewTask: trims whitespace from title', async () => {
  const title = '  Task with spaces  ';
  const mockNewTask = { id: 'task-123', title: 'Task with spaces' } as TaskWithSubTasks;
  vi.mocked(mockTaskService.addTask).mockImplementation(() => Promise.resolve(mockNewTask));

  const result = await TaskListService.addNewTask(title);

  expect(mockTaskService.addTask).toHaveBeenCalledWith('list-1', {
    title: 'Task with spaces'
  });
  expect(result).toBe('task-123');
});

test('TaskListService.addNewTask: returns null for empty title', async () => {
  const result = await TaskListService.addNewTask('');

  expect(mockTaskService.addTask).not.toHaveBeenCalled();
  expect(result).toBeNull();
});

test('TaskListService.addNewTask: returns null for whitespace-only title', async () => {
  const result = await TaskListService.addNewTask('   ');

  expect(mockTaskService.addTask).not.toHaveBeenCalled();
  expect(result).toBeNull();
});

test('TaskListService.addNewTask: returns null when no projects exist', async () => {
  mockTaskStore.projects = [];

  const result = await TaskListService.addNewTask('Valid Title');

  expect(mockTaskService.addTask).not.toHaveBeenCalled();
  expect(result).toBeNull();
});

test('TaskListService.addNewTask: returns null when no task lists exist', async () => {
  mockTaskStore.projects = [
    {
      id: 'project-1',
      name: 'Project 1',
      orderIndex: 0,
      isArchived: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      taskLists: []
    }
  ];

  const result = await TaskListService.addNewTask('Valid Title');

  expect(mockTaskService.addTask).not.toHaveBeenCalled();
  expect(result).toBeNull();
});

test('TaskListService.addNewTask: returns null when TaskService.addTask returns null', async () => {
  vi.mocked(mockTaskService.addTask).mockImplementation(() => Promise.resolve(null));

  const result = await TaskListService.addNewTask('Valid Title');

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
