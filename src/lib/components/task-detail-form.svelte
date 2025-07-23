<script lang="ts">
  import type { TaskWithSubTasks, SubTask, TaskStatus } from '$lib/types/task';
  import Button from '$lib/components/button.svelte';
  import Select from '$lib/components/ui/select.svelte';
  import Textarea from '$lib/components/ui/textarea.svelte';
  import { formatDate } from '$lib/utils/date-utils';

  interface Props {
    currentItem: TaskWithSubTasks | SubTask;
    isSubTask: boolean;
    formData: {
      title: string;
      description: string;
      start_date: Date | undefined;
      end_date: Date | undefined;
      is_range_date: boolean;
      priority: number;
    };
    onStatusChange: (event: Event) => void;
    onFormChange: () => void;
    onDueDateClick: (event?: Event) => void;
    onDescriptionChange: (description: string) => void;
    onPriorityChange: (priority: number) => void;
  }

  let { 
    currentItem, 
    isSubTask, 
    formData, 
    onStatusChange, 
    onFormChange, 
    onDueDateClick,
    onDescriptionChange,
    onPriorityChange
  }: Props = $props();

  function handleDescriptionInput(event: Event) {
    const target = event.target as HTMLTextAreaElement;
    onDescriptionChange(target.value);
  }

  function handlePriorityChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    onPriorityChange(Number(target.value));
    onFormChange();
  }
</script>

<!-- Status, Due Date, Priority -->
<div class="flex flex-wrap gap-4">
  <div class="min-w-[120px] flex-1">
    <label for="task-status" class="block text-sm font-medium mb-2">Status</label>
    <Select
      id="task-status"
      value={currentItem.status}
      onchange={onStatusChange}
      class="w-full"
    >
      <option value="not_started">Not Started</option>
      <option value="in_progress">In Progress</option>
      <option value="waiting">Waiting</option>
      <option value="completed">Completed</option>
      <option value="cancelled">Cancelled</option>
    </Select>
  </div>

  <div class="min-w-[140px] flex-1">
    <label for="task-due-date" class="block text-sm font-medium mb-2">
      Due Date {#if isSubTask}<span class="text-xs text-muted-foreground">(Optional)</span>{/if}
    </label>
    <Button
      variant="outline"
      class="w-full justify-start text-left h-10 px-3 py-2 font-normal"
      onclick={onDueDateClick}
    >
      {#if formData.end_date}
        {formatDate(formData.end_date)}
      {:else}
        <span class="text-muted-foreground">Select date</span>
      {/if}
    </Button>
  </div>

  <div class="min-w-[120px] flex-1">
    <label for="task-priority" class="block text-sm font-medium mb-2">
      Priority {#if isSubTask}<span class="text-xs text-muted-foreground">(Optional)</span>{/if}
    </label>
    <Select id="task-priority" value={formData.priority} onchange={handlePriorityChange} class="w-full">
      {#if isSubTask}
        <option value={0}>Not Set</option>
      {/if}
      <option value={1}>High (1)</option>
      <option value={2}>Medium (2)</option>
      <option value={3}>Low (3)</option>
      <option value={4}>Lowest (4)</option>
    </Select>
  </div>
</div>

<!-- Description -->
<div>
  <label for="task-description" class="block text-sm font-medium mb-2">
    Description {#if isSubTask}<span class="text-xs text-muted-foreground">(Optional)</span>{/if}
  </label>
  <Textarea
    id="task-description"
    class="w-full min-h-24"
    value={formData.description}
    oninput={handleDescriptionInput}
    placeholder={isSubTask ? "Sub-task description (optional)" : "Task description"}
  />
</div>