import { describe, expect, it } from 'vitest';
import {
  isSubTask,
  isTaskWithSubTasks,
  requireItem
} from '$lib/services/ui/task-detail/task-detail-guards';
import type { SubTask } from '$lib/types/sub-task';
import type { TaskWithSubTasks } from '$lib/types/task';

describe('task detail guards', () => {
  const task = { id: 'task-1', listId: 'list-1', subTasks: [] } as unknown as TaskWithSubTasks;
  const subTask = { id: 'sub-1', taskId: 'task-1' } as SubTask;

  it('identifies tasks and subtasks', () => {
    expect(isTaskWithSubTasks(task)).toBe(true);
    expect(isTaskWithSubTasks(subTask)).toBe(false);
    expect(isTaskWithSubTasks(null)).toBe(false);
    expect(isSubTask(subTask)).toBe(true);
    expect(isSubTask(task)).toBe(false);
    expect(isSubTask(null)).toBe(false);
  });

  it('returns the item or throws when it is missing', () => {
    expect(requireItem(task)).toBe(task);
    expect(() => requireItem(null)).toThrow('TaskDetailActions: current item is not available');
  });
});
