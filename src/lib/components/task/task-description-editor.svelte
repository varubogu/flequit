<script lang="ts">
  import type { TaskWithSubTasks, SubTask } from '$lib/types/task';
  import Textarea from '$lib/components/ui/textarea.svelte';
  import TagCompletionProvider from '$lib/components/tag/tag-completion-provider.svelte';
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
    onDescriptionChange: (description: string) => void;
  }

  let {
    currentItem,
    isSubTask,
    isNewTaskMode = false,
    formData,
    onDescriptionChange
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

  // Reactive messages
  const task_description = reactiveMessage(m.task_description);
  const sub_task_description_optional = reactiveMessage(m.sub_task_description_optional);
  const description = reactiveMessage(m.description);
  const optional = reactiveMessage(m.optional);
</script>

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
