import { describe, expect, it } from 'vitest';
import {
  createProjectRecurrence,
  createSubtaskRecurrence,
  createTaskRecurrence
} from '$lib/types/recurrence-reference';

describe('recurrence reference factories', () => {
  it('creates task, subtask, and project associations', () => {
    const task = createTaskRecurrence('task-1', 'rule-1', 'user-1');
    const subtask = createSubtaskRecurrence('sub-1', 'rule-1', 'user-1');
    const project = createProjectRecurrence('project-1', 'rule-1');

    expect(task).toMatchObject({
      taskId: 'task-1',
      recurrenceRuleId: 'rule-1',
      deleted: false,
      updatedBy: 'user-1'
    });
    expect(task.createdAt).toBeInstanceOf(Date);
    expect(subtask).toMatchObject({ subtaskId: 'sub-1', deleted: false, updatedBy: 'user-1' });
    expect(project).toEqual({ projectId: 'project-1', recurrenceRuleId: 'rule-1' });
  });
});
