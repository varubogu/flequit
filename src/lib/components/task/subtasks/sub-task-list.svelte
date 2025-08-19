<script lang="ts">
  import type { TaskWithSubTasks } from '$lib/types/task';
  import type { SubTask } from '$lib/types/sub-task';
  import { taskStore } from '$lib/stores/tasks.svelte';
  import Button from '$lib/components/shared/button.svelte';
  import DueDate from '$lib/components/datetime/date-inputs/due-date.svelte';
  import ContextMenuWrapper from '$lib/components/shared/context-menu-wrapper.svelte';
  import type { ContextMenuList } from '$lib/types/context-menu';
  import { DragDropManager, type DragData } from '$lib/utils/drag-drop';

  interface Props {
    task: TaskWithSubTasks;
    subTaskDatePickerPosition: { x: number; y: number };
    showSubTaskDatePicker: boolean;
    handleSubTaskClick: (event: Event | undefined, subTaskId: string) => void;
    handleSubTaskToggle: (event: Event | undefined, subTaskId: string) => void;
    handleSubTaskDueDateClick: (event: MouseEvent, subTask: SubTask) => void;
    createSubTaskContextMenu: (subTask: SubTask) => ContextMenuList;
  }

  let {
    task,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    subTaskDatePickerPosition,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    showSubTaskDatePicker,
    handleSubTaskClick,
    handleSubTaskToggle,
    handleSubTaskDueDateClick,
    createSubTaskContextMenu
  }: Props = $props();

  // Drag & Drop handlers for subtasks
  function handleSubTaskDragStart(event: DragEvent, subTask: SubTask) {
    const dragData: DragData = {
      type: 'subtask',
      id: subTask.id,
      taskId: task.id
    };
    DragDropManager.startDrag(event, dragData);
  }

  function handleSubTaskDragEnd(event: DragEvent) {
    DragDropManager.handleDragEnd(event);
  }
</script>

<div class="mt-2 ml-10 space-y-2">
  {#each task.sub_tasks as subTask (subTask.id)}
    <div
      role="button"
      tabindex="0"
      draggable="true"
      ondragstart={(e) => handleSubTaskDragStart(e, subTask)}
      ondragend={handleSubTaskDragEnd}
    >
      <ContextMenuWrapper items={createSubTaskContextMenu(subTask)}>
        <Button
          variant="ghost"
          class="bg-card text-card-foreground flex h-auto w-full items-center justify-start gap-2 rounded border p-2 transition-all {taskStore.selectedSubTaskId ===
          subTask.id
            ? 'selected'
            : ''}"
          onclick={(e) => handleSubTaskClick(e, subTask.id)}
        >
          <Button
            variant="ghost"
            size="icon"
            class="h-6 min-h-[24px] w-6 min-w-[24px] text-lg"
            onclick={(e) => handleSubTaskToggle(e, subTask.id)}
            title="Toggle subtask completion"
          >
            {subTask.status === 'completed' ? '✅' : '⚪'}
          </Button>
          <div class="flex min-w-0 flex-1 items-center justify-between gap-2">
            <span
              class="truncate text-sm font-medium"
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
      </ContextMenuWrapper>
    </div>
  {/each}
</div>
