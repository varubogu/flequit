import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Tag } from '$lib/types/tag';

// ---------- モック ----------

const mockBackend = {
  tagging: {
    createTaskTag: vi.fn(),
    deleteTaskTag: vi.fn(),
    createSubtaskTag: vi.fn(),
    deleteSubtaskTag: vi.fn()
  }
};

// グローバルモック (mock-domain.ts) を実際の実装で上書き
vi.mock('$lib/services/domain/tagging', async () => {
  const actual = await vi.importActual<typeof import('$lib/services/domain/tagging')>(
    '$lib/services/domain/tagging'
  );
  return actual;
});

vi.mock('$lib/infrastructure/backend-client', () => ({
  resolveBackend: vi.fn(async () => mockBackend)
}));

vi.mock('$lib/services/domain/current-user-id', () => ({
  getCurrentUserId: vi.fn(() => 'user-1')
}));

// ---------- ヘルパー ----------

const now = new Date('2025-01-01T00:00:00.000Z');

const buildTag = (overrides: Partial<Tag> = {}): Tag => ({
  id: 'tag-1',
  name: 'Test Tag',
  color: '#00ff00',
  createdAt: now,
  updatedAt: now,
  deleted: false,
  updatedBy: 'user-1',
  ...overrides
});

// ---------- テスト ----------

const { TaggingService } = await import('$lib/services/domain/tagging');

describe('TaggingService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createTaskTag', () => {
    it('バックエンドを呼び出してタグを作成する', async () => {
      const tag = buildTag();
      mockBackend.tagging.createTaskTag.mockResolvedValue(tag);

      const result = await TaggingService.createTaskTag('project-1', 'task-1', 'Test Tag');

      expect(mockBackend.tagging.createTaskTag).toHaveBeenCalledWith(
        'project-1',
        'task-1',
        'Test Tag',
        'user-1'
      );
      expect(result).toEqual(tag);
    });
  });

  describe('deleteTaskTag', () => {
    it('バックエンドを呼び出してタグを削除する', async () => {
      mockBackend.tagging.deleteTaskTag.mockResolvedValue(undefined);

      await TaggingService.deleteTaskTag('project-1', 'task-1', 'tag-1');

      expect(mockBackend.tagging.deleteTaskTag).toHaveBeenCalledWith(
        'project-1',
        'task-1',
        'tag-1',
        'user-1'
      );
    });
  });

  describe('createSubtaskTag', () => {
    it('バックエンドを呼び出してサブタスクタグを作成する', async () => {
      const tag = buildTag({ id: 'subtag-1', name: 'SubTag' });
      mockBackend.tagging.createSubtaskTag.mockResolvedValue(tag);

      const result = await TaggingService.createSubtaskTag('project-1', 'subtask-1', 'SubTag');

      expect(mockBackend.tagging.createSubtaskTag).toHaveBeenCalledWith(
        'project-1',
        'subtask-1',
        'SubTag',
        'user-1'
      );
      expect(result).toEqual(tag);
    });
  });

  describe('deleteSubtaskTag', () => {
    it('バックエンドを呼び出してサブタスクタグを削除する', async () => {
      mockBackend.tagging.deleteSubtaskTag.mockResolvedValue(undefined);

      await TaggingService.deleteSubtaskTag('project-1', 'subtask-1', 'tag-1');

      expect(mockBackend.tagging.deleteSubtaskTag).toHaveBeenCalledWith(
        'project-1',
        'subtask-1',
        'tag-1',
        'user-1'
      );
    });
  });
});
