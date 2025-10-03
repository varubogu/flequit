<script lang="ts">
  import type { TaskWithSubTasks } from '$lib/types/task';
  import type { SubTask } from '$lib/types/sub-task';
  import type { ContextMenuList } from '$lib/types/context-menu';
  import { getPriorityColor } from '$lib/utils/task-utils';
  import Button from '$lib/components/shared/button.svelte';
  import TaskStatusToggle from '$lib/components/task/controls/task-status-toggle.svelte';
  import TaskContent from '$lib/components/task/core/task-content.svelte';
  import SubTaskList from '$lib/components/task/subtasks/sub-task-list.svelte';
  import TaskAccordionToggle from '../controls/task-accordion-toggle.svelte';
  import ContextMenuWrapper from '$lib/components/shared/context-menu-wrapper.svelte';
  import type TaskDatePicker from '../forms/task-date-picker.svelte';

  interface TaskItemLogic {
    task: TaskWithSubTasks;
    showSubTasks: boolean;
    isSelected: boolean;
    hasSelectedSubTask: boolean;
    isActiveTask: boolean;
    completedSubTasks: number;
    subTaskProgress: number;
    taskContextMenuItems: ContextMenuList;
    createSubTaskContextMenu: (subTask: SubTask) => ContextMenuList;
    handleTaskClick: () => void;
    handleStatusToggle: () => void;
    handleSubTaskToggle: (event: Event | undefined, subTaskId: string) => void;
    handleSubTaskClick: (event: Event | undefined, subTaskId: string) => void;
    toggleSubTasksAccordion: (event?: Event) => void;
    handleDragStart: (event: DragEvent) => void;
    handleDragOver: (event: DragEvent) => void;
    handleDrop: (event: DragEvent) => void;
    handleDragEnd: (event: DragEvent) => void;
    handleDragEnter: (event: DragEvent, element: HTMLElement) => void;
    handleDragLeave: (event: DragEvent, element: HTMLElement) => void;
  }

  interface Props {
    logic: TaskItemLogic;
    task: TaskWithSubTasks;
    taskDatePicker?: TaskDatePicker;
  }

  let { logic, task, taskDatePicker }: Props = $props();
</script>

<div class="flex w-full min-w-0 items-start gap-1 overflow-hidden">
  <div class="flex-shrink-0">
    <TaskAccordionToggle
      hasSubTasks={task.subTasks.length > 0}
      isExpanded={logic.showSubTasks}
      onToggle={logic.toggleSubTasksAccordion.bind(logic)}
    />
  </div>

  <!-- Main Task Button -->
  <div
    role="button"
    tabindex="0"
    class="min-w-0 flex-1 overflow-hidden"
    draggable="true"
    ondragstart={logic.handleDragStart.bind(logic)}
    ondragover={logic.handleDragOver.bind(logic)}
    ondrop={logic.handleDrop.bind(logic)}
    ondragend={logic.handleDragEnd.bind(logic)}
    ondragenter={(e) => logic.handleDragEnter(e, e.currentTarget as HTMLElement)}
    ondragleave={(e) => logic.handleDragLeave(e, e.currentTarget as HTMLElement)}
  >
    <ContextMenuWrapper items={logic.taskContextMenuItems}>
      <Button
        variant="ghost"
        class="task-item-button bg-card text-card-foreground rounded-lg border border-l-4 shadow-sm {getPriorityColor(
          task.priority
        )} h-auto flex-1 justify-start p-4 text-left transition-all {logic.isActiveTask
          ? 'selected'
          : ''} w-full min-w-0"
        onclick={logic.handleTaskClick.bind(logic)}
        data-testid="task-{task.id}"
      >
        <div class="flex w-full min-w-0 items-start gap-3 overflow-hidden">
          <div class="flex-shrink-0">
            <TaskStatusToggle
              status={task.status}
              ontoggle={logic.handleStatusToggle.bind(logic)}
            />
          </div>
          <TaskContent
            {task}
            completedSubTasks={logic.completedSubTasks}
            subTaskProgress={logic.subTaskProgress}
            handleDueDateClick={(e) => taskDatePicker && taskDatePicker.handleDueDateClick(e)}
          />
        </div>
      </Button>
    </ContextMenuWrapper>
  </div>
</div>

<!-- Sub-tasks Accordion -->
{#if task.subTasks.length > 0 && logic.showSubTasks}
  <SubTaskList
    {task}
    subTaskDatePickerPosition={{ x: 0, y: 0 }}
    showSubTaskDatePicker={false}
    handleSubTaskClick={logic.handleSubTaskClick.bind(logic)}
    handleSubTaskToggle={logic.handleSubTaskToggle.bind(logic)}
    handleSubTaskDueDateClick={(e, st) =>
      taskDatePicker && taskDatePicker.handleSubTaskDueDateClick(e, st)}
    createSubTaskContextMenu={logic.createSubTaskContextMenu.bind(logic)}
  />
{/if}
