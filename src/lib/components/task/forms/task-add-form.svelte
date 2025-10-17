<script lang="ts">
  import { TaskListService } from '$lib/services/domain/task-list';
  import { selectionStore } from '$lib/stores/selection-store.svelte';
  import { useTaskDetailUiStore } from '$lib/services/ui/task-detail-ui-store.svelte';
  import Button from '$lib/components/shared/button.svelte';
  import { Save, X, Edit3 } from 'lucide-svelte';
  import { taskStore } from '$lib/stores/tasks.svelte';
  import { taskInteractions } from '$lib/services/ui/task';
  import { getTranslationService } from '$lib/stores/locale.svelte';
  import { tick } from 'svelte';
  import { cn } from '$lib/utils';

  interface Props {
    onTaskAdded?: () => void;
    onCancel?: () => void;
  }

  let { onTaskAdded, onCancel }: Props = $props();

  const taskDetailUiStore = useTaskDetailUiStore();

  const translationService = getTranslationService();
  let newTaskTitle = $state('');
  let inputElement: HTMLInputElement;

  // Reactive messages
  const editTask = translationService.getMessage('edit_task');
  const addTask = translationService.getMessage('add_task');
  const cancel = translationService.getMessage('cancel');
  const taskTitlePlaceholder = translationService.getMessage('task_title_placeholder');

  // 自動フォーカス
  $effect(() => {
    const focusInput = async () => {
      await tick();
      await tick(); // ダブルtickで確実にDOM更新を待つ

      if (inputElement && inputElement.focus) {
        inputElement.focus();
      }
    };

    focusInput();
  });

  async function handleAddTask() {
    if (!newTaskTitle.trim()) return;

    const newTaskId = await TaskListService.addNewTask(newTaskTitle);
    if (newTaskId) {
      newTaskTitle = '';
      selectionStore.selectTask(newTaskId);
      onTaskAdded?.();
    }
  }

  function handleEditTask() {
    // Get current list ID for new task mode
    const currentListId = getCurrentListId();
    if (!currentListId) return;

    taskInteractions.startNewTaskMode(currentListId);
    if (newTaskTitle.trim()) {
      taskInteractions.updateNewTaskData({ title: newTaskTitle });
    }
    newTaskTitle = '';

    // タスク詳細を表示
    taskDetailUiStore?.openNewTaskDetail();

    onTaskAdded?.();
  }

  function getCurrentListId(): string | null {
    // Get the appropriate list ID based on current view
    if (taskStore.selectedListId) {
      return taskStore.selectedListId;
    }

    // If no specific list is selected, find the first available list
    for (const project of taskStore.projects) {
      if (project.taskLists.length > 0) {
        return project.taskLists[0].id;
      }
    }

    return null;
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter') {
      handleAddTask();
    } else if (event.key === 'Escape') {
      handleCancel();
    }
  }

  function handleCancel() {
    newTaskTitle = '';
    onCancel?.();
  }
</script>

<div class="mt-3">
  <div class="flex gap-2">
    <input
      bind:this={inputElement}
      type="text"
      class={cn(
        'border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50',
        'flex-1'
      )}
      placeholder={taskTitlePlaceholder()}
      bind:value={newTaskTitle}
      onkeydown={handleKeydown}
    />
    <Button size="icon" onclick={handleEditTask} title={editTask()}>
      <Edit3 class="h-4 w-4" />
    </Button>
    <Button size="icon" onclick={handleAddTask} disabled={!newTaskTitle.trim()} title={addTask()}>
      <Save class="h-4 w-4" />
    </Button>
    <Button variant="secondary" size="icon" onclick={handleCancel} title={cancel()}>
      <X class="h-4 w-4" />
    </Button>
  </div>
</div>
