import type { AssignmentService } from '$lib/services/backend/assignment-service';

export class AssignmentWebService implements AssignmentService {
  // Task Assignment operations
  async createTaskAssignment(taskId: string, userId: string): Promise<boolean> {
    // TODO: Web API実装を追加
    console.warn('Web backend: createTaskAssignment not implemented', taskId, userId);
    return false; // 仮実装として失敗を返す
  }

  async deleteTaskAssignment(taskId: string, userId: string): Promise<boolean> {
    // TODO: Web API実装を追加
    console.warn('Web backend: deleteTaskAssignment not implemented', taskId, userId);
    return false; // 仮実装として失敗を返す
  }

  // Subtask Assignment operations
  async createSubtaskAssignment(subtaskId: string, userId: string): Promise<boolean> {
    // TODO: Web API実装を追加
    console.warn('Web backend: createSubtaskAssignment not implemented', subtaskId, userId);
    return false; // 仮実装として失敗を返す
  }

  async deleteSubtaskAssignment(subtaskId: string, userId: string): Promise<boolean> {
    // TODO: Web API実装を追加
    console.warn('Web backend: deleteSubtaskAssignment not implemented', subtaskId, userId);
    return false; // 仮実装として失敗を返す
  }
}