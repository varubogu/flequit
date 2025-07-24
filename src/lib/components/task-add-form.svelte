<script lang="ts">
  import { TaskListService } from '$lib/services/task-list-service';
  import { TaskService } from '$lib/services/task-service';
  import Button from '$lib/components/button.svelte';
  import Input from '$lib/components/ui/input.svelte';
  import { Save, X, Edit3 } from 'lucide-svelte';
  import { taskStore } from '$lib/stores/tasks.svelte';
  import { viewStore } from '$lib/stores/view-store.svelte';

  interface Props {
    onTaskAdded?: () => void;
    onCancel?: () => void;
  }

  let { onTaskAdded, onCancel }: Props = $props();

  let newTaskTitle = $state('');

  function handleAddTask() {
    const newTaskId = TaskListService.addNewTask(newTaskTitle);
    if (newTaskId) {
      newTaskTitle = '';
      TaskService.selectTask(newTaskId);
      onTaskAdded?.();
    }
  }

  function handleEditTask() {
    // Get current list ID for new task mode
    const currentListId = getCurrentListId();
    if (!currentListId) return;
    
    taskStore.startNewTaskMode(currentListId);
    if (newTaskTitle.trim()) {
      taskStore.updateNewTaskData({ title: newTaskTitle });
    }
    newTaskTitle = '';
    onTaskAdded?.();
  }

  function getCurrentListId(): string | null {
    // Get the appropriate list ID based on current view
    if (taskStore.selectedListId) {
      return taskStore.selectedListId;
    }
    
    // If no specific list is selected, find the first available list
    for (const project of taskStore.projects) {
      if (project.task_lists.length > 0) {
        return project.task_lists[0].id;
      }
    }
    
    return null;
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter') {
      handleAddTask();
    } else if (event.key === 'Escape') {
      handleCancel();
    }
  }

  function handleCancel() {
    newTaskTitle = '';
    onCancel?.();
  }
</script>

<div class="mt-3">
  <div class="flex gap-2">
    <Input
      type="text"
      class="flex-1"
      placeholder="Enter task title..."
      bind:value={newTaskTitle}
      onkeydown={handleKeydown}
    />
    <Button
      size="icon"
      onclick={handleEditTask}
      title="Edit Task Details"
    >
      <Edit3 class="h-4 w-4" />
    </Button>
    <Button
      size="icon"
      onclick={handleAddTask}
      disabled={!newTaskTitle.trim()}
      title="Add Task"
    >
      <Save class="h-4 w-4" />
    </Button>
    <Button
      variant="secondary"
      size="icon"
      onclick={handleCancel}
      title="Cancel"
    >
      <X class="h-4 w-4" />
    </Button>
  </div>
</div>
