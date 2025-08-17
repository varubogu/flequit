<script lang="ts">
  import type { TaskWithSubTasks } from '$lib/types/task';
  import TaskDatePicker from '../forms/task-date-picker.svelte';
  import TaskItemContent from './task-item-content.svelte';
  import { TaskItemLogic } from './task-item-logic.svelte';
  import { createEventDispatcher } from 'svelte';

  interface Props {
    task: TaskWithSubTasks;
    onTaskClick?: (taskId: string) => void;
    onSubTaskClick?: (subTaskId: string) => void;
  }

  let { task, onTaskClick, onSubTaskClick }: Props = $props();

  const dispatch = createEventDispatcher<{
    taskSelectionRequested: { taskId: string };
    subTaskSelectionRequested: { subTaskId: string };
  }>();

  // Get handlers from child components
  let taskDatePicker: TaskDatePicker | undefined = $state();

  // Initialize logic
  const logic = new TaskItemLogic(task, onTaskClick, onSubTaskClick, dispatch);
</script>

<TaskItemContent {logic} {task} {taskDatePicker} />

<TaskDatePicker bind:this={taskDatePicker} {task} />
