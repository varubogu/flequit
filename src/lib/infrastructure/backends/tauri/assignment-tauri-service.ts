import { invoke } from '@tauri-apps/api/core';
import type { AssignmentService } from '$lib/infrastructure/backends/assignment-service';

export class AssignmentTauriService implements AssignmentService {
  // Task Assignment operations
  async createTaskAssignment(projectId: string, taskId: string, userId: string): Promise<boolean> {
    try {
      const taskAssignment = { taskId, userId };
      await invoke('create_task_assignment', { projectId, taskAssignment });
      return true;
    } catch (error) {
      console.error('Failed to create task assignment:', error);
      return false;
    }
  }

  async deleteTaskAssignment(projectId: string, taskId: string, userId: string): Promise<boolean> {
    try {
      await invoke('delete_task_assignment', { projectId, taskId, userId });
      return true;
    } catch (error) {
      console.error('Failed to delete task assignment:', error);
      return false;
    }
  }

  // Subtask Assignment operations
  async createSubtaskAssignment(projectId: string, subtaskId: string, userId: string): Promise<boolean> {
    try {
      const subtaskAssignment = { subtaskId, userId };
      await invoke('create_subtask_assignment', { projectId, subtaskAssignment });
      return true;
    } catch (error) {
      console.error('Failed to create subtask assignment:', error);
      return false;
    }
  }

  async deleteSubtaskAssignment(projectId: string, subtaskId: string, userId: string): Promise<boolean> {
    try {
      await invoke('delete_subtask_assignment', { projectId, subtaskId, userId });
      return true;
    } catch (error) {
      console.error('Failed to delete subtask assignment:', error);
      return false;
    }
  }
}
