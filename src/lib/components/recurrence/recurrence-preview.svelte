<script lang="ts">
  import { getTranslationService } from '$lib/stores/locale.svelte';
	import * as m from '$paraglide/messages.js';
	import { reactiveMessage } from '$lib/stores/locale.svelte';
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

<section class="flex flex-col h-[500px]">
	<div class="mb-3 flex-shrink-0">
		<h3 class="text-lg font-semibold">{preview()}</h3>
	</div>
	{#if showBasicSettings && previewDates.length > 0}
		<div class="flex flex-col flex-1 min-h-0">
			<p class="text-sm text-muted-foreground flex-shrink-0">
				{nextExecutionDatesLabel()}
			</p>
			<div class="flex items-center gap-2 mb-2 flex-shrink-0">
				<input
					type="number"
					bind:value={displayCount}
					min="1"
					max="50"
					class="w-16 px-2 py-1 text-sm border border-border rounded bg-background text-foreground"
				/>
				<span class="text-sm text-muted-foreground">{timesSuffix()}</span>
			</div>
			<div class="flex-1 overflow-y-auto border border-border rounded bg-card/50 min-h-0">
				<div class="space-y-1 p-2">
					{#each previewDates.slice(0, displayCount) as date, index}
						<div
							class={cn(
								'flex items-center gap-2 p-2 bg-muted rounded text-sm',
								repeatCount && index >= repeatCount && 'text-muted-foreground'
							)}
						>
							<span class="font-mono flex-shrink-0 w-8">{index + 1}.</span>
							<span class="flex-1">{formatDate(date)}</span>
						</div>
					{/each}
				</div>
			</div>
		</div>
	{:else if showBasicSettings}
		<div class="flex-1 flex items-center justify-center min-h-0">
			<p class="text-sm text-muted-foreground">{generatingPreview()}</p>
		</div>
	{:else}
		<div class="flex-1 flex items-center justify-center min-h-0">
			<p class="text-sm text-muted-foreground">{recurrenceDisabledPreview()}</p>
		</div>
	{/if}
</section>
