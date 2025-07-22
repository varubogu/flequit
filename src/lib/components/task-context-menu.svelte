<script lang="ts">
  import type { TaskWithSubTasks, SubTask } from "$lib/types/task";
  import { contextMenuStore } from "$lib/stores/context-menu.svelte";
  import { taskStore } from "$lib/stores/tasks.svelte";
  import { TaskService } from "$lib/services/task-service";

  interface Props {
    task: TaskWithSubTasks;
  }

  let { task }: Props = $props();

  function handleEdit() {
    console.log(`Editing task: ${task.title}`);
  }

  function handleDelete() {
    TaskService.deleteTask(task.id);
  }

  function setPriority(priority: 'low' | 'medium' | 'high' | 'urgent') {
    console.log(`Setting priority to ${priority} for task: ${task.title}`);
    const priorityMap: Record<'low' | 'medium' | 'high' | 'urgent', number> = {
      'low': 1,
      'medium': 2,
      'high': 3,
      'urgent': 4
    };
    taskStore.updateTask(task.id, { ...task, priority: priorityMap[priority] });
  }

  function handleTaskContextMenu(event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();

    contextMenuStore.open(event.clientX, event.clientY, [
      {
        label: 'Edit Task',
        action: handleEdit
      },
      {
        label: 'Set Priority',
        action: () => setPriority
      },
      {
        label: '',
        action: () => console.log('Priority submenu would open'),
        separator: true
      },
      {
        label: 'Delete Task',
        action: handleDelete
      }
    ]);
  }

  function handleSubTaskContextMenu(event: MouseEvent, subTask: SubTask) {
    event.preventDefault();
    event.stopPropagation();

    contextMenuStore.open(event.clientX, event.clientY, [
      {
        label: 'Edit Subtask',
        action: () => console.log('Edit subtask:', subTask.title)
      },
      {
        label: '',
        action: () => console.log('Priority submenu would open'),
        separator: true
      },
      {
        label: 'Delete Subtask',
        action: () => console.log('Delete subtask:', subTask.title)
      }
    ]);
  }

  // Export handlers for parent component
  export {
    handleTaskContextMenu,
    handleSubTaskContextMenu
  };
</script>