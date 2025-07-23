<script lang="ts">
  import type { TaskWithSubTasks, SubTask, TaskStatus } from '$lib/types/task';
  import Button from '$lib/components/button.svelte';
  import Select from '$lib/components/ui/select.svelte';
  import Textarea from '$lib/components/ui/textarea.svelte';
  import { formatDate } from '$lib/utils/date-utils';
  import { localeStore, reactiveMessage } from '$lib/stores/locale.svelte';
  import * as m from '$paraglide/messages';



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

  // Reactive messages
  const status = reactiveMessage(m.status);
  const not_started = reactiveMessage(m.add_task);
  const in_progress = reactiveMessage(m.in_progress);
  const waiting = reactiveMessage(m.waiting);
  const completed = reactiveMessage(m.completed);
  const due_date = reactiveMessage(m.due_date);
  const optional = reactiveMessage(m.optional);
  const select_date = reactiveMessage(m.select_date);
  const priority = reactiveMessage(m.priority);
  const cancelled = reactiveMessage(m.cancelled);
  const task_description = reactiveMessage(m.task_description);
  const sub_task_description_optional = reactiveMessage(m.sub_task_description_optional);
  const description = reactiveMessage(m.description);
  const not_set = reactiveMessage(m.not_set);
  const high_priority = reactiveMessage(m.high_priority);
  const medium_priority = reactiveMessage(m.medium_priority);
  const low_priority = reactiveMessage(m.low_priority);
  const lowest_priority = reactiveMessage(m.lowest_priority);


</script>

<!-- Status, Due Date, Priority -->
<div class="flex flex-wrap gap-4">
  <div class="min-w-[120px] flex-1">
    <label for="task-status" class="block text-sm font-medium mb-2">{status()}</label>
    <Select
      id="task-status"
      value={currentItem.status}
      onchange={onStatusChange}
      class="w-full"
    >
      <option value="not_started">{not_started()}</option>
      <option value="in_progress">{in_progress()}</option>
      <option value="waiting">{waiting()}</option>
      <option value="completed">{completed()}</option>
      <option value="cancelled">{cancelled()}</option>
    </Select>
  </div>

  <div class="min-w-[140px] flex-1">
    <label for="task-due-date" class="block text-sm font-medium mb-2">
      {due_date()} {#if isSubTask}<span class="text-xs text-muted-foreground">{optional()}</span>{/if}
    </label>
    <Button
      variant="outline"
      class="w-full justify-start text-left h-10 px-3 py-2 font-normal"
      onclick={onDueDateClick}
    >
      {#if formData.end_date}
        {formatDate(formData.end_date)}
      {:else}
        <span class="text-muted-foreground">{select_date()}</span>
      {/if}
    </Button>
  </div>

  <div class="min-w-[120px] flex-1">
    <label for="task-priority" class="block text-sm font-medium mb-2">
      {priority()} {#if isSubTask}<span class="text-xs text-muted-foreground">{optional()}</span>{/if}
    </label>
    <Select id="task-priority" value={formData.priority} onchange={handlePriorityChange} class="w-full">
      {#if isSubTask}
        <option value={0}>{not_set()}</option>
      {/if}
      <option value={1}>{high_priority({ priority: 1 })}</option>
      <option value={2}>{medium_priority({ priority: 2 })}</option>
      <option value={3}>{low_priority({ priority: 3 })}</option>
      <option value={4}>{lowest_priority({ priority: 4 })}</option>
    </Select>
  </div>
</div>

<!-- Description -->
<div>
  <label for="task-description" class="block text-sm font-medium mb-2">
    {description()} {#if isSubTask}<span class="text-xs text-muted-foreground">{optional()}</span>{/if}
  </label>
  <Textarea
    id="task-description"
    class="w-full min-h-24"
    value={formData.description}
    oninput={handleDescriptionInput}
    placeholder={isSubTask ? sub_task_description_optional() : task_description()}
  />
</div>
