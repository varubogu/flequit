<script lang="ts">
  import { getTranslationService } from '$lib/stores/locale.svelte';
  import type { TaskWithSubTasks } from '$lib/types/task';
  import Button from '$lib/components/shared/button.svelte';
  import DueDate from '$lib/components/datetime/due-date.svelte';
  import * as m from '$paraglide/messages';
  import { reactiveMessage } from '$lib/stores/locale.svelte';

  interface Props {
    task: TaskWithSubTasks;
    selectedSubTaskId: string | null;
    onSubTaskClick: (subTaskId: string) => void;
    onSubTaskToggle: (subTaskId: string) => void;
  }

  let { task, selectedSubTaskId, onSubTaskClick, onSubTaskToggle }: Props = $props();

  const translationService = getTranslationService();
  // Reactive messages
  const sub_tasks = translationService.getMessage('sub_tasks');
  const toggle_subtask_completion = translationService.getMessage('toggle_subtask_completion');
</script>

{#if task.sub_tasks.length > 0}
  <div>
    <h3 class="mb-2 block text-sm font-medium">{sub_tasks()}</h3>
    <div class="space-y-2">
      {#each task.sub_tasks as subTask}
        <Button
          variant="ghost"
          class="bg-card text-card-foreground flex h-auto w-full items-center justify-start gap-3 rounded border p-3 {selectedSubTaskId ===
          subTask.id
            ? 'bg-primary/10 border-primary'
            : ''}"
          onclick={() => onSubTaskClick(subTask.id)}
        >
          <Button
            variant="ghost"
            size="icon"
            class="h-8 w-8 text-lg"
            onclick={(e) => {
              e?.stopPropagation();
              onSubTaskToggle(subTask.id);
            }}
            aria-label={toggle_subtask_completion()}
          >
            {subTask.status === 'completed' ? '✅' : '⚪'}
          </Button>
          <div class="flex min-w-0 flex-1 items-center justify-between gap-2">
            <span
              class="truncate font-medium"
              class:line-through={subTask.status === 'completed'}
              class:text-muted-foreground={subTask.status === 'completed'}
            >
              {subTask.title}
            </span>
            {#if subTask.end_date}
              <DueDate
                task={subTask}
                variant="full"
                class="text-xs whitespace-nowrap"
                handleDueDateClick={() => {}}
              />
            {/if}
          </div>
        </Button>
      {/each}
    </div>
  </div>
{/if}
