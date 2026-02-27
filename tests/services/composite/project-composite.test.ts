import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Project, ProjectTree } from '$lib/types/project';

// ---------- モック ----------

const projectBackendMock = {
  createProjectTree: vi.fn(),
  update: vi.fn(),
  delete: vi.fn()
};

vi.mock('$lib/services/domain/project', () => ({
  ProjectBackend: projectBackendMock
}));

const projectStoreMock = {
  addProjectToStore: vi.fn(),
  updateProjectInStore: vi.fn(),
  removeProjectFromStore: vi.fn(),
  reorderProjectsInStore: vi.fn(),
  moveProjectToPositionInStore: vi.fn(),
  getProjectById: vi.fn()
};

vi.mock('$lib/stores/providers/project-store-provider', () => ({
  resolveProjectStore: () => projectStoreMock
}));

// ---------- ヘルパー ----------

const now = new Date('2025-01-01T00:00:00.000Z');

const buildProject = (overrides: Partial<Project> = {}): Project => ({
  id: 'project-1',
  name: 'Test Project',
  description: undefined,
  color: undefined,
  orderIndex: 0,
  isArchived: false,
  createdAt: now,
  updatedAt: now,
  deleted: false,
  updatedBy: 'system',
  ...overrides
});

const buildProjectTree = (overrides: Partial<ProjectTree> = {}): ProjectTree => ({
  ...buildProject(),
  taskLists: [],
  allTags: [],
  ...overrides
});

// ---------- テスト ----------

const { ProjectCompositeService } = await import('$lib/services/composite/project-composite');

describe('ProjectCompositeService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createProject', () => {
    it('バックエンドでプロジェクトを作成しストアに追加する', async () => {
      const newTree = buildProjectTree({ id: 'new-1', name: 'New Project' });
      projectBackendMock.createProjectTree.mockResolvedValue(newTree);

      const result = await ProjectCompositeService.createProject({ name: 'New Project' });

      expect(projectBackendMock.createProjectTree).toHaveBeenCalledWith({ name: 'New Project' });
      expect(projectStoreMock.addProjectToStore).toHaveBeenCalledWith(newTree);
      expect(result).toEqual(newTree);
    });

    it('バックエンドエラー時はnullを返す', async () => {
      projectBackendMock.createProjectTree.mockRejectedValue(new Error('Backend error'));

      const result = await ProjectCompositeService.createProject({ name: 'Fail Project' });

      expect(result).toBeNull();
      expect(projectStoreMock.addProjectToStore).not.toHaveBeenCalled();
    });
  });

  describe('updateProject', () => {
    it('バックエンドを更新しストアも更新する', async () => {
      const updated = buildProject({ name: 'Updated', color: '#ff0000' });
      projectBackendMock.update.mockResolvedValue(updated);

      const result = await ProjectCompositeService.updateProject('project-1', {
        name: 'Updated',
        color: '#ff0000'
      });

      expect(projectBackendMock.update).toHaveBeenCalledWith('project-1', {
        name: 'Updated',
        color: '#ff0000'
      });
      expect(projectStoreMock.updateProjectInStore).toHaveBeenCalledWith(
        'project-1',
        expect.objectContaining({ name: 'Updated', color: '#ff0000' })
      );
      expect(result).toEqual(updated);
    });

    it('バックエンドがnullを返した場合はnullを返す', async () => {
      projectBackendMock.update.mockResolvedValue(null);

      const result = await ProjectCompositeService.updateProject('project-1', { name: 'X' });

      expect(result).toBeNull();
      expect(projectStoreMock.updateProjectInStore).not.toHaveBeenCalled();
    });

    it('バックエンドエラー時はnullを返す', async () => {
      projectBackendMock.update.mockRejectedValue(new Error('Backend error'));

      const result = await ProjectCompositeService.updateProject('project-1', { name: 'X' });

      expect(result).toBeNull();
    });
  });

  describe('deleteProject', () => {
    it('バックエンドで削除しストアからも削除する', async () => {
      projectBackendMock.delete.mockResolvedValue(true);

      const result = await ProjectCompositeService.deleteProject('project-1');

      expect(projectBackendMock.delete).toHaveBeenCalledWith('project-1');
      expect(projectStoreMock.removeProjectFromStore).toHaveBeenCalledWith('project-1');
      expect(result).toBe(true);
    });

    it('バックエンドが失敗した場合はストアを更新しない', async () => {
      projectBackendMock.delete.mockResolvedValue(false);

      const result = await ProjectCompositeService.deleteProject('project-1');

      expect(result).toBe(false);
      expect(projectStoreMock.removeProjectFromStore).not.toHaveBeenCalled();
    });

    it('バックエンドエラー時はfalseを返す', async () => {
      projectBackendMock.delete.mockRejectedValue(new Error('Backend error'));

      const result = await ProjectCompositeService.deleteProject('project-1');

      expect(result).toBe(false);
    });
  });

  describe('reorderProjects', () => {
    it('ストアを並べ替えてバックエンドを一括更新する', async () => {
      const reordered = [
        buildProject({ id: 'p1', orderIndex: 0 }),
        buildProject({ id: 'p2', orderIndex: 1 })
      ];
      projectStoreMock.reorderProjectsInStore.mockReturnValue(reordered);
      projectBackendMock.update.mockResolvedValue(buildProject());

      await ProjectCompositeService.reorderProjects(0, 1);

      expect(projectStoreMock.reorderProjectsInStore).toHaveBeenCalledWith(0, 1);
      expect(projectBackendMock.update).toHaveBeenCalledTimes(2);
      expect(projectBackendMock.update).toHaveBeenCalledWith('p1', { order_index: 0 });
      expect(projectBackendMock.update).toHaveBeenCalledWith('p2', { order_index: 1 });
    });
  });

  describe('moveProjectToPosition', () => {
    it('ストアを移動してバックエンドを更新する', async () => {
      const moved = [buildProject({ id: 'p1', orderIndex: 2 })];
      projectStoreMock.moveProjectToPositionInStore.mockReturnValue(moved);
      projectBackendMock.update.mockResolvedValue(buildProject());

      await ProjectCompositeService.moveProjectToPosition('p1', 2);

      expect(projectStoreMock.moveProjectToPositionInStore).toHaveBeenCalledWith('p1', 2);
      expect(projectBackendMock.update).toHaveBeenCalledWith('p1', { order_index: 2 });
    });
  });

  describe('archiveProject', () => {
    it('プロジェクトをアーカイブする', async () => {
      const archived = buildProject({ isArchived: true });
      projectBackendMock.update.mockResolvedValue(archived);

      const result = await ProjectCompositeService.archiveProject('project-1', true);

      expect(result).toBe(true);
      expect(projectBackendMock.update).toHaveBeenCalledWith(
        'project-1',
        expect.objectContaining({ is_archived: true })
      );
    });

    it('updateProjectがnullを返した場合はfalseを返す', async () => {
      projectBackendMock.update.mockResolvedValue(null);

      const result = await ProjectCompositeService.archiveProject('project-1', true);

      expect(result).toBe(false);
    });
  });
});
