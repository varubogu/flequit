<script lang="ts">
  import { taskStore } from '$lib/stores/tasks.svelte';
  import type { ProjectTree } from '$lib/types/task';
  import type { ViewType } from '$lib/services/view-service';
  import Button from '$lib/components/ui/button.svelte';
  import Card from '$lib/components/ui/card.svelte';
  import SidebarButton from '$lib/components/sidebar-button.svelte';

  interface Props {
    currentView?: ViewType;
    onViewChange?: (view: ViewType) => void;
  }

  let { currentView = 'all', onViewChange }: Props = $props();

  let projects = $derived(taskStore.projects);
  let todayTasksCount = $derived(taskStore.todayTasks.length);
  let overdueTasksCount = $derived(taskStore.overdueTasks.length);

  function handleViewChange(view: ViewType) {
    onViewChange?.(view);
  }

  function handleProjectSelect(project: ProjectTree) {
    taskStore.selectProject(project.id);
    onViewChange?.('project');
  }

  function getProjectTaskCount(project: ProjectTree): number {
    return project.task_lists.reduce((acc, list) => acc + list.tasks.length, 0);
  }
</script>

<Card class="w-64 border-r flex flex-col h-full">
  <!-- Header -->
  <div class="p-4 border-b">
    <h1 class="text-lg font-bold">Flequit</h1>
  </div>

  <!-- Navigation -->
  <nav class="flex-1 p-4">
    <div class="space-y-1">
      <!-- Quick Views -->
      <div class="mb-4">
        <h3 class="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
          Views
        </h3>

        <SidebarButton
          icon="📝"
          label="All Tasks"
          count={taskStore.allTasks.length}
          isActive={currentView === 'all'}
          onclick={() => handleViewChange('all')}
        />

        <SidebarButton
          icon="📅"
          label="Today"
          count={todayTasksCount}
          isActive={currentView === 'today'}
          onclick={() => handleViewChange('today')}
        />

        <SidebarButton
          icon="🚨"
          label="Overdue"
          count={overdueTasksCount}
          isActive={currentView === 'overdue'}
          onclick={() => handleViewChange('overdue')}
        />

        <SidebarButton
          icon="✅"
          label="Completed"
          count={taskStore.allTasks.filter(t => t.status === 'completed').length}
          isActive={currentView === 'completed'}
          onclick={() => handleViewChange('completed')}
        />
      </div>

      <!-- Projects -->
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
            <Button
              variant={currentView === 'project' && taskStore.selectedProjectId === project.id ? 'secondary' : 'ghost'}
              class="flex items-center justify-between w-full h-auto p-3 text-sm"
              onclick={() => handleProjectSelect(project)}
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

            <!-- Task Lists (when project is selected) -->
            {#if currentView === 'project' && taskStore.selectedProjectId === project.id}
              <div class="ml-4 mt-1 space-y-1">
                {#each project.task_lists as list (list.id)}
                  <Button
                    variant={taskStore.selectedListId === list.id ? 'secondary' : 'ghost'}
                    size="sm"
                    class="flex items-center justify-between w-full h-auto p-2 text-xs"
                    onclick={() => taskStore.selectList(list.id)}
                  >
                    <span class="truncate">{list.name}</span>
                    <span class="text-muted-foreground">
                      {list.tasks.length}
                    </span>
                  </Button>
                {/each}
              </div>
            {/if}
          {/each}
        {/if}
      </div>
    </div>
  </nav>

  <!-- Footer -->
  <div class="p-4 border-t">
    <div class="text-xs text-muted-foreground text-center">
      Flequit v0.1.0
    </div>
  </div>
</Card>
