import type { Task, TaskWithSubTasks } from '$lib/types/task';
import { RecurrenceService } from '$lib/services/domain/recurrence/recurrence-service';
import { taskCoreStore } from '$lib/stores/task-core-store.svelte';

export class TaskRecurrenceService {
  scheduleNextOccurrence(task: TaskWithSubTasks): void {
    if (!task.recurrenceRule) return;

    const baseDate = task.planEndDate || new Date();
    const nextDate = RecurrenceService.calculateNextDate(baseDate, task.recurrenceRule);
    if (!nextDate) return;

    const nextTaskData: Partial<Task> = {
      listId: task.listId,
      projectId: task.projectId,
      title: task.title,
      description: task.description,
      status: 'not_started',
      priority: task.priority,
      planStartDate:
        task.isRangeDate && task.planStartDate && task.planEndDate
          ? new Date(
              nextDate.getTime() - (task.planEndDate.getTime() - task.planStartDate.getTime())
            )
          : undefined,
      planEndDate: nextDate,
      isRangeDate: task.isRangeDate,
      recurrenceRule: task.recurrenceRule,
      orderIndex: 0,
      isArchived: false
    };

    taskCoreStore.createRecurringTask(nextTaskData);
  }
}
