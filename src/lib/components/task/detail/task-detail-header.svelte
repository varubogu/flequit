<script lang="ts">
  import { getTranslationService } from '$lib/stores/locale.svelte';
  import type { TaskWithSubTasks } from '$lib/types/task';
  import type { SubTask } from '$lib/types/sub-task';
  import Button from '$lib/components/shared/button.svelte';
  import Input from '$lib/components/ui/input.svelte';
  import TagCompletionProvider from '$lib/components/tag/completion/tag-completion-provider.svelte';
  import { Trash2, Save } from 'lucide-svelte';
  import { taskStore } from '$lib/stores/tasks.svelte';
  import { taskMutations } from '$lib/stores/tasks.svelte';
  import { SubTaskMutations } from '$lib/services/domain/subtask';
  import { selectionStore } from '$lib/stores/selection-store.svelte';

  const subTaskMutations = new SubTaskMutations();

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

  const translationService = getTranslationService();
  function handleTitleInput(event: CustomEvent<{ value: string }>) {
    onTitleChange(event.detail.value);
  }

  function handleTagDetected(event: CustomEvent<{ tagName: string; position: number }>) {
    // Add tag to task or subtask when detected in title
    if (!currentItem) return;

    if (isNewTaskMode) {
      taskStore.addTagToNewTask(event.detail.tagName);
    } else if (isSubTask && 'taskId' in currentItem) {
      void subTaskMutations.addTagToSubTaskByName(currentItem.id, currentItem.taskId, event.detail.tagName);
    } else if ('listId' in currentItem) {
      void taskMutations.addTagToTaskByName(currentItem.id, event.detail.tagName);
    }
  }

  // Reactive messages
  const delete_task = translationService.getMessage('delete_task');
  const sub_task_title = translationService.getMessage('sub_task_title');
  const task_title = translationService.getMessage('task_title');
  const save_task = translationService.getMessage('save');
</script>

<div class="border-b p-6">
  <div class="flex items-start justify-between">
    <div class="flex-1">
      <TagCompletionProvider ontagDetected={handleTagDetected}>
        <Input
          class="w-full border-none px-0 text-xl font-semibold shadow-none focus-visible:ring-0"
          value={title}
          oninput={(e) => {
            const target = e.target as HTMLInputElement;
            handleTitleInput(new CustomEvent('input', { detail: { value: target.value } }));
          }}
          placeholder={isSubTask ? sub_task_title() : task_title()}
        />
      </TagCompletionProvider>
    </div>
    <div class="ml-4 flex gap-2">
      {#if isNewTaskMode}
        <Button
          variant="ghost"
          size="icon"
          onclick={onSaveNewTask}
          title={save_task()}
          disabled={!title.trim()}
        >
          <Save class="h-4 w-4" />
        </Button>
      {/if}
      <Button
        variant="ghost"
        size="icon"
        class="text-destructive"
        onclick={onDelete}
        title={delete_task()}
      >
        <Trash2 class="h-4 w-4" />
      </Button>
    </div>
  </div>
</div>
