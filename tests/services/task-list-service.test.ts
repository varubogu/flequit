import { beforeEach, describe, expect, test, vi } from 'vitest';
import type { TaskList, TaskListWithTasks } from '$lib/types/task-list';
import type { ProjectTree } from '$lib/types/project';
import type { TaskWithSubTasks } from '$lib/types/task';

const backendTaskLists = new Map<string, TaskList>();

const backendStub = {
  tasklist: {
    async create(_projectId: string, taskList: TaskList) {
      backendTaskLists.set(taskList.id, structuredClone(taskList));
    },
    async update(_projectId: string, taskListId: string, patch: Record<string, unknown>) {
      const existing = backendTaskLists.get(taskListId);
      if (!existing) {
        return false;
      }

      const updatedAt = (patch.updated_at as Date | undefined) ?? existing.updatedAt;
      backendTaskLists.set(taskListId, {
        ...existing,
        ...(patch as Partial<TaskList>),
        updatedAt
      });
      return true;
    },
    async delete(_projectId: string, taskListId: string) {
      return backendTaskLists.delete(taskListId);
    },
    async get(_projectId: string, taskListId: string) {
      return backendTaskLists.get(taskListId) ?? null;
    }
  }
};

vi.mock('$lib/infrastructure/backend-client', () => ({
  resolveBackend: vi.fn(async () => backendStub),
  resetBackendCache: vi.fn()
}));

const buildTask = (listId: string, overrides: Partial<TaskWithSubTasks> = {}): TaskWithSubTasks => {
  const now = new Date();
  return {
    id: overrides.id ?? crypto.randomUUID(),
    projectId: overrides.projectId ?? 'project-1',
    listId,
    title: overrides.title ?? 'Task',
    description: overrides.description ?? '',
    status: overrides.status ?? 'not_started',
    priority: overrides.priority ?? 0,
    planStartDate: overrides.planStartDate,
    planEndDate: overrides.planEndDate,
    isRangeDate: overrides.isRangeDate ?? false,
    isArchived: overrides.isArchived ?? false,
    orderIndex: overrides.orderIndex ?? 0,
    createdAt: overrides.createdAt ?? now,
    updatedAt: overrides.updatedAt ?? now,
    tags: overrides.tags ?? [],
    tagIds: overrides.tagIds ?? [],
    assignedUserIds: overrides.assignedUserIds ?? [],
    subTasks: overrides.subTasks ?? []
  };
};

const addTaskMock = vi.fn(async (listId: string, data: { title: string }) =>
  buildTask(listId, { title: data.title })
);

vi.mock('$lib/services/domain/task', () => ({
  taskOperations: {
    addTask: addTaskMock
  }
}));

const errorHandlerMock = {
  addSyncError: vi.fn()
};

vi.mock('$lib/stores/error-handler.svelte', () => ({
  errorHandler: errorHandlerMock
}));

const projectStoreMock = {
  projects: [] as ProjectTree[],
  getProjectById: vi.fn(
    (id: string) => projectStoreMock.projects.find((project) => project.id === id) ?? null
  )
};

vi.mock('$lib/stores/project-store.svelte', () => ({
  projectStore: projectStoreMock
}));

const selectionState = {
  selectedListId: null as string | null,
  selectedProjectId: null as string | null
};

const { TaskListService, configureTaskListSelectionResolver } = await vi.importActual<
  typeof import('$lib/services/domain/task-list')
>('$lib/services/domain/task-list');

configureTaskListSelectionResolver(() => selectionState);

const buildTaskList = (overrides: Partial<TaskList> = {}): TaskList => {
  const now = new Date();
  return {
    id: overrides.id ?? crypto.randomUUID(),
    projectId: overrides.projectId ?? 'project-1',
    name: overrides.name ?? 'Test List',
    description: overrides.description,
    color: overrides.color,
    orderIndex: overrides.orderIndex ?? 0,
    isArchived: overrides.isArchived ?? false,
    createdAt: overrides.createdAt ?? now,
    updatedAt: overrides.updatedAt ?? now
  };
};

const toTaskListWithTasks = (
  list: TaskList,
  tasks: TaskWithSubTasks[] = []
): TaskListWithTasks => ({
  ...structuredClone(list),
  tasks: tasks.map((task) => structuredClone(task))
});

const buildProject = (
  lists: TaskListWithTasks[],
  overrides: Partial<ProjectTree> = {}
): ProjectTree => {
  const now = new Date();
  return {
    id: overrides.id ?? 'project-1',
    name: overrides.name ?? 'Project 1',
    description: overrides.description,
    color: overrides.color,
    orderIndex: overrides.orderIndex ?? 0,
    isArchived: overrides.isArchived ?? false,
    status: overrides.status,
    ownerId: overrides.ownerId,
    createdAt: overrides.createdAt ?? now,
    updatedAt: overrides.updatedAt ?? now,
    taskLists: lists,
    allTags: overrides.allTags
  };
};

const registerProject = (project: ProjectTree) => {
  projectStoreMock.projects = [project];
  projectStoreMock.getProjectById.mockImplementation((id: string) =>
    id === project.id ? project : null
  );
};

beforeEach(() => {
  backendTaskLists.clear();
  projectStoreMock.projects = [];
  projectStoreMock.getProjectById.mockReset().mockImplementation(() => null);
  selectionState.selectedListId = null;
  selectionState.selectedProjectId = null;
  addTaskMock.mockClear();
  errorHandlerMock.addSyncError.mockClear();
});

describe('TaskListService', () => {
  test('addNewTask trims title and returns created task id', async () => {
    const list = buildTaskList();
    backendTaskLists.set(list.id, structuredClone(list));
    const project = buildProject([toTaskListWithTasks(list)]);
    registerProject(project);
    selectionState.selectedListId = list.id;

    const result = await TaskListService.addNewTask('  New Task  ');

    expect(addTaskMock).toHaveBeenCalledWith(list.id, { title: 'New Task' });
    const createdTask = await addTaskMock.mock.results[0].value;
    expect(result).toBe(createdTask.id);
  });

  test('addNewTask falls back to project selection when list is not directly selected', async () => {
    const list = buildTaskList();
    backendTaskLists.set(list.id, structuredClone(list));
    const project = buildProject([toTaskListWithTasks(list)]);
    registerProject(project);
    selectionState.selectedProjectId = project.id;

    const result = await TaskListService.addNewTask('Task via project');

    expect(addTaskMock).toHaveBeenCalledWith(list.id, { title: 'Task via project' });
    const createdTask = await addTaskMock.mock.results[0].value;
    expect(result).toBe(createdTask.id);
  });

  test('addNewTask returns null when title is empty after trimming', async () => {
    const result = await TaskListService.addNewTask('   ');

    expect(result).toBeNull();
    expect(addTaskMock).not.toHaveBeenCalled();
  });

  test('addNewTask returns null when no target list can be resolved', async () => {
    const project = buildProject([]);
    registerProject(project);

    const result = await TaskListService.addNewTask('Task without list');

    expect(result).toBeNull();
    expect(addTaskMock).not.toHaveBeenCalled();
  });

  test('resolveTargetListId respects configured resolver', () => {
    const list = buildTaskList();
    backendTaskLists.set(list.id, structuredClone(list));
    const project = buildProject([toTaskListWithTasks(list)]);
    registerProject(project);

    selectionState.selectedListId = list.id;
    expect(TaskListService.resolveTargetListId()).toBe(list.id);

    selectionState.selectedListId = null;
    selectionState.selectedProjectId = project.id;
    expect(TaskListService.resolveTargetListId()).toBe(list.id);
  });

  test('getTaskCountText returns pluralized strings', () => {
    expect(TaskListService.getTaskCountText(0)).toBe('0 tasks');
    expect(TaskListService.getTaskCountText(1)).toBe('1 task');
    expect(TaskListService.getTaskCountText(2)).toBe('2 tasks');
  });
});
