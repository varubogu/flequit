import { taskStore } from '$lib/stores/tasks.svelte';
import type { TaskWithSubTasks } from '$lib/types/task';
import { TaskService } from '$lib/services/task-service';
import { viewStore } from '$lib/stores/view-store.svelte';

export function createSearchLogic(onClose: () => void) {
  let searchValue = $state('');
  let filteredTasks = $state<TaskWithSubTasks[]>([]);
  
  const isCommandMode = $derived(searchValue.startsWith('>'));
  const isTagSearch = $derived(searchValue.startsWith('#'));

  $effect(() => {
    if (searchValue && !isCommandMode) {
      if (isTagSearch) {
        const tagQuery = searchValue.slice(1).toLowerCase();
        if (tagQuery) {
          filteredTasks = taskStore.allTasks
            .filter((task) => task.tags.some((tag) => tag.name.toLowerCase().includes(tagQuery)))
            .slice(0, 5);
        } else {
          filteredTasks = taskStore.allTasks.filter((task) => task.tags.length > 0).slice(0, 5);
        }
      } else {
        filteredTasks = taskStore.allTasks
          .filter(
            (task) =>
              task.title.toLowerCase().includes(searchValue.toLowerCase()) ||
              task.description?.toLowerCase().includes(searchValue.toLowerCase())
          )
          .slice(0, 5);
      }
    } else {
      filteredTasks = [];
    }
  });

  function handleSearchExecute() {
    if (!isCommandMode) {
      viewStore.performSearch(searchValue);
      onClose();
    }
  }

  function handleTaskSelect(task: TaskWithSubTasks) {
    TaskService.selectTask(task.id);
    onClose();
  }

  function handleCommandSelect() {
    onClose();
  }

  function handleAddNewTask() {
    let listId = taskStore.selectedListId;

    if (!listId && taskStore.projects.length > 0) {
      const firstProject = taskStore.projects[0];
      if (firstProject.task_lists.length > 0) {
        listId = firstProject.task_lists[0].id;
      }
    }

    if (listId) {
      taskStore.startNewTaskMode(listId);
    }

    onClose();
  }

  function handleViewAllTasks() {
    viewStore.changeView('all');
    onClose();
  }

  function handleKeyDown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      onClose();
    }
  }

  return {
    searchValue: {
      get value() { return searchValue; },
      set value(val: string) { searchValue = val; }
    },
    filteredTasks: { get value() { return filteredTasks; } },
    isCommandMode: { get value() { return isCommandMode; } },
    isTagSearch: { get value() { return isTagSearch; } },
    handleSearchExecute,
    handleTaskSelect,
    handleCommandSelect,
    handleAddNewTask,
    handleViewAllTasks,
    handleKeyDown
  };
}