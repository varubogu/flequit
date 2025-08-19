<script lang="ts">
  import { getTranslationService } from '$lib/stores/locale.svelte';
  import { Button } from '$lib/components/ui/button/index.js';
  import { Plus, X } from 'lucide-svelte';
  import WeekdayConditionEditor from '../datetime/conditions/weekday-condition-editor.svelte';
  import type { DateRelation } from '$lib/types/datetime-calendar';
  import type { WeekdayCondition } from '$lib/types/datetime-calendar';
  import type { DateCondition } from '$lib/types/datetime-calendar';

  type Props = {
    dateConditions: DateCondition[];
    weekdayConditions: WeekdayCondition[];
    onDateConditionAdd: () => void;
    onDateConditionRemove: (id: string) => void;
    onDateConditionUpdate: (id: string, updates: Partial<DateCondition>) => void;
    onWeekdayConditionAdd: () => void;
    onWeekdayConditionRemove: (id: string) => void;
    onWeekdayConditionUpdate: (id: string, updates: Partial<WeekdayCondition>) => void;
  };

  let {
    dateConditions,
    weekdayConditions,
    onDateConditionAdd,
    onDateConditionRemove,
    onDateConditionUpdate,
    onWeekdayConditionAdd,
    onWeekdayConditionRemove,
    onWeekdayConditionUpdate
  }: Props = $props();

  const translationService = getTranslationService();
  const adjustmentConditions = translationService.getMessage('adjustment_conditions');
  const dateConditionsLabel = translationService.getMessage('date_conditions');
  const weekdayConditionsLabel = translationService.getMessage('weekday_conditions');
  const add = translationService.getMessage('add');

  const dateRelationOptions = [
    { value: 'before', label: translationService.getMessage('before') },
    { value: 'on_or_before', label: translationService.getMessage('on_or_before') },
    { value: 'on_or_after', label: translationService.getMessage('on_or_after') },
    { value: 'after', label: translationService.getMessage('after') }
  ];
</script>

<section class="space-y-3">
  <h3 class="text-lg font-semibold">{adjustmentConditions()}</h3>

  <!-- 日付条件 -->
  <div class="space-y-2">
    <div class="flex items-center justify-between">
      <h4 class="font-medium">{dateConditionsLabel()}</h4>
      <Button size="sm" onclick={onDateConditionAdd}>
        <Plus class="mr-1 h-4 w-4" />
        {add()}
      </Button>
    </div>

    {#each dateConditions as condition (condition.id)}
      <div class="border-border bg-card flex items-center gap-2 rounded border p-3">
        <select
          value={condition.relation}
          onchange={(e) => {
            const target = e.target as HTMLSelectElement;
            onDateConditionUpdate(condition.id, { relation: target.value as DateRelation });
          }}
          class="border-border bg-background text-foreground rounded border p-1"
        >
          {#each dateRelationOptions as option (option.value)}
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
          class="border-border bg-background text-foreground rounded border p-1"
        />

        <button
          type="button"
          onclick={() => onDateConditionRemove(condition.id)}
          class="text-destructive hover:bg-destructive/10 rounded p-1"
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
        <Plus class="mr-1 h-4 w-4" />
        {add()}
      </Button>
    </div>

    {#each weekdayConditions as condition (condition.id)}
      <WeekdayConditionEditor
        {condition}
        onUpdate={(updates) => onWeekdayConditionUpdate(condition.id, updates)}
        onRemove={() => onWeekdayConditionRemove(condition.id)}
      />
    {/each}
  </div>
</section>
