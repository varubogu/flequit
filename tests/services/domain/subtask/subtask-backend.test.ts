import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { SubTask } from '$lib/types/sub-task';

const { resolveBackend, addSyncError, getCurrentUserId } = vi.hoisted(() => ({
  resolveBackend: vi.fn(),
  addSyncError: vi.fn(),
  getCurrentUserId: vi.fn(() => 'user-1')
}));

vi.mock('$lib/infrastructure/backend-client', () => ({ resolveBackend }));
vi.mock('$lib/stores/error-handler.svelte', () => ({
  errorHandler: { addSyncError }
}));
vi.mock('$lib/services/domain/current-user-id', () => ({ getCurrentUserId }));

import { SubTaskBackend } from '$lib/services/domain/subtask/subtask-backend';

describe('SubTaskBackend', () => {
  const subtaskApi = {
    create: vi.fn(),
    update: vi.fn(),
    get: vi.fn(),
    delete: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
    resolveBackend.mockResolvedValue({ subtask: subtaskApi });
    vi.stubGlobal('crypto', { randomUUID: () => 'subtask-uuid' });
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('creates a subtask with the default status when none is given', async () => {
    subtaskApi.create.mockResolvedValue(undefined);

    const created = await SubTaskBackend.createSubTask('project-1', 'task-1', {
      title: 'Write tests',
      priority: 2
    });

    expect(created).toMatchObject({
      id: 'subtask-uuid',
      taskId: 'task-1',
      title: 'Write tests',
      status: 'not_started',
      priority: 2,
      orderIndex: 0,
      completed: false,
      updatedBy: 'user-1'
    });
    expect(subtaskApi.create).toHaveBeenCalledWith('project-1', created, 'user-1');
  });

  it('keeps an explicit status', async () => {
    subtaskApi.create.mockResolvedValue(undefined);

    const created = await SubTaskBackend.createSubTask('project-1', 'task-1', {
      title: 'Doing',
      status: 'in_progress',
      description: 'notes'
    });

    expect(created.status).toBe('in_progress');
    expect(created.description).toBe('notes');
  });

  it('records a sync error when create fails', async () => {
    const error = new Error('create failed');
    subtaskApi.create.mockRejectedValue(error);

    await expect(
      SubTaskBackend.createSubTask('project-1', 'task-1', { title: 'Fail' })
    ).rejects.toBe(error);
    expect(addSyncError).toHaveBeenCalledWith('サブタスク作成', 'subtask', 'subtask-uuid', error);
  });

  it('serializes provided dates and returns the fetched subtask', async () => {
    const planStartDate = new Date('2024-03-01T00:00:00Z');
    const planEndDate = new Date('2024-03-02T00:00:00Z');
    const doStartDate = new Date('2024-03-03T00:00:00Z');
    const doEndDate = new Date('2024-03-04T00:00:00Z');
    const stored = { id: 'sub-1', title: 'Updated' } as SubTask;
    subtaskApi.update.mockResolvedValue(true);
    subtaskApi.get.mockResolvedValue(stored);

    await expect(
      SubTaskBackend.updateSubTask('project-1', 'sub-1', {
        title: 'Updated',
        planStartDate,
        planEndDate,
        doStartDate,
        doEndDate
      })
    ).resolves.toBe(stored);

    expect(subtaskApi.update).toHaveBeenCalledWith(
      'project-1',
      'sub-1',
      expect.objectContaining({
        title: 'Updated',
        plan_start_date: planStartDate.toISOString(),
        plan_end_date: planEndDate.toISOString(),
        do_start_date: doStartDate.toISOString(),
        do_end_date: doEndDate.toISOString()
      }),
      'user-1'
    );
  });

  it('sends undefined dates and returns null when the update is rejected', async () => {
    subtaskApi.update.mockResolvedValue(false);

    await expect(SubTaskBackend.updateSubTask('project-1', 'sub-1', { title: 'Nope' })).resolves.toBeNull();
    expect(subtaskApi.update).toHaveBeenCalledWith(
      'project-1',
      'sub-1',
      expect.objectContaining({
        plan_start_date: undefined,
        plan_end_date: undefined,
        do_start_date: undefined,
        do_end_date: undefined
      }),
      'user-1'
    );
    expect(subtaskApi.get).not.toHaveBeenCalled();
  });

  it('records a sync error when update fails', async () => {
    const error = new Error('update failed');
    subtaskApi.update.mockRejectedValue(error);

    await expect(SubTaskBackend.updateSubTask('project-1', 'sub-1', { title: 'X' })).rejects.toBe(error);
    expect(addSyncError).toHaveBeenCalledWith('サブタスク更新', 'subtask', 'sub-1', error);
  });

  it('deletes a subtask and records a sync error on failure', async () => {
    subtaskApi.delete.mockResolvedValueOnce(true);
    await expect(SubTaskBackend.deleteSubTask('project-1', 'sub-1')).resolves.toBe(true);

    const error = new Error('delete failed');
    subtaskApi.delete.mockRejectedValueOnce(error);
    await expect(SubTaskBackend.deleteSubTask('project-1', 'sub-1')).rejects.toBe(error);
    expect(addSyncError).toHaveBeenCalledWith('サブタスク削除', 'subtask', 'sub-1', error);
  });
});
