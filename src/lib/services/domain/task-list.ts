import { TaskService } from '$lib/services/task-service';
import { projectStore } from '$lib/stores/project-store.svelte';
import { selectionStore } from '$lib/stores/selection-store.svelte';
import type { ProjectTree } from '$lib/types/project';

function getSelectedProject(): ProjectTree | null {
  const projectId = selectionStore.selectedProjectId;
  if (!projectId) {
    return null;
  }
  return projectStore.getProjectById(projectId);
}

function findFirstAvailableList(): string | null {
  for (const project of projectStore.projects) {
    if (project.taskLists?.length) {
      return project.taskLists[0].id;
    }
  }
  return null;
}

function resolveTargetListId(): string | null {
  if (selectionStore.selectedListId) {
    return selectionStore.selectedListId;
  }

  const selectedProject = getSelectedProject();
  const listFromProject = selectedProject?.taskLists?.[0];
  if (listFromProject) {
    return listFromProject.id;
  }

  return findFirstAvailableList();
}

export const TaskListService = {
  async addNewTask(title: string): Promise<string | null> {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      return null;
    }

    const targetListId = resolveTargetListId();
    if (!targetListId) {
      return null;
    }

    const newTask = await TaskService.addTask(targetListId, {
      title: trimmedTitle
    });

    return newTask ? newTask.id : null;
  },

  getTaskCountText(count: number): string {
    return `${count} task${count !== 1 ? 's' : ''}`;
  },

  resolveTargetListId
};
