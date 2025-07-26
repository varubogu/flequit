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

	const repeatEvery = reactiveMessage(m.repeat_every);
	const recurrenceInterval = reactiveMessage(m.recurrence_interval);
	const unitLabel = reactiveMessage(m.unit);
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

<section class="space-y-3">
	<h3 class="text-lg font-semibold">{recurrenceInterval()}</h3>
	<div class="grid grid-cols-2 gap-4">
		<div>
			<label for="interval-input">{repeatEvery()}</label>
			<input
				id="interval-input"
				type="number"
				bind:value={interval}
				min="1"
				class="w-full p-2 border border-border rounded bg-background text-foreground"
				oninput={onchange}
			/>
		</div>
		<div>
			<label for="unit-select">{unitLabel()}</label>
			<select
				id="unit-select"
				bind:value={unit}
				class="w-full p-2 border border-border rounded bg-background text-foreground"
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
			<div role="group" aria-labelledby="weekdays-label">
		<span id="weekdays-label" class="block mb-2">{repeatWeekdays()}</span>
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
	{/if}

	<!-- 複雑な単位の詳細設定 -->
	{#if showAdvancedSettings && isComplexUnit}
		<div class="space-y-3">
			<h4 class="font-medium">{advancedSettings()}</h4>

			<div class="grid grid-cols-2 gap-4">
				<!-- 特定日付 -->
				<div>
					<label for="specific-date-input">{specificDate()}</label>
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
					<label for="week-of-period-select">{weekOfMonth()}</label>
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
					<label for="weekday-of-week-select">{weekdayOfWeek()}</label>
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
</section>
