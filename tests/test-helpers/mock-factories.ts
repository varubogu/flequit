/**
 * テスト用のモックファクトリー
 * Task, SubTask, Tag, TaskListなどの標準的なモックオブジェクトを生成
 */

import type { Task, TaskWithSubTasks } from '$lib/types/task';
import type { SubTask } from '$lib/types/sub-task';
import type { Tag } from '$lib/types/tag';
import type { TaskListWithTasks } from '$lib/types/task-list';

/**
 * 最小限のTagモックを作成
 */
export function createMockTag(overrides?: Partial<Tag>): Tag {
  return {
    id: 'test-tag-id',
    name: 'Test Tag',
    color: '#ff0000',
    createdAt: new Date(),
    updatedAt: new Date(),
    deleted: false,
    updatedBy: 'test-user',
    ...overrides
  };
}

/**
 * 最小限のTaskモックを作成
 */
export function createMockTask(overrides?: Partial<Task>): Task {
  return {
    id: 'test-task-id',
    projectId: 'test-project-id',
    listId: 'test-list-id',
    title: 'Test Task',
    description: 'Test Description',
    status: 'not_started',
    priority: 1,
    orderIndex: 0,
    assignedUserIds: [],
    tagIds: [],
    isArchived: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    deleted: false,
    updatedBy: 'test-user',
    ...overrides
  };
}

/**
 * 最小限のTaskWithSubTasksモックを作成
 */
export function createMockTaskWithSubTasks(
  overrides?: Partial<TaskWithSubTasks>
): TaskWithSubTasks {
  return {
    ...createMockTask(),
    tags: [],
    subTasks: [],
    ...overrides
  };
}

/**
 * 最小限のSubTaskモックを作成
 */
export function createMockSubTask(overrides?: Partial<SubTask>): SubTask {
  return {
    id: 'test-subtask-id',
    taskId: 'test-task-id',
    title: 'Test SubTask',
    description: '',
    status: 'not_started',
    priority: 1,
    orderIndex: 0,
    completed: false,
    assignedUserIds: [],
    tagIds: [],
    tags: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    deleted: false,
    updatedBy: 'test-user',
    ...overrides
  };
}

/**
 * 最小限のTaskListWithTasksモックを作成
 */
export function createMockTaskList(overrides?: Partial<TaskListWithTasks>): TaskListWithTasks {
  return {
    id: 'test-list-id',
    projectId: 'test-project-id',
    name: 'Test List',
    description: '',
    color: '#cccccc',
    orderIndex: 0,
    isArchived: false,
    tasks: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    deleted: false,
    updatedBy: 'test-user',
    ...overrides
  };
}
