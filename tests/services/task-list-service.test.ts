import { test, expect, vi, beforeEach } from 'vitest';
import { TaskListService } from '$lib/services/task-list-service';
import type { TaskWithSubTasks } from '$lib/types/task';
import type { ProjectTree } from '$lib/types/project';
import type { TaskListWithTasks } from '$lib/types/task-list';

interface SelectionStoreMock {
  selectedListId: string | null;
  selectedProjectId: string | null;
}

interface ProjectStoreMock {
  projects: ProjectTree[];
  getProjectById: (id: string) => ProjectTree | null;
}

vi.mock('$lib/stores/selection-store.svelte', () => {
  const mockedSelectionStore: SelectionStoreMock = {
    selectedListId: null,
    selectedProjectId: null
  };

  return {
    selectionStore: mockedSelectionStore
  };
});

vi.mock('$lib/stores/project-store.svelte', () => {
  const mockedProjectStore: ProjectStoreMock = {
    projects: [],
    getProjectById: vi.fn<(id: string) => ProjectTree | null>()
  };

  return {
    projectStore: mockedProjectStore
  };
});

vi.mock('$lib/services/task-service', () => ({
  TaskService: {
    addTask: vi.fn()
  }
}));

const { selectionStore: selectionStoreModule } = await import('$lib/stores/selection-store.svelte');
const mockSelectionStore = selectionStoreModule as SelectionStoreMock;

const { projectStore: projectStoreModule } = await import('$lib/stores/project-store.svelte');
const mockProjectStore = projectStoreModule as ProjectStoreMock;

const mockTaskService = vi.mocked(await import('$lib/services/task-service')).TaskService;

const createTaskList = (overrides: Partial<TaskListWithTasks> = {}): TaskListWithTasks => ({
  id: 'list-1',
  projectId: 'project-1',
  name: 'First List',
  orderIndex: 0,
  isArchived: false,
  createdAt: new Date(),
  updatedAt: new Date(),
  tasks: [],
  ...overrides
});

const createProject = (overrides: Partial<ProjectTree> = {}): ProjectTree => ({
  id: 'project-1',
  name: 'Project 1',
  orderIndex: 0,
  isArchived: false,
  createdAt: new Date(),
  updatedAt: new Date(),
  taskLists: [createTaskList()],
  ...overrides
});

beforeEach(() => {
  vi.clearAllMocks();

  mockSelectionStore.selectedListId = null;
  mockSelectionStore.selectedProjectId = null;

  const defaultProject = createProject();
  mockProjectStore.projects = [defaultProject];
  vi.mocked(mockProjectStore.getProjectById).mockImplementation((id: string) =>
    id === defaultProject.id ? defaultProject : null
  );
});

test('TaskListService.addNewTask: creates task successfully', async () => {
  const title = 'New Task Title';
  const mockNewTask = { id: 'task-123', title } as TaskWithSubTasks;
  vi.mocked(mockTaskService.addTask).mockResolvedValue(mockNewTask);

  const result = await TaskListService.addNewTask(title);

  expect(mockTaskService.addTask).toHaveBeenCalledWith('list-1', { title });
  expect(result).toBe('task-123');
});

test('TaskListService.addNewTask: trims whitespace from title', async () => {
  const title = '  Task with spaces  ';
  const mockNewTask = { id: 'task-456', title: 'Task with spaces' } as TaskWithSubTasks;
  vi.mocked(mockTaskService.addTask).mockResolvedValue(mockNewTask);

  const result = await TaskListService.addNewTask(title);

  expect(mockTaskService.addTask).toHaveBeenCalledWith('list-1', {
    title: 'Task with spaces'
  });
  expect(result).toBe('task-456');
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
  mockProjectStore.projects = [];
  vi.mocked(mockProjectStore.getProjectById).mockReturnValue(null);

  const result = await TaskListService.addNewTask('Valid Title');

  expect(mockTaskService.addTask).not.toHaveBeenCalled();
  expect(result).toBeNull();
});

test('TaskListService.addNewTask: returns null when no task lists exist', async () => {
  const projectWithoutLists = createProject({ taskLists: [] });
  mockProjectStore.projects = [projectWithoutLists];
  vi.mocked(mockProjectStore.getProjectById).mockReturnValue(projectWithoutLists);

  const result = await TaskListService.addNewTask('Valid Title');

  expect(mockTaskService.addTask).not.toHaveBeenCalled();
  expect(result).toBeNull();
});

test('TaskListService.addNewTask: returns null when TaskService.addTask returns null', async () => {
  vi.mocked(mockTaskService.addTask).mockResolvedValue(null);

  const result = await TaskListService.addNewTask('Valid Title');

  expect(mockTaskService.addTask).toHaveBeenCalled();
  expect(result).toBeNull();
});

test('TaskListService.addNewTask: uses selected list when available', async () => {
  const title = 'Selected List Task';
  const mockNewTask = { id: 'task-789', title } as TaskWithSubTasks;
  mockSelectionStore.selectedListId = 'selected-list';
  vi.mocked(mockTaskService.addTask).mockResolvedValue(mockNewTask);

  const result = await TaskListService.addNewTask(title);

  expect(mockTaskService.addTask).toHaveBeenCalledWith('selected-list', { title });
  expect(result).toBe('task-789');
});

test('TaskListService.addNewTask: falls back to selected project first list', async () => {
  const title = 'Project Selected Task';
  const mockNewTask = { id: 'task-999', title } as TaskWithSubTasks;
  mockSelectionStore.selectedProjectId = 'project-1';
  vi.mocked(mockTaskService.addTask).mockResolvedValue(mockNewTask);

  const result = await TaskListService.addNewTask(title);

  expect(mockTaskService.addTask).toHaveBeenCalledWith('list-1', { title });
  expect(result).toBe('task-999');
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
