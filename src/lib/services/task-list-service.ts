import { projectStore } from '$lib/stores/project-store.svelte';
import { selectionStore } from '$lib/stores/selection-store.svelte';
import { TaskService } from './task-service';

export const TaskListService = {
  async addNewTask(title: string): Promise<string | null> {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      return null;
    }

    const targetListId = this.resolveTargetListId();
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

  resolveTargetListId(): string | null {
    // 優先度: 選択中のリスト > 選択中プロジェクトの先頭リスト > 全体で最初に見つかったリスト
    if (selectionStore.selectedListId) {
      return selectionStore.selectedListId;
    }

    const projectFromSelection = this.getSelectedProject();
    const listFromProject = projectFromSelection?.taskLists?.[0];
    if (listFromProject) {
      return listFromProject.id;
    }

    const fallbackList = this.findFirstAvailableList();
    if (fallbackList) return fallbackList;

    return null;
  },

  getSelectedProject() {
    const projectId = selectionStore.selectedProjectId;
    if (!projectId) return null;
    return projectStore.getProjectById(projectId);
  },

  findFirstAvailableList(): string | null {
    for (const project of projectStore.projects) {
      if (project.taskLists?.length) {
        return project.taskLists[0].id;
      }
    }
    return null;
  }
};
