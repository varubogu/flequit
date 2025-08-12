<script lang="ts">
  import Button from '$lib/components/shared/button.svelte';
  import Input from '$lib/components/ui/input.svelte';
  import { Save, X } from 'lucide-svelte';
  import { getTranslationService } from '$lib/stores/locale.svelte';

  interface Props {
    onSubTaskAdded?: (title: string) => void;
    onCancel?: () => void;
  }

  let { onSubTaskAdded, onCancel }: Props = $props();

  const translationService = getTranslationService();
  let newSubTaskTitle = $state('');

  // Reactive messages
  const cancel = translationService.getMessage('cancel');
  const subTaskTitle = translationService.getMessage('sub_task_title');
  const addSubtask = translationService.getMessage('add_subtask');

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
    <Input
      type="text"
      class="flex-1"
      placeholder={subTaskTitle()}
      bind:value={newSubTaskTitle}
      onkeydown={handleKeydown}
    />
    <Button size="icon" onclick={handleAddSubTask} disabled={!newSubTaskTitle.trim()} title={addSubtask()}>
      <Save class="h-4 w-4" />
    </Button>
    <Button variant="secondary" size="icon" onclick={handleCancel} title={cancel()}>
      <X class="h-4 w-4" />
    </Button>
  </div>
</div>