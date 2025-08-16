<script lang="ts">
  import { getTranslationService } from '$lib/stores/locale.svelte';
  import { cn } from '$lib/utils';

  type Props = {
    showBasicSettings: boolean;
    previewDates: Date[];
    displayCount: number;
    formatDate: (date: Date) => string;
    repeatCount?: number;
  };

  let {
    showBasicSettings,
    previewDates,
    displayCount = $bindable(),
    formatDate,
    repeatCount
  }: Props = $props();

  const translationService = getTranslationService();
  const preview = translationService.getMessage('preview');
  const generatingPreview = translationService.getMessage('generating_preview');
  const recurrenceDisabledPreview = translationService.getMessage('recurrence_disabled_preview');
  const nextExecutionDatesLabel = translationService.getMessage('next_execution_dates_label');
  const timesSuffix = translationService.getMessage('times_suffix');
</script>

<section class="flex h-[500px] flex-col">
  <div class="mb-3 flex-shrink-0">
    <h3 class="text-lg font-semibold">{preview()}</h3>
  </div>
  {#if showBasicSettings && previewDates.length > 0}
    <div class="flex min-h-0 flex-1 flex-col">
      <p class="text-muted-foreground flex-shrink-0 text-sm">
        {nextExecutionDatesLabel()}
      </p>
      <div class="mb-2 flex flex-shrink-0 items-center gap-2">
        <input
          type="number"
          bind:value={displayCount}
          min="1"
          max="50"
          class="border-border bg-background text-foreground w-16 rounded border px-2 py-1 text-sm"
        />
        <span class="text-muted-foreground text-sm">{timesSuffix()}</span>
      </div>
      <div class="border-border bg-card/50 min-h-0 flex-1 overflow-y-auto rounded border">
        <div class="space-y-1 p-2">
          {#each previewDates.slice(0, displayCount) as date, index (index)}
            <div
              class={cn(
                'bg-muted flex items-center gap-2 rounded p-2 text-sm',
                repeatCount && index >= repeatCount && 'text-muted-foreground'
              )}
            >
              <span class="w-8 flex-shrink-0 font-mono">{index + 1}.</span>
              <span class="flex-1">{formatDate(date)}</span>
            </div>
          {/each}
        </div>
      </div>
    </div>
  {:else if showBasicSettings}
    <div class="flex min-h-0 flex-1 items-center justify-center">
      <p class="text-muted-foreground text-sm">{generatingPreview()}</p>
    </div>
  {:else}
    <div class="flex min-h-0 flex-1 items-center justify-center">
      <p class="text-muted-foreground text-sm">{recurrenceDisabledPreview()}</p>
    </div>
  {/if}
</section>
