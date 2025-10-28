import { describe, beforeEach, it, expect, vi } from 'vitest';
import { SubTaskMutations } from '$lib/services/domain/subtask/subtask-mutations';
import type { ProjectTree } from '$lib/types/project';
import type { TaskWithSubTasks } from '$lib/types/task';
import type { SubTaskWithTags } from '$lib/types/sub-task';
import type { Tag } from '$lib/types/tag';

type TestEnvironment = ReturnType<typeof createTestEnvironment>;

function createBaseTag(name: string, overrides: Partial<Tag> = {}): Tag {
  return {
    id: `tag-${name}`,
    name,
    color: '#000000',
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-01T00:00:00Z'),
    ...overrides
  };
}

function generateId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

function createBaseSubTask(
  overrides: Partial<SubTaskWithTags> = {}
): SubTaskWithTags {
  return {
    id: generateId('sub'),
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

function createBaseTask(
  overrides: Partial<TaskWithSubTasks> = {}
): TaskWithSubTasks {
  return {
    id: 'task-1',
    projectId: 'project-1',
    listId: 'list-1',
    title: 'Parent Task',
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
    subTasks: [],
    ...overrides
  };
}

function createBaseProject(task: TaskWithSubTasks): ProjectTree {
  return {
    id: 'project-1',
    name: 'Test Project',
    description: '',
    color: '#0080ff',
    orderIndex: 0,
    isArchived: false,
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-01T00:00:00Z'),
    taskLists: [
      {
        id: 'list-1',
        projectId: 'project-1',
        name: 'List 1',
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

function createTestEnvironment() {
  const task: TaskWithSubTasks = createBaseTask();
  const project: ProjectTree = createBaseProject(task);
  const tags: Tag[] = [];
  let subTaskCounter = 0;

  const getSubTaskById = (id: string) =>
    task.subTasks.find((subTask) => subTask.id === id);

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

  const subTaskStoreMock = {
    addSubTask: vi.fn(async (_taskId: string, data: Partial<SubTaskWithTags>) => {
      if (_taskId !== task.id) {
        console.error('Failed to find task for subtask creation:', _taskId);
        return null;
      }
      const newSubTask = createBaseSubTask({
        id: `sub-${++subTaskCounter}`,
        taskId: task.id,
        title: data.title ?? 'New SubTask',
        status: (data.status as 'not_started' | 'completed') ?? 'not_started',
        priority: data.priority ?? 0,
        description: data.description
      });
      task.subTasks.push(newSubTask);
      return newSubTask;
    }),
    updateSubTask: vi.fn(async (subTaskId: string, updates: Partial<SubTaskWithTags>) => {
      const target = getSubTaskById(subTaskId);
      if (!target) return;
      Object.assign(target, updates, {
        updatedAt: new Date()
      });
    }),
    deleteSubTask: vi.fn(async (subTaskId: string) => {
      const index = task.subTasks.findIndex((subTask) => subTask.id === subTaskId);
      if (index !== -1) {
        task.subTasks.splice(index, 1);
      }
    }),
	attachTagToSubTask: vi.fn((subTaskId: string, tag: Tag) => {
		const target = getSubTaskById(subTaskId);
		if (!target) return;
		const tagsList = target.tags ?? (target.tags = []);
		if (tagsList.some((existing) => existing.id === tag.id)) return;
		tagsList.push(tag);
		target.updatedAt = new Date();
	}),
	detachTagFromSubTask: vi.fn((subTaskId: string, tagId: string) => {
		const target = getSubTaskById(subTaskId);
		if (!target) return null;
		const tagsList = target.tags ?? [];
		const index = tagsList.findIndex((tag) => tag.id === tagId);
		if (index === -1) return null;
		const [removed] = tagsList.splice(index, 1);
		target.updatedAt = new Date();
		return removed ?? null;
	})
  };

  const taggingServiceMock = {
    createSubtaskTag: vi.fn(
      async (_projectId: string, _subTaskId: string, name: string) => {
        return createBaseTag(name, {
          id: `created-${name}-${Math.random().toString(36).slice(2, 7)}`
        });
      }
    ),
    deleteSubtaskTag: vi.fn(async () => {})
  };

  const errorHandlerMock = {
    addSyncError: vi.fn()
  };

  const mutations = new SubTaskMutations({
    taskStore: taskStoreMock as unknown as typeof taskStoreMock,
    taskCoreStore: { updateTask: vi.fn() } as any,
    subTaskStore: subTaskStoreMock as any,
    tagStore: { tags } as any,
    taggingService: taggingServiceMock as any,
    errorHandler: errorHandlerMock as any
  });

  return {
    project,
    task,
    tags,
    taskStoreMock,
    subTaskStoreMock,
    taggingServiceMock,
    errorHandlerMock,
    mutations,
    getSubTaskById,
    resetTags(newTags: Tag[] = []) {
      tags.splice(0, tags.length, ...newTags);
    },
    addExistingTag(tag: Tag) {
      if (!tags.some((existing) => existing.id === tag.id)) {
        tags.push(tag);
      }
    }
  };
}

describe('サブタスクとタグ管理の結合テスト', () => {
  let env: TestEnvironment;

  beforeEach(() => {
    env = createTestEnvironment();
  });

  it('サブタスクを作成してタグを追加できる', async () => {
    const created = await env.mutations.addSubTask('task-1', {
      title: 'Test SubTask',
      priority: 2
    });

    expect(created).not.toBeNull();
    expect(created?.title).toBe('Test SubTask');

    const subTaskId = created!.id;
    await env.mutations.addTagToSubTaskByName(subTaskId, 'task-1', 'urgent');

    const subTask = env.getSubTaskById(subTaskId);
    expect(subTask?.tags).toHaveLength(1);
    expect(subTask?.tags?.[0].name).toBe('urgent');
    expect(env.taggingServiceMock.createSubtaskTag).toHaveBeenCalledWith(
      'project-1',
      subTaskId,
      'urgent'
    );
  });

  it('サブタスクのライフサイクル管理', async () => {
    const created = await env.mutations.addSubTask('task-1', {
      title: 'Lifecycle Sub',
      priority: 1
    });
    expect(created).not.toBeNull();
    const subTaskId = created!.id;

    env.mutations.updateSubTask(subTaskId, {
      title: 'Updated',
      status: 'completed',
      priority: 3
    });
    const updated = env.getSubTaskById(subTaskId);
    expect(updated?.title).toBe('Updated');
    expect(updated?.status).toBe('completed');
    expect(updated?.priority).toBe(3);

    await env.mutations.deleteSubTask(subTaskId);
    expect(env.task.subTasks).toHaveLength(0);
  });

  it('複数のサブタスクと複数のタグを管理できる', async () => {
    const subTaskA = await env.mutations.addSubTask('task-1', {
      title: 'SubA'
    });
    const subTaskB = await env.mutations.addSubTask('task-1', {
      title: 'SubB'
    });
    expect(subTaskA).not.toBeNull();
    expect(subTaskB).not.toBeNull();

    await env.mutations.addTagToSubTaskByName(subTaskA!.id, 'task-1', 'urgent');
    await env.mutations.addTagToSubTaskByName(subTaskA!.id, 'task-1', 'work');
    await env.mutations.addTagToSubTaskByName(subTaskB!.id, 'task-1', 'urgent');
    await env.mutations.addTagToSubTaskByName(subTaskB!.id, 'task-1', 'personal');

    const subA = env.getSubTaskById(subTaskA!.id);
    const subB = env.getSubTaskById(subTaskB!.id);
    expect(subA?.tags).toHaveLength(2);
    expect(subB?.tags).toHaveLength(2);

    env.mutations.removeTagFromSubTask(subTaskA!.id, 'task-1', 'non-existent');
    expect(env.getSubTaskById(subTaskA!.id)?.tags).toHaveLength(2);
  });

  it('タスクとサブタスクのタグ管理の独立性', async () => {
    env.task.tags.push(createBaseTag('task-tag', { id: 'task-tag' }));

    const created = await env.mutations.addSubTask('task-1', {
      title: 'Independent'
    });
    await env.mutations.addTagToSubTaskByName(created!.id, 'task-1', 'subtask-tag');

    expect(env.task.tags).toHaveLength(1);
    const subTask = env.getSubTaskById(created!.id);
    expect(subTask?.tags).toHaveLength(1);
    expect(subTask?.tags?.[0].name).toBe('subtask-tag');
  });

  it('サブタスクを削除してもタグストアには影響しない', async () => {
    const created = await env.mutations.addSubTask('task-1', { title: 'Temp' });
    expect(created).not.toBeNull();

    await env.mutations.addTagToSubTaskByName(created!.id, 'task-1', 'temporary-tag');
    expect(env.tags).toHaveLength(0);

    await env.mutations.deleteSubTask(created!.id);
    expect(env.getSubTaskById(created!.id)).toBeUndefined();
    expect(env.tags).toHaveLength(0);
  });

  it('タグ追加でエラーが発生した場合はエラーハンドラーが呼び出される', async () => {
    const created = await env.mutations.addSubTask('task-1', { title: 'Error Case' });
    env.taggingServiceMock.createSubtaskTag.mockRejectedValueOnce(new Error('network error'));

    await env.mutations.addTagToSubTaskByName(created!.id, 'task-1', 'failing-tag');

    const subTask = env.getSubTaskById(created!.id);
    expect(subTask?.tags).toHaveLength(0);
    expect(env.errorHandlerMock.addSyncError).toHaveBeenCalledWith(
      'サブタスクタグ追加',
      'subtask',
      created!.id,
      expect.any(Error)
    );
  });

  describe('エラーハンドリング', () => {
    it('存在しないタスクにサブタスクを追加しようとした場合はnullが返る', async () => {
      const result = await env.mutations.addSubTask('non-existent-task', {
        title: 'Should Fail'
      });
      expect(result).toBeNull();
      expect(env.task.subTasks).toHaveLength(0);
    });

    it('存在しないサブタスクを更新しようとしてもエラーにならない', async () => {
      env.mutations.updateSubTask('missing-subtask', { title: 'No effect' });
      expect(env.task.subTasks).toHaveLength(0);
    });

    it('存在しないサブタスクを削除しようとしてもエラーにならない', async () => {
      await env.mutations.deleteSubTask('missing-subtask');
      expect(env.task.subTasks).toHaveLength(0);
    });
  });
});
