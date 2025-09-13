import type { AssignmentService } from '$lib/services/backend/assignment-service';

export class AssignmentWebService implements AssignmentService {
  // Task Assignment operations
  async createTaskAssignment(projectId: string, taskId: string, userId: string): Promise<boolean> {
    // TODO: Web API実装を追加
    console.warn('Web backend: createTaskAssignment not implemented', projectId, taskId, userId);
    return false; // 仮実装として失敗を返す
  }

  async deleteTaskAssignment(projectId: string, taskId: string, userId: string): Promise<boolean> {
    // TODO: Web API実装を追加
    console.warn('Web backend: deleteTaskAssignment not implemented', projectId, taskId, userId);
    return false; // 仮実装として失敗を返す
  }

  // Subtask Assignment operations
  async createSubtaskAssignment(projectId: string, subtaskId: string, userId: string): Promise<boolean> {
    // TODO: Web API実装を追加
    console.warn('Web backend: createSubtaskAssignment not implemented', projectId, subtaskId, userId);
    return false; // 仮実装として失敗を返す
  }

  async deleteSubtaskAssignment(projectId: string, subtaskId: string, userId: string): Promise<boolean> {
    // TODO: Web API実装を追加
    console.warn('Web backend: deleteSubtaskAssignment not implemented', projectId, subtaskId, userId);
    return false; // 仮実装として失敗を返す
  }
}