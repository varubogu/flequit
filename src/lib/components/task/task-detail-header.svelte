<script lang="ts">
  import type { TaskWithSubTasks, SubTask } from '$lib/types/task';
  import Button from '$lib/components/shared/button.svelte';
  import Input from '$lib/components/ui/input.svelte';
  import TagCompletionProvider from '$lib/components/tag/tag-completion-provider.svelte';
  import { Trash2, Save } from 'lucide-svelte';
  import { localeStore, reactiveMessage } from '$lib/stores/locale.svelte';
  import * as m from '$paraglide/messages';
  import { taskStore } from '$lib/stores/tasks.svelte';

  interface Props {
    currentItem: TaskWithSubTasks | SubTask;
    isSubTask: boolean;
    isNewTaskMode?: boolean;
    title: string;
    onTitleChange: (title: string) => void;
    onDelete: () => void;
    onSaveNewTask?: () => void;
  }

  let {
    currentItem,
    isSubTask,
    isNewTaskMode = false,
    title,
    onTitleChange,
    onDelete,
    onSaveNewTask
  }: Props = $props();

  function handleTitleInput(event: CustomEvent<{ value: string }>) {
    onTitleChange(event.detail.value);
  }

  function handleTagDetected(event: CustomEvent<{ tagName: string; position: number }>) {
    // Add tag to task or subtask when detected in title
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
  const delete_task = reactiveMessage(m.delete_task);
  const sub_task_title = reactiveMessage(m.sub_task_title);
  const task_title = reactiveMessage(m.task_title);
  const save_task = reactiveMessage(m.save);


</script>

<div class="p-6 border-b">
  <div class="flex items-start justify-between">
    <div class="flex-1">
      <TagCompletionProvider ontagDetected={handleTagDetected}>
        <Input
          class="w-full text-xl font-semibold border-none shadow-none px-0 focus-visible:ring-0"
          value={title}
          oninput={(e) => {
            const target = e.target as HTMLInputElement;
            handleTitleInput(new CustomEvent('input', { detail: { value: target.value } }));
          }}
          placeholder={isSubTask ? sub_task_title() : task_title()}
        />
      </TagCompletionProvider>
    </div>
    <div class="flex gap-2 ml-4">
      {#if isNewTaskMode}
        <Button variant="ghost" size="icon" onclick={onSaveNewTask} title={save_task()} disabled={!title.trim()}>
          <Save class="h-4 w-4" />
        </Button>
      {/if}
      <Button variant="ghost" size="icon" class="text-destructive" onclick={onDelete} title={delete_task()}>
        <Trash2 class="h-4 w-4" />
      </Button>
    </div>
  </div>
</div>
