<script lang="ts">
  import type { ViewType } from '$lib/services/view-service';
  import { taskStore } from '$lib/stores/tasks.svelte';
  import Button from '$lib/components/shared/button.svelte';
  import { ChevronDown, ChevronRight } from 'lucide-svelte';
  import ContextMenuWrapper from '$lib/components/shared/context-menu-wrapper.svelte';
  import TaskListDisplay from '$lib/components/task/core/task-list-display.svelte';
  import type { ProjectListLogic } from './project-list-logic.svelte';

  interface Props {
    logic: ProjectListLogic;
    currentView?: ViewType;
    isCollapsed?: boolean;
    onViewChange?: (view: ViewType) => void;
  }

  let { logic, currentView = 'all', isCollapsed = false, onViewChange }: Props = $props();
</script>

{#each logic.projectsData as project (project.id)}
  <div class="w-full">
    <div class="flex w-full items-start">
      {#if !isCollapsed}
        {#if project.taskLists.length > 0}
          <Button
            variant="ghost"
            size="icon"
            class="text-muted-foreground hover:text-foreground mt-1 h-8 min-h-[32px] w-8 min-w-[32px] transition-all duration-100 active:scale-100 active:brightness-[0.4]"
            onclick={() => logic.toggleProjectExpansion(project.id)}
            title={logic.toggleTaskLists()}
            data-testid="toggle-project-{project.id}"
          >
            {#if logic.expandedProjects.has(project.id)}
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
        <ContextMenuWrapper items={logic.createProjectContextMenu(project)}>
          <Button
            variant={(currentView === 'project' || currentView === 'tasklist') &&
            (taskStore.selectedProjectId === project.id ||
              (currentView === 'tasklist' && taskStore.selectedListId &&
               project.taskLists.some(list => list.id === taskStore.selectedListId)))
              ? 'secondary'
              : 'ghost'}
            class={`${
              (currentView === 'project' || currentView === 'tasklist') &&
              (taskStore.selectedProjectId === project.id ||
                (currentView === 'tasklist' && taskStore.selectedListId &&
                 project.taskLists.some(list => list.id === taskStore.selectedListId)))
                ? 'bg-primary/20 border-2 border-primary shadow-md shadow-primary/40 text-foreground'
                : ''
            } ${
              isCollapsed
                ? 'flex h-auto w-full items-center justify-center py-2 text-sm transition-all duration-100 active:scale-100 active:brightness-[0.4]'
                : 'flex h-auto w-full items-center justify-between py-3 pr-3 pl-1 text-sm transition-all duration-100 active:scale-100 active:brightness-[0.4]'
            }`}
            onclick={() => logic.handleProjectSelect(project)}
            data-testid="project-{project.id}"
            draggable="true"
            ondragstart={(event) => logic.handleProjectDragStart(event, project)}
            ondragover={(event) => logic.handleProjectDragOver(event, project)}
            ondrop={(event) => logic.handleProjectDrop(event, project)}
            ondragend={logic.handleProjectDragEnd.bind(logic)}
            ondragenter={(event) =>
              event.currentTarget &&
              logic.handleProjectDragEnter(event, event.currentTarget as HTMLElement)}
            ondragleave={(event) =>
              event.currentTarget &&
              logic.handleProjectDragLeave(event, event.currentTarget as HTMLElement)}
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
                {logic.getProjectTaskCount(project)}
              </span>
            {/if}
          </Button>
        </ContextMenuWrapper>
      </div>
    </div>

    {#if !isCollapsed}
      <TaskListDisplay
        {project}
        isExpanded={logic.expandedProjects?.has(project.id) ?? false}
        {currentView}
        {onViewChange}
      />
    {/if}
  </div>
{/each}
