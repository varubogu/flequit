<script lang="ts">
  import Button from '$lib/components/shared/button.svelte';
  import { Save, X } from 'lucide-svelte';
  import { useTranslation } from '$lib/hooks/use-translation.svelte';
  import { tick } from 'svelte';
  import { cn } from '$lib/utils';

  interface Props {
    onSubTaskAdded?: (title: string) => void;
    onCancel?: () => void;
  }

  let { onSubTaskAdded, onCancel }: Props = $props();

  const translationService = useTranslation();
  let newSubTaskTitle = $state('');
  let inputElement: HTMLInputElement;

  // Reactive messages
  const cancel = translationService.getMessage('cancel');
  const subTaskTitle = translationService.getMessage('sub_task_title');
  const addSubtask = translationService.getMessage('add_subtask');

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

  function handleAddSubTask() {
    if (newSubTaskTitle.trim()) {
      onSubTaskAdded?.(newSubTaskTitle.trim());
      newSubTaskTitle = '';
    }
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter') {
      handleAddSubTask();
    } else if (event.key === 'Escape') {
      handleCancel();
    }
  }

  function handleCancel() {
    newSubTaskTitle = '';
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
      placeholder={subTaskTitle()}
      bind:value={newSubTaskTitle}
      onkeydown={handleKeydown}
    />
    <Button
      size="icon"
      onclick={handleAddSubTask}
      disabled={!newSubTaskTitle.trim()}
      title={addSubtask()}
    >
      <Save class="h-4 w-4" />
    </Button>
    <Button variant="secondary" size="icon" onclick={handleCancel} title={cancel()}>
      <X class="h-4 w-4" />
    </Button>
  </div>
</div>
