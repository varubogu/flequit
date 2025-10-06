<script lang="ts">
  import { SvelteSet } from 'svelte/reactivity';
  import { getTranslationService } from '$lib/stores/locale.svelte';
  import type { ProjectTree } from '$lib/types/project';
  import type { ViewType } from '$lib/services/ui/view';
  import { taskCoreStore } from '$lib/stores/task-core-store.svelte';
  import { projectStore } from '$lib/stores/project-store.svelte';
  import { taskListStore } from '$lib/stores/task-list-store.svelte';
  import { selectionStore } from '$lib/stores/selection-store.svelte';
  import { DragDropManager, type DragData, type DropTarget } from '$lib/utils/drag-drop';
  import type { ContextMenuList } from '$lib/types/context-menu';
  import { createContextMenu, createSeparator } from '$lib/types/context-menu';
  import { Edit, Plus, Trash2 } from 'lucide-svelte';
  import ProjectDialog from '$lib/components/project/project-dialog.svelte';
  import TaskListDialog from '$lib/components/task/dialogs/task-list-dialog.svelte';
  import ProjectListContent from './project-list-content.svelte';

  interface Props {
    currentView?: ViewType;
    onViewChange?: (view: ViewType) => void;
    isCollapsed?: boolean;
  }

  let { currentView = 'all', onViewChange, isCollapsed = false }: Props = $props();

  // State
  let expandedProjects = new SvelteSet<string>();
  let showProjectDialog = $state(false);
  let projectDialogMode = $state<'add' | 'edit'>('add');
  let editingProject = $state<ProjectTree | null>(null);
  let showTaskListDialog = $state(false);
  let taskListDialogProject = $state<ProjectTree | null>(null);

  // Translation service
  const translationService = getTranslationService();

  // Derived states
  const projectsData = $derived(projectStore.projects);
  // Translation messages - initialize once
  let editProject = $state('');
  let addTaskList = $state('');
  let deleteProject = $state('');
  let toggleTaskListsMessage = $state('');
  let messagesInitialized = $state(false);

  $effect(() => {
    if (!messagesInitialized) {
      editProject = translationService.getMessage('edit_project')();
      addTaskList = translationService.getMessage('add_task_list')();
      deleteProject = translationService.getMessage('delete_project')();
      toggleTaskListsMessage = translationService.getMessage('toggle_task_lists')();
      messagesInitialized = true;
    }
  });

  // Project handlers
  function handleProjectSelect(project: ProjectTree) {
    selectionStore.selectProject(project.id);
    onViewChange?.('project');
  }

  function toggleProjectExpansion(projectId: string) {
    const newSet = new SvelteSet(expandedProjects);
    if (newSet.has(projectId)) {
      newSet.delete(projectId);
    } else {
      newSet.add(projectId);
    }
    expandedProjects = newSet;
  }

  function getProjectTaskCount(project: ProjectTree): number {
    return project.taskLists.reduce((acc, list) => acc + list.tasks.length, 0);
  }

  // Dialog handlers
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
        selectionStore.selectList(newTaskList.id);
        onViewChange?.('tasklist');
      }
    }
    showTaskListDialog = false;
  }

  async function handleProjectSave(data: { name: string; color: string }) {
    const { name, color } = data;
    if (projectDialogMode === 'add') {
      const newProject = await projectStore.addProject({ name, color });
      if (newProject) {
        selectionStore.selectProject(newProject.id);
        onViewChange?.('project');
      }
    } else if (editingProject) {
      await projectStore.updateProject(editingProject.id, { name, color });
    }
    showProjectDialog = false;
  }

  // Drag & Drop handlers
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
      const targetIndex = projectsData.findIndex((p) => p.id === targetProject.id);
      await projectStore.moveProjectToPosition(dragData.id, targetIndex);
    } else if (dragData.type === 'tasklist') {
      // タスクリストをプロジェクトにドロップ（最後尾に配置）
      await taskListStore.moveTaskListToProject(dragData.id, targetProject.id);
    } else if (dragData.type === 'task') {
      // タスクをプロジェクトにドロップ（デフォルトのタスクリストに移動）
      if (targetProject.taskLists.length > 0) {
        const defaultTaskList = targetProject.taskLists[0];
        await taskCoreStore.moveTaskToList(dragData.id, defaultTaskList.id);
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

  // Context menu
  function createProjectContextMenu(project: ProjectTree): ContextMenuList {
    return createContextMenu([
      {
        id: 'edit-project',
        label: editProject,
        action: () => openProjectDialog('edit', project),
        icon: Edit
      },
      {
        id: 'add-task-list',
        label: addTaskList,
        action: () => openTaskListDialog('add', project),
        icon: Plus
      },
      createSeparator(),
      {
        id: 'delete-project',
        label: deleteProject,
        action: () => projectStore.deleteProject(project.id),
        icon: Trash2,
        destructive: true
      }
    ]);
  }

  // Dialog close handlers
  function handleProjectDialogClose() {
    showProjectDialog = false;
  }

  function handleTaskListDialogClose() {
    showTaskListDialog = false;
  }

  // Create logic object for ProjectListContent (using $derived.by for reactive references)
  const logic = $derived.by(() => {
    // Evaluate all $derived values within the function
    const currentToggleTaskLists = toggleTaskListsMessage;
    return {
      expandedProjects,
      projectsData,
      toggleTaskLists: currentToggleTaskLists,
      handleProjectSelect,
      toggleProjectExpansion,
      getProjectTaskCount,
      openProjectDialog,
      openTaskListDialog,
      handleProjectDragStart,
      handleProjectDragOver,
      handleProjectDrop,
      handleProjectDragEnd,
      handleProjectDragEnter,
      handleProjectDragLeave,
      createProjectContextMenu
    };
  });
</script>

<ProjectListContent {logic} {currentView} {isCollapsed} {onViewChange} />

<ProjectDialog
  open={showProjectDialog}
  mode={projectDialogMode}
  initialName={editingProject?.name || ''}
  initialColor={editingProject?.color || '#3b82f6'}
  onsave={handleProjectSave}
  onclose={handleProjectDialogClose}
/>

<TaskListDialog
  open={showTaskListDialog}
  mode="add"
  initialName=""
  onsave={handleTaskListSave}
  onclose={handleTaskListDialogClose}
/>
