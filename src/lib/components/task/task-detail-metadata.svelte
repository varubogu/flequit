<script lang="ts">
  import type { TaskWithSubTasks, SubTask } from '$lib/types/task';
  import Button from '$lib/components/shared/button.svelte';
  import { formatDateTime } from '$lib/utils/datetime-utils';
  import { localeStore, reactiveMessage } from '$lib/stores/locale.svelte';
  import * as m from '$paraglide/messages';



  interface Props {
    currentItem: TaskWithSubTasks | SubTask;
    isSubTask: boolean;
    isNewTaskMode?: boolean;
    onGoToParentTask?: () => void;
  }

  let { currentItem, isSubTask, isNewTaskMode = false, onGoToParentTask }: Props = $props();

  // Reactive messages
  const created = reactiveMessage(m.created);
  const updated = reactiveMessage(m.updated);
  const parent_task_id = reactiveMessage(m.parent_task_id);
  const go_to_parent_task = reactiveMessage(m.go_to_parent_task);
  const sub_task = reactiveMessage(m.sub_task);
  const task = reactiveMessage(m.task);

</script>

{#if !isNewTaskMode}
  <div class="border-t pt-4 space-y-2 text-sm text-muted-foreground">
    <div>{created()}: {formatDateTime(currentItem.created_at)}</div>
    <div>{updated()}: {formatDateTime(currentItem.updated_at)}</div>
    <div>{isSubTask ? sub_task() : task()} ID: {currentItem.id}</div>
    {#if isSubTask && 'task_id' in currentItem}
      <div>{parent_task_id()}: {currentItem.task_id}</div>
      {#if onGoToParentTask}
        <Button
          variant="outline"
          size="sm"
          onclick={onGoToParentTask}
          class="mt-2"
        >
          {go_to_parent_task()}
        </Button>
      {/if}
    {/if}
  </div>
{/if}
