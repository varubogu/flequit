<script lang="ts">
  import { getTranslationService } from '$lib/stores/locale.svelte';
  import type { TaskWithSubTasks } from '$lib/types/task';
  import type { SubTask } from "$lib/types/sub-task";
  import Button from '$lib/components/shared/button.svelte';
  import { formatDateTime } from '$lib/utils/datetime-utils';

  interface Props {
    currentItem: TaskWithSubTasks | SubTask;
    isSubTask: boolean;
    isNewTaskMode?: boolean;
    onGoToParentTask?: () => void;
  }

  let { currentItem, isSubTask, isNewTaskMode = false, onGoToParentTask }: Props = $props();

  const translationService = getTranslationService();
  // Reactive messages
  const created = translationService.getMessage('created');
  const updated = translationService.getMessage('updated');
  const parent_task_id = translationService.getMessage('parent_task_id');
  const go_to_parent_task = translationService.getMessage('go_to_parent_task');
  const sub_task = translationService.getMessage('sub_task');
  const task = translationService.getMessage('task');
</script>

{#if !isNewTaskMode}
  <div class="text-muted-foreground space-y-2 border-t pt-4 text-sm">
    <div>{created()}: {formatDateTime(currentItem.created_at)}</div>
    <div>{updated()}: {formatDateTime(currentItem.updated_at)}</div>
    <div>{isSubTask ? sub_task() : task()} ID: {currentItem.id}</div>
    {#if isSubTask && 'task_id' in currentItem}
      <div>{parent_task_id()}: {currentItem.task_id}</div>
      {#if onGoToParentTask}
        <Button variant="outline" size="sm" onclick={onGoToParentTask} class="mt-2">
          {go_to_parent_task()}
        </Button>
      {/if}
    {/if}
  </div>
{/if}
