<script lang="ts">
  import type { ProjectTree } from '$lib/types/task';
  import { taskStore } from '$lib/stores/tasks.svelte';
  import Button from '$lib/components/button.svelte';
  import TaskListDialog from '$lib/components/task-list-dialog.svelte';
  import * as ContextMenu from '$lib/components/ui/context-menu';

  interface Props {
    project: ProjectTree;
    isExpanded: boolean;
    onViewChange?: (view: any) => void;
  }

  let { project, isExpanded, onViewChange }: Props = $props();
  
  function handleTaskListSelect(list: any) {
    taskStore.selectList(list.id);
    onViewChange?.('tasklist');
  }

  let showTaskListDialog = $state(false);
  let taskListDialogMode: 'add' | 'edit' = $state('add');
  let editingTaskList: any = $state(null);
  let editingProject: any = $state(null);


  function openTaskListDialog(mode: 'add' | 'edit', taskList?: any, project?: any) {
    taskListDialogMode = mode;
    editingTaskList = taskList;
    editingProject = project;
    showTaskListDialog = true;
  }

  function handleTaskListSave(data: { name: string }) {
    const { name } = data;
    if (taskListDialogMode === 'add') {
      console.log('Creating new task list:', name, 'in project:', editingProject?.name);
    } else {
      console.log('Updating task list:', editingTaskList?.name, 'to', name);
    }
    showTaskListDialog = false;
  }
</script>

{#if isExpanded}
  <div class="ml-4 mt-1 space-y-1">
    {#each project.task_lists as list (list.id)}
      <ContextMenu.Root>
        <ContextMenu.Trigger class="block w-full">
          <Button
            variant={taskStore.selectedListId === list.id ? 'secondary' : 'ghost'}
            size="sm"
            class="flex items-center justify-between w-full h-auto p-2 text-xs active:scale-100 active:brightness-[0.4] transition-all duration-100"
            onclick={() => handleTaskListSelect(list)}
            data-testid="tasklist-{list.id}"
          >
            <span class="truncate">{list.name}</span>
            <span class="text-muted-foreground">
              {list.tasks.length}
            </span>
          </Button>
        </ContextMenu.Trigger>
        <ContextMenu.Content>
          <ContextMenu.Item onclick={() => openTaskListDialog('edit', list, project)}>
            Edit Task List
          </ContextMenu.Item>
          <ContextMenu.Item onclick={() => console.log('Add task to:', list.name)}>
            Add Task
          </ContextMenu.Item>
          <ContextMenu.Separator />
          <ContextMenu.Item 
            variant="destructive"
            disabled={list.tasks.length > 0}
            onclick={() => console.log('Delete task list:', list.name)}
          >
            Delete Task List
          </ContextMenu.Item>
        </ContextMenu.Content>
      </ContextMenu.Root>
    {/each}
  </div>
{/if}

<TaskListDialog
  open={showTaskListDialog}
  mode={taskListDialogMode}
  initialName={editingTaskList?.name || ''}
  onsave={handleTaskListSave}
  onclose={() => showTaskListDialog = false}
/>