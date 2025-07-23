<script lang="ts">
  import type { TaskWithSubTasks } from '$lib/types/task';
  import Button from '$lib/components/button.svelte';
  import { formatDate } from '$lib/utils/date-utils';

  interface Props {
    task: TaskWithSubTasks;
    selectedSubTaskId: string | null;
    onSubTaskClick: (subTaskId: string) => void;
    onSubTaskToggle: (subTaskId: string) => void;
  }

  let { task, selectedSubTaskId, onSubTaskClick, onSubTaskToggle }: Props = $props();
</script>

{#if task.sub_tasks.length > 0}
  <div>
    <h3 class="block text-sm font-medium mb-2">Sub-tasks</h3>
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
            aria-label="Toggle subtask completion"
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
              <span class="text-xs text-muted-foreground whitespace-nowrap">
                {formatDate(subTask.end_date)}
              </span>
            {/if}
          </div>
        </Button>
      {/each}
    </div>
  </div>
{/if}