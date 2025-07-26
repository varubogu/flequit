<script lang="ts">
  import type { RecurrenceLevel } from '$lib/types/task';
  import * as m from '$paraglide/messages.js';
  import { reactiveMessage } from '$lib/stores/locale.svelte';

  type Props = {
    value: RecurrenceLevel;
    onchange?: (event: Event) => void;
  };

  let { value = $bindable(), onchange }: Props = $props();

  const recurrence = reactiveMessage(m.recurrence);
  const recurrenceDisabled = reactiveMessage(m.recurrence_disabled);
  const recurrenceEnabled = reactiveMessage(m.recurrence_enabled);
  const recurrenceAdvanced = reactiveMessage(m.recurrence_advanced);

  const recurrenceLevelOptions = [
    { value: 'disabled', label: recurrenceDisabled },
    { value: 'enabled', label: recurrenceEnabled },
    { value: 'advanced', label: recurrenceAdvanced }
  ];
</script>

<div class="flex items-center gap-4">
  <h3 class="text-lg font-semibold w-32 flex-shrink-0">{recurrence()}</h3>
  <div class="flex-1">
    <select
      bind:value
      class="w-full p-2 border border-border rounded bg-background text-foreground"
      onchange={onchange}
    >
      {#each recurrenceLevelOptions as option}
        <option value={option.value}>{option.label()}</option>
      {/each}
    </select>
  </div>
</div>
