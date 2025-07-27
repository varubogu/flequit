<script lang="ts">
  import type { ProjectTree } from '$lib/types/task';
  import type { ViewType } from '$lib/services/view-service';
  import { taskStore } from '$lib/stores/tasks.svelte';
  import Button from '$lib/components/shared/button.svelte';
  import { ChevronDown, ChevronRight, Plus } from 'lucide-svelte';
  import ProjectDialog from '$lib/components/project/project-dialog.svelte';
  import TaskListDialog from '$lib/components/task/task-list-dialog.svelte';
  import * as ContextMenu from '$lib/components/ui/context-menu';
  import * as m from '$paraglide/messages.js';
  import { reactiveMessage } from '$lib/stores/locale.svelte';
  import TaskListDisplay from '$lib/components/task/task-list-display.svelte';
  import { DragDropManager, type DragData, type DropTarget } from '$lib/utils/drag-drop';

  interface Props {
    currentView?: ViewType;
    onViewChange?: (view: ViewType) => void;
    isCollapsed?: boolean;
  }

  let { currentView = 'all', onViewChange, isCollapsed = false }: Props = $props();

  const editProject = reactiveMessage(m.edit_project);
  const addTaskList = reactiveMessage(m.add_task_list);
  const deleteProject = reactiveMessage(m.delete_project);
  const toggleTaskLists = reactiveMessage(m.toggle_task_lists);

  let projectsData = $derived(taskStore.projects);
  let expandedProjects = $state<Set<string>>(new Set());

  let showProjectDialog = $state(false);
  let projectDialogMode: 'add' | 'edit' = $state('add');
  let editingProject: any = $state(null);

  let showTaskListDialog = $state(false);
  let taskListDialogProject: any = $state(null);

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
    expandedProjects = new Set(expandedProjects);
  }

  function getProjectTaskCount(project: ProjectTree): number {
    return project.task_lists.reduce((acc, list) => acc + list.tasks.length, 0);
  }

  function openProjectDialog(mode: 'add' | 'edit', project?: any) {
    projectDialogMode = mode;
    editingProject = project;
    showProjectDialog = true;
  }

  function openTaskListDialog(mode: 'add', project: any) {
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
      const targetIndex = projectsData.findIndex(p => p.id === targetProject.id);
      taskStore.moveProjectToPosition(dragData.id, targetIndex);
    } else if (dragData.type === 'tasklist') {
      // タスクリストをプロジェクトにドロップ（最後尾に配置）
      taskStore.moveTaskListToProject(dragData.id, targetProject.id);
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
</script>

{#each projectsData as project (project.id)}
  <div class="w-full">
    <div class="flex items-start w-full">
      {#if !isCollapsed}
        {#if project.task_lists.length > 0}
          <Button
            variant="ghost"
            size="icon"
            class="h-8 w-8 min-h-[32px] min-w-[32px] text-muted-foreground hover:text-foreground mt-1 active:scale-100 active:brightness-[0.4] transition-all duration-100"
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
          <div class="h-8 w-8 min-h-[32px] min-w-[32px] mt-1"></div>
        {/if}
      {/if}

      <div class="flex-1">
        <ContextMenu.Root>
          <ContextMenu.Trigger class="block w-full">
            <Button
              variant={(currentView === 'project' || currentView === 'tasklist') && taskStore.selectedProjectId === project.id ? 'secondary' : 'ghost'}
              class={isCollapsed 
                ? "flex items-center justify-center w-full h-auto py-2 text-sm active:scale-100 active:brightness-[0.4] transition-all duration-100"
                : "flex items-center justify-between w-full h-auto py-3 pr-3 pl-1 text-sm active:scale-100 active:brightness-[0.4] transition-all duration-100"}
              onclick={() => handleProjectSelect(project)}
              data-testid="project-{project.id}"
              draggable="true"
              ondragstart={(event) => handleProjectDragStart(event, project)}
              ondragover={(event) => handleProjectDragOver(event, project)}
              ondrop={(event) => handleProjectDrop(event, project)}
              ondragend={handleProjectDragEnd}
              ondragenter={(event) => event.currentTarget && handleProjectDragEnter(event, event.currentTarget as HTMLElement)}
              ondragleave={(event) => event.currentTarget && handleProjectDragLeave(event, event.currentTarget as HTMLElement)}
            >
              <div class="flex items-center gap-2 min-w-0">
                <div
                  class="w-3 h-3 rounded-full flex-shrink-0"
                  style="background-color: {project.color || '#3b82f6'}"
                ></div>
                {#if !isCollapsed}
                  <span class="truncate">{project.name}</span>
                {/if}
              </div>
              {#if !isCollapsed}
                <span class="text-xs text-muted-foreground flex-shrink-0">
                  {getProjectTaskCount(project)}
                </span>
              {/if}
            </Button>
          </ContextMenu.Trigger>
          <ContextMenu.Content>
            <ContextMenu.Item onclick={() => openProjectDialog('edit', project)}>
              {editProject()}
            </ContextMenu.Item>
            <ContextMenu.Item onclick={() => openTaskListDialog('add', project)}>
              {addTaskList()}
            </ContextMenu.Item>
            <ContextMenu.Separator />
            <ContextMenu.Item
              variant="destructive"
              onclick={() => taskStore.deleteProject(project.id)}
            >
              {deleteProject()}
            </ContextMenu.Item>
          </ContextMenu.Content>
        </ContextMenu.Root>
      </div>
    </div>

    {#if !isCollapsed}
      <TaskListDisplay
        {project}
        isExpanded={expandedProjects.has(project.id)}
        {onViewChange}
      />
    {/if}
  </div>
{/each}

<ProjectDialog
  open={showProjectDialog}
  mode={projectDialogMode}
  initialName={editingProject?.name || ''}
  initialColor={editingProject?.color || '#3b82f6'}
  onsave={handleProjectSave}
  onclose={() => showProjectDialog = false}
/>

<TaskListDialog
  open={showTaskListDialog}
  mode="add"
  initialName=""
  onsave={handleTaskListSave}
  onclose={() => showTaskListDialog = false}
/>
