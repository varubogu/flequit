import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { TaskList } from '$lib/types/task-list';

// ---------- モック ----------

const taskListServiceMock = {
  createTaskList: vi.fn(),
  updateTaskList: vi.fn(),
  deleteTaskList: vi.fn()
};

vi.mock('$lib/services/domain/task-list', () => ({
  TaskListService: taskListServiceMock
}));

const taskListStoreMock = {
  addTaskList: vi.fn(),
  updateTaskList: vi.fn(),
  deleteTaskList: vi.fn(),
  getProjectIdByListId: vi.fn(),
  reorderTaskLists: vi.fn(),
  moveTaskListToProject: vi.fn(),
  moveTaskListToPosition: vi.fn()
};

vi.mock('$lib/stores/task-list-store.svelte', () => ({
  taskListStore: taskListStoreMock
}));

// ---------- ヘルパー ----------

const now = new Date('2025-01-01T00:00:00.000Z');

const buildTaskList = (overrides: Partial<TaskList> = {}): TaskList => ({
  id: 'list-1',
  projectId: 'project-1',
  name: 'Test List',
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

// ---------- テスト ----------

const { TaskListCompositeService } = await import(
  '$lib/services/composite/task-list-composite'
);

describe('TaskListCompositeService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createTaskList', () => {
    it('バックエンドでタスクリストを作成しストアに追加する', async () => {
      const newList = buildTaskList({ id: 'new-list', name: 'New List' });
      taskListServiceMock.createTaskList.mockResolvedValue(newList);
      taskListStoreMock.addTaskList.mockResolvedValue(undefined);

      const result = await TaskListCompositeService.createTaskList('project-1', {
        name: 'New List'
      });

      expect(taskListServiceMock.createTaskList).toHaveBeenCalledWith('project-1', {
        name: 'New List'
      });
      expect(taskListStoreMock.addTaskList).toHaveBeenCalledWith('project-1', { name: 'New List' });
      expect(result).toEqual(newList);
    });

    it('バックエンドエラー時はnullを返す', async () => {
      taskListServiceMock.createTaskList.mockRejectedValue(new Error('Backend error'));

      const result = await TaskListCompositeService.createTaskList('project-1', {
        name: 'Fail List'
      });

      expect(result).toBeNull();
      expect(taskListStoreMock.addTaskList).not.toHaveBeenCalled();
    });
  });

  describe('updateTaskList', () => {
    it('プロジェクトIDを取得しバックエンドとストアを更新する', async () => {
      taskListStoreMock.getProjectIdByListId.mockReturnValue('project-1');
      const updated = buildTaskList({ name: 'Updated List' });
      taskListServiceMock.updateTaskList.mockResolvedValue(updated);
      taskListStoreMock.updateTaskList.mockResolvedValue(undefined);

      const result = await TaskListCompositeService.updateTaskList('list-1', {
        name: 'Updated List'
      });

      expect(taskListStoreMock.getProjectIdByListId).toHaveBeenCalledWith('list-1');
      expect(taskListServiceMock.updateTaskList).toHaveBeenCalledWith('project-1', 'list-1', {
        name: 'Updated List'
      });
      expect(taskListStoreMock.updateTaskList).toHaveBeenCalledWith('list-1', {
        name: 'Updated List'
      });
      expect(result).toEqual(updated);
    });

    it('プロジェクトIDが見つからない場合はnullを返す', async () => {
      taskListStoreMock.getProjectIdByListId.mockReturnValue(null);

      const result = await TaskListCompositeService.updateTaskList('unknown-list', {
        name: 'X'
      });

      expect(result).toBeNull();
      expect(taskListServiceMock.updateTaskList).not.toHaveBeenCalled();
    });

    it('バックエンドがnullを返した場合はnullを返す', async () => {
      taskListStoreMock.getProjectIdByListId.mockReturnValue('project-1');
      taskListServiceMock.updateTaskList.mockResolvedValue(null);

      const result = await TaskListCompositeService.updateTaskList('list-1', { name: 'X' });

      expect(result).toBeNull();
      expect(taskListStoreMock.updateTaskList).not.toHaveBeenCalled();
    });

    it('バックエンドエラー時はnullを返す', async () => {
      taskListStoreMock.getProjectIdByListId.mockReturnValue('project-1');
      taskListServiceMock.updateTaskList.mockRejectedValue(new Error('Backend error'));

      const result = await TaskListCompositeService.updateTaskList('list-1', { name: 'X' });

      expect(result).toBeNull();
    });
  });

  describe('deleteTaskList', () => {
    it('バックエンドで削除しストアからも削除する', async () => {
      taskListStoreMock.getProjectIdByListId.mockReturnValue('project-1');
      taskListServiceMock.deleteTaskList.mockResolvedValue(true);
      taskListStoreMock.deleteTaskList.mockResolvedValue(undefined);

      const result = await TaskListCompositeService.deleteTaskList('list-1');

      expect(taskListServiceMock.deleteTaskList).toHaveBeenCalledWith('project-1', 'list-1');
      expect(taskListStoreMock.deleteTaskList).toHaveBeenCalledWith('list-1');
      expect(result).toBe(true);
    });

    it('バックエンドが失敗した場合はストアを更新しない', async () => {
      taskListStoreMock.getProjectIdByListId.mockReturnValue('project-1');
      taskListServiceMock.deleteTaskList.mockResolvedValue(false);

      const result = await TaskListCompositeService.deleteTaskList('list-1');

      expect(result).toBe(false);
      expect(taskListStoreMock.deleteTaskList).not.toHaveBeenCalled();
    });

    it('プロジェクトIDが見つからない場合はfalseを返す', async () => {
      taskListStoreMock.getProjectIdByListId.mockReturnValue(null);

      const result = await TaskListCompositeService.deleteTaskList('unknown-list');

      expect(result).toBe(false);
    });

    it('バックエンドエラー時はfalseを返す', async () => {
      taskListStoreMock.getProjectIdByListId.mockReturnValue('project-1');
      taskListServiceMock.deleteTaskList.mockRejectedValue(new Error('Backend error'));

      const result = await TaskListCompositeService.deleteTaskList('list-1');

      expect(result).toBe(false);
    });
  });

  describe('reorderTaskLists', () => {
    it('ストアを並べ替える', async () => {
      taskListStoreMock.reorderTaskLists.mockResolvedValue(undefined);

      await TaskListCompositeService.reorderTaskLists('project-1', 0, 2);

      expect(taskListStoreMock.reorderTaskLists).toHaveBeenCalledWith('project-1', 0, 2);
    });
  });

  describe('moveTaskListToProject', () => {
    it('ストアのタスクリストを別プロジェクトへ移動する', async () => {
      taskListStoreMock.moveTaskListToProject.mockResolvedValue(undefined);

      await TaskListCompositeService.moveTaskListToProject('list-1', 'project-2', 1);

      expect(taskListStoreMock.moveTaskListToProject).toHaveBeenCalledWith(
        'list-1',
        'project-2',
        1
      );
    });
  });

  describe('moveTaskListToPosition', () => {
    it('ストアのタスクリストを指定位置へ移動する', async () => {
      taskListStoreMock.moveTaskListToPosition.mockResolvedValue(undefined);

      await TaskListCompositeService.moveTaskListToPosition('list-1', 'project-1', 3);

      expect(taskListStoreMock.moveTaskListToPosition).toHaveBeenCalledWith(
        'list-1',
        'project-1',
        3
      );
    });
  });

  describe('archiveTaskList', () => {
    it('タスクリストをアーカイブする', async () => {
      taskListStoreMock.getProjectIdByListId.mockReturnValue('project-1');
      const archived = buildTaskList({ isArchived: true });
      taskListServiceMock.updateTaskList.mockResolvedValue(archived);
      taskListStoreMock.updateTaskList.mockResolvedValue(undefined);

      const result = await TaskListCompositeService.archiveTaskList('list-1', true);

      expect(result).toBe(true);
      expect(taskListServiceMock.updateTaskList).toHaveBeenCalledWith(
        'project-1',
        'list-1',
        expect.objectContaining({ is_archived: true })
      );
    });

    it('updateTaskListがnullを返した場合はfalseを返す', async () => {
      taskListStoreMock.getProjectIdByListId.mockReturnValue('project-1');
      taskListServiceMock.updateTaskList.mockResolvedValue(null);

      const result = await TaskListCompositeService.archiveTaskList('list-1', true);

      expect(result).toBe(false);
    });
  });
});
