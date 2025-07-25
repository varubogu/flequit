<script lang="ts">
  import Select from '$lib/components/ui/select.svelte';
  import { reactiveMessage } from '$lib/stores/locale.svelte';
  import * as m from '$paraglide/messages';

  interface Props {
    isSubTask: boolean;
    formData: {
      title: string;
      description: string;
      start_date: Date | undefined;
      end_date: Date | undefined;
      is_range_date: boolean;
      priority: number;
    };
    onPriorityChange: (priority: number) => void;
    onFormChange: () => void;
  }

  let { isSubTask, formData, onPriorityChange, onFormChange }: Props = $props();

  function handlePriorityChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    onPriorityChange(Number(target.value));
    onFormChange();
  }

  // Reactive messages
  const priority = reactiveMessage(m.priority);
  const optional = reactiveMessage(m.optional);
  const not_set = reactiveMessage(m.not_set);
  const high_priority = reactiveMessage(m.high_priority);
  const medium_priority = reactiveMessage(m.medium_priority);
  const low_priority = reactiveMessage(m.low_priority);
  const lowest_priority = reactiveMessage(m.lowest_priority);
</script>

<div class="min-w-[120px] flex-1">
  <label for="task-priority" class="block text-sm font-medium mb-2">
    {priority()} {#if isSubTask}<span class="text-xs text-muted-foreground">{optional()}</span>{/if}
  </label>
  <Select id="task-priority" value={formData.priority} onchange={handlePriorityChange} class="w-full">
    {#if isSubTask}
      <option value={0}>{not_set()}</option>
    {/if}
    <option value={1}>{high_priority({ priority: 1 })}</option>
    <option value={2}>{medium_priority({ priority: 2 })}</option>
    <option value={3}>{low_priority({ priority: 3 })}</option>
    <option value={4}>{lowest_priority({ priority: 4 })}</option>
  </Select>
</div>