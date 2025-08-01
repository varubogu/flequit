<script lang="ts">
  import { getTranslationService } from '$lib/stores/locale.svelte';
  import type { ProjectTree } from '$lib/types/task';
  import type { ViewType } from '$lib/services/view-service';
  import { taskStore } from '$lib/stores/tasks.svelte';
  import Button from '$lib/components/shared/button.svelte';
  import { ChevronDown, ChevronRight, Plus, Edit, Trash2 } from 'lucide-svelte';
  import ProjectDialog from '$lib/components/project/project-dialog.svelte';
  import TaskListDialog from '$lib/components/task/task-list-dialog.svelte';
  import ContextMenuWrapper from '$lib/components/shared/context-menu-wrapper.svelte';
  import TaskListDisplay from '$lib/components/task/task-list-display.svelte';
  import { DragDropManager, type DragData, type DropTarget } from '$lib/utils/drag-drop';
  import type { ContextMenuList } from '$lib/types/context-menu';
  import { createContextMenu, createSeparator } from '$lib/types/context-menu';

  interface Props {
    currentView?: ViewType;
    onViewChange?: (view: ViewType) => void;
    isCollapsed?: boolean;
  }

  let { currentView = 'all', onViewChange, isCollapsed = false }: Props = $props();

  const translationService = getTranslationService();
  const editProject = translationService.getMessage('edit_project');
  const addTaskList = translationService.getMessage('add_task_list');
  const deleteProject = translationService.getMessage('delete_project');
  const toggleTaskLists = translationService.getMessage('toggle_task_lists');

  let projectsData = $derived(taskStore.projects);
  let expandedProjects = $state<Set<string>>(new Set());

  let showProjectDialog = $state(false);
  let projectDialogMode: 'add' | 'edit' = $state('add');
  let editingProject: ProjectTree | null = $state(null);

  let showTaskListDialog = $state(false);
  let taskListDialogProject: ProjectTree | null = $state(null);

  function handleProjectSelect(project: ProjectTree) {
    taskStore.selectProject(project.id);
    onViewChange?.('project');
  }

  function toggleProjectExpansion(projectId: string) {
    if (expandedProjects.has(projectId)) {
      expandedProjects.delete(projectId);
    } else {
      expandedProjects.add(projectId);
    }
    // Set を再代入する必要はありません（リアクティブ）
  }

  function getProjectTaskCount(project: ProjectTree): number {
    return project.task_lists.reduce((acc, list) => acc + list.tasks.length, 0);
  }

  function openProjectDialog(mode: 'add' | 'edit', project?: ProjectTree) {
    projectDialogMode = mode;
    editingProject = project ?? null;
    showProjectDialog = true;
  }

  function openTaskListDialog(mode: 'add', project: ProjectTree) {
    taskListDialogProject = project;
    showTaskListDialog = true;
  }

  function handleTaskListSave(data: { name: string }) {
    if (taskListDialogProject) {
      const newTaskList = taskStore.addTaskList(taskListDialogProject.id, { name: data.name });
      if (newTaskList) {
        taskStore.selectList(newTaskList.id);
        onViewChange?.('tasklist');
      }
    }
    showTaskListDialog = false;
  }

  function handleProjectSave(data: { name: string; color: string }) {
    const { name, color } = data;
    if (projectDialogMode === 'add') {
      const newProject = taskStore.addProject({ name, color });
      if (newProject) {
        taskStore.selectProject(newProject.id);
        onViewChange?.('project');
      }
    } else if (editingProject) {
      taskStore.updateProject(editingProject.id, { name, color });
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

  function handleProjectDrop(event: DragEvent, targetProject: ProjectTree) {
    const target: DropTarget = {
      type: 'project',
      id: targetProject.id
    };

    const dragData = DragDropManager.handleDrop(event, target);
    if (!dragData) return;

    if (dragData.type === 'project') {
      // プロジェクト同士の並び替え
      const targetIndex = projectsData.findIndex((p) => p.id === targetProject.id);
      taskStore.moveProjectToPosition(dragData.id, targetIndex);
    } else if (dragData.type === 'tasklist') {
      // タスクリストをプロジェクトにドロップ（最後尾に配置）
      taskStore.moveTaskListToProject(dragData.id, targetProject.id);
    } else if (dragData.type === 'task') {
      // タスクをプロジェクトにドロップ（デフォルトのタスクリストに移動）
      if (targetProject.task_lists.length > 0) {
        const defaultTaskList = targetProject.task_lists[0];
        taskStore.moveTaskToList(dragData.id, defaultTaskList.id);
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

  // プロジェクト用のコンテキストメニューリストを作成
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
        action: () => taskStore.deleteProject(project.id),
        icon: Trash2,
        destructive: true
      }
    ]);
  }
</script>

{#each projectsData as project (project.id)}
  <div class="w-full">
    <div class="flex w-full items-start">
      {#if !isCollapsed}
        {#if project.task_lists.length > 0}
          <Button
            variant="ghost"
            size="icon"
            class="text-muted-foreground hover:text-foreground mt-1 h-8 min-h-[32px] w-8 min-w-[32px] transition-all duration-100 active:scale-100 active:brightness-[0.4]"
            onclick={() => toggleProjectExpansion(project.id)}
            title={toggleTaskLists()}
            data-testid="toggle-project-{project.id}"
          >
            {#if expandedProjects.has(project.id)}
              <ChevronDown class="h-4 w-4" />
            {:else}
              <ChevronRight class="h-4 w-4" />
            {/if}
          </Button>
        {:else}
          <div class="mt-1 h-8 min-h-[32px] w-8 min-w-[32px]"></div>
        {/if}
      {/if}

      <div class="flex-1">
        <ContextMenuWrapper items={createProjectContextMenu(project)}>
          <Button
            variant={(currentView === 'project' || currentView === 'tasklist') &&
            taskStore.selectedProjectId === project.id
              ? 'secondary'
              : 'ghost'}
            class={isCollapsed
              ? 'flex h-auto w-full items-center justify-center py-2 text-sm transition-all duration-100 active:scale-100 active:brightness-[0.4]'
              : 'flex h-auto w-full items-center justify-between py-3 pr-3 pl-1 text-sm transition-all duration-100 active:scale-100 active:brightness-[0.4]'}
            onclick={() => handleProjectSelect(project)}
            data-testid="project-{project.id}"
            draggable="true"
            ondragstart={(event) => handleProjectDragStart(event, project)}
            ondragover={(event) => handleProjectDragOver(event, project)}
            ondrop={(event) => handleProjectDrop(event, project)}
            ondragend={handleProjectDragEnd}
            ondragenter={(event) =>
              event.currentTarget &&
              handleProjectDragEnter(event, event.currentTarget as HTMLElement)}
            ondragleave={(event) =>
              event.currentTarget &&
              handleProjectDragLeave(event, event.currentTarget as HTMLElement)}
          >
            <div class="flex min-w-0 items-center gap-2">
              <div
                class="h-3 w-3 flex-shrink-0 rounded-full"
                style="background-color: {project.color || '#3b82f6'}"
              ></div>
              {#if !isCollapsed}
                <span class="truncate">{project.name}</span>
              {/if}
            </div>
            {#if !isCollapsed}
              <span class="text-muted-foreground flex-shrink-0 text-xs">
                {getProjectTaskCount(project)}
              </span>
            {/if}
          </Button>
        </ContextMenuWrapper>
      </div>
    </div>

    {#if !isCollapsed}
      <TaskListDisplay {project} isExpanded={expandedProjects.has(project.id)} {onViewChange} />
    {/if}
  </div>
{/each}

<ProjectDialog
  open={showProjectDialog}
  mode={projectDialogMode}
  initialName={editingProject?.name || ''}
  initialColor={editingProject?.color || '#3b82f6'}
  onsave={handleProjectSave}
  onclose={() => (showProjectDialog = false)}
/>

<TaskListDialog
  open={showTaskListDialog}
  mode="add"
  initialName=""
  onsave={handleTaskListSave}
  onclose={() => (showTaskListDialog = false)}
/>
