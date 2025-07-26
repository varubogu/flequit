<script lang="ts">
  import type { TaskWithSubTasks } from '$lib/types/task';
  import Button from '$lib/components/button.svelte';
  import DueDate from '$lib/components/due-date.svelte';
  import * as m from '$paraglide/messages';
  import { reactiveMessage } from '$lib/stores/locale.svelte';

  interface Props {
    task: TaskWithSubTasks;
    selectedSubTaskId: string | null;
    onSubTaskClick: (subTaskId: string) => void;
    onSubTaskToggle: (subTaskId: string) => void;
  }

  let { task, selectedSubTaskId, onSubTaskClick, onSubTaskToggle }: Props = $props();

  // Reactive messages
  const sub_tasks = reactiveMessage(m.sub_tasks);
  const toggle_subtask_completion = reactiveMessage(m.toggle_subtask_completion);


</script>

{#if task.sub_tasks.length > 0}
  <div>
    <h3 class="block text-sm font-medium mb-2">{sub_tasks()}</h3>
    <div class="space-y-2">
      {#each task.sub_tasks as subTask}
        <Button
          variant="ghost"
          class="flex items-center gap-3 p-3 border rounded w-full justify-start h-auto bg-card text-card-foreground {selectedSubTaskId === subTask.id ? 'bg-primary/10 border-primary' : ''}"
          onclick={() => onSubTaskClick(subTask.id)}
        >
          <Button
            variant="ghost"
            size="icon"
            class="text-lg h-8 w-8"
            onclick={(e) => {
              e?.stopPropagation();
              onSubTaskToggle(subTask.id);
            }}
            aria-label={toggle_subtask_completion()}
          >
            {subTask.status === 'completed' ? '✅' : '⚪'}
          </Button>
          <div class="flex items-center justify-between gap-2 flex-1 min-w-0">
            <span
              class="font-medium truncate"
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
