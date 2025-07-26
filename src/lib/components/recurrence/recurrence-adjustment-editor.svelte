<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import { Plus, X } from 'lucide-svelte';
	import WeekdayConditionEditor from '../datetime/weekday-condition-editor.svelte';
	import type { DateCondition, WeekdayCondition, DateRelation } from '$lib/types/task';
	import * as m from '$paraglide/messages.js';
	import { reactiveMessage } from '$lib/stores/locale.svelte';

	type Props = {
		dateConditions: DateCondition[];
		weekdayConditions: WeekdayCondition[];
		onDateConditionAdd: () => void;
		onDateConditionRemove: (id: string) => void;
		onDateConditionUpdate: (id:string, updates: Partial<DateCondition>) => void;
		onWeekdayConditionAdd: () => void;
		onWeekdayConditionRemove: (id: string) => void;
		onWeekdayConditionUpdate: (id:string, updates: Partial<WeekdayCondition>) => void;
	};

	let {
		dateConditions = $bindable(),
		weekdayConditions = $bindable(),
		onDateConditionAdd,
		onDateConditionRemove,
		onDateConditionUpdate,
		onWeekdayConditionAdd,
		onWeekdayConditionRemove,
		onWeekdayConditionUpdate
	}: Props = $props();

	const adjustmentConditions = reactiveMessage(m.adjustment_conditions);
	const dateConditionsLabel = reactiveMessage(m.date_conditions);
	const weekdayConditionsLabel = reactiveMessage(m.weekday_conditions);
	const add = reactiveMessage(m.add);

	const dateRelationOptions = [
		{ value: 'before', label: reactiveMessage(m.before) },
		{ value: 'on_or_before', label: reactiveMessage(m.on_or_before) },
		{ value: 'on_or_after', label: reactiveMessage(m.on_or_after) },
		{ value: 'after', label: reactiveMessage(m.after) }
	];
</script>

<section class="space-y-3">
	<h3 class="text-lg font-semibold">{adjustmentConditions()}</h3>

	<!-- 日付条件 -->
	<div class="space-y-2">
		<div class="flex items-center justify-between">
			<h4 class="font-medium">{dateConditionsLabel()}</h4>
			<Button size="sm" onclick={onDateConditionAdd}>
				<Plus class="h-4 w-4 mr-1" />
				{add()}
			</Button>
		</div>

		{#each dateConditions as condition}
			<div class="flex items-center gap-2 p-3 border border-border rounded bg-card">
				<select
					value={condition.relation}
					onchange={(e) => {
						const target = e.target as HTMLSelectElement;
						onDateConditionUpdate(condition.id, { relation: target.value as DateRelation });
					}}
					class="p-1 border border-border rounded bg-background text-foreground"
				>
					{#each dateRelationOptions as option}
						<option value={option.value}>{option.label()}</option>
					{/each}
				</select>

				<input
					type="date"
					value={condition.reference_date.toISOString().split('T')[0]}
					onchange={(e) => {
						const target = e.target as HTMLInputElement;
						onDateConditionUpdate(condition.id, { reference_date: new Date(target.value) });
					}}
					class="p-1 border border-border rounded bg-background text-foreground"
				/>

				<button
					type="button"
					onclick={() => onDateConditionRemove(condition.id)}
					class="p-1 text-destructive hover:bg-destructive/10 rounded"
				>
					<X class="h-4 w-4" />
				</button>
			</div>
		{/each}
	</div>

	<!-- 曜日条件 -->
	<div class="space-y-2">
		<div class="flex items-center justify-between">
			<h4 class="font-medium">{weekdayConditionsLabel()}</h4>
			<Button size="sm" onclick={onWeekdayConditionAdd}>
				<Plus class="h-4 w-4 mr-1" />
				{add()}
			</Button>
		</div>

		{#each weekdayConditions as condition}
			<WeekdayConditionEditor
				{condition}
				onUpdate={(updates) => onWeekdayConditionUpdate(condition.id, updates)}
				onRemove={() => onWeekdayConditionRemove(condition.id)}
			/>
		{/each}
	</div>
</section>
