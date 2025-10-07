import type { SubTask } from '$lib/types/sub-task';
import { resolveBackend } from '$lib/infrastructure/backend-client';

function mapUpdates(updates: Partial<SubTask>) {
  const patch: Record<string, unknown> = {};
  if (updates.title !== undefined) patch.title = updates.title;
  if (updates.description !== undefined) patch.description = updates.description;
  if (updates.status !== undefined) patch.status = updates.status;
  if (updates.priority !== undefined) patch.priority = updates.priority;
  if (updates.orderIndex !== undefined) patch.order_index = updates.orderIndex;
  if (updates.completed !== undefined) patch.completed = updates.completed;
  if (updates.assignedUserIds !== undefined) patch.assigned_user_ids = updates.assignedUserIds;
  if (updates.tagIds !== undefined) patch.tag_ids = updates.tagIds;
  if (updates.planStartDate !== undefined) patch.plan_start_date = updates.planStartDate?.toISOString();
  if (updates.planEndDate !== undefined) patch.plan_end_date = updates.planEndDate?.toISOString();
  if (updates.doStartDate !== undefined) patch.do_start_date = updates.doStartDate?.toISOString();
  if (updates.doEndDate !== undefined) patch.do_end_date = updates.doEndDate?.toISOString();
  if (updates.recurrenceRule !== undefined) patch.recurrence_rule = updates.recurrenceRule;
  patch.updated_at = new Date();
  return patch;
}

export const SubtaskCrudService = {
  async create(
    projectId: string,
    taskId: string,
    subTaskData: {
      title: string;
      description?: string;
      status?: string;
      priority?: number;
    }
  ): Promise<SubTask> {
    const backend = await resolveBackend();
    const newSubTask: SubTask = {
      id: crypto.randomUUID(),
      taskId,
      title: subTaskData.title,
      description: subTaskData.description,
      status:
        (subTaskData.status as
          | 'not_started'
          | 'in_progress'
          | 'waiting'
          | 'completed'
          | 'cancelled') || 'not_started',
      priority: subTaskData.priority ?? 0,
      orderIndex: 0,
      completed: false,
      assignedUserIds: [],
      tagIds: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };
    await backend.subtask.create(projectId, newSubTask);
    return newSubTask;
  },

  async update(projectId: string, subTaskId: string, updates: Partial<SubTask>) {
    const backend = await resolveBackend();
    const patchData = mapUpdates(updates);
    const success = await backend.subtask.update(projectId, subTaskId, patchData);
    if (!success) return null;
    return backend.subtask.get(projectId, subTaskId);
  },

  async delete(projectId: string, subTaskId: string) {
    const backend = await resolveBackend();
    return backend.subtask.delete(projectId, subTaskId);
  }
};
