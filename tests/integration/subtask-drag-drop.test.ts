import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DragDropManager, type DragData } from '$lib/utils/drag-drop';
import { SubTaskMutations } from '$lib/services/domain/subtask/subtask-mutations';
import type { ProjectTree } from '$lib/types/project';
import type { TaskWithSubTasks } from '$lib/types/task';
import type { SubTaskWithTags } from '$lib/types/sub-task';
import type { Tag } from '$lib/types/tag';

type DragDropEnv = ReturnType<typeof createDragDropEnvironment>;

function genId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

function createTask(): TaskWithSubTasks {
  return {
    id: 'task-1',
    projectId: 'project-1',
    listId: 'list-1',
    title: 'Task',
    description: '',
    status: 'not_started',
    priority: 1,
    planStartDate: undefined,
    planEndDate: undefined,
    isRangeDate: false,
    orderIndex: 0,
    isArchived: false,
    assignedUserIds: [],
    tagIds: [],
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-01T00:00:00Z'),
    tags: [],
    subTasks: []
  };
}

function createProject(task: TaskWithSubTasks): ProjectTree {
  return {
    id: 'project-1',
    name: 'Project',
    description: '',
    color: '#00aaff',
    orderIndex: 0,
    isArchived: false,
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-01T00:00:00Z'),
    taskLists: [
      {
        id: 'list-1',
        projectId: 'project-1',
        name: 'List',
        description: '',
        color: undefined,
        orderIndex: 0,
        isArchived: false,
        createdAt: new Date('2024-01-01T00:00:00Z'),
        updatedAt: new Date('2024-01-01T00:00:00Z'),
        tasks: [task]
      }
    ]
  };
}

function createSubTask(overrides: Partial<SubTaskWithTags> = {}): SubTaskWithTags {
  return {
    id: genId('sub'),
    taskId: 'task-1',
    title: 'SubTask',
    description: '',
    status: 'not_started',
    priority: 0,
    planStartDate: undefined,
    planEndDate: undefined,
    doStartDate: undefined,
    doEndDate: undefined,
    isRangeDate: false,
    recurrenceRule: undefined,
    orderIndex: 0,
    completed: false,
    assignedUserIds: [],
    tagIds: [],
    tags: [],
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-01T00:00:00Z'),
    ...overrides
  };
}

function createDragDropEnvironment() {
  const task = createTask();
  const project = createProject(task);
  const tags: Tag[] = [
    {
      id: 'tag-1',
      name: 'Existing Tag',
      color: '#ff0000',
      createdAt: new Date('2024-01-01T00:00:00Z'),
      updatedAt: new Date('2024-01-01T00:00:00Z')
    }
  ];

  const subTaskStoreMock = {
    addSubTask: vi.fn(async (taskId: string, data: Partial<SubTaskWithTags>) => {
      if (taskId !== task.id) return null;
      const newSub = createSubTask({
        id: genId('sub'),
        taskId,
        title: data.title ?? 'New SubTask',
        priority: data.priority ?? 0
      });
      task.subTasks.push(newSub);
      return newSub;
    }),
    updateSubTask: vi.fn(async (subTaskId: string, updates: Partial<SubTaskWithTags>) => {
      const sub = task.subTasks.find((item) => item.id === subTaskId);
      if (!sub) return;
      Object.assign(sub, updates, { updatedAt: new Date() });
    }),
    deleteSubTask: vi.fn(async (subTaskId: string) => {
      const index = task.subTasks.findIndex((item) => item.id === subTaskId);
      if (index !== -1) {
        task.subTasks.splice(index, 1);
      }
    }),
    attachTagToSubTask: vi.fn((subTaskId: string, tag: Tag) => {
      const sub = task.subTasks.find((item) => item.id === subTaskId);
      if (!sub) return;
      if (sub.tags.some((existing) => existing.id === tag.id)) return;
      sub.tags.push(tag);
      sub.updatedAt = new Date();
    }),
    detachTagFromSubTask: vi.fn((subTaskId: string, tagId: string) => {
      const sub = task.subTasks.find((item) => item.id === subTaskId);
      if (!sub) return null;
      const index = sub.tags.findIndex((tag) => tag.id === tagId);
      if (index === -1) return null;
      const [removed] = sub.tags.splice(index, 1);
      sub.updatedAt = new Date();
      return removed ?? null;
    })
  };

  const taskStoreMock = {
    getTaskProjectAndList: vi.fn((taskId: string) => {
      if (taskId === task.id) {
        return {
          project,
          taskList: project.taskLists[0]
        };
      }
      return null;
    })
  };

  const taggingServiceMock = {
    createSubtaskTag: vi.fn(async (_projectId: string, _subTaskId: string, name: string) => ({
      id: genId('tag'),
      name,
      color: '#00aa00',
      createdAt: new Date(),
      updatedAt: new Date()
    })),
    deleteSubtaskTag: vi.fn(async () => {})
  };

  const errorHandlerMock = {
    addSyncError: vi.fn()
  };

  const mutations = new SubTaskMutations({
    taskStore: taskStoreMock as any,
    taskCoreStore: { updateTask: vi.fn() } as any,
    subTaskStore: subTaskStoreMock as any,
    tagStore: { tags } as any,
    taggingService: taggingServiceMock as any,
    errorHandler: errorHandlerMock as any
  });

  const subTask = createSubTask({ id: 'subtask-1', title: 'Initial' });
  task.subTasks.push(subTask);

  return {
    project,
    task,
    tags,
    subTask,
    subTaskStoreMock,
    taskStoreMock,
    taggingServiceMock,
    errorHandlerMock,
    mutations
  };
}

describe('SubTask Drag and Drop Integration', () => {
  let env: DragDropEnv;

  beforeEach(() => {
    vi.clearAllMocks();
    env = createDragDropEnvironment();
  });

  describe('DragDropManager canDrop for subtasks', () => {
    it('subtask can drop on view', () => {
      const dragData = { type: 'subtask', id: 'subtask-1', taskId: 'task-1' } as const;
      const target = { type: 'view', id: 'today' } as const;
      expect(DragDropManager.canDrop(dragData, target)).toBe(true);
    });

    it('subtask can drop on tag', () => {
      const dragData = { type: 'subtask', id: 'subtask-1', taskId: 'task-1' } as const;
      const target = { type: 'tag', id: 'tag-1' } as const;
      expect(DragDropManager.canDrop(dragData, target)).toBe(true);
    });

    it('subtask cannot drop on task', () => {
      const dragData = { type: 'subtask', id: 'subtask-1', taskId: 'task-1' } as const;
      const target = { type: 'task', id: 'task-2' } as const;
      expect(DragDropManager.canDrop(dragData, target)).toBe(false);
    });

    it('subtask cannot drop on itself', () => {
      const dragData = { type: 'subtask', id: 'subtask-1', taskId: 'task-1' } as const;
      const target = { type: 'subtask', id: 'subtask-1' } as const;
      expect(DragDropManager.canDrop(dragData, target)).toBe(false);
    });
  });

  describe('View drop handling', () => {
    const handleViewDrop = (viewId: string, dragData: DragData, mutations: SubTaskMutations) => {
      if (dragData.type === 'subtask' && dragData.taskId) {
        mutations.updateSubTaskDueDateForView(dragData.id, dragData.taskId, viewId);
      }
    };

    ['today', 'tomorrow', 'next3days', 'nextweek', 'thismonth'].forEach((viewId) => {
      it(`updates due date when dropped on ${viewId}`, () => {
        const dragData = {
          type: 'subtask' as const,
          id: env.subTask.id,
          taskId: env.task.id
        };

        handleViewDrop(viewId, dragData, env.mutations);

        expect(env.subTaskStoreMock.updateSubTask).toHaveBeenCalledWith(
          env.subTask.id,
          expect.objectContaining({ planEndDate: expect.any(Date) })
        );
      });
    });
  });

  describe('Tag drop handling', () => {
    it('adds tag to subtask via mutations', async () => {
      const dragData: DragData = {
        type: 'subtask',
        id: env.subTask.id,
        taskId: env.task.id
      };

      const handleTagDrop = async (
        targetTagId: string,
        dragData: DragData,
        mutations: SubTaskMutations
      ) => {
        if (dragData.type === 'subtask' && dragData.taskId) {
          await mutations.addTagToSubTask(dragData.id, dragData.taskId, targetTagId);
        }
      };

      await handleTagDrop('tag-1', dragData, env.mutations);

      expect(env.taggingServiceMock.createSubtaskTag).toHaveBeenCalledWith(
        'project-1',
        env.subTask.id,
        'Existing Tag'
      );
      expect(env.subTaskStoreMock.attachTagToSubTask).toHaveBeenCalled();
    });
  });

  describe('SubTaskMutations direct methods', () => {
    it('updateSubTaskDueDateForView delegates to store', () => {
      env.mutations.updateSubTaskDueDateForView(env.subTask.id, env.task.id, 'today');
      expect(env.subTaskStoreMock.updateSubTask).toHaveBeenCalledTimes(1);
    });

    it('addTagToSubTask delegates to tagging service', async () => {
      await env.mutations.addTagToSubTask(env.subTask.id, env.task.id, 'tag-1');
      expect(env.taggingServiceMock.createSubtaskTag).toHaveBeenCalled();
      expect(env.subTaskStoreMock.attachTagToSubTask).toHaveBeenCalled();
    });
  });
});
