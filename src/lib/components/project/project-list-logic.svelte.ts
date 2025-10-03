import { SvelteSet } from 'svelte/reactivity';
import { getTranslationService } from '$lib/stores/locale.svelte';
import type { ProjectTree } from '$lib/types/project';
import type { ViewType } from '$lib/services/ui/view';
import { taskStore } from '$lib/stores/tasks.svelte';
import { DragDropManager, type DragData, type DropTarget } from '$lib/utils/drag-drop';
import type { ContextMenuList } from '$lib/types/context-menu';
import { createContextMenu, createSeparator } from '$lib/types/context-menu';
import { Edit, Plus, Trash2 } from 'lucide-svelte';

export class ProjectListLogic {
  // State
  expandedProjects = $state<Set<string>>(new SvelteSet());
  showProjectDialog = $state(false);
  projectDialogMode = $state<'add' | 'edit'>('add');
  editingProject = $state<ProjectTree | null>(null);
  showTaskListDialog = $state(false);
  taskListDialogProject = $state<ProjectTree | null>(null);

  // Callbacks
  private onViewChange?: (view: ViewType) => void;

  // Translation service
  private translationService = getTranslationService();

  constructor(onViewChange?: (view: ViewType) => void) {
    this.onViewChange = onViewChange;
  }

  // Derived states
  projectsData = $derived(taskStore.projects);
  editProject = this.translationService.getMessage('edit_project');
  addTaskList = this.translationService.getMessage('add_task_list');
  deleteProject = this.translationService.getMessage('delete_project');
  toggleTaskLists = this.translationService.getMessage('toggle_task_lists');

  // Project handlers
  handleProjectSelect(project: ProjectTree) {
    taskStore.selectProject(project.id);
    this.onViewChange?.('project');
  }

  toggleProjectExpansion(projectId: string) {
    const newSet = new SvelteSet(this.expandedProjects);
    if (newSet.has(projectId)) {
      newSet.delete(projectId);
    } else {
      newSet.add(projectId);
    }
    this.expandedProjects = newSet as Set<string>;
  }

  getProjectTaskCount(project: ProjectTree): number {
    return project.taskLists.reduce((acc, list) => acc + list.tasks.length, 0);
  }

  // Dialog handlers
  openProjectDialog(mode: 'add' | 'edit', project?: ProjectTree) {
    this.projectDialogMode = mode;
    this.editingProject = project ?? null;
    this.showProjectDialog = true;
  }

  openTaskListDialog(mode: 'add', project: ProjectTree) {
    this.taskListDialogProject = project;
    this.showTaskListDialog = true;
  }

  async handleTaskListSave(data: { name: string }) {
    if (this.taskListDialogProject) {
      const newTaskList = await taskStore.addTaskList(this.taskListDialogProject.id, {
        name: data.name
      });
      if (newTaskList) {
        taskStore.selectList(newTaskList.id);
        this.onViewChange?.('tasklist');
      }
    }
    this.showTaskListDialog = false;
  }

  async handleProjectSave(data: { name: string; color: string }) {
    const { name, color } = data;
    if (this.projectDialogMode === 'add') {
      const newProject = await taskStore.addProject({ name, color });
      if (newProject) {
        taskStore.selectProject(newProject.id);
        this.onViewChange?.('project');
      }
    } else if (this.editingProject) {
      await taskStore.updateProject(this.editingProject.id, { name, color });
    }
    this.showProjectDialog = false;
  }

  // Drag & Drop handlers
  handleProjectDragStart(event: DragEvent, project: ProjectTree) {
    const dragData: DragData = {
      type: 'project',
      id: project.id
    };
    DragDropManager.startDrag(event, dragData);
  }

  handleProjectDragOver(event: DragEvent, project: ProjectTree) {
    const target: DropTarget = {
      type: 'project',
      id: project.id
    };
    DragDropManager.handleDragOver(event, target);
  }

  async handleProjectDrop(event: DragEvent, targetProject: ProjectTree) {
    const target: DropTarget = {
      type: 'project',
      id: targetProject.id
    };

    const dragData = DragDropManager.handleDrop(event, target);
    if (!dragData) return;

    if (dragData.type === 'project') {
      // プロジェクト同士の並び替え
      const targetIndex = this.projectsData.findIndex((p) => p.id === targetProject.id);
      await taskStore.moveProjectToPosition(dragData.id, targetIndex);
    } else if (dragData.type === 'tasklist') {
      // タスクリストをプロジェクトにドロップ（最後尾に配置）
      await taskStore.moveTaskListToProject(dragData.id, targetProject.id);
    } else if (dragData.type === 'task') {
      // タスクをプロジェクトにドロップ（デフォルトのタスクリストに移動）
      if (targetProject.taskLists.length > 0) {
        const defaultTaskList = targetProject.taskLists[0];
        await taskStore.moveTaskToList(dragData.id, defaultTaskList.id);
      }
    }
  }

  handleProjectDragEnd(event: DragEvent) {
    DragDropManager.handleDragEnd(event);
  }

  handleProjectDragEnter(event: DragEvent, element: HTMLElement) {
    DragDropManager.handleDragEnter(event, element);
  }

  handleProjectDragLeave(event: DragEvent, element: HTMLElement) {
    DragDropManager.handleDragLeave(event, element);
  }

  // Context menu
  createProjectContextMenu(project: ProjectTree): ContextMenuList {
    return createContextMenu([
      {
        id: 'edit-project',
        label: this.editProject,
        action: () => this.openProjectDialog('edit', project),
        icon: Edit
      },
      {
        id: 'add-task-list',
        label: this.addTaskList,
        action: () => this.openTaskListDialog('add', project),
        icon: Plus
      },
      createSeparator(),
      {
        id: 'delete-project',
        label: this.deleteProject,
        action: () => taskStore.deleteProject(project.id),
        icon: Trash2,
        destructive: true
      }
    ]);
  }

  // Dialog close handlers
  handleProjectDialogClose() {
    this.showProjectDialog = false;
  }

  handleTaskListDialogClose() {
    this.showTaskListDialog = false;
  }
}
