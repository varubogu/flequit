import { SvelteSet } from 'svelte/reactivity';
import { useTranslation } from '$lib/hooks/use-translation.svelte';
import type { ProjectTree } from '$lib/types/project';
import type { ViewType } from '$lib/stores/view-store.svelte';
import { useProjectStore } from '$lib/hooks/use-project-store.svelte';
import { selectionStore } from '$lib/stores/selection-store.svelte';
import type { ContextMenuList } from '$lib/types/context-menu';
import { createContextMenu, createSeparator } from '$lib/types/context-menu';
import { Edit, Plus, Trash2 } from 'lucide-svelte';
import { ProjectCompositeService } from '$lib/services/composite/project-composite';
import { createProjectDragDropHandler } from '$lib/components/project/handlers/project-drag-drop-handler.svelte';
import { createProjectDialogManager } from '$lib/components/project/handlers/project-dialog-manager.svelte';

export interface ProjectListLogic {
  expandedProjects: SvelteSet<string>;
  projectsData: ProjectTree[];
  toggleTaskLists: string;
  handleProjectSelect: (project: ProjectTree) => void;
  toggleProjectExpansion: (projectId: string) => void;
  getProjectTaskCount: (project: ProjectTree) => number;
  openProjectDialog: (mode: 'add' | 'edit', project?: ProjectTree) => void;
  openTaskListDialog: (mode: 'add', project: ProjectTree) => void;
  handleProjectDragStart: (event: DragEvent, project: ProjectTree) => void;
  handleProjectDragOver: (event: DragEvent, project: ProjectTree) => void;
  handleProjectDrop: (event: DragEvent, targetProject: ProjectTree) => Promise<void>;
  handleProjectDragEnd: (event: DragEvent) => void;
  handleProjectDragEnter: (event: DragEvent, element: HTMLElement) => void;
  handleProjectDragLeave: (event: DragEvent, element: HTMLElement) => void;
  createProjectContextMenu: (project: ProjectTree) => ContextMenuList;
}

export interface ProjectListDialogState {
  showProjectDialog: boolean;
  projectDialogMode: 'add' | 'edit';
  editingProject: ProjectTree | null;
  showTaskListDialog: boolean;
  taskListDialogProject: ProjectTree | null;
}

export function useProjectListController(
  onViewChange?: (view: ViewType) => void
): {
  logic: ProjectListLogic;
  dialogState: ProjectListDialogState;
  handleProjectSave: (data: { name: string; color: string }) => Promise<void>;
  handleTaskListSave: (data: { name: string }) => Promise<void>;
  handleProjectDialogClose: () => void;
  handleTaskListDialogClose: () => void;
} {
  // Translation service
  const translationService = useTranslation();
  const projectStore = useProjectStore();

  // State
  const expandedProjects = new SvelteSet<string>();

  // Derived states
  const projectsData = $derived(projectStore.projects);

  // Translation messages
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

  // Drag & Drop handler
  const dragDropHandler = createProjectDragDropHandler(() => projectsData);

  // Dialog manager
  const dialogManager = createProjectDialogManager(onViewChange);

  // Project handlers
  function handleProjectSelect(project: ProjectTree) {
    selectionStore.selectProject(project.id);
    onViewChange?.('project');
  }

  function toggleProjectExpansion(projectId: string) {
    if (expandedProjects.has(projectId)) {
      expandedProjects.delete(projectId);
    } else {
      expandedProjects.add(projectId);
    }
  }

  function getProjectTaskCount(project: ProjectTree): number {
    return project.taskLists.reduce((acc, list) => acc + list.tasks.length, 0);
  }

  // Context menu
  function createProjectContextMenu(project: ProjectTree): ContextMenuList {
    return createContextMenu([
      {
        id: 'edit-project',
        label: editProject,
        action: () => dialogManager.openProjectDialog('edit', project),
        icon: Edit
      },
      {
        id: 'add-task-list',
        label: addTaskList,
        action: () => dialogManager.openTaskListDialog('add', project),
        icon: Plus
      },
      createSeparator(),
      {
        id: 'delete-project',
        label: deleteProject,
        action: () => ProjectCompositeService.deleteProject(project.id),
        icon: Trash2,
        destructive: true
      }
    ]);
  }

  // Create logic object
  const logic = $derived.by(() => {
    const currentToggleTaskLists = toggleTaskListsMessage;
    return {
      expandedProjects,
      projectsData,
      toggleTaskLists: currentToggleTaskLists,
      handleProjectSelect,
      toggleProjectExpansion,
      getProjectTaskCount,
      openProjectDialog: dialogManager.openProjectDialog,
      openTaskListDialog: dialogManager.openTaskListDialog,
      handleProjectDragStart: dragDropHandler.handleProjectDragStart,
      handleProjectDragOver: dragDropHandler.handleProjectDragOver,
      handleProjectDrop: dragDropHandler.handleProjectDrop,
      handleProjectDragEnd: dragDropHandler.handleProjectDragEnd,
      handleProjectDragEnter: dragDropHandler.handleProjectDragEnter,
      handleProjectDragLeave: dragDropHandler.handleProjectDragLeave,
      createProjectContextMenu
    };
  });

  return {
    get logic() {
      return logic;
    },
    dialogState: dialogManager.dialogState,
    handleProjectSave: dialogManager.handleProjectSave,
    handleTaskListSave: dialogManager.handleTaskListSave,
    handleProjectDialogClose: dialogManager.handleProjectDialogClose,
    handleTaskListDialogClose: dialogManager.handleTaskListDialogClose
  };
}
