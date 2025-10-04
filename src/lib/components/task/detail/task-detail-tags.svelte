<script lang="ts">
  import { getTranslationService } from '$lib/stores/locale.svelte';
  import type { TaskWithSubTasks } from '$lib/types/task';
  import type { SubTask, SubTaskWithTags } from '$lib/types/sub-task';
  import { taskStore } from '$lib/stores/tasks.svelte';
  import { subTaskStore } from '$lib/stores/sub-task-store.svelte';
  import TagInput from '$lib/components/tag/display/tag-input.svelte';

  type SubTaskForProps = SubTask | SubTaskWithTags;
  interface Props {
    task: TaskWithSubTasks | null;
    subTask: SubTaskForProps | null;
    isNewTaskMode?: boolean;
  }

  let { task, subTask, isNewTaskMode = false }: Props = $props();

  const translationService = getTranslationService();
  let currentItem = $derived(subTask || task);
  let isSubTask = $derived(!!subTask);

  // Get project ID for tag creation
  const projectId = $derived(() => {
    if (isNewTaskMode) {
      return taskStore.selectedProjectId;
    } else if (isSubTask && currentItem) {
      // SubTaskの場合、親タスクを探してプロジェクトIDを取得
      for (const project of taskStore.projects) {
        for (const list of project.taskLists) {
          for (const task of list.tasks) {
            if (task.subTasks?.some((st) => st.id === currentItem.id)) {
              return project.id;
            }
          }
        }
      }
      return undefined;
    } else if (task) {
      return taskStore.getProjectIdByTaskId(task.id);
    }
    return undefined;
  });

  // Reactive messages
  const tags = translationService.getMessage('tags');

  function handleTagAdded(tagName: string) {
    if (!currentItem) return;

    if (isNewTaskMode) {
      taskStore.addTagToNewTask(tagName);
    } else if (isSubTask) {
      subTaskStore.addTagToSubTask(currentItem.id, tagName);
    } else {
      taskStore.addTagToTask(currentItem.id, tagName);
    }
  }

  function handleTagRemoved(tagId: string) {
    if (!currentItem) return;

    if (isNewTaskMode) {
      taskStore.removeTagFromNewTask(tagId);
    } else if (isSubTask) {
      subTaskStore.removeTagFromSubTask(currentItem.id, tagId);
    } else {
      taskStore.removeTagFromTask(currentItem.id, tagId);
    }
  }
</script>

{#if currentItem}
  <div>
    <h3 class="mb-2 block text-sm font-medium">{tags()}</h3>
    <TagInput tags={currentItem.tags || []} projectId={projectId() || undefined} ontagAdded={handleTagAdded} ontagRemoved={handleTagRemoved} />
  </div>
{/if}
