import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { ProjectTree } from '$lib/types/project';

// ---------- モック ----------

const backendMock = {
  initialization: {
    loadProjectData: vi.fn(),
    initializeAll: vi.fn()
  }
};

vi.mock('$lib/infrastructure/backend-client', () => ({
  resolveBackend: vi.fn(async () => backendMock)
}));

const errorHandlerMock = {
  addSyncError: vi.fn()
};

vi.mock('$lib/stores/error-handler.svelte', () => ({
  errorHandler: errorHandlerMock
}));

// ---------- ヘルパー ----------

const now = new Date('2025-01-01T00:00:00.000Z');

const buildProjectTree = (overrides: Partial<ProjectTree> = {}): ProjectTree => ({
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
  taskLists: [],
  allTags: [],
  ...overrides
});

// ---------- テスト ----------

const { InitializationService } = await import('$lib/services/domain/initialization-service');

describe('InitializationService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('loadProjectData', () => {
    it('バックエンドからプロジェクトデータを読み込む', async () => {
      const projects = [buildProjectTree(), buildProjectTree({ id: 'project-2' })];
      backendMock.initialization.loadProjectData.mockResolvedValue(projects);

      const result = await InitializationService.loadProjectData();

      expect(backendMock.initialization.loadProjectData).toHaveBeenCalled();
      expect(result).toEqual(projects);
    });

    it('バックエンドエラー時はエラーを記録して再スローする', async () => {
      const error = new Error('Load failed');
      backendMock.initialization.loadProjectData.mockRejectedValue(error);

      await expect(InitializationService.loadProjectData()).rejects.toThrow('Load failed');
      expect(errorHandlerMock.addSyncError).toHaveBeenCalledWith(
        'プロジェクトデータ読み込み',
        'initialization',
        'project_data',
        error
      );
    });
  });

  describe('initializeAll', () => {
    it('バックエンドで全初期化を実行する', async () => {
      backendMock.initialization.initializeAll.mockResolvedValue(true);

      const result = await InitializationService.initializeAll();

      expect(backendMock.initialization.initializeAll).toHaveBeenCalled();
      expect(result).toBe(true);
    });

    it('バックエンドエラー時はエラーを記録して再スローする', async () => {
      const error = new Error('Init failed');
      backendMock.initialization.initializeAll.mockRejectedValue(error);

      await expect(InitializationService.initializeAll()).rejects.toThrow('Init failed');
      expect(errorHandlerMock.addSyncError).toHaveBeenCalledWith(
        '完全初期化',
        'initialization',
        'all',
        error
      );
    });
  });
});
