import { resolveBackend } from '$lib/infrastructure/backend-client';
import { getCurrentUserId } from '$lib/utils/user-id-helper';

export const AssignmentService = {
  async createTaskAssignment(projectId: string, taskId: string, userId: string) {
    const backend = await resolveBackend();
    return backend.assignment.createTaskAssignment(projectId, taskId, userId, getCurrentUserId());
  },

  async deleteTaskAssignment(projectId: string, taskId: string, userId: string) {
    const backend = await resolveBackend();
    return backend.assignment.deleteTaskAssignment(projectId, taskId, userId, getCurrentUserId());
  },

  async createSubtaskAssignment(projectId: string, subTaskId: string, userId: string) {
    const backend = await resolveBackend();
    return backend.assignment.createSubtaskAssignment(projectId, subTaskId, userId, getCurrentUserId());
  },

  async deleteSubtaskAssignment(projectId: string, subTaskId: string, userId: string) {
    const backend = await resolveBackend();
    return backend.assignment.deleteSubtaskAssignment(projectId, subTaskId, userId, getCurrentUserId());
  }
};
