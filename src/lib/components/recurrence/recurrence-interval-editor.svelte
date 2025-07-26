<script lang="ts">
	import type { RecurrenceUnit, DayOfWeek, RecurrenceDetails } from '$lib/types/task';
	import * as m from '$paraglide/messages.js';
	import { reactiveMessage } from '$lib/stores/locale.svelte';

	type Props = {
		unit: RecurrenceUnit;
		interval: number;
		daysOfWeek: DayOfWeek[];
		details: RecurrenceDetails;
		showAdvancedSettings: boolean;
		onchange?: (event: Event) => void;
		ontoggleDayOfWeek?: (day: DayOfWeek) => void;
	};

	let {
		unit = $bindable(),
		interval = $bindable(),
		daysOfWeek = $bindable(),
		details = $bindable(),
		showAdvancedSettings,
		onchange,
		ontoggleDayOfWeek
	}: Props = $props();

	let inputValue = $state(String(interval));

	$effect(() => {
		const parentValueStr = String(interval);
		if (parentValueStr !== inputValue) {
			inputValue = parentValueStr;
		}
	});

	function handleKeyDown(event: KeyboardEvent) {
		if (['Backspace', 'Delete', 'Tab', 'Escape', 'Enter', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) return;
		if ((event.ctrlKey || event.metaKey) && ['a', 'c', 'v', 'x'].includes(event.key.toLowerCase())) return;
		if (!/^[0-9]$/.test(event.key)) event.preventDefault();
	}

	function handleInput(event: Event) {
		const target = event.target as HTMLInputElement;
		setTimeout(() => {
			const sanitizedInput = target.value.replace(/[^0-9]/g, '');
			if (target.value !== sanitizedInput) target.value = sanitizedInput;
			
			inputValue = sanitizedInput;

			if (sanitizedInput === '' || parseInt(sanitizedInput, 10) < 1) {
				interval = 1;
			} else {
				interval = parseInt(sanitizedInput, 10);
			}
			if (onchange) onchange(event);
		}, 0);
	}

	const recurrenceInterval = reactiveMessage(m.recurrence_interval);
	const repeatWeekdays = reactiveMessage(m.repeat_weekdays);
	const advancedSettings = reactiveMessage(m.advanced_settings);
	const specificDate = reactiveMessage(m.specific_date);
	const specificDateExample = reactiveMessage(m.specific_date_example);
	const weekOfMonth = reactiveMessage(m.week_of_month);
	const noSelection = reactiveMessage(m.no_selection);
	const weekdayOfWeek = reactiveMessage(m.weekday_of_week);

	const unitOptions = [
		{ value: 'minute', label: reactiveMessage(m.minute) },
		{ value: 'hour', label: reactiveMessage(m.hour) },
		{ value: 'day', label: reactiveMessage(m.day) },
		{ value: 'week', label: reactiveMessage(m.week) },
		{ value: 'month', label: reactiveMessage(m.month) },
		{ value: 'quarter', label: reactiveMessage(m.quarter) },
		{ value: 'half_year', label: reactiveMessage(m.half_year) },
		{ value: 'year', label: reactiveMessage(m.year) }
	];

	const dayOfWeekOptions = [
		{ value: 'sunday', label: reactiveMessage(m.sunday) },
		{ value: 'monday', label: reactiveMessage(m.monday) },
		{ value: 'tuesday', label: reactiveMessage(m.tuesday) },
		{ value: 'wednesday', label: reactiveMessage(m.wednesday) },
		{ value: 'thursday', label: reactiveMessage(m.thursday) },
		{ value: 'friday', label: reactiveMessage(m.friday) },
		{ value: 'saturday', label: reactiveMessage(m.saturday) }
	];

	const weekOfMonthOptions = [
		{ value: 'first', label: reactiveMessage(m.first_week) },
		{ value: 'second', label: reactiveMessage(m.second_week) },
		{ value: 'third', label: reactiveMessage(m.third_week) },
		{ value: 'fourth', label: reactiveMessage(m.fourth_week) },
		{ value: 'last', label: reactiveMessage(m.last_week) }
	];

	const isComplexUnit = $derived(['year', 'half_year', 'quarter', 'month', 'week'].includes(unit));
</script>

<div class="space-y-3">
	<div class="flex items-center gap-4">
		<h3 class="text-lg font-semibold w-32 flex-shrink-0">{recurrenceInterval()}</h3>
		<div class="flex-1 flex items-center gap-4">
			<input
				type="number"
				value={inputValue}
				onkeydown={handleKeyDown}
				oninput={handleInput}
				min="1"
				step="1"
				class="flex-1 p-2 border border-border rounded bg-background text-foreground"
				placeholder="1"
			/>
			<select
				bind:value={unit}
				class="w-32 p-2 border border-border rounded bg-background text-foreground"
				onchange={onchange}
			>
				{#each unitOptions as option}
					<option value={option.value}>{option.label()}</option>
				{/each}
			</select>
		</div>
	</div>

	<!-- 週単位の曜日選択 -->
	{#if unit === 'week'}
		<div class="pl-36">
			<div role="group" aria-labelledby="weekdays-label">
				<span id="weekdays-label" class="block mb-2 text-sm text-muted-foreground">
					{repeatWeekdays()}
				</span>
				<div class="grid grid-cols-7 gap-2">
					{#each dayOfWeekOptions as dayOption}
						<button
							type="button"
							class="p-2 text-sm border border-border rounded {daysOfWeek.includes(
								dayOption.value as DayOfWeek
							)
								? 'bg-primary text-primary-foreground'
								: 'bg-background text-foreground hover:bg-accent hover:text-accent-foreground'}"
							onclick={() => ontoggleDayOfWeek?.(dayOption.value as DayOfWeek)}
						>
							{dayOption.label().slice(0, 1)}
						</button>
					{/each}
				</div>
			</div>
		</div>
	{/if}

	<!-- 複雑な単位の詳細設定 -->
	{#if showAdvancedSettings && isComplexUnit}
		<div class="pl-36 space-y-3">
			<h4 class="font-medium">{advancedSettings()}</h4>

			<div class="grid grid-cols-2 gap-4">
				<!-- 特定日付 -->
				<div>
					<label for="specific-date-input" class="text-sm text-muted-foreground">
						{specificDate()}
					</label>
					<input
						id="specific-date-input"
						type="number"
						bind:value={details.specific_date}
						min="1"
						max="31"
						class="w-full p-2 border border-border rounded bg-background text-foreground"
						placeholder={specificDateExample()}
						oninput={onchange}
					/>
				</div>

				<!-- 第◯週の指定 -->
				<div>
					<label for="week-of-period-select" class="text-sm text-muted-foreground">
						{weekOfMonth()}
					</label>
					<select
						id="week-of-period-select"
						bind:value={details.week_of_period}
						class="w-full p-2 border border-border rounded bg-background text-foreground"
						onchange={onchange}
					>
						<option value="">{noSelection()}</option>
						{#each weekOfMonthOptions as option}
							<option value={option.value}>{option.label()}</option>
						{/each}
					</select>
				</div>
			</div>

			{#if details.week_of_period}
				<div>
					<label for="weekday-of-week-select" class="text-sm text-muted-foreground">
						{weekdayOfWeek()}
					</label>
					<select
						id="weekday-of-week-select"
						bind:value={details.weekday_of_week}
						class="w-full p-2 border border-border rounded bg-background text-foreground"
						onchange={onchange}
					>
						{#each dayOfWeekOptions as option}
							<option value={option.value}>{option.label()}</option>
						{/each}
					</select>
				</div>
			{/if}
		</div>
	{/if}
</div>
