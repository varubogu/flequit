<script lang="ts">
  import { getTranslationService } from '$lib/stores/locale.svelte';
  import type { TaskWithSubTasks } from '$lib/types/task';
  import Button from '$lib/components/shared/button.svelte';
  import DueDate from '$lib/components/datetime/date-inputs/due-date.svelte';
  import { TaskListService } from '$lib/services/task-list-service';
  import { Plus } from 'lucide-svelte';
  import SubTaskAddForm from './subtask-add-form.svelte';

  interface Props {
    task: TaskWithSubTasks;
    selectedSubTaskId: string | null;
    onSubTaskClick: (subTaskId: string) => void;
    onSubTaskToggle: (subTaskId: string) => void;
    onAddSubTask?: () => void;
    showSubTaskAddForm?: boolean;
    onSubTaskAdded?: (title: string) => void;
    onSubTaskAddCancel?: () => void;
  }

  let { 
    task, 
    selectedSubTaskId, 
    onSubTaskClick, 
    onSubTaskToggle, 
    onAddSubTask,
    showSubTaskAddForm = false,
    onSubTaskAdded,
    onSubTaskAddCancel
  }: Props = $props();

  const translationService = getTranslationService();
  let subTaskCountText = $derived(TaskListService.getTaskCountText(task.sub_tasks.length).replace('task', 'subtask'));
  
  // Reactive messages
  const sub_tasks = translationService.getMessage('sub_tasks');
  const toggle_subtask_completion = translationService.getMessage('toggle_subtask_completion');
  const add_subtask = translationService.getMessage('add_subtask');
</script>

<div>
  <!-- Header with count and add button -->
  <div class="mb-2 flex items-center justify-between">
    <h3 class="text-sm font-medium">{sub_tasks()}</h3>
    <div class="flex items-center gap-2">
      <span class="text-muted-foreground text-xs">
        {subTaskCountText}
      </span>
      {#if onAddSubTask}
        <Button size="icon" variant="ghost" class="h-6 w-6" onclick={onAddSubTask} title={add_subtask()} data-testid="add-subtask">
          <Plus class="h-3 w-3" />
        </Button>
      {/if}
    </div>
  </div>

  <!-- Add SubTask Form -->
  {#if showSubTaskAddForm}
    <SubTaskAddForm onSubTaskAdded={onSubTaskAdded} onCancel={onSubTaskAddCancel} />
  {/if}

  <!-- Sub-task list -->
  {#if task.sub_tasks.length > 0}
    <div class="space-y-2" class:mt-1={showSubTaskAddForm}>
      {#each task.sub_tasks as subTask (subTask.id)}
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
  {/if}
</div>
