import type { TaskList } from '$lib/types/task-list';
import type { TaskWithSubTasks } from '$lib/types/task';
import type { ProjectTree } from '$lib/types/project';
import { SvelteDate } from 'svelte/reactivity';

export type TaskNewModeDependencies = {
  taskListStore: {
    getProjectIdByListId(listId: string): string | null;
  };
  projectStore: {
    projects: ProjectTree[];
  };
};

export class TaskNewModeStore {
  #deps: TaskNewModeDependencies;

  isNewTaskMode = $state<boolean>(false);
  newTaskDraft = $state<TaskWithSubTasks | null>(null);

  constructor(deps: TaskNewModeDependencies) {
    this.#deps = deps;
  }

  start(listId: string) {
    this.isNewTaskMode = true;
    const projectId = this.#deps.taskListStore.getProjectIdByListId(listId);
    if (!projectId) {
      console.error('Failed to find project for list:', listId);
      this.cancel();
      return;
    }

    this.newTaskDraft = {
      id: 'new-task',
      projectId,
      listId,
      title: '',
      description: '',
      status: 'not_started',
      priority: 0,
      orderIndex: 0,
      isArchived: false,
      assignedUserIds: [],
      tagIds: [],
      createdAt: new SvelteDate(),
      updatedAt: new SvelteDate(),
      subTasks: [],
      tags: []
    } as TaskWithSubTasks;
  }

  cancel() {
    this.isNewTaskMode = false;
    this.newTaskDraft = null;
  }

  updateDraft(updates: Partial<TaskWithSubTasks>) {
    if (!this.newTaskDraft) return;
    this.newTaskDraft = { ...this.newTaskDraft, ...updates };
  }
}
