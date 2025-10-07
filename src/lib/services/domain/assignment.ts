import { resolveBackend } from '$lib/infrastructure/backend-client';

export const AssignmentService = {
  async createTaskAssignment(projectId: string, taskId: string, userId: string) {
    const backend = await resolveBackend();
    return backend.assignment.createTaskAssignment(projectId, taskId, userId);
  },

  async deleteTaskAssignment(projectId: string, taskId: string, userId: string) {
    const backend = await resolveBackend();
    return backend.assignment.deleteTaskAssignment(projectId, taskId, userId);
  },

  async createSubtaskAssignment(projectId: string, subTaskId: string, userId: string) {
    const backend = await resolveBackend();
    return backend.assignment.createSubtaskAssignment(projectId, subTaskId, userId);
  },

  async deleteSubtaskAssignment(projectId: string, subTaskId: string, userId: string) {
    const backend = await resolveBackend();
    return backend.assignment.deleteSubtaskAssignment(projectId, subTaskId, userId);
  }
};
