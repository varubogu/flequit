<script lang="ts">
  import { TaskListService } from '$lib/services/task-list-service';
  import { TaskService } from '$lib/services/task-service';
  import Button from '$lib/components/ui/button.svelte';
  import Input from '$lib/components/ui/input.svelte';
  import { Save, X } from 'lucide-svelte';

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
