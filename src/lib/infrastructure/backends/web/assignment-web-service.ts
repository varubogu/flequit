import type { AssignmentService } from '$lib/infrastructure/backends/assignment-service';

export class AssignmentWebService implements AssignmentService {
  // Task Assignment operations
  async createTaskAssignment(projectId: string, taskId: string, userId: string): Promise<boolean> {
    // TODO: Web API実装を追加
    console.warn('Web backends: createTaskAssignment not implemented', projectId, taskId, userId);
    return false; // 仮実装として失敗を返す
  }

  async deleteTaskAssignment(projectId: string, taskId: string, userId: string): Promise<boolean> {
    // TODO: Web API実装を追加
    console.warn('Web backends: deleteTaskAssignment not implemented', projectId, taskId, userId);
    return false; // 仮実装として失敗を返す
  }

  // Subtask Assignment operations
  async createSubtaskAssignment(projectId: string, subtaskId: string, userId: string): Promise<boolean> {
    // TODO: Web API実装を追加
    console.warn('Web backends: createSubtaskAssignment not implemented', projectId, subtaskId, userId);
    return false; // 仮実装として失敗を返す
  }

  async deleteSubtaskAssignment(projectId: string, subtaskId: string, userId: string): Promise<boolean> {
    // TODO: Web API実装を追加
    console.warn('Web backends: deleteSubtaskAssignment not implemented', projectId, subtaskId, userId);
    return false; // 仮実装として失敗を返す
  }
}