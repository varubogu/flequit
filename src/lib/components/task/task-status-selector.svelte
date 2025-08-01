<script lang="ts">
  import type { TaskWithSubTasks, SubTask } from '$lib/types/task';
  import Select from '$lib/components/ui/select.svelte';
  import { getTranslationService } from '$lib/stores/locale.svelte';

  interface Props {
    currentItem: TaskWithSubTasks | SubTask;
    onStatusChange: (event: Event) => void;
  }

  let { currentItem, onStatusChange }: Props = $props();

  const translationService = getTranslationService();
  // Reactive messages
  const status = translationService.getMessage('status');
  const not_started = translationService.getMessage('not_started');
  const in_progress = translationService.getMessage('in_progress');
  const waiting = translationService.getMessage('waiting');
  const completed = translationService.getMessage('completed');
  const cancelled = translationService.getMessage('cancelled');
</script>

<div class="min-w-[120px] flex-1">
  <label for="task-status" class="mb-2 block text-sm font-medium">{status()}</label>
  <Select id="task-status" value={currentItem.status} onchange={onStatusChange} class="w-full">
    <option value="not_started">{not_started()}</option>
    <option value="in_progress">{in_progress()}</option>
    <option value="waiting">{waiting()}</option>
    <option value="completed">{completed()}</option>
    <option value="cancelled">{cancelled()}</option>
  </Select>
</div>
