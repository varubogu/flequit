import type { ProjectTree } from '$lib/types/project';
import type { ViewType } from '$lib/stores/view-store.svelte';
import { taskListStore } from '$lib/stores/task-list-store.svelte';
import { selectionStore } from '$lib/stores/selection-store.svelte';
import { ProjectCompositeService } from '$lib/services/composite/project-composite';

/**
 * プロジェクトダイアログ管理
 */
export function createProjectDialogManager(
  onViewChange?: (view: ViewType) => void,
  onProjectExpand?: (projectId: string) => void
) {
  let showProjectDialog = $state(false);
  let projectDialogMode = $state<'add' | 'edit'>('add');
  let editingProject = $state<ProjectTree | null>(null);
  let showTaskListDialog = $state(false);
  let taskListDialogProject = $state<ProjectTree | null>(null);

  function openProjectDialog(mode: 'add' | 'edit', project?: ProjectTree) {
    projectDialogMode = mode;
    editingProject = project ?? null;
    showProjectDialog = true;
  }

  function openTaskListDialog(mode: 'add', project: ProjectTree) {
    taskListDialogProject = project;
    showTaskListDialog = true;
  }

  async function handleTaskListSave(data: { name: string }) {
    if (taskListDialogProject) {
      const newTaskList = await taskListStore.addTaskList(taskListDialogProject.id, {
        name: data.name
      });
      if (newTaskList) {
        // プロジェクトを展開
        onProjectExpand?.(taskListDialogProject.id);
        // タスクリストを選択
        selectionStore.selectList(newTaskList.id);
        onViewChange?.('tasklist');
      }
    }
    showTaskListDialog = false;
  }

  async function handleProjectSave(data: { name: string; color: string }) {
    const { name, color } = data;
    if (projectDialogMode === 'add') {
      const newProject = await ProjectCompositeService.createProject({ name, color });
      if (newProject) {
        selectionStore.selectProject(newProject.id);
        onViewChange?.('project');
      }
    } else if (editingProject) {
      await ProjectCompositeService.updateProject(editingProject.id, { name, color });
    }
    showProjectDialog = false;
  }

  function handleProjectDialogClose() {
    showProjectDialog = false;
  }

  function handleTaskListDialogClose() {
    showTaskListDialog = false;
  }

  return {
    dialogState: {
      get showProjectDialog() {
        return showProjectDialog;
      },
      get projectDialogMode() {
        return projectDialogMode;
      },
      get editingProject() {
        return editingProject;
      },
      get showTaskListDialog() {
        return showTaskListDialog;
      },
      get taskListDialogProject() {
        return taskListDialogProject;
      }
    },
    openProjectDialog,
    openTaskListDialog,
    handleProjectSave,
    handleTaskListSave,
    handleProjectDialogClose,
    handleTaskListDialogClose
  };
}
