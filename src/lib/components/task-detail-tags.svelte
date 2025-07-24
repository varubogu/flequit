<script lang="ts">
  import { reactiveMessage } from '$lib/stores/locale.svelte';
  import type { TaskWithSubTasks } from '$lib/types/task';
  import * as m from '$paraglide/messages';
  import { taskStore } from '$lib/stores/tasks.svelte';
  import TagInput from './tag-input.svelte';

  interface Props {
    task: TaskWithSubTasks;
    isNewTaskMode?: boolean;
  }

  let { task, isNewTaskMode = false }: Props = $props();

  // Reactive messages
  const tags = reactiveMessage(m.tags);

  function handleTagAdded(tagName: string) {
    if (isNewTaskMode) {
      taskStore.addTagToNewTask(tagName);
    } else {
      taskStore.addTagToTask(task.id, tagName);
    }
  }

  function handleTagRemoved(tagId: string) {
    if (isNewTaskMode) {
      taskStore.removeTagFromNewTask(tagId);
    } else {
      taskStore.removeTagFromTask(task.id, tagId);
    }
  }
</script>

<div>
  <h3 class="block text-sm font-medium mb-2">{tags()}</h3>
  <TagInput
    tags={task.tags}
    placeholder="Add tags..."
    ontagAdded={handleTagAdded}
    ontagRemoved={handleTagRemoved}
  />
</div>
