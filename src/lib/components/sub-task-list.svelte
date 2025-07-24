<script lang="ts">
  import type { TaskWithSubTasks, SubTask } from '$lib/types/task';
  import { taskStore } from '$lib/stores/tasks.svelte';
  import Button from '$lib/components/button.svelte';
  import DueDate from './due-date.svelte';

  interface Props {
    task: TaskWithSubTasks;
    subTaskDatePickerPosition: { x: number; y: number };
    showSubTaskDatePicker: boolean;
    handleSubTaskClick: (event: Event | undefined, subTaskId: string) => void;
    handleSubTaskToggle: (event: Event | undefined, subTaskId: string) => void;
    handleSubTaskContextMenu: (event: MouseEvent, subTask: SubTask) => void;
    handleSubTaskDueDateClick: (event: MouseEvent, subTask: SubTask) => void;
  }

  let {
    task,
    subTaskDatePickerPosition,
    showSubTaskDatePicker,
    handleSubTaskClick,
    handleSubTaskToggle,
    handleSubTaskContextMenu,
    handleSubTaskDueDateClick
  }: Props = $props();
</script>

<div class="ml-10 mt-2 space-y-2">
  {#each task.sub_tasks as subTask (subTask.id)}
    <div
      role="button"
      tabindex="0"
      oncontextmenu={(e) => handleSubTaskContextMenu(e, subTask)}
    >
      <Button
        variant="ghost"
        class="flex items-center gap-2 p-2 rounded border w-full justify-start h-auto bg-card text-card-foreground {taskStore.selectedSubTaskId ===
        subTask.id
          ? 'bg-primary/10 border-primary'
          : ''}"
        onclick={(e) => handleSubTaskClick(e, subTask.id)}
      >
        <Button
          variant="ghost"
          size="icon"
          class="text-lg h-6 w-6 min-h-[24px] min-w-[24px]"
          onclick={(e) => handleSubTaskToggle(e, subTask.id)}
          title="Toggle subtask completion"
        >
          {subTask.status === 'completed' ? '✅' : '⚪'}
        </Button>
        <div class="flex items-center justify-between gap-2 flex-1 min-w-0">
          <span
            class="text-sm font-medium truncate"
            class:line-through={subTask.status === 'completed'}
            class:text-muted-foreground={subTask.status === 'completed'}
          >
            {subTask.title}
          </span>
          <DueDate
            task={subTask}
            handleDueDateClick={(e) => handleSubTaskDueDateClick(e as MouseEvent, subTask)}
          />
        </div>
      </Button>
    </div>
  {/each}
</div>
