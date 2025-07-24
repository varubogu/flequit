<script lang="ts">
  import type { TaskWithSubTasks, SubTask } from '$lib/types/task';
  import Select from '$lib/components/ui/select.svelte';
  import Textarea from '$lib/components/ui/textarea.svelte';
  import TagCompletionProvider from '$lib/components/tag-completion-provider.svelte';
  import DueDate from '$lib/components/due-date.svelte';
  import { reactiveMessage } from '$lib/stores/locale.svelte';
  import * as m from '$paraglide/messages';
  import { taskStore } from '$lib/stores/tasks.svelte';



  interface Props {
    currentItem: TaskWithSubTasks | SubTask;
    isSubTask: boolean;
    isNewTaskMode?: boolean;
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
    isNewTaskMode = false,
    formData,
    onStatusChange,
    onFormChange,
    onDueDateClick,
    onDescriptionChange,
    onPriorityChange
  }: Props = $props();

  function handleDescriptionInput(event: CustomEvent<{ value: string }>) {
    onDescriptionChange(event.detail.value);
  }

  function handleTagDetected(event: CustomEvent<{ tagName: string; position: number }>) {
    // Add tag to task or subtask when detected in description
    if (!currentItem) return;
    
    if (isNewTaskMode) {
      taskStore.addTagToNewTask(event.detail.tagName);
    } else if (isSubTask) {
      taskStore.addTagToSubTask(currentItem.id, event.detail.tagName);
    } else if ('list_id' in currentItem) {
      taskStore.addTagToTask(currentItem.id, event.detail.tagName);
    }
  }

  function handlePriorityChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    onPriorityChange(Number(target.value));
    onFormChange();
  }

  // Reactive messages
  const status = reactiveMessage(m.status);
  const not_started = reactiveMessage(m.not_started);
  const in_progress = reactiveMessage(m.in_progress);
  const waiting = reactiveMessage(m.waiting);
  const completed = reactiveMessage(m.completed);
  const due_date = reactiveMessage(m.due_date);
  const optional = reactiveMessage(m.optional);
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
    <DueDate
      task={{ ...currentItem, end_date: formData.end_date }}
      variant="full"
      handleDueDateClick={onDueDateClick}
    />
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
  <TagCompletionProvider ontagDetected={handleTagDetected}>
    <Textarea
      id="task-description"
      class="w-full min-h-24"
      value={formData.description}
      oninput={(e) => {
        const target = e.target as HTMLTextAreaElement;
        handleDescriptionInput(new CustomEvent('input', { detail: { value: target.value } }));
      }}
      placeholder={isSubTask ? sub_task_description_optional() : task_description()}
    />
  </TagCompletionProvider>
</div>
