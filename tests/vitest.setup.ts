import '@testing-library/jest-dom';
import { beforeEach, vi } from 'vitest';

// Mock Svelte 5 reactivity system
// $stateはクラスフィールド宣言で使われる場合、初期値を直接返す
(global as Record<string, unknown>).$state = (initialValue?: unknown) => {
  return initialValue;
};

// Mock Svelte 5 derived
(global as Record<string, unknown>).$derived = (fn: () => unknown) => {
  return fn();
};

// Mock Svelte 5 effect
(global as Record<string, unknown>).$effect = (fn: () => void | (() => void)) => {
  fn();
};

// Mock Svelte 5 reactivity classes
(global as Record<string, unknown>).SvelteDate = class extends Date {
  constructor(...args: ConstructorParameters<typeof Date>) {
    super(...args);
  }
};

(global as Record<string, unknown>).SvelteMap = class extends Map {
  constructor(entries?: Iterable<readonly [unknown, unknown]> | null) {
    super();
    if (entries) {
      for (const [key, value] of entries) {
        this.set(key, value);
      }
    }
  }
};

(global as Record<string, unknown>).SvelteSet = class extends Set {
  constructor(values?: readonly unknown[] | null) {
    super(values);
  }
};

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  root = null;
  rootMargin = '';
  thresholds = [];

  constructor() {}
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() {
    return [];
  }
};

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => {}
  })
});

// Mock scrollIntoView
Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
  value: () => {},
  writable: true
});

// Mock console methods to avoid noise in tests
const originalConsole = console;
global.console = {
  ...originalConsole,
  // Keep error and warn for debugging
  log: () => {},
  debug: () => {},
  info: () => {},
  // Suppress backends not implemented warnings
  warn: (message: string, ...args: unknown[]) => {
    if (
      typeof message === 'string' &&
      message.includes('Web backends:') &&
      message.includes('not implemented')
    ) {
      return; // Suppress backends not implemented warnings
    }
    originalConsole.warn(message, ...args);
  }
};

// Mock domain services for tests
type ProjectRecord = {
  id: string;
  name: string;
  description?: string;
  color?: string;
  orderIndex: number;
  isArchived: boolean;
  createdAt: Date;
  updatedAt: Date;
  taskLists: string[];
};

type TaskListRecord = {
  id: string;
  projectId: string;
  name: string;
  description?: string;
  color?: string;
  orderIndex: number;
  isArchived: boolean;
  createdAt: Date;
  updatedAt: Date;
  tasks: string[];
};

type TaskRecord = {
  id: string;
  projectId: string;
  listId: string;
  title: string;
  description?: string;
  status: string;
  priority: number;
  planStartDate?: Date;
  planEndDate?: Date;
  isRangeDate?: boolean;
  isArchived: boolean;
  tagIds: string[];
  createdAt: Date;
  updatedAt: Date;
};

type SubTaskRecord = {
  id: string;
  projectId: string;
  taskId: string;
  title: string;
  description?: string;
  status: string;
  priority?: number;
  orderIndex: number;
  completed: boolean;
  assignedUserIds: string[];
  tagIds: string[];
  createdAt: Date;
  updatedAt: Date;
};

type SettingsState = {
  weekStart: string;
  timezone: string;
  dateFormat: string;
  customDueDays: number[];
  theme: 'system' | 'light' | 'dark';
  font: string;
  fontSize: number;
  fontColor: string;
  backgroundColor: string;
};

const mockProjects = new Map<string, ProjectRecord>();
const mockTaskLists = new Map<string, TaskListRecord>();
const mockTasks = new Map<string, TaskRecord>();
const mockSubTasks = new Map<string, SubTaskRecord>();

const createDefaultSettings = (): SettingsState => ({
  weekStart: 'monday',
  timezone: 'UTC',
  dateFormat: 'yyyy-MM-dd HH:mm',
  customDueDays: [],
  theme: 'system',
  font: 'default',
  fontSize: 13,
  fontColor: 'default',
  backgroundColor: 'default'
});

let mockSettings = createDefaultSettings();

const structuredCopy = <T>(value: T): T => structuredClone(value);

const resetDomainState = () => {
  mockProjects.clear();
  mockTaskLists.clear();
  mockTasks.clear();
  mockSubTasks.clear();
  mockSettings = createDefaultSettings();
};

const ensureProject = (projectId: string): ProjectRecord | null => {
  return mockProjects.get(projectId) ?? null;
};

const ensureTaskList = (taskListId: string): TaskListRecord | null => {
  return mockTaskLists.get(taskListId) ?? null;
};

const dataServiceImpl = {
  async createProject(projectData: Record<string, unknown>) {
    const now = new Date();
    const project: ProjectRecord = {
      id: crypto.randomUUID(),
      name: (projectData.name as string) ?? '',
      description: projectData.description as string | undefined,
      color: projectData.color as string | undefined,
      orderIndex: (projectData.order_index as number | undefined) ?? mockProjects.size,
      isArchived: false,
      createdAt: now,
      updatedAt: now,
      taskLists: []
    };
    mockProjects.set(project.id, project);
    return structuredCopy(project);
  },

  async createProjectTree(projectData: Record<string, unknown>) {
    const project = await this.createProject(projectData);
    return structuredCopy({
      ...project,
      taskLists: []
    });
  },

  async updateProject(projectId: string, updates: Record<string, unknown>) {
    const existing = ensureProject(projectId);
    if (!existing) {
      return null;
    }
    const updated: ProjectRecord = {
      ...existing,
      name: (updates.name as string) ?? existing.name,
      description: (updates.description as string | undefined) ?? existing.description,
      color: (updates.color as string | undefined) ?? existing.color,
      orderIndex: (updates.order_index as number | undefined) ?? existing.orderIndex,
      isArchived: (updates.is_archived as boolean | undefined) ?? existing.isArchived,
      updatedAt: new Date()
    };
    mockProjects.set(projectId, updated);
    return structuredCopy(updated);
  },

  async deleteProject(projectId: string) {
    for (const [taskListId, taskList] of [...mockTaskLists.entries()]) {
      if (taskList.projectId === projectId) {
        mockTaskLists.delete(taskListId);
      }
    }
    for (const [taskId, task] of [...mockTasks.entries()]) {
      if (task.projectId === projectId) {
        mockTasks.delete(taskId);
      }
    }
    for (const [subTaskId, subTask] of [...mockSubTasks.entries()]) {
      if (subTask.projectId === projectId) {
        mockSubTasks.delete(subTaskId);
      }
    }
    return mockProjects.delete(projectId);
  },

  async createTaskList(projectId: string, taskListData: Record<string, unknown>) {
    const now = new Date();
    const taskList: TaskListRecord = {
      id: crypto.randomUUID(),
      projectId,
      name: (taskListData.name as string) ?? '',
      description: taskListData.description as string | undefined,
      color: taskListData.color as string | undefined,
      orderIndex:
        (taskListData.order_index as number | undefined) ??
        Array.from(mockTaskLists.values()).filter((tl) => tl.projectId === projectId).length,
      isArchived: false,
      createdAt: now,
      updatedAt: now,
      tasks: []
    };
    mockTaskLists.set(taskList.id, taskList);
    const project = ensureProject(projectId);
    if (project && !project.taskLists.includes(taskList.id)) {
      project.taskLists.push(taskList.id);
      project.updatedAt = now;
      mockProjects.set(projectId, project);
    }
    return structuredCopy(taskList);
  },

  async createTaskListWithTasks(projectId: string, taskListData: Record<string, unknown>) {
    const taskList = await this.createTaskList(projectId, taskListData);
    return structuredCopy({
      ...taskList,
      tasks: []
    });
  },

  async updateTaskList(projectId: string, taskListId: string, updates: Record<string, unknown>) {
    const existing = ensureTaskList(taskListId);
    if (!existing || existing.projectId !== projectId) {
      return null;
    }
    const updated: TaskListRecord = {
      ...existing,
      name: (updates.name as string) ?? existing.name,
      description: (updates.description as string | undefined) ?? existing.description,
      color: (updates.color as string | undefined) ?? existing.color,
      orderIndex: (updates.orderIndex as number | undefined) ?? existing.orderIndex,
      isArchived: (updates.is_archived as boolean | undefined) ?? existing.isArchived,
      updatedAt: new Date(),
      tasks: existing.tasks
    };
    mockTaskLists.set(taskListId, updated);
    return structuredCopy(updated);
  },

  async deleteTaskList(projectId: string, taskListId: string) {
    const existing = ensureTaskList(taskListId);
    if (!existing || existing.projectId !== projectId) {
      return false;
    }
    for (const taskId of existing.tasks) {
      mockTasks.delete(taskId);
      for (const [subTaskId, subTask] of [...mockSubTasks.entries()]) {
        if (subTask.taskId === taskId) {
          mockSubTasks.delete(subTaskId);
        }
      }
    }
    mockTaskLists.delete(taskListId);
    const project = ensureProject(projectId);
    if (project) {
      project.taskLists = project.taskLists.filter((id) => id !== taskListId);
      project.updatedAt = new Date();
      mockProjects.set(projectId, project);
    }
    return true;
  },

  async createTask(listId: string, taskData: Record<string, unknown>) {
    const now = new Date();
    const projectId = (taskData.projectId as string) ?? ensureTaskList(listId)?.projectId ?? '';
    const task: TaskRecord = {
      id: crypto.randomUUID(),
      projectId,
      listId,
      title: (taskData.title as string) ?? '',
      description: taskData.description as string | undefined,
      status: (taskData.status as string) ?? 'not_started',
      priority: (taskData.priority as number | undefined) ?? 0,
      planStartDate: taskData.planStartDate as Date | undefined,
      planEndDate: taskData.planEndDate as Date | undefined,
      isRangeDate: taskData.isRangeDate as boolean | undefined,
      isArchived: (taskData.isArchived as boolean | undefined) ?? false,
      tagIds: (taskData.tagIds as string[]) ?? [],
      createdAt: now,
      updatedAt: now
    };
    mockTasks.set(task.id, task);
    const taskList = ensureTaskList(listId);
    if (taskList && !taskList.tasks.includes(task.id)) {
      taskList.tasks.push(task.id);
      taskList.updatedAt = now;
      mockTaskLists.set(listId, taskList);
    }
    return structuredCopy(task);
  },

  async createTaskWithSubTasks(listId: string, taskData: Record<string, unknown>) {
    await this.createTask(listId, taskData);
  },

  async updateTask(projectId: string, taskId: string, updates: Record<string, unknown>) {
    const existing = mockTasks.get(taskId);
    if (!existing || existing.projectId !== projectId) {
      return null;
    }
    const updated: TaskRecord = {
      ...existing,
      title: (updates.title as string) ?? existing.title,
      description: updates.description as string | undefined ?? existing.description,
      status: (updates.status as string) ?? existing.status,
      priority: (updates.priority as number | undefined) ?? existing.priority,
      listId: (updates.listId as string | undefined) ?? existing.listId,
      tagIds: (updates.tagIds as string[] | undefined) ?? existing.tagIds,
      updatedAt: new Date()
    };
    mockTasks.set(taskId, updated);
    return structuredCopy(updated);
  },

  async updateTaskWithSubTasks(projectId: string, taskId: string, updates: Record<string, unknown>) {
    await this.updateTask(projectId, taskId, updates);
  },

  async deleteTask(projectId: string, taskId: string) {
    const existing = mockTasks.get(taskId);
    if (!existing || existing.projectId !== projectId) {
      return false;
    }
    mockTasks.delete(taskId);
    const taskList = ensureTaskList(existing.listId);
    if (taskList) {
      taskList.tasks = taskList.tasks.filter((id) => id !== taskId);
      taskList.updatedAt = new Date();
      mockTaskLists.set(taskList.id, taskList);
    }
    for (const [subTaskId, subTask] of [...mockSubTasks.entries()]) {
      if (subTask.taskId === taskId) {
        mockSubTasks.delete(subTaskId);
      }
    }
    return true;
  },

  async deleteTaskWithSubTasks(projectId: string, taskId: string) {
    return this.deleteTask(projectId, taskId);
  },

  async createSubTask(projectId: string, taskId: string, subTaskData: Record<string, unknown>) {
    const now = new Date();
    const subTask: SubTaskRecord = {
      id: crypto.randomUUID(),
      projectId,
      taskId,
      title: (subTaskData.title as string) ?? '',
      description: subTaskData.description as string | undefined,
      status: (subTaskData.status as string) ?? 'not_started',
      priority: subTaskData.priority as number | undefined,
      orderIndex: 0,
      completed: false,
      assignedUserIds: [],
      tagIds: [],
      createdAt: now,
      updatedAt: now
    };
    mockSubTasks.set(subTask.id, subTask);
    return structuredCopy(subTask);
  },

  async updateSubTask(projectId: string, subTaskId: string, updates: Record<string, unknown>) {
    const existing = mockSubTasks.get(subTaskId);
    if (!existing || existing.projectId !== projectId) {
      return null;
    }
    const updated: SubTaskRecord = {
      ...existing,
      title: (updates.title as string) ?? existing.title,
      description: updates.description as string | undefined ?? existing.description,
      status: (updates.status as string) ?? existing.status,
      priority: (updates.priority as number | undefined) ?? existing.priority,
      updatedAt: new Date()
    };
    mockSubTasks.set(subTaskId, updated);
    return structuredCopy(updated);
  },

  async deleteSubTask(projectId: string, subTaskId: string) {
    const existing = mockSubTasks.get(subTaskId);
    if (!existing || existing.projectId !== projectId) {
      return false;
    }
    mockSubTasks.delete(subTaskId);
    return true;
  },

  async addTagToSubTask(projectId: string, subTaskId: string, tagId: string) {
    const existing = mockSubTasks.get(subTaskId);
    if (!existing || existing.projectId !== projectId) {
      return;
    }
    if (!existing.tagIds.includes(tagId)) {
      existing.tagIds.push(tagId);
      existing.updatedAt = new Date();
      mockSubTasks.set(subTaskId, existing);
    }
  },

  async removeTagFromSubTask(projectId: string, subTaskId: string, tagId: string) {
    const existing = mockSubTasks.get(subTaskId);
    if (!existing || existing.projectId !== projectId) {
      return;
    }
    existing.tagIds = existing.tagIds.filter((id) => id !== tagId);
    existing.updatedAt = new Date();
    mockSubTasks.set(subTaskId, existing);
  },

  async loadSettings() {
    return structuredCopy(mockSettings);
  },

  async saveSettings(settings: SettingsState) {
    mockSettings = structuredClone(settings);
    return true;
  },

  async settingsFileExists() {
    return true;
  },

  async initializeSettingsWithDefaults() {
    mockSettings = createDefaultSettings();
    return true;
  },

  async getSettingsFilePath() {
    return '/tmp/settings.json';
  },

  async updateSettingsPartially(partial: Partial<SettingsState>) {
    mockSettings = {
      ...mockSettings,
      ...partial
    };
    return structuredCopy(mockSettings);
  },

  async addCustomDueDay(days: number) {
    if (!mockSettings.customDueDays.includes(days)) {
      mockSettings.customDueDays.push(days);
    }
    return true;
  }
};

beforeEach(() => {
  resetDomainState();
});

vi.mock('$lib/services/domain/project', () => ({
  ProjectService: {
    createProject: dataServiceImpl.createProject.bind(dataServiceImpl),
    updateProject: dataServiceImpl.updateProject.bind(dataServiceImpl),
    deleteProject: dataServiceImpl.deleteProject.bind(dataServiceImpl),
    createProjectTree: dataServiceImpl.createProjectTree.bind(dataServiceImpl)
  }
}));

vi.mock('$lib/services/domain/task-list', () => ({
  TaskListService: {
    createTaskList: dataServiceImpl.createTaskList.bind(dataServiceImpl),
    createTaskListWithTasks: dataServiceImpl.createTaskListWithTasks.bind(dataServiceImpl),
    updateTaskList: dataServiceImpl.updateTaskList.bind(dataServiceImpl),
    deleteTaskList: dataServiceImpl.deleteTaskList.bind(dataServiceImpl)
  }
}));

vi.mock('$lib/services/domain/task', () => ({
  TaskService: {
    createTask: dataServiceImpl.createTask.bind(dataServiceImpl),
    updateTask: dataServiceImpl.updateTask.bind(dataServiceImpl),
    deleteTask: dataServiceImpl.deleteTask.bind(dataServiceImpl),
    createTaskWithSubTasks: dataServiceImpl.createTaskWithSubTasks.bind(dataServiceImpl),
    updateTaskWithSubTasks: dataServiceImpl.updateTaskWithSubTasks.bind(dataServiceImpl),
    deleteTaskWithSubTasks: dataServiceImpl.deleteTaskWithSubTasks.bind(dataServiceImpl)
  }
}));

vi.mock('$lib/services/domain/subtask', () => ({
  SubTaskService: {
    createSubTask: dataServiceImpl.createSubTask.bind(dataServiceImpl),
    updateSubTask: dataServiceImpl.updateSubTask.bind(dataServiceImpl),
    deleteSubTask: dataServiceImpl.deleteSubTask.bind(dataServiceImpl),
    addTagToSubTask: dataServiceImpl.addTagToSubTask.bind(dataServiceImpl),
    removeTagFromSubTask: dataServiceImpl.removeTagFromSubTask.bind(dataServiceImpl)
  }
}));

vi.mock('$lib/services/domain/settings', async () => {
  const actual = await vi.importActual<typeof import('$lib/services/domain/settings')>(
    '$lib/services/domain/settings'
  );
  return {
    ...actual,
    SettingsService: {
      loadSettings: dataServiceImpl.loadSettings.bind(dataServiceImpl),
      saveSettings: dataServiceImpl.saveSettings.bind(dataServiceImpl),
      settingsFileExists: dataServiceImpl.settingsFileExists.bind(dataServiceImpl),
      initializeSettingsWithDefaults: dataServiceImpl.initializeSettingsWithDefaults.bind(
        dataServiceImpl
      ),
      getSettingsFilePath: dataServiceImpl.getSettingsFilePath.bind(dataServiceImpl),
      updateSettingsPartially: dataServiceImpl.updateSettingsPartially.bind(dataServiceImpl),
      addCustomDueDay: dataServiceImpl.addCustomDueDay.bind(dataServiceImpl)
    }
  };
});
