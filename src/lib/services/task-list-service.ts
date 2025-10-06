import { taskStore } from '$lib/stores/tasks.svelte';
import { TaskService } from './task-service';

export const TaskListService = {
  async addNewTask(title: string): Promise<string | null> {
    if (!title.trim() || taskStore.projects.length === 0) {
      return null;
    }

    const firstList = taskStore.projects[0].taskLists[0];
    if (!firstList) {
      return null;
    }

    const newTask = await TaskService.addTask(firstList.id, {
      title: title.trim()
    });

    return newTask ? newTask.id : null;
  },

  getTaskCountText(count: number): string {
    return `${count} task${count !== 1 ? 's' : ''}`;
  }
};
