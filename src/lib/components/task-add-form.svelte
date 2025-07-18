<script lang="ts">
  import { TaskListService } from '$lib/services/task-list-service';
  import Button from '$lib/components/ui/button.svelte';
  import Input from '$lib/components/ui/input.svelte';

  interface Props {
    onTaskAdded?: () => void;
    onCancel?: () => void;
  }

  let { onTaskAdded, onCancel }: Props = $props();

  let newTaskTitle = $state('');

  function handleAddTask() {
    if (TaskListService.addNewTask(newTaskTitle)) {
      newTaskTitle = '';
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
      onclick={handleAddTask}
      disabled={!newTaskTitle.trim()}
    >
      Add
    </Button>
    <Button 
      variant="secondary"
      onclick={handleCancel}
    >
      Cancel
    </Button>
  </div>
</div>