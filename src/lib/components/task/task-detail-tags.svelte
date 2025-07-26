<script lang="ts">
  import { reactiveMessage } from '$lib/stores/locale.svelte';
  import type { TaskWithSubTasks, SubTask } from '$lib/types/task';
  import * as m from '$paraglide/messages';
  import { taskStore } from '$lib/stores/tasks.svelte';
  import TagInput from '$lib/components/tag/tag-input.svelte';

  interface Props {
    task: TaskWithSubTasks | null;
    subTask: SubTask | null;
    isNewTaskMode?: boolean;
  }

  let { task, subTask, isNewTaskMode = false }: Props = $props();

  let currentItem = $derived(subTask || task);
  let isSubTask = $derived(!!subTask);

  // Reactive messages
  const tags = reactiveMessage(m.tags);

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
    <h3 class="block text-sm font-medium mb-2">{tags()}</h3>
    <TagInput
      tags={currentItem.tags}
      placeholder="Add tags..."
      ontagAdded={handleTagAdded}
      ontagRemoved={handleTagRemoved}
    />
  </div>
{/if}
