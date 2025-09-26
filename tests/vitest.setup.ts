import '@testing-library/jest-dom';

// Mock Svelte 5 reactivity system
(global as any).$state = (initialValue?: unknown) => {
  let value = initialValue;
  return {
    get value() { return value; },
    set value(newValue) { value = newValue; }
  };
};

// Mock Svelte 5 derived
(global as any).$derived = (fn: () => unknown) => {
  return fn();
};

// Mock Svelte 5 effect
(global as any).$effect = (fn: () => void | (() => void)) => {
  fn();
};

// Mock Svelte 5 reactivity classes
(global as any).SvelteDate = class extends Date {
  constructor(...args: ConstructorParameters<typeof Date>) {
    super(...args);
  }
};

(global as any).SvelteMap = class extends Map {
  constructor(entries?: Iterable<readonly [unknown, unknown]> | null) {
    super();
    if (entries) {
      for (const [key, value] of entries) {
        this.set(key, value);
      }
    }
  }
};

(global as any).SvelteSet = class extends Set {
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
  // Suppress backend not implemented warnings
  warn: (message: string, ...args: unknown[]) => {
    if (
      typeof message === 'string' &&
      message.includes('Web backend:') &&
      message.includes('not implemented')
    ) {
      return; // Suppress backend not implemented warnings
    }
    originalConsole.warn(message, ...args);
  }
};

// Mock dataService for tests
import { vi } from 'vitest';

vi.mock('$lib/services/data-service', () => {
  const mockProjects = new Map();
  const mockTaskLists = new Map();
  const mockTasks = new Map();
  const mockSubTasks = new Map();
  // settings mock state
  let mockSettings = {
    weekStart: 'monday',
    timezone: 'UTC',
    dateFormat: 'yyyy-MM-dd HH:mm',
    customDueDays: [] as number[]
  };

  return {
    dataService: {
      // Project methods
      async createProject(projectData: any) {
        const newProject = {
          id: crypto.randomUUID(),
          ...projectData,
          order_index: projectData.order_index ?? 0,
          is_archived: false,
          created_at: new Date(),
          updated_at: new Date()
        };
        mockProjects.set(newProject.id, newProject);
        return newProject;
      },

      async createProjectTree(projectData: any) {
        const newProject = {
          id: crypto.randomUUID(),
          ...projectData,
          created_at: new Date(),
          updated_at: new Date(),
          task_lists: []
        };
        mockProjects.set(newProject.id, newProject);
        return newProject;
      },

      async updateProject(projectId: string, updates: any) {
        const project = mockProjects.get(projectId);
        if (project) {
          const updated = { ...project, ...updates, updated_at: new Date() };
          mockProjects.set(projectId, updated);
          return updated;
        }
        return null;
      },

      async deleteProject(projectId: string) {
        return mockProjects.delete(projectId);
      },

      // TaskList methods
      async createTaskList(projectId: string, taskListData: any) {
        const newTaskList = {
          id: crypto.randomUUID(),
          project_id: projectId,
          ...taskListData,
          order_index: taskListData.order_index ?? 0,
          is_archived: false,
          created_at: new Date(),
          updated_at: new Date()
        };
        mockTaskLists.set(newTaskList.id, newTaskList);
        return newTaskList;
      },

      async createTaskListWithTasks(projectId: string, taskListData: any) {
        const newTaskList = {
          id: crypto.randomUUID(),
          project_id: projectId,
          ...taskListData,
          created_at: new Date(),
          updated_at: new Date(),
          tasks: []
        };
        mockTaskLists.set(newTaskList.id, newTaskList);

        // Add to project if exists
        const project = mockProjects.get(projectId);
        if (project) {
          project.task_lists.push(newTaskList);
          mockProjects.set(projectId, project);
        }

        return newTaskList;
      },

      async updateTaskList(taskListId: string, updates: any) {
        const taskList = mockTaskLists.get(taskListId);
        if (taskList) {
          const updated = { ...taskList, ...updates, updated_at: new Date() };
          mockTaskLists.set(taskListId, updated);
          return updated;
        }
        return null;
      },

      async deleteTaskList(taskListId: string) {
        const taskList = mockTaskLists.get(taskListId);
        if (taskList) {
          // Remove from project
          const project = mockProjects.get(taskList.project_id);
          if (project) {
            const index = project.task_lists.findIndex((tl: any) => tl.id === taskListId);
            if (index !== -1) {
              project.task_lists.splice(index, 1);
              mockProjects.set(project.id, project);
            }
          }
          mockTaskLists.delete(taskListId);
          return true;
        }
        return false;
      },

      // Task methods
      async createTask(listId: string, taskData: any) {
        const newTask = {
          id: crypto.randomUUID(),
          list_id: listId,
          ...taskData,
          status: taskData.status ?? 'not_started',
          priority: taskData.priority ?? 0,
          order_index: taskData.order_index ?? 0,
          is_archived: false,
          assigned_user_ids: taskData.assigned_user_ids ?? [],
          tag_ids: taskData.tag_ids ?? [],
          created_at: new Date(),
          updated_at: new Date()
        };
        mockTasks.set(newTask.id, newTask);
        return newTask;
      },

      async createTaskWithSubTasks(listId: string, taskData: any) {
        const newTask = {
          ...taskData,
          created_at: new Date(),
          updated_at: new Date()
        };
        mockTasks.set(newTask.id, newTask);
        return newTask;
      },

      async updateTaskWithSubTasks(taskId: string, updates: any) {
        const task = mockTasks.get(taskId);
        if (task) {
          const updated = { ...task, ...updates, updated_at: new Date() };
          mockTasks.set(taskId, updated);
          return updated;
        }
        return null;
      },

      async deleteTaskWithSubTasks(taskId: string) {
        return mockTasks.delete(taskId);
      },

      async updateTask(taskId: string, updates: any) {
        const task = mockTasks.get(taskId);
        if (task) {
          const updated = { ...task, ...updates, updated_at: new Date() };
          mockTasks.set(taskId, updated);
          return updated;
        }
        return null;
      },

      // SubTask methods
      async createSubTask(taskId: string, subTaskData: any) {
        const newSubTask = {
          id: crypto.randomUUID(),
          task_id: taskId,
          ...subTaskData,
          status: subTaskData.status ?? 'not_started',
          priority: subTaskData.priority ?? 0,
          order_index: subTaskData.order_index ?? 0,
          completed: false,
          assigned_user_ids: subTaskData.assigned_user_ids ?? [],
          tag_ids: subTaskData.tag_ids ?? [],
          tags: subTaskData.tags ?? [],
          created_at: new Date(),
          updated_at: new Date()
        };
        mockSubTasks.set(newSubTask.id, newSubTask);
        return newSubTask;
      },

      async updateSubTask(subTaskId: string, updates: any) {
        const subTask = mockSubTasks.get(subTaskId);
        if (subTask) {
          const updated = { ...subTask, ...updates, updated_at: new Date() };
          mockSubTasks.set(subTaskId, updated);
          return updated;
        }
        return null;
      },

      async deleteSubTask(subTaskId: string) {
        return mockSubTasks.delete(subTaskId);
      },

      // Tag methods
      async createTag(tagData: any) {
        return {
          id: crypto.randomUUID(),
          ...tagData,
          order_index: tagData.order_index ?? 0,
          created_at: new Date(),
          updated_at: new Date()
        };
      },

      async updateTag(tagId: string, updates: any) {
        // Mock implementation - just return success
        return true;
      },

      // Additional methods
      async loadProjectData() {
        return [];
      },

      async initializeAll() {
        return true;
      },

      // Settings Management methods (for settings components/tests)
      async loadSettings() {
        return { ...mockSettings };
      },
      async saveSettings(settings: any) {
        mockSettings = { ...mockSettings, ...settings };
        return true;
      },
      async settingsFileExists() {
        return true;
      },
      async initializeSettingsWithDefaults() {
        mockSettings = {
          weekStart: 'monday',
          timezone: 'UTC',
          dateFormat: 'yyyy-MM-dd HH:mm',
          customDueDays: []
        };
        return true;
      },
      async getSettingsFilePath() {
        return '/tmp/settings.json';
      },
      async updateSettingsPartially(partial: Partial<typeof mockSettings>) {
        mockSettings = { ...mockSettings, ...partial };
        return { ...mockSettings };
      },
      async addCustomDueDay(days: number) {
        if (!mockSettings.customDueDays.includes(days)) {
          mockSettings.customDueDays.push(days);
        }
        return true;
      },

      async addTagToSubTask(subTaskId: string, tagId: string) {
        const subTask = mockSubTasks.get(subTaskId);
        if (subTask) {
          subTask.tag_ids = subTask.tag_ids || [];
          if (!subTask.tag_ids.includes(tagId)) {
            subTask.tag_ids.push(tagId);
          }
          return true;
        }
        return false;
      },

      async removeTagFromSubTask(subTaskId: string, tagId: string) {
        const subTask = mockSubTasks.get(subTaskId);
        if (subTask && subTask.tag_ids) {
          subTask.tag_ids = subTask.tag_ids.filter((id: string) => id !== tagId);
          return true;
        }
        return false;
      }
    }
  };
});
