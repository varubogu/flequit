<script lang="ts">
  import { getTranslationService } from '$lib/stores/locale.svelte';
  import type { TaskWithSubTasks } from '$lib/types/task';
  import type { SubTask } from "$lib/types/sub-task";
  import { taskStore } from '$lib/stores/tasks.svelte';
  import TagInput from '$lib/components/tag/tag-input.svelte';

  interface Props {
    task: TaskWithSubTasks | null;
    subTask: SubTask | null;
    isNewTaskMode?: boolean;
  }

  let { task, subTask, isNewTaskMode = false }: Props = $props();

  const translationService = getTranslationService();
  let currentItem = $derived(subTask || task);
  let isSubTask = $derived(!!subTask);

  // Reactive messages
  const tags = translationService.getMessage('tags');

  function handleTagAdded(tagName: string) {
    if (!currentItem) return;

    if (isNewTaskMode) {
      taskStore.addTagToNewTask(tagName);
    } else if (isSubTask) {
      taskStore.addTagToSubTask(currentItem.id, tagName);
    } else {
      taskStore.addTagToTask(currentItem.id, tagName);
    }
  }

  function handleTagRemoved(tagId: string) {
    if (!currentItem) return;

    if (isNewTaskMode) {
      taskStore.removeTagFromNewTask(tagId);
    } else if (isSubTask) {
      taskStore.removeTagFromSubTask(currentItem.id, tagId);
    } else {
      taskStore.removeTagFromTask(currentItem.id, tagId);
    }
  }
</script>

{#if currentItem}
  <div>
    <h3 class="mb-2 block text-sm font-medium">{tags()}</h3>
    <TagInput tags={currentItem.tags} ontagAdded={handleTagAdded} ontagRemoved={handleTagRemoved} />
  </div>
{/if}
