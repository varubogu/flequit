<script lang="ts">
  import type { ProjectTree } from '$lib/types/task';
  import type { ViewType } from '$lib/services/view-service';
  import { taskStore } from '$lib/stores/tasks.svelte';
  import Button from '$lib/components/button.svelte';
  import { ChevronDown, ChevronRight } from 'lucide-svelte';
  import ProjectDialog from '$lib/components/project-dialog.svelte';
  import SidebarProjectTaskLists from '$lib/components/sidebar-project-task-lists.svelte';
  import * as ContextMenu from '$lib/components/ui/context-menu';

  interface Props {
    currentView?: ViewType;
    onViewChange?: (view: ViewType) => void;
  }

  let { currentView = 'all', onViewChange }: Props = $props();

  let projects = $derived(taskStore.projects);
  let expandedProjects = $state<Set<string>>(new Set());

  let showProjectDialog = $state(false);
  let projectDialogMode: 'add' | 'edit' = $state('add');
  let editingProject: any = $state(null);

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


  function handleProjectSave(data: { name: string; color: string }) {
    const { name, color } = data;
    if (projectDialogMode === 'add') {
      console.log('Creating new project:', name, color);
    } else {
      console.log('Updating project:', editingProject?.name, 'to', name, color);
    }
    showProjectDialog = false;
  }

</script>

<div>
  <h3 class="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
    Projects
  </h3>

  {#if projects.length === 0}
    <div class="text-sm text-muted-foreground px-3 py-2">
      No projects yet
    </div>
  {:else}
    {#each projects as project (project.id)}
      <div class="w-full">
        <div class="flex items-start w-full">
          {#if project.task_lists.length > 0}
            <Button
              variant="ghost"
              size="icon"
              class="h-8 w-8 min-h-[32px] min-w-[32px] text-muted-foreground hover:text-foreground mt-1 active:scale-100 active:brightness-[0.4] transition-all duration-100"
              onclick={() => toggleProjectExpansion(project.id)}
              title="Toggle task lists"
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

          <div class="flex-1">
            <ContextMenu.Root>
              <ContextMenu.Trigger class="block w-full">
                <Button
                  variant={(currentView === 'project' || currentView === 'tasklist') && taskStore.selectedProjectId === project.id ? 'secondary' : 'ghost'}
                  class="flex items-center justify-between w-full h-auto py-3 pr-3 pl-1 text-sm active:scale-100 active:brightness-[0.4] transition-all duration-100"
                  onclick={() => handleProjectSelect(project)}
                  data-testid="project-{project.id}"
                >
                  <div class="flex items-center gap-2 min-w-0">
                    <div
                      class="w-3 h-3 rounded-full flex-shrink-0"
                      style="background-color: {project.color || '#3b82f6'}"
                    ></div>
                    <span class="truncate">{project.name}</span>
                  </div>
                  <span class="text-xs text-muted-foreground flex-shrink-0">
                    {getProjectTaskCount(project)}
                  </span>
                </Button>
              </ContextMenu.Trigger>
              <ContextMenu.Content>
                <ContextMenu.Item onclick={() => openProjectDialog('edit', project)}>
                  Edit Project
                </ContextMenu.Item>
                <ContextMenu.Item onclick={() => console.log('Add task list to:', project.name)}>
                  Add Task List
                </ContextMenu.Item>
                <ContextMenu.Separator />
                <ContextMenu.Item 
                  variant="destructive"
                  disabled={project.task_lists.length > 0}
                  onclick={() => console.log('Delete project:', project.name)}
                >
                  Delete Project
                </ContextMenu.Item>
              </ContextMenu.Content>
            </ContextMenu.Root>
          </div>
        </div>

        <SidebarProjectTaskLists 
          {project} 
          isExpanded={expandedProjects.has(project.id)}
          {onViewChange}
        />
      </div>
    {/each}
  {/if}
</div>

<ProjectDialog
  open={showProjectDialog}
  mode={projectDialogMode}
  initialName={editingProject?.name || ''}
  initialColor={editingProject?.color || '#3b82f6'}
  onsave={handleProjectSave}
  onclose={() => showProjectDialog = false}
/>

