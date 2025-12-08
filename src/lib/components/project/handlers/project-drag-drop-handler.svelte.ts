import { taskOperations } from '$lib/services/domain/task';
import type { ProjectTree } from '$lib/types/project';
import { taskListStore } from '$lib/stores/task-list-store.svelte';
import { DragDropManager, type DragData, type DropTarget } from '$lib/utils/drag-drop';
import { ProjectCompositeService } from '$lib/services/composite/project-composite';

/**
 * プロジェクトのドラッグ&ドロップハンドラー
 */
export function createProjectDragDropHandler(getProjectsData: () => ProjectTree[]) {
  function handleProjectDragStart(event: DragEvent, project: ProjectTree) {
    const dragData: DragData = {
      type: 'project',
      id: project.id
    };
    DragDropManager.startDrag(event, dragData);
  }

  function handleProjectDragOver(event: DragEvent, project: ProjectTree) {
    const target: DropTarget = {
      type: 'project',
      id: project.id
    };
    DragDropManager.handleDragOver(event, target);
  }

  async function handleProjectDrop(event: DragEvent, targetProject: ProjectTree) {
    const target: DropTarget = {
      type: 'project',
      id: targetProject.id
    };

    const dragData = DragDropManager.handleDrop(event, target);
    if (!dragData) return;

    if (dragData.type === 'project') {
      // プロジェクト同士の並び替え
      const projectsData = getProjectsData();
      const targetIndex = projectsData.findIndex((p) => p.id === targetProject.id);
      await ProjectCompositeService.moveProjectToPosition(dragData.id, targetIndex);
    } else if (dragData.type === 'tasklist') {
      // タスクリストをプロジェクトにドロップ（最後尾に配置）
      await taskListStore.moveTaskListToProject(dragData.id, targetProject.id);
    } else if (dragData.type === 'task') {
      // タスクをプロジェクトにドロップ（デフォルトのタスクリストに移動）
      if (targetProject.taskLists.length > 0) {
        const defaultTaskList = targetProject.taskLists[0];
        await taskOperations.moveTaskToList(dragData.id, defaultTaskList.id);
      }
    }
  }

  function handleProjectDragEnd(event: DragEvent) {
    DragDropManager.handleDragEnd(event);
  }

  function handleProjectDragEnter(event: DragEvent, element: HTMLElement) {
    DragDropManager.handleDragEnter(event, element);
  }

  function handleProjectDragLeave(event: DragEvent, element: HTMLElement) {
    DragDropManager.handleDragLeave(event, element);
  }

  return {
    handleProjectDragStart,
    handleProjectDragOver,
    handleProjectDrop,
    handleProjectDragEnd,
    handleProjectDragEnter,
    handleProjectDragLeave
  };
}
