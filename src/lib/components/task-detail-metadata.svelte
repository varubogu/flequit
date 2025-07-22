<script lang="ts">
  import type { TaskWithSubTasks, SubTask } from '$lib/types/task';
  import Button from '$lib/components/ui/button.svelte';
  import { formatDateTime } from '$lib/utils/date-utils';

  interface Props {
    currentItem: TaskWithSubTasks | SubTask;
    isSubTask: boolean;
    onGoToParentTask?: () => void;
  }

  let { currentItem, isSubTask, onGoToParentTask }: Props = $props();
</script>

<div class="border-t pt-4 space-y-2 text-sm text-muted-foreground">
  <div>Created: {formatDateTime(currentItem.created_at)}</div>
  <div>Updated: {formatDateTime(currentItem.updated_at)}</div>
  <div>{isSubTask ? 'Sub-task' : 'Task'} ID: {currentItem.id}</div>
  {#if isSubTask && 'task_id' in currentItem}
    <div>Parent Task ID: {currentItem.task_id}</div>
    {#if onGoToParentTask}
      <Button
        variant="outline"
        size="sm"
        onclick={onGoToParentTask}
        class="mt-2"
      >
        Go to Parent Task
      </Button>
    {/if}
  {/if}
</div>