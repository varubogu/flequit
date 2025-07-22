<script lang="ts">
  import type { ProjectTree } from '$lib/types/task';
  import { taskStore } from '$lib/stores/tasks.svelte';
  import { contextMenuStore } from '$lib/stores/context-menu.svelte';
  import Button from '$lib/components/ui/button.svelte';
  import TaskListDialog from '$lib/components/task-list-dialog.svelte';

  interface Props {
    project: ProjectTree;
    isExpanded: boolean;
  }

  let { project, isExpanded }: Props = $props();

  let showTaskListDialog = $state(false);
  let taskListDialogMode: 'add' | 'edit' = $state('add');
  let editingTaskList: any = $state(null);
  let editingProject: any = $state(null);

  function handleTaskListContextMenu(event: MouseEvent, list: any, project: ProjectTree) {
    event.preventDefault();
    event.stopPropagation();

    contextMenuStore.open(event.clientX, event.clientY, [
      {
        label: 'Edit Task List',
        action: () => openTaskListDialog('edit', list, project)
      },
      {
        label: 'Add Task',
        action: () => console.log('Add task to:', list.name)
      },
      {
        label: '',
        action: () => {},
        separator: true
      },
      {
        label: 'Delete Task List',
        action: () => console.log('Delete task list:', list.name),
        disabled: list.tasks.length > 0
      }
    ]);
  }

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
      <div
        role="button"
        tabindex="0"
        oncontextmenu={(e) => handleTaskListContextMenu(e, list, project)}
      >
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
      </div>
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