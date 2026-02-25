// @ts-nocheck
import { beforeEach, vi } from 'vitest';
import type { RecurrenceRule } from '$lib/types/datetime-calendar';

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
  recurrenceRule?: RecurrenceRule;
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

type TagRecord = {
  id: string;
  name: string;
  color?: string;
  projectId?: string;
  orderIndex?: number;
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
  customDateFormats: Array<{ id: string; name: string; format: string }>;
  timeLabels: Array<{ id: string; name: string; time: string }>;
  dueDateButtons: Record<string, boolean>;
  viewItems: Array<{ id: string; label: string; icon: string; visible: boolean; order: number }>;
  lastSelectedAccount: string;
};

const mockProjects = new Map<string, ProjectRecord>();
const mockTaskLists = new Map<string, TaskListRecord>();
const mockTasks = new Map<string, TaskRecord>();
const mockSubTasks = new Map<string, SubTaskRecord>();
const mockTags: TagRecord[] = [];
const mockTagProjects = new Map<string, string>();
const mockBookmarkedTags = new Set<string>();
const mockBookmarkedOrder: string[] = [];

const cloneTagRecord = (tag: TagRecord): TagRecord => ({
  ...tag,
  createdAt: new Date(tag.createdAt),
  updatedAt: new Date(tag.updatedAt)
});

const replaceTags = (tags: TagRecord[]) => {
  mockTags.length = 0;
  mockBookmarkedOrder.length = 0;
  for (const tag of tags) {
    mockTags.push(cloneTagRecord(tag));
    if (tag.projectId) {
      mockTagProjects.set(tag.id, tag.projectId);
    }
    if (typeof tag.orderIndex === 'number') {
      mockBookmarkedOrder[tag.orderIndex] = tag.id;
    }
  }
};

const toTagRecord = (tag: { id: string; name: string; color?: string; createdAt: Date; updatedAt: Date; projectId?: string; orderIndex?: number }): TagRecord => ({
  id: tag.id,
  name: tag.name,
  color: tag.color,
  projectId: tag.projectId ?? mockTagProjects.get(tag.id) ?? undefined,
  orderIndex: tag.orderIndex,
  createdAt: new Date(tag.createdAt),
  updatedAt: new Date(tag.updatedAt)
});

const getTagsSnapshot = () => mockTags.map(cloneTagRecord);

const createDefaultSettings = (): SettingsState => ({
  weekStart: 'monday',
  timezone: 'UTC',
  dateFormat: 'yyyy-MM-dd HH:mm',
  customDueDays: [],
  theme: 'system',
  font: 'default',
  fontSize: 13,
  fontColor: 'default',
  backgroundColor: 'default',
  customDateFormats: [],
  timeLabels: [],
  dueDateButtons: {
    overdue: true,
    today: true,
    tomorrow: true,
    threeDays: false,
    thisWeek: true,
    thisMonth: true,
    thisQuarter: false,
    thisYear: false,
    thisYearEnd: false
  },
  viewItems: [],
  lastSelectedAccount: ''
});

let mockSettings = createDefaultSettings();

const structuredCopy = <T>(value: T): T => {
  try {
    return structuredClone(value);
  } catch {
    return JSON.parse(JSON.stringify(value)) as T;
  }
};

const resetDomainState = () => {
  mockProjects.clear();
  mockTaskLists.clear();
  mockTasks.clear();
  mockSubTasks.clear();
  mockTags.length = 0;
  mockTagProjects.clear();
  mockBookmarkedTags.clear();
  mockBookmarkedOrder.length = 0;
  mockSettings = createDefaultSettings();
};

const ensureProject = (projectId: string): ProjectRecord | null => mockProjects.get(projectId) ?? null;
const ensureTaskList = (taskListId: string): TaskListRecord | null => mockTaskLists.get(taskListId) ?? null;
const ensureTag = (tagId: string): TagRecord | null => mockTags.find((tag) => tag.id === tagId) ?? null;

const generateId = (prefix: string) => `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

const getBookmarksSnapshot = () => mockBookmarkedOrder.filter(Boolean);

const syncBookmarkOrderIndices = () => {
  mockBookmarkedOrder.forEach((id, index) => {
    const tag = ensureTag(id);
    if (tag) {
      tag.orderIndex = index;
    }
  });
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

  async createTag(projectId: string | undefined, tagData: Record<string, unknown>) {
    const now = new Date();
    const tag: TagRecord = {
      id: crypto.randomUUID(),
      name: ((tagData.name as string) ?? '').trim(),
      color: tagData.color as string | undefined,
      projectId: projectId ?? undefined,
      createdAt: now,
      updatedAt: now
    };
    mockTags.push(tag);
    if (projectId) {
      mockTagProjects.set(tag.id, projectId);
    }
    return structuredCopy(tag);
  },

  async updateTag(projectId: string | undefined, tagId: string, updates: Record<string, unknown>) {
    const existing = ensureTag(tagId);
    if (!existing) {
      return null;
    }
    const updated: TagRecord = {
      ...existing,
      name: (updates.name as string) ?? existing.name,
      color: (updates.color as string | undefined) ?? existing.color,
      updatedAt: new Date()
    };
    const index = mockTags.findIndex((tag) => tag.id === tagId);
    if (index !== -1) {
      mockTags[index] = updated;
    }
    if (projectId) {
      mockTagProjects.set(tagId, projectId);
    }
    return structuredCopy(updated);
  },

  async deleteTag(projectId: string | undefined, tagId: string) {
    const index = mockTags.findIndex((tag) => tag.id === tagId);
    if (index === -1) {
      return false;
    }
    mockTags.splice(index, 1);
    mockTagProjects.delete(tagId);
    mockBookmarkedTags.delete(tagId);
    const orderIndex = mockBookmarkedOrder.indexOf(tagId);
    if (orderIndex !== -1) {
      mockBookmarkedOrder.splice(orderIndex, 1);
    }
    return true;
  },

  async getProjectIdByTagId(tagId: string) {
    return mockTagProjects.get(tagId) ?? null;
  },

  async addBookmark(_projectId: string | undefined, tagId: string) {
    if (ensureTag(tagId)) {
      mockBookmarkedTags.add(tagId);
      if (!mockBookmarkedOrder.includes(tagId)) {
        mockBookmarkedOrder.push(tagId);
      }
    }
    return true;
  },

  async removeBookmark(_projectId: string | undefined, tagId: string) {
    mockBookmarkedTags.delete(tagId);
    const orderIndex = mockBookmarkedOrder.indexOf(tagId);
    if (orderIndex !== -1) {
      mockBookmarkedOrder.splice(orderIndex, 1);
    }
    return true;
  },

  async loadSettings() {
    return structuredCopy(mockSettings);
  },

  async saveSettings(settings: SettingsState) {
    mockSettings = structuredCopy(settings);
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

const taskListServiceMock = {
  createTaskList: vi.fn(dataServiceImpl.createTaskList.bind(dataServiceImpl)),
  createTaskListWithTasks: vi.fn(dataServiceImpl.createTaskListWithTasks.bind(dataServiceImpl)),
  updateTaskList: vi.fn(dataServiceImpl.updateTaskList.bind(dataServiceImpl)),
  deleteTaskList: vi.fn(dataServiceImpl.deleteTaskList.bind(dataServiceImpl)),
  addNewTask: vi.fn(async (title: string) => {
    const trimmed = title.trim();
    if (!trimmed) {
      return null;
    }

    const { selectedListId } = currentSelectionResolver();
    if (!selectedListId) {
      return null;
    }

    const created = await dataServiceImpl.createTask(selectedListId, { title: trimmed });
    return created?.id ?? null;
  }),
  getTaskCountText: vi.fn((count: number) => `${count} task${count === 1 ? '' : 's'}`),
  resolveTargetListId: vi.fn(() => currentSelectionResolver().selectedListId),
  getSelectedProject: vi.fn(() => {
    const { selectedProjectId } = currentSelectionResolver();
    if (!selectedProjectId) {
      return null;
    }

    const project = mockProjects.get(selectedProjectId);
    if (!project) {
      return null;
    }

    return {
      ...project,
      taskLists: project.taskLists
        .map((id) => mockTaskLists.get(id))
        .filter((list): list is TaskListRecord => Boolean(list))
        .map((list) => ({
          ...list,
          tasks: list.tasks.map((taskId) => mockTasks.get(taskId)).filter(Boolean)
        }))
    };
  }),
  findFirstAvailableList: vi.fn(() => {
    const [first] = [...mockTaskLists.values()];
    return first?.id ?? null;
  })
};

const taggingServiceMock = {
  createTaskTag: vi.fn(async (_projectId: string, _taskId: string, tagName: string) => ({
    id: crypto.randomUUID(),
    name: tagName,
    color: undefined,
    createdAt: new Date(),
    updatedAt: new Date()
  })),
  deleteTaskTag: vi.fn(async () => true),
  createSubtaskTag: vi.fn(async (_projectId: string, _subTaskId: string, tagName: string) => ({
    id: crypto.randomUUID(),
    name: tagName,
    color: undefined,
    createdAt: new Date(),
    updatedAt: new Date()
  })),
  deleteSubtaskTag: vi.fn(async () => true)
};

const buildTaskServiceFacade = async () => {
  const { taskCoreStore } = await import('../../src/lib/stores/task-core-store.svelte');
  const { taskStore } = await import('../../src/lib/stores/tasks.svelte');
  const { selectionStore } = await import('../../src/lib/stores/selection-store.svelte');
  const { taskListStore } = await import('../../src/lib/stores/task-list-store.svelte');
  const { subTaskStore } = await import('../../src/lib/stores/sub-task-store.svelte');
  const { TaggingService } = await import('../../src/lib/services/domain/tagging');
  const { RecurrenceService } = await import('../../src/lib/services/composite/recurrence-composite');
  const { errorHandler } = await import('../../src/lib/stores/error-handler.svelte');
  const { tagStore } = await import('../../src/lib/stores/tags.svelte');

  const normalizeDescription = (value?: string) =>
    value && value.trim().length > 0 ? value : undefined;

  const updateTaskFromForm = (taskId: string, formData: Record<string, unknown>) => {
    taskCoreStore.updateTask(taskId, {
      title: formData.title as string,
      description: normalizeDescription(formData.description as string | undefined),
      priority: (formData.priority as number | undefined) ?? 0,
      planStartDate: formData.planStartDate as Date | undefined,
      planEndDate: formData.planEndDate as Date | undefined,
      isRangeDate: (formData.isRangeDate as boolean | undefined) ?? false
    });
  };

  const updateSubTaskFromForm = (subTaskId: string, formData: Record<string, unknown>) => {
    subTaskStore.updateSubTask(subTaskId, {
      title: formData.title as string,
      description: normalizeDescription(formData.description as string | undefined),
      priority: (formData.priority as number | undefined) ?? 0,
      planStartDate: formData.planStartDate as Date | undefined,
      planEndDate: formData.planEndDate as Date | undefined,
      isRangeDate: (formData.isRangeDate as boolean | undefined) ?? false
    });
  };

  const computeEndDate = (view: string): Date | null => {
    const base = new Date();
    base.setHours(0, 0, 0, 0);
    switch (view) {
      case 'today':
        return base;
      case 'tomorrow':
        base.setDate(base.getDate() + 1);
        return base;
      case 'next3days':
        base.setDate(base.getDate() + 3);
        return base;
      case 'nextweek':
        base.setDate(base.getDate() + 7);
        return base;
      case 'thismonth':
        base.setMonth(base.getMonth() + 1);
        return base;
      default:
        return null;
    }
  };

  return {
    toggleTaskStatus(taskId: string) {
      taskCoreStore.toggleTaskStatus(taskId);
    },
    selectTask(taskId: string | null) {
      if (taskStore.isNewTaskMode) {
        taskStore.pendingTaskSelection = taskId;
        return false;
      }
      selectionStore.selectTask(taskId ?? null);
      return true;
    },
    selectSubTask(subTaskId: string | null) {
      if (taskStore.isNewTaskMode) {
        taskStore.pendingSubTaskSelection = subTaskId;
        return false;
      }
      selectionStore.selectSubTask(subTaskId ?? null);
      return true;
    },
    updateTask(taskId: string, updates: Record<string, unknown>) {
      taskCoreStore.updateTask(taskId, updates);
    },
    updateTaskFromForm,
    changeTaskStatus(taskId: string, newStatus: string) {
      const task = taskStore.getTaskById?.(taskId) as TaskRecord | undefined;

      if (newStatus === 'completed' && task?.recurrenceRule && task.planEndDate) {
        const nextDate = RecurrenceService.calculateNextDate(
          task.planEndDate,
          task.recurrenceRule
        );
        if (nextDate) {
          let planStartDate = task.planStartDate;
          if (task.isRangeDate && task.planStartDate && task.planEndDate) {
            const diff = task.planEndDate.getTime() - task.planStartDate.getTime();
            planStartDate = new Date(nextDate.getTime() - diff);
          }
          taskCoreStore.createRecurringTask({
            ...task,
            id: crypto.randomUUID(),
            status: 'not_started',
            planStartDate,
            planEndDate: nextDate
          } as unknown as TaskRecord);
        }
      }

      taskCoreStore.updateTask(taskId, { status: newStatus });
    },
    deleteTask(taskId: string) {
      selectionStore.selectTask(null);
      taskCoreStore.deleteTask(taskId);
      return true;
    },
    addTask(listId: string, taskData: Record<string, unknown>) {
      const projectId = taskListStore.getProjectIdByListId?.(listId) ?? null;
      const newTask = {
        id: crypto.randomUUID(),
        listId,
        projectId,
        title: taskData.title as string,
        description: normalizeDescription(taskData.description as string | undefined),
        status: 'not_started',
        priority: (taskData.priority as number | undefined) ?? 0,
        orderIndex: 0,
        isArchived: false,
        assignedUserIds: [],
        tagIds: [],
        createdAt: new Date(),
        updatedAt: new Date()
      };
      return taskCoreStore.addTask(listId, newTask as unknown as TaskRecord & { subTasks: []; tags: [] });
    },
    toggleSubTaskStatus(task: TaskRecord & { subTasks: Array<{ id: string; status: string }> }, subTaskId: string) {
      const found = task.subTasks.find((st) => st.id === subTaskId);
      if (!found) {
        return;
      }
      const nextStatus = found.status === 'completed' ? 'not_started' : 'completed';
      const updated = task.subTasks.map((st) =>
        st.id === subTaskId ? { ...st, status: nextStatus } : st
      );
      taskCoreStore.updateTask(task.id, { sub_tasks: updated });
    },
    updateSubTaskFromForm,
    updateSubTask(subTaskId: string, updates: Record<string, unknown>) {
      subTaskStore.updateSubTask(subTaskId, updates);
    },
    changeSubTaskStatus(subTaskId: string, newStatus: string) {
      subTaskStore.updateSubTask(subTaskId, { status: newStatus });
    },
    deleteSubTask(subTaskId: string) {
      subTaskStore.deleteSubTask(subTaskId);
      return true;
    },
    selectTaskAndFocus(taskId: string) {
      selectionStore.selectTask(taskId);
    },
    forceSelectTask(taskId: string) {
      if (taskStore.isNewTaskMode) {
        taskStore.cancelNewTaskMode?.();
      }
      selectionStore.selectTask(taskId);
    },
    forceSelectSubTask(subTaskId: string) {
      if (taskStore.isNewTaskMode) {
        taskStore.cancelNewTaskMode?.();
      }
      selectionStore.selectSubTask(subTaskId);
    },
    addSubTask(taskId: string, subTaskData: Record<string, unknown>) {
      return subTaskStore.addSubTask(taskId, {
        title: subTaskData.title as string,
        description: normalizeDescription(subTaskData.description as string | undefined),
        status: 'not_started',
        priority: (subTaskData.priority as number | undefined) ?? 0
      });
    },
    addTagToTask(taskId: string, tagId: string) {
      const context = taskStore.getTaskProjectAndList?.(taskId);
      const projectId = context?.project?.id;
      if (!projectId) {
        return;
      }
      const tags = Array.isArray(tagStore.tags) ? tagStore.tags : [];
      const tag = tags.find((item: TagRecord) => item.id === tagId);
      if (!tag) {
        return;
      }
      return TaggingService.createTaskTag(projectId, taskId, tag.name)
        .then((created) => {
          taskStore.attachTagToTask?.(taskId, created as unknown as TagRecord);
        })
        .catch((error) => {
          errorHandler.addSyncError('タスクタグ追加', 'task', taskId, error);
        });
    },
    removeTagFromTask(taskId: string, tagId: string) {
      const context = taskStore.getTaskProjectAndList?.(taskId);
      const projectId = context?.project?.id;
      if (!projectId) {
        return;
      }
      const removed = taskStore.detachTagFromTask?.(taskId, tagId) ?? null;
      if (!removed) {
        return;
      }
      return TaggingService.deleteTaskTag(projectId, taskId, tagId).catch((error) => {
        taskStore.attachTagToTask?.(taskId, removed as unknown as TagRecord);
        errorHandler.addSyncError('タスクタグ削除', 'task', taskId, error);
      });
    },
    addTagToSubTask(subTaskId: string, taskId: string, tagId: string) {
      const context = taskStore.getTaskProjectAndList?.(taskId);
      const projectId = context?.project?.id;
      if (!projectId) {
        return;
      }
      const tags = Array.isArray(tagStore.tags) ? tagStore.tags : [];
      const tag = tags.find((item: TagRecord) => item.id === tagId);
      if (!tag) {
        return;
      }
      return TaggingService.createSubtaskTag(projectId, subTaskId, tag.name)
        .then((created) => {
          subTaskStore.attachTagToSubTask?.(subTaskId, created as unknown as TagRecord);
        })
        .catch((error) => {
          errorHandler.addSyncError('サブタスクタグ追加', 'subtask', subTaskId, error);
        });
    },
    removeTagFromSubTask(subTaskId: string, taskId: string, tagId: string) {
      const context = taskStore.getTaskProjectAndList?.(taskId);
      const projectId = context?.project?.id;
      if (!projectId) {
        return;
      }
      const removed = subTaskStore.detachTagFromSubTask?.(subTaskId, tagId) ?? null;
      if (!removed) {
        return;
      }
      return TaggingService.deleteSubtaskTag(projectId, subTaskId, tagId).catch((error) => {
        subTaskStore.attachTagToSubTask?.(subTaskId, removed as unknown as TagRecord);
        errorHandler.addSyncError('サブタスクタグ削除', 'subtask', subTaskId, error);
      });
    },
    updateTaskDueDateForView(taskId: string, view: string) {
      const targetDate = computeEndDate(view);
      if (!targetDate) {
        return;
      }
      taskCoreStore.updateTask(taskId, { planEndDate: targetDate });
    },
    updateSubTaskDueDateForView(subTaskId: string, taskId: string, view: string) {
      const targetDate = computeEndDate(view);
      if (!targetDate) {
        return;
      }
      subTaskStore.updateSubTask(subTaskId, { planEndDate: targetDate });
    }
  };
};

const taskServiceFacadePromise = buildTaskServiceFacade();

type SelectionResolver = () => {
  selectedListId: string | null;
  selectedProjectId: string | null;
};

const defaultSelectionResolver: SelectionResolver = () => ({
  selectedListId: null,
  selectedProjectId: null
});

let currentSelectionResolver: SelectionResolver = defaultSelectionResolver;

beforeEach(() => {
  resetDomainState();
  currentSelectionResolver = defaultSelectionResolver;

  taskListServiceMock.createTaskList
    .mockReset()
    .mockImplementation(dataServiceImpl.createTaskList.bind(dataServiceImpl));
  taskListServiceMock.createTaskListWithTasks
    .mockReset()
    .mockImplementation(dataServiceImpl.createTaskListWithTasks.bind(dataServiceImpl));
  taskListServiceMock.updateTaskList
    .mockReset()
    .mockImplementation(dataServiceImpl.updateTaskList.bind(dataServiceImpl));
  taskListServiceMock.deleteTaskList
    .mockReset()
    .mockImplementation(dataServiceImpl.deleteTaskList.bind(dataServiceImpl));
  taskListServiceMock.addNewTask.mockReset().mockImplementation(async (title: string) => {
    const trimmed = title.trim();
    if (!trimmed) {
      return null;
    }

    const { selectedListId } = currentSelectionResolver();
    if (!selectedListId) {
      return null;
    }

    const created = await dataServiceImpl.createTask(selectedListId, { title: trimmed });
    return created?.id ?? null;
  });
  taskListServiceMock.getTaskCountText
    .mockReset()
    .mockImplementation((count: number) => `${count} task${count === 1 ? '' : 's'}`);
  taskListServiceMock.resolveTargetListId
    .mockReset()
    .mockImplementation(() => currentSelectionResolver().selectedListId);
  taskListServiceMock.getSelectedProject.mockReset().mockImplementation(() => {
    const { selectedProjectId } = currentSelectionResolver();
    if (!selectedProjectId) {
      return null;
    }

    const project = mockProjects.get(selectedProjectId);
    if (!project) {
      return null;
    }

    return {
      ...project,
      taskLists: project.taskLists
        .map((id) => mockTaskLists.get(id))
        .filter((list): list is TaskListRecord => Boolean(list))
        .map((list) => ({
          ...list,
          tasks: list.tasks.map((taskId) => mockTasks.get(taskId)).filter(Boolean)
        }))
    };
  });
  taskListServiceMock.findFirstAvailableList.mockReset().mockImplementation(() => {
    const [first] = [...mockTaskLists.values()];
    return first?.id ?? null;
  });

  taggingServiceMock.createTaskTag.mockReset().mockImplementation(async (_projectId, _taskId, tagName) => ({
    id: crypto.randomUUID(),
    name: tagName,
    color: undefined,
    createdAt: new Date(),
    updatedAt: new Date()
  }));
  taggingServiceMock.deleteTaskTag.mockReset().mockResolvedValue(true);
  taggingServiceMock.createSubtaskTag.mockReset().mockImplementation(async (_projectId, _subTaskId, tagName) => ({
    id: crypto.randomUUID(),
    name: tagName,
    color: undefined,
    createdAt: new Date(),
    updatedAt: new Date()
  }));
  taggingServiceMock.deleteSubtaskTag.mockReset().mockResolvedValue(true);
});

vi.mock('$lib/services/domain/project', () => ({
  ProjectBackend: {
    create: dataServiceImpl.createProject.bind(dataServiceImpl),
    update: dataServiceImpl.updateProject.bind(dataServiceImpl),
    delete: dataServiceImpl.deleteProject.bind(dataServiceImpl),
    createProjectTree: dataServiceImpl.createProjectTree.bind(dataServiceImpl)
  }
}));

vi.mock('$lib/services/domain/task-list', () => ({
  TaskListService: taskListServiceMock,
  configureTaskListSelectionResolver: (resolver: SelectionResolver) => {
    currentSelectionResolver = resolver;
  }
}));

vi.mock('$lib/services/domain/task/task-crud', () => ({
	TaskService: {
		createTask: dataServiceImpl.createTask.bind(dataServiceImpl),
		updateTask: dataServiceImpl.updateTask.bind(dataServiceImpl),
		deleteTask: dataServiceImpl.deleteTask.bind(dataServiceImpl),
		createTaskWithSubTasks: dataServiceImpl.createTaskWithSubTasks.bind(dataServiceImpl),
		updateTaskWithSubTasks: dataServiceImpl.updateTaskWithSubTasks.bind(dataServiceImpl),
		deleteTaskWithSubTasks: dataServiceImpl.deleteTaskWithSubTasks.bind(dataServiceImpl)
	}
}));

vi.mock('$lib/services/domain/tag', () => ({
  TagService: {
    createTag: vi.fn(async (projectId: string | undefined, tagData: Record<string, unknown>) =>
      dataServiceImpl.createTag(projectId, tagData)
    ),
    updateTag: vi.fn(async (projectId: string | undefined, tagId: string, updates: Record<string, unknown>) =>
      dataServiceImpl.updateTag(projectId, tagId, updates)
    ),
    deleteTag: vi.fn(async (projectId: string | undefined, tagId: string) =>
      dataServiceImpl.deleteTag(projectId, tagId)
    ),
    addBookmark: vi.fn(async (projectId: string | undefined, tagId: string) =>
      dataServiceImpl.addBookmark(projectId, tagId)
    ),
    removeBookmark: vi.fn(async (projectId: string | undefined, tagId: string) =>
      dataServiceImpl.removeBookmark(projectId, tagId)
    ),
    getProjectIdByTagId: vi.fn(async (tagId: string) => dataServiceImpl.getProjectIdByTagId(tagId))
  }
}));

vi.mock('$lib/services/domain/tagging', () => ({
  TaggingService: taggingServiceMock
}));

vi.mock('$lib/services/domain/task', async () => {
  const actual = await vi.importActual<typeof import('$lib/services/domain/task')>(
    '$lib/services/domain/task'
  );
  return {
    ...actual,
    TaskService: await taskServiceFacadePromise
  };
});

vi.mock('../../src/lib/services/domain/task', async () => {
  const actual = await vi.importActual<typeof import('../../src/lib/services/domain/task')>(
    '../../src/lib/services/domain/task'
  );
  return {
    ...actual,
    TaskService: await taskServiceFacadePromise
  };
});

vi.mock('$lib/stores/tags.svelte', async () => {
  const actual = await vi.importActual<typeof import('$lib/stores/tags.svelte')>(
    '$lib/stores/tags.svelte'
  );

  const tagStore = {
    ...actual.tagStore,
    get tags() {
      return getTagsSnapshot();
    },
    set tags(value: unknown) {
      const records = (value as Array<Record<string, unknown>>).map((tag) =>
        toTagRecord(tag as TagRecord)
      );
      replaceTags(records);
    },
    setTags: vi.fn((tags: Array<Record<string, unknown>>) => {
      replaceTags(tags.map((tag) => toTagRecord(tag as TagRecord)));
    }),
    addTagWithId: vi.fn((tag: unknown) => {
      const record = toTagRecord(tag as TagRecord);
      mockTags.push(record);
      if (record.projectId) {
        mockTagProjects.set(record.id, record.projectId);
      }
      return cloneTagRecord(record);
    }),
    addTag: vi.fn(async (tagData: { name: string; color?: string }, projectId?: string) =>
      dataServiceImpl.createTag(projectId, tagData)
    ),
    get bookmarkedTags() {
      return new Set(mockBookmarkedTags);
    },
    set bookmarkedTags(value: Iterable<string>) {
      mockBookmarkedTags.clear();
      mockBookmarkedOrder.length = 0;
      if (!value) {
        return;
      }

      for (const id of value) {
        mockBookmarkedTags.add(id);
        if (!mockBookmarkedOrder.includes(id)) {
          mockBookmarkedOrder.push(id);
        }
      }

      syncBookmarkOrderIndices();
    },
    addBookmark: vi.fn(async (tagId: string) => {
      mockBookmarkedTags.add(tagId);
      if (!mockBookmarkedOrder.includes(tagId)) {
        mockBookmarkedOrder.push(tagId);
      }
      const tag = ensureTag(tagId);
      if (tag) {
        tag.orderIndex = mockBookmarkedOrder.indexOf(tagId);
      }
    }),
    removeBookmark: vi.fn((tagId: string) => {
      mockBookmarkedTags.delete(tagId);
      const idx = mockBookmarkedOrder.indexOf(tagId);
      if (idx !== -1) {
        mockBookmarkedOrder.splice(idx, 1);
      }
      syncBookmarkOrderIndices();
    }),
    isBookmarked: vi.fn((tagId: string) => mockBookmarkedTags.has(tagId)),
    toggleBookmark: vi.fn((tagId: string) => {
      if (mockBookmarkedTags.has(tagId)) {
        mockBookmarkedTags.delete(tagId);
        const idx = mockBookmarkedOrder.indexOf(tagId);
        if (idx !== -1) {
          mockBookmarkedOrder.splice(idx, 1);
        }
      } else {
        mockBookmarkedTags.add(tagId);
        if (!mockBookmarkedOrder.includes(tagId)) {
          mockBookmarkedOrder.push(tagId);
        }
      }
      syncBookmarkOrderIndices();
    }),
    moveBookmarkedTagToPosition: vi.fn(async (tagId: string, targetIndex: number) => {
      const currentIndex = mockBookmarkedOrder.indexOf(tagId);
      if (currentIndex === -1 || currentIndex === targetIndex) {
        return;
      }
      mockBookmarkedOrder.splice(currentIndex, 1);
      mockBookmarkedOrder.splice(targetIndex, 0, tagId);
      syncBookmarkOrderIndices();
    }),
    reorderBookmarkedTags: vi.fn(async (fromIndex: number, toIndex: number) => {
      if (
        fromIndex === toIndex ||
        fromIndex < 0 ||
        toIndex < 0 ||
        fromIndex >= mockBookmarkedOrder.length ||
        toIndex >= mockBookmarkedOrder.length
      ) {
        return;
      }

      const [moved] = mockBookmarkedOrder.splice(fromIndex, 1);
      mockBookmarkedOrder.splice(toIndex, 0, moved);
      syncBookmarkOrderIndices();
    }),
    getBookmarkedTagList: vi.fn(() =>
      getBookmarksSnapshot()
        .map((id) => ensureTag(id))
        .filter((tag): tag is TagRecord => Boolean(tag))
        .map(cloneTagRecord)
    ),
    get bookmarkedTagList() {
      return this.getBookmarkedTagList();
    },
    setBookmarkForInitialization: vi.fn((tagId: string) => {
      mockBookmarkedTags.add(tagId);
      if (!mockBookmarkedOrder.includes(tagId)) {
        mockBookmarkedOrder.push(tagId);
      }
      syncBookmarkOrderIndices();
    }),
    initializeTagOrderIndices: vi.fn(() => {
      const ordered = getBookmarksSnapshot();
      ordered.forEach((id, index) => {
        const tag = ensureTag(id);
        if (tag) {
          tag.orderIndex = index;
        }
      });
    }),
    getProjectIdByTagId: vi.fn(async (tagId: string) => mockTagProjects.get(tagId) ?? null)
  };

  return {
    ...actual,
    tagStore
  };
});

vi.mock('$lib/services/domain/subtask', () => {
  const subTaskOperations = {
    toggleSubTaskStatus: vi.fn(),
    addSubTask: vi.fn(),
    updateSubTaskFromForm: vi.fn(),
    updateSubTask: vi.fn(),
    changeSubTaskStatus: vi.fn(),
    deleteSubTask: vi.fn(),
    addTagToSubTaskByName: vi.fn(),
    addTagToSubTask: vi.fn(),
    removeTagFromSubTask: vi.fn(),
    updateSubTaskDueDateForView: vi.fn()
  };

  return {
    SubTaskBackend: {
      createSubTask: dataServiceImpl.createSubTask.bind(dataServiceImpl),
      updateSubTask: dataServiceImpl.updateSubTask.bind(dataServiceImpl),
      deleteSubTask: dataServiceImpl.deleteSubTask.bind(dataServiceImpl)
    },
    SubTaskOperations: class {
      toggleSubTaskStatus = subTaskOperations.toggleSubTaskStatus;
      addSubTask = subTaskOperations.addSubTask;
      updateSubTaskFromForm = subTaskOperations.updateSubTaskFromForm;
      updateSubTask = subTaskOperations.updateSubTask;
      changeSubTaskStatus = subTaskOperations.changeSubTaskStatus;
      deleteSubTask = subTaskOperations.deleteSubTask;
      addTagToSubTaskByName = subTaskOperations.addTagToSubTaskByName;
      addTagToSubTask = subTaskOperations.addTagToSubTask;
      removeTagFromSubTask = subTaskOperations.removeTagFromSubTask;
      updateSubTaskDueDateForView = subTaskOperations.updateSubTaskDueDateForView;
    },
    getSubTaskOperations: vi.fn(() => subTaskOperations),
    subTaskOperations
  };
});

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

vi.mock('$lib/stores/settings.svelte', () => {
  const availableTimezones = [
    { value: 'UTC', label: 'UTC' },
    { value: 'America/New_York', label: 'Eastern Time' },
    { value: 'Asia/Tokyo', label: 'Japan Time' }
  ];

  const settingsStore = {
    get language() {
      return mockSettings.language;
    },
    setLanguage: vi.fn((language: string) => {
      mockSettings.language = language;
    }),
    get weekStart() {
      return mockSettings.weekStart;
    },
    setWeekStart: vi.fn((weekStart: string) => {
      mockSettings.weekStart = weekStart;
    }),
    get timezone() {
      return mockSettings.timezone;
    },
    setTimezone: vi.fn((timezone: string) => {
      mockSettings.timezone = timezone;
    }),
    get effectiveTimezone() {
      if (mockSettings.timezone === 'system') {
        return Intl.DateTimeFormat().resolvedOptions().timeZone;
      }
      return mockSettings.timezone;
    },
    get dateFormat() {
      return mockSettings.dateFormat;
    },
    setDateFormat: vi.fn((dateFormat: string) => {
      mockSettings.dateFormat = dateFormat;
    }),
    resetDateFormatToDefault: vi.fn(() => {
      mockSettings.dateFormat = createDefaultSettings().dateFormat;
    }),
    get customDateFormats() {
      return mockSettings.customDateFormats;
    },
    addCustomDateFormat: vi.fn((name: string, format: string) => {
      const id = generateId('custom');
      mockSettings.customDateFormats.push({ id, name, format });
      return id;
    }),
    updateCustomDateFormat: vi.fn(
      (id: string, updates: Partial<{ name: string; format: string }>) => {
        mockSettings.customDateFormats = mockSettings.customDateFormats.map((item) =>
          item.id === id ? { ...item, ...updates } : item
        );
      }
    ),
    removeCustomDateFormat: vi.fn((id: string) => {
      mockSettings.customDateFormats = mockSettings.customDateFormats.filter((item) => item.id !== id);
    }),
    get timeLabels() {
      return mockSettings.timeLabels;
    },
    addTimeLabel: vi.fn((name: string, time: string) => {
      const id = generateId('time');
      mockSettings.timeLabels.push({ id, name, time });
      return id;
    }),
    updateTimeLabel: vi.fn(
      (id: string, updates: Partial<{ name: string; time: string }>) => {
        mockSettings.timeLabels = mockSettings.timeLabels.map((label) =>
          label.id === id ? { ...label, ...updates } : label
        );
      }
    ),
    removeTimeLabel: vi.fn((id: string) => {
      mockSettings.timeLabels = mockSettings.timeLabels.filter((label) => label.id !== id);
    }),
    getTimeLabelsByTime: vi.fn((time: string) =>
      mockSettings.timeLabels.filter((label) => label.time === time)
    ),
    init: vi.fn(async () => {})
  };

  const DEFAULT_SETTINGS = createDefaultSettings();

  return {
    settingsStore,
    mainSettingsStore: settingsStore,
    DEFAULT_SETTINGS,
    getAvailableTimezones: vi.fn(() => availableTimezones),
    getDefaultDateFormat: () => DEFAULT_SETTINGS.dateFormat,
    getStandardDateFormats: () => [DEFAULT_SETTINGS.dateFormat],
    getAllDateFormats: () => [
      { id: 'default', name: 'Default', format: DEFAULT_SETTINGS.dateFormat },
      ...mockSettings.customDateFormats
    ]
  };
});

beforeEach(() => {
  // default storage mock for tests that rely on localStorage interaction
  const localStorageMock = {
    getItem: vi.fn(() => null),
    setItem: vi.fn(),
    clear: vi.fn()
  };
  Object.defineProperty(window, 'localStorage', {
    value: localStorageMock,
    writable: true
  });
});
