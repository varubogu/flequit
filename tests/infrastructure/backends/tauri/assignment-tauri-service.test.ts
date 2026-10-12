import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AssignmentTauriService } from '$lib/infrastructure/backends/tauri/assignment-tauri-service';

vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn()
}));

const mockInvoke = vi.mocked((await import('@tauri-apps/api/core')).invoke);

describe('AssignmentTauriService', () => {
  const service = new AssignmentTauriService();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('creates and deletes task and subtask assignments', async () => {
    mockInvoke.mockResolvedValue(undefined);

    await expect(service.createTaskAssignment('p1', 't1', 'u1', 'actor')).resolves.toBe(true);
    await expect(service.deleteTaskAssignment('p1', 't1', 'u1', 'actor')).resolves.toBe(true);
    await expect(service.createSubtaskAssignment('p1', 's1', 'u1', 'actor')).resolves.toBe(true);
    await expect(service.deleteSubtaskAssignment('p1', 's1', 'u1', 'actor')).resolves.toBe(true);

    expect(mockInvoke).toHaveBeenNthCalledWith(1, 'create_task_assignment', {
      projectId: 'p1',
      taskAssignment: { taskId: 't1', userId: 'u1' },
      userId: 'actor'
    });
    expect(mockInvoke).toHaveBeenNthCalledWith(2, 'delete_task_assignment', {
      projectId: 'p1',
      taskId: 't1',
      userId: 'u1',
      deletedByUserId: 'actor'
    });
    expect(mockInvoke).toHaveBeenNthCalledWith(3, 'create_subtask_assignment', {
      projectId: 'p1',
      subtaskAssignment: { subtaskId: 's1', userId: 'u1' },
      userId: 'actor'
    });
    expect(mockInvoke).toHaveBeenNthCalledWith(4, 'delete_subtask_assignment', {
      projectId: 'p1',
      subtaskId: 's1',
      userId: 'u1',
      deletedByUserId: 'actor'
    });
  });

  it('returns false when invoke rejects', async () => {
    mockInvoke.mockRejectedValue(new Error('offline'));

    await expect(service.createTaskAssignment('p1', 't1', 'u1', 'actor')).resolves.toBe(false);
    await expect(service.deleteTaskAssignment('p1', 't1', 'u1', 'actor')).resolves.toBe(false);
    await expect(service.createSubtaskAssignment('p1', 's1', 'u1', 'actor')).resolves.toBe(false);
    await expect(service.deleteSubtaskAssignment('p1', 's1', 'u1', 'actor')).resolves.toBe(false);
  });
});
