<script lang="ts">
  import { getTranslationService } from '$lib/stores/locale.svelte';
  import type { RecurrenceLevel } from '$lib/types/task';

  type Props = {
    value: RecurrenceLevel;
    onchange?: (event: Event) => void;
  };

  let { value = $bindable(), onchange }: Props = $props();

  const translationService = getTranslationService();
  const recurrence = translationService.getMessage('recurrence');
  const recurrenceDisabled = translationService.getMessage('recurrence_disabled');
  const recurrenceEnabled = translationService.getMessage('recurrence_enabled');
  const recurrenceAdvanced = translationService.getMessage('recurrence_advanced');

  const recurrenceLevelOptions = [
    { value: 'disabled', label: recurrenceDisabled },
    { value: 'enabled', label: recurrenceEnabled },
    { value: 'advanced', label: recurrenceAdvanced }
  ];
</script>

<div class="flex items-center gap-4">
  <h3 class="w-32 flex-shrink-0 text-lg font-semibold">{recurrence()}</h3>
  <div class="flex-1">
    <select
      bind:value
      class="border-border bg-background text-foreground w-full rounded border p-2"
      {onchange}
    >
      {#each recurrenceLevelOptions as option (option.value)}
        <option value={option.value}>{option.label()}</option>
      {/each}
    </select>
  </div>
</div>
