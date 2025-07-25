<script lang="ts">
  import * as Dialog from "$lib/components/ui/dialog/index.js";
  import { Button } from "$lib/components/ui/button/index.js";
  import { Repeat } from "lucide-svelte";
  import type { RecurrenceRule, RecurrenceUnit, DayOfWeek, WeekOfMonth, AdjustmentType } from '$lib/types/task';
  import * as m from '$paraglide/messages.js';
  import { reactiveMessage } from '$lib/stores/locale.svelte';

  interface Props {
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    recurrenceRule?: RecurrenceRule | null;
    onSave?: (rule: RecurrenceRule | null) => void;
  }

  let { open = $bindable(false), onOpenChange, recurrenceRule, onSave }: Props = $props();

  // 初期値設定
  let enabled = $state(!!recurrenceRule);
  let unit = $state<RecurrenceUnit>(recurrenceRule?.unit || 'day');
  let interval = $state(recurrenceRule?.interval || 1);
  let daysOfWeek = $state<DayOfWeek[]>(recurrenceRule?.days_of_week || []);
  let dayOfMonth = $state(recurrenceRule?.day_of_month || 1);
  let weekOfMonth = $state<WeekOfMonth>(recurrenceRule?.week_of_month || 'first');
  let months = $state<number[]>(recurrenceRule?.months || []);
  let endDate = $state<Date | undefined>(recurrenceRule?.end_date);
  let maxOccurrences = $state<number | undefined>(recurrenceRule?.max_occurrences);
  let adjustmentEnabled = $state(recurrenceRule?.adjustment?.enabled || false);
  let adjustmentIfWeekday = $state<DayOfWeek | undefined>(recurrenceRule?.adjustment?.if_weekday);
  let adjustmentIfHoliday = $state(recurrenceRule?.adjustment?.if_holiday || false);
  let adjustmentThenAdjust = $state<AdjustmentType>(recurrenceRule?.adjustment?.then_adjust || 'next');
  let adjustmentToWeekday = $state<DayOfWeek>(recurrenceRule?.adjustment?.to_weekday || 'monday');

  // リアクティブメッセージ
  const recurrenceSettings = reactiveMessage(m.recurrence_settings);
  const enableRecurrence = reactiveMessage(m.enable_recurrence);
  const repeatEvery = reactiveMessage(m.repeat_every);
  const repeatOn = reactiveMessage(m.repeat_on);
  const endRecurrence = reactiveMessage(m.end_recurrence);
  const dateAdjustment = reactiveMessage(m.date_adjustment);
  const save = reactiveMessage(m.save);
  const cancel = reactiveMessage(m.cancel);
  const remove = reactiveMessage(m.remove);

  // 選択肢
  const unitOptions = [
    { value: 'minute', label: '分' },
    { value: 'hour', label: '時間' },
    { value: 'day', label: '日' },
    { value: 'week', label: '週' },
    { value: 'month', label: '月' },
    { value: 'quarter', label: '四半期' },
    { value: 'half_year', label: '半期' },
    { value: 'year', label: '年' }
  ];

  const dayOfWeekOptions = [
    { value: 'sunday', label: '日曜日' },
    { value: 'monday', label: '月曜日' },
    { value: 'tuesday', label: '火曜日' },
    { value: 'wednesday', label: '水曜日' },
    { value: 'thursday', label: '木曜日' },
    { value: 'friday', label: '金曜日' },
    { value: 'saturday', label: '土曜日' }
  ];

  const weekOfMonthOptions = [
    { value: 'first', label: '第1' },
    { value: 'second', label: '第2' },
    { value: 'third', label: '第3' },
    { value: 'fourth', label: '第4' },
    { value: 'last', label: '最後' }
  ];

  const adjustmentTypeOptions = [
    { value: 'previous', label: '前の' },
    { value: 'next', label: '次の' }
  ];


  function handleSave() {
    if (!enabled) {
      onSave?.(null);
    } else {
      const rule: RecurrenceRule = {
        unit,
        interval,
        ...(unit === 'week' && daysOfWeek.length > 0 && { days_of_week: daysOfWeek }),
        ...(unit === 'month' && { day_of_month: dayOfMonth }),
        ...(unit === 'month' && weekOfMonth && { week_of_month: weekOfMonth }),
        ...(unit === 'year' && months.length > 0 && { months }),
        ...(endDate && { end_date: endDate }),
        ...(maxOccurrences && { max_occurrences: maxOccurrences }),
        ...(adjustmentEnabled && {
          adjustment: {
            enabled: adjustmentEnabled,
            ...(adjustmentIfWeekday && { if_weekday: adjustmentIfWeekday }),
            if_holiday: adjustmentIfHoliday,
            then_adjust: adjustmentThenAdjust,
            to_weekday: adjustmentToWeekday
          }
        })
      };
      onSave?.(rule);
    }
    onOpenChange?.(false);
  }

  function handleRemove() {
    onSave?.(null);
    onOpenChange?.(false);
  }
</script>

<Dialog.Root bind:open onOpenChange={onOpenChange}>
  <Dialog.Content class="max-w-lg">
    <Dialog.Header>
      <Dialog.Title class="flex items-center gap-2">
        <Repeat class="h-5 w-5" />
        {recurrenceSettings()}
      </Dialog.Title>
    </Dialog.Header>

    <div class="space-y-4">
      <!-- 繰り返し有効/無効 -->
      <div class="flex items-center space-x-2">
        <input type="checkbox" bind:checked={enabled} id="enable-recurrence" />
        <label for="enable-recurrence">{enableRecurrence()}</label>
      </div>

      {#if enabled}
        <!-- 基本設定 -->
        <div class="space-y-4">
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label>{repeatEvery()}</label>
              <input type="number" bind:value={interval} min="1" class="w-full p-2 border border-border rounded bg-background text-foreground" />
            </div>
            <div>
              <select bind:value={unit} class="w-full p-2 border border-border rounded bg-background text-foreground">
                {#each unitOptions as option}
                  <option value={option.value}>{option.label}</option>
                {/each}
              </select>
            </div>
          </div>
        </div>
      {/if}
    </div>

    <Dialog.Footer class="flex justify-between">
      <div>
        {#if recurrenceRule}
          <Button variant="destructive" onclick={handleRemove}>
            {remove()}
          </Button>
        {/if}
      </div>
      <div class="flex gap-2">
        <Button variant="outline" onclick={() => onOpenChange?.(false)}>
          {cancel()}
        </Button>
        <Button onclick={handleSave}>
          {save()}
        </Button>
      </div>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>