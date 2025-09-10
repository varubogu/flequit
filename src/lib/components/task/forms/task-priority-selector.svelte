<script lang="ts">
  import Select from '$lib/components/ui/select.svelte';
  import { getTranslationService } from '$lib/stores/locale.svelte';

  interface Props {
    isSubTask: boolean;
    formData: {
      title: string;
      description: string;
      plan_start_date: Date | undefined;
      plan_end_date: Date | undefined;
      is_range_date: boolean;
      priority: number;
    };
    onPriorityChange: (priority: number) => void;
    onFormChange: () => void;
  }

  let { isSubTask, formData, onPriorityChange, onFormChange }: Props = $props();

  const translationService = getTranslationService();
  function handlePriorityChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    onPriorityChange(Number(target.value));
    onFormChange();
  }

  // Reactive messages
  const priority = translationService.getMessage('priority');
  const optional = translationService.getMessage('optional');
  const not_set = translationService.getMessage('not_set');
  const high_priority = translationService.getMessage('high_priority', { priority: 1 });
  const medium_priority = translationService.getMessage('medium_priority', { priority: 2 });
  const low_priority = translationService.getMessage('low_priority', { priority: 3 });
  const lowest_priority = translationService.getMessage('lowest_priority', { priority: 4 });
</script>

<div class="min-w-[120px] flex-1">
  <label for="task-priority" class="mb-2 block text-sm font-medium">
    {priority()}
    {#if isSubTask}<span class="text-muted-foreground text-xs">{optional()}</span>{/if}
  </label>
  <Select
    id="task-priority"
    value={formData.priority}
    onchange={handlePriorityChange}
    class="w-full"
  >
    {#if isSubTask}
      <option value={0}>{not_set()}</option>
    {/if}
    <option value={1}>{high_priority()}</option>
    <option value={2}>{medium_priority()}</option>
    <option value={3}>{low_priority()}</option>
    <option value={4}>{lowest_priority()}</option>
  </Select>
</div>
