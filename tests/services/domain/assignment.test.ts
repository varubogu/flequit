import { describe, it, expect, vi, beforeEach } from 'vitest';

// ---------- モック ----------

const backendMock = {
  assignment: {
    createTaskAssignment: vi.fn(),
    deleteTaskAssignment: vi.fn(),
    createSubtaskAssignment: vi.fn(),
    deleteSubtaskAssignment: vi.fn()
  }
};

vi.mock('$lib/infrastructure/backend-client', () => ({
  resolveBackend: vi.fn(async () => backendMock)
}));

vi.mock('$lib/services/domain/current-user-id', () => ({
  getCurrentUserId: vi.fn(() => 'current-user')
}));

// ---------- テスト ----------

const { AssignmentService } = await import('$lib/services/domain/assignment');

describe('AssignmentService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createTaskAssignment', () => {
    it('バックエンドを呼び出してタスク担当者を作成する', async () => {
      backendMock.assignment.createTaskAssignment.mockResolvedValue(true);

      const result = await AssignmentService.createTaskAssignment(
        'project-1',
        'task-1',
        'user-1'
      );

      expect(backendMock.assignment.createTaskAssignment).toHaveBeenCalledWith(
        'project-1',
        'task-1',
        'user-1',
        'current-user'
      );
      expect(result).toBe(true);
    });
  });

  describe('deleteTaskAssignment', () => {
    it('バックエンドを呼び出してタスク担当者を削除する', async () => {
      backendMock.assignment.deleteTaskAssignment.mockResolvedValue(true);

      const result = await AssignmentService.deleteTaskAssignment(
        'project-1',
        'task-1',
        'user-1'
      );

      expect(backendMock.assignment.deleteTaskAssignment).toHaveBeenCalledWith(
        'project-1',
        'task-1',
        'user-1',
        'current-user'
      );
      expect(result).toBe(true);
    });
  });

  describe('createSubtaskAssignment', () => {
    it('バックエンドを呼び出してサブタスク担当者を作成する', async () => {
      backendMock.assignment.createSubtaskAssignment.mockResolvedValue(true);

      const result = await AssignmentService.createSubtaskAssignment(
        'project-1',
        'subtask-1',
        'user-1'
      );

      expect(backendMock.assignment.createSubtaskAssignment).toHaveBeenCalledWith(
        'project-1',
        'subtask-1',
        'user-1',
        'current-user'
      );
      expect(result).toBe(true);
    });
  });

  describe('deleteSubtaskAssignment', () => {
    it('バックエンドを呼び出してサブタスク担当者を削除する', async () => {
      backendMock.assignment.deleteSubtaskAssignment.mockResolvedValue(true);

      const result = await AssignmentService.deleteSubtaskAssignment(
        'project-1',
        'subtask-1',
        'user-1'
      );

      expect(backendMock.assignment.deleteSubtaskAssignment).toHaveBeenCalledWith(
        'project-1',
        'subtask-1',
        'user-1',
        'current-user'
      );
      expect(result).toBe(true);
    });
  });
});
