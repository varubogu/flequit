import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Project } from '$lib/types/project';

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

import { ProjectBackend } from '$lib/services/domain/project/project-backend';

describe('ProjectBackend', () => {
  const projectApi = {
    create: vi.fn(),
    get: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    restore: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
    resolveBackend.mockResolvedValue({ project: projectApi });
    vi.stubGlobal('crypto', { randomUUID: () => 'project-uuid' });
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('creates a project and defaults order index to 0', async () => {
    projectApi.create.mockResolvedValue(undefined);

    const created = await ProjectBackend.create({ name: 'Alpha', description: 'notes' });

    expect(created).toMatchObject({
      id: 'project-uuid',
      name: 'Alpha',
      description: 'notes',
      orderIndex: 0,
      isArchived: false,
      deleted: false,
      updatedBy: 'user-1'
    });
    expect(projectApi.create).toHaveBeenCalledWith(created, 'user-1');
  });

  it('keeps an explicit order index', async () => {
    projectApi.create.mockResolvedValue(undefined);

    const created = await ProjectBackend.create({ name: 'Beta', order_index: 4, color: '#abc' });

    expect(created.orderIndex).toBe(4);
    expect(created.color).toBe('#abc');
  });

  it('records a sync error when create fails', async () => {
    const error = new Error('create failed');
    projectApi.create.mockRejectedValue(error);

    await expect(ProjectBackend.create({ name: 'Alpha' })).rejects.toBe(error);
    expect(addSyncError).toHaveBeenCalledWith('プロジェクト作成', 'project', 'project-uuid', error);
  });

  it('gets a project from the backend', async () => {
    const project = { id: 'project-1', name: 'Alpha' } as Project;
    projectApi.get.mockResolvedValue(project);

    await expect(ProjectBackend.get('project-1')).resolves.toBe(project);

    projectApi.get.mockRejectedValue(new Error('get failed'));
    await expect(ProjectBackend.get('project-1')).rejects.toThrow('get failed');
  });

  it('returns the updated project when the patch succeeds and null otherwise', async () => {
    const updated = { id: 'project-1', name: 'Renamed' } as Project;
    projectApi.update.mockResolvedValueOnce(true);
    projectApi.get.mockResolvedValueOnce(updated);

    await expect(ProjectBackend.update('project-1', { name: 'Renamed' })).resolves.toBe(updated);
    expect(projectApi.update).toHaveBeenCalledWith(
      'project-1',
      expect.objectContaining({ name: 'Renamed', updated_at: expect.any(Date) }),
      'user-1'
    );

    projectApi.update.mockResolvedValueOnce(false);
    await expect(ProjectBackend.update('project-1', { is_archived: true })).resolves.toBeNull();
  });

  it('records a sync error when update fails', async () => {
    const error = new Error('update failed');
    projectApi.update.mockRejectedValue(error);

    await expect(ProjectBackend.update('project-1', { name: 'Renamed' })).rejects.toBe(error);
    expect(addSyncError).toHaveBeenCalledWith('プロジェクト更新', 'project', 'project-1', error);
  });

  it('deletes and restores a project', async () => {
    projectApi.delete.mockResolvedValue(true);
    projectApi.restore.mockResolvedValue(true);

    await expect(ProjectBackend.delete('project-1')).resolves.toBe(true);
    await expect(ProjectBackend.restore('project-1')).resolves.toBe(true);
    expect(projectApi.delete).toHaveBeenCalledWith('project-1', 'user-1');
    expect(projectApi.restore).toHaveBeenCalledWith('project-1', 'user-1');
  });

  it('records sync errors when delete or restore fails', async () => {
    const deleteError = new Error('delete failed');
    projectApi.delete.mockRejectedValue(deleteError);
    await expect(ProjectBackend.delete('project-1')).rejects.toBe(deleteError);
    expect(addSyncError).toHaveBeenCalledWith('プロジェクト削除', 'project', 'project-1', deleteError);

    const restoreError = new Error('restore failed');
    projectApi.restore.mockRejectedValue(restoreError);
    await expect(ProjectBackend.restore('project-1')).rejects.toBe(restoreError);
    expect(addSyncError).toHaveBeenCalledWith(
      'プロジェクト復元',
      'project',
      'project-1',
      restoreError
    );
  });

  it('wraps a created project as an empty tree', async () => {
    projectApi.create.mockResolvedValue(undefined);

    const tree = await ProjectBackend.createProjectTree({ name: 'Alpha', order_index: 2 });

    expect(tree.taskLists).toEqual([]);
    expect(tree.allTags).toEqual([]);
    expect(tree.orderIndex).toBe(2);
  });
});
