<script lang="ts">
  import type { TaskWithSubTasks, SubTask } from "$lib/types/task";
  import { contextMenuStore } from "$lib/stores/context-menu.svelte";
  import { taskStore } from "$lib/stores/tasks.svelte";
  import { TaskService } from "$lib/services/task-service";
  import * as m from '$paraglide/messages.js';
  import { reactiveMessage } from '$lib/stores/locale.svelte';
  import ContextMenuWrapper from '$lib/components/shared/context-menu-wrapper.svelte';
  import { Edit, Trash2, Flag, Target } from 'lucide-svelte';
  import type { ContextMenuList } from '$lib/types/context-menu';
  import { createContextMenu, createSeparator } from '$lib/types/context-menu';

  interface Props {
    task: TaskWithSubTasks;
  }

  let { task }: Props = $props();

  // Reactive messages
  const editTask = reactiveMessage(m.edit_task);
  const setPriorityLabel = reactiveMessage(m.set_priority);
  const deleteTask = reactiveMessage(m.delete_task);
  const editSubtask = reactiveMessage(m.edit_subtask);
  const deleteSubtask = reactiveMessage(m.delete_subtask);
  // const high = reactiveMessage(m.high_priority);
  // const medium = reactiveMessage(m.medium_priority);
  // const low = reactiveMessage(m.low_priority);
  // const lowest_priority = reactiveMessage(m.lowest_priority);

  function handleEdit() {
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

  // タスク用のコンテキストメニューリストを作成
  function createTaskContextMenu(): ContextMenuList {
    return createContextMenu([
      {
        id: 'edit-task',
        label: editTask,
        action: handleEdit,
        icon: Edit
      },
      createSeparator(),
      // {
      //   id: 'priority-low',
      //   label: low,
      //   action: () => setPriority('low'),
      //   icon: Flag
      // },
      // {
      //   id: 'priority-medium',
      //   label: medium,
      //   action: () => setPriority('medium'),
      //   icon: Flag
      // },
      // {
      //   id: 'priority-high',
      //   label: high,
      //   action: () => setPriority('high'),
      //   icon: Flag
      // },
      // {
      //   id: 'priority-lowest',
      //   label: lowest_priority,
      //   action: () => setPriority('lowest'),
      //   icon: Flag
      // },
      createSeparator(),
      {
        id: 'delete-task',
        label: deleteTask,
        action: handleDelete,
        icon: Trash2,
        destructive: true
      }
    ]);
  }

  function handleTaskContextMenu(event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();

    contextMenuStore.open(event.clientX, event.clientY, [
      {
        label: editTask(),
        action: handleEdit
      },
      {
        label: setPriorityLabel(),
        action: () => setPriority
      },
      {
        label: '',
        action: () => console.log('Priority submenu would open'),
        separator: true
      },
      {
        label: deleteTask(),
        action: handleDelete
      }
    ]);
  }

  // サブタスク用のコンテキストメニューリストを作成
  function createSubTaskContextMenu(subTask: SubTask): ContextMenuList {
    return createContextMenu([
      {
        id: 'edit-subtask',
        label: editSubtask,
        action: () => console.log('Edit subtask:', subTask.title),
        icon: Edit
      },
      createSeparator(),
      {
        id: 'delete-subtask',
        label: deleteSubtask,
        action: () => console.log('Delete subtask:', subTask.title),
        icon: Trash2,
        destructive: true
      }
    ]);
  }

  function handleSubTaskContextMenu(event: MouseEvent, subTask: SubTask) {
    event.preventDefault();
    event.stopPropagation();

    contextMenuStore.open(event.clientX, event.clientY, [
      {
        label: editSubtask(),
        action: () => console.log('Edit subtask:', subTask.title)
      },
      {
        label: '',
        action: () => console.log('Priority submenu would open'),
        separator: true
      },
      {
        label: deleteSubtask(),
        action: () => console.log('Delete subtask:', subTask.title)
      }
    ]);
  }

  // Export handlers and context menu functions for parent component
  export {
    handleTaskContextMenu,
    handleSubTaskContextMenu,
    createTaskContextMenu,
    createSubTaskContextMenu
  };
</script>
