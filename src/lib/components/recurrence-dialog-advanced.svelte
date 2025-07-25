<script lang="ts">
  import * as Dialog from "$lib/components/ui/dialog/index.js";
  import { Button } from "$lib/components/ui/button/index.js";
  import { Repeat, Plus, X, Calendar } from "lucide-svelte";
  import WeekdayConditionEditor from './weekday-condition-editor.svelte';
  import type { 
    RecurrenceRule, 
    RecurrenceUnit, 
    RecurrenceLevel,
    DayOfWeek, 
    WeekOfMonth,
    DateCondition,
    WeekdayCondition,
    DateRelation,
    AdjustmentDirection,
    AdjustmentTarget,
    RecurrenceDetails
  } from '$lib/types/task';
  import { RecurrenceService } from '$lib/services/recurrence-service';
  import * as m from '$paraglide/messages.js';
  import { reactiveMessage } from '$lib/stores/locale.svelte';

  interface Props {
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    recurrenceRule?: RecurrenceRule | null;
    onSave?: (rule: RecurrenceRule | null) => void;
  }

  let { open = $bindable(false), onOpenChange, recurrenceRule, onSave }: Props = $props();

  // 基本設定
  let recurrenceLevel = $state<RecurrenceLevel>(
    !recurrenceRule ? 'disabled' : 
    (recurrenceRule.adjustment && (recurrenceRule.adjustment.date_conditions.length > 0 || recurrenceRule.adjustment.weekday_conditions.length > 0)) || 
    (recurrenceRule.details && Object.keys(recurrenceRule.details).length > 0) ? 'advanced' : 'enabled'
  );
  let unit = $state<RecurrenceUnit>(recurrenceRule?.unit || 'day');
  let interval = $state(recurrenceRule?.interval || 1);
  let daysOfWeek = $state<DayOfWeek[]>(recurrenceRule?.days_of_week || []);
  
  // 詳細設定
  let details = $state<RecurrenceDetails>(recurrenceRule?.details || {});
  
  // 補正条件
  let dateConditions = $state<DateCondition[]>(recurrenceRule?.adjustment?.date_conditions || []);
  let weekdayConditions = $state<WeekdayCondition[]>(recurrenceRule?.adjustment?.weekday_conditions || []);
  
  // 終了条件
  let endDate = $state<Date | undefined>(recurrenceRule?.end_date);
  let maxOccurrences = $state<number | undefined>(recurrenceRule?.max_occurrences);
  
  // 繰り返し回数の制御（プレビュー表示用）
  let repeatCount = $state<number | undefined>(recurrenceRule?.max_occurrences);

  // プレビュー
  let previewDates = $state<Date[]>([]);

  // リアクティブメッセージ
  const recurrenceSettings = reactiveMessage(m.recurrence_settings);
  const recurrence = reactiveMessage(m.recurrence);
  const recurrenceDisabled = reactiveMessage(m.recurrence_disabled);
  const recurrenceEnabled = reactiveMessage(m.recurrence_enabled);
  const recurrenceAdvanced = reactiveMessage(m.recurrence_advanced);
  const repeatCountLabel = reactiveMessage(m.repeat_count);
  const repeatEvery = reactiveMessage(m.repeat_every);
  const save = reactiveMessage(m.save);
  const cancel = reactiveMessage(m.cancel);
  const remove = reactiveMessage(m.remove);

  // 選択肢
  const recurrenceLevelOptions = [
    { value: 'disabled', label: recurrenceDisabled },
    { value: 'enabled', label: recurrenceEnabled },
    { value: 'advanced', label: recurrenceAdvanced }
  ];

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

  const dateRelationOptions = [
    { value: 'before', label:'より前' },
    { value: 'on_or_before', label: '以前' },
    { value: 'on_or_after', label: '以降' },
    { value: 'after', label: 'より後' }
  ];

  const adjustmentDirectionOptions = [
    { value: 'previous', label: '前' },
    { value: 'next', label: '後' }
  ];

  const adjustmentTargetOptions = [
    { value: 'weekday', label: '平日' },
    { value: 'weekend', label: '休日' },
    { value: 'holiday', label: '祝日' },
    { value: 'non_holiday', label: '非祝日' },
    { value: 'specific_weekday', label: '特定曜日' }
  ];

  // 複雑な単位かどうかの判定
  const isComplexUnit = $derived(['year', 'half_year', 'quarter', 'month', 'week'].includes(unit));
  
  // 表示項目の制御
  const showBasicSettings = $derived(recurrenceLevel === 'enabled' || recurrenceLevel === 'advanced');
  const showAdvancedSettings = $derived(recurrenceLevel === 'advanced');

  // プレビューを更新
  $effect(() => {
    if (showBasicSettings) {
      updatePreview();
    } else {
      previewDates = [];
    }
  });

  function updatePreview() {
    try {
      const rule = buildRecurrenceRule();
      if (rule) {
        const baseDate = new Date();
        // 繰り返し回数が指定されている場合はその回数、そうでなければデフォルト5回
        const previewLimit = repeatCount && repeatCount > 0 ? Math.min(repeatCount, 5) : 5;
        previewDates = RecurrenceService.generateRecurrenceDates(baseDate, rule, previewLimit);
      } else {
        previewDates = [];
      }
    } catch (error) {
      console.error('プレビュー生成エラー:', error);
      previewDates = [];
    }
  }

  function toggleDayOfWeek(day: DayOfWeek) {
    if (daysOfWeek.includes(day)) {
      daysOfWeek = daysOfWeek.filter(d => d !== day);
    } else {
      daysOfWeek = [...daysOfWeek, day];
    }
  }

  function addDateCondition() {
    const newCondition: DateCondition = {
      id: crypto.randomUUID(),
      relation: 'before',
      reference_date: new Date()
    };
    dateConditions = [...dateConditions, newCondition];
  }

  function removeDateCondition(id: string) {
    dateConditions = dateConditions.filter(c => c.id !== id);
  }

  function updateDateCondition(id: string, updates: Partial<DateCondition>) {
    dateConditions = dateConditions.map(c => 
      c.id === id ? { ...c, ...updates } : c
    );
  }

  function addWeekdayCondition() {
    const newCondition: WeekdayCondition = {
      id: crypto.randomUUID(),
      if_weekday: 'monday',
      then_direction: 'next',
      then_target: 'weekday'
    };
    weekdayConditions = [...weekdayConditions, newCondition];
  }

  function removeWeekdayCondition(id: string) {
    weekdayConditions = weekdayConditions.filter(c => c.id !== id);
  }

  function updateWeekdayCondition(id: string, updates: Partial<WeekdayCondition>) {
    weekdayConditions = weekdayConditions.map(c => 
      c.id === id ? { ...c, ...updates } : c
    );
  }

  function buildRecurrenceRule(): RecurrenceRule | null {
    if (recurrenceLevel === 'disabled') return null;

    const rule: RecurrenceRule = {
      unit,
      interval,
      ...(unit === 'week' && daysOfWeek.length > 0 && { days_of_week: daysOfWeek }),
      ...(showAdvancedSettings && isComplexUnit && Object.keys(details).length > 0 && { details }),
      ...(showAdvancedSettings && (dateConditions.length > 0 || weekdayConditions.length > 0) && {
        adjustment: {
          date_conditions: dateConditions,
          weekday_conditions: weekdayConditions
        }
      }),
      ...(endDate && { end_date: endDate }),
      ...(repeatCount && repeatCount > 0 && { max_occurrences: repeatCount })
    };

    return rule;
  }

  function handleSave() {
    const rule = buildRecurrenceRule();
    onSave?.(rule);
    onOpenChange?.(false);
  }

  function handleRemove() {
    onSave?.(null);
    onOpenChange?.(false);
  }

  function formatDate(date: Date): string {
    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      weekday: 'short'
    });
  }
</script>

<Dialog.Root bind:open onOpenChange={onOpenChange}>
  <Dialog.Content class="max-w-4xl max-h-[90vh] overflow-y-auto">
    <Dialog.Header>
      <Dialog.Title class="flex items-center gap-2">
        <Repeat class="h-5 w-5" />
        {recurrenceSettings()}
      </Dialog.Title>
    </Dialog.Header>

    <div class="grid grid-cols-3 gap-6">
      <!-- 左側：設定パネル -->
      <div class="col-span-2 space-y-6">
        
        <!-- 1. 繰り返し設定レベル -->
        <section class="space-y-3">
          <h3 class="text-lg font-semibold">{recurrence()}</h3>
          <div>
            <select 
              bind:value={recurrenceLevel} 
              class="w-full p-2 border border-border rounded bg-background text-foreground"
              onchange={updatePreview}
            >
              {#each recurrenceLevelOptions as option}
                <option value={option.value}>{option.label()}</option>
              {/each}
            </select>
          </div>
        </section>

        {#if showBasicSettings}
          <!-- 2. 繰り返し回数 -->
          <section class="space-y-3">
            <h3 class="text-lg font-semibold">{repeatCountLabel()}</h3>
            <div>
              <input 
                type="number" 
                bind:value={repeatCount} 
                min="1" 
                class="w-full p-2 border border-border rounded bg-background text-foreground"
                placeholder="無制限の場合は空白"
                oninput={updatePreview}
              />
              <p class="text-sm text-muted-foreground mt-1">無制限の場合は空白にしてください</p>
            </div>
          </section>

          <!-- 3. 繰り返し間隔 -->
          <section class="space-y-3">
            <h3 class="text-lg font-semibold">繰り返し間隔</h3>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label>{repeatEvery()}</label>
                <input 
                  type="number" 
                  bind:value={interval} 
                  min="1" 
                  class="w-full p-2 border border-border rounded bg-background text-foreground"
                  oninput={updatePreview}
                />
              </div>
              <div>
                <label>単位</label>
                <select 
                  bind:value={unit} 
                  class="w-full p-2 border border-border rounded bg-background text-foreground"
                  onchange={updatePreview}
                >
                  {#each unitOptions as option}
                    <option value={option.value}>{option.label}</option>
                  {/each}
                </select>
              </div>
            </div>

            <!-- 週単位の曜日選択 -->
            {#if unit === 'week'}
              <div>
                <label class="block mb-2">繰り返し曜日</label>
                <div class="grid grid-cols-7 gap-2">
                  {#each dayOfWeekOptions as dayOption}
                    <button
                      type="button"
                      class="p-2 text-sm border border-border rounded {daysOfWeek.includes(dayOption.value as DayOfWeek) ? 'bg-primary text-primary-foreground' : 'bg-background text-foreground hover:bg-accent hover:text-accent-foreground'}"
                      onclick={() => { toggleDayOfWeek(dayOption.value as DayOfWeek); updatePreview(); }}
                    >
                      {dayOption.label.slice(0, 1)}
                    </button>
                  {/each}
                </div>
              </div>
            {/if}

            <!-- 複雑な単位の詳細設定 -->
            {#if showAdvancedSettings && isComplexUnit}
              <div class="space-y-3">
                <h4 class="font-medium">詳細設定</h4>
                
                <div class="grid grid-cols-2 gap-4">
                  <!-- 特定日付 -->
                  <div>
                    <label>特定日付</label>
                    <input 
                      type="number" 
                      bind:value={details.specific_date}
                      min="1" 
                      max="31"
                      class="w-full p-2 border border-border rounded bg-background text-foreground"
                      placeholder="例：15日"
                      oninput={updatePreview}
                    />
                  </div>

                  <!-- 第◯週の指定 -->
                  <div>
                    <label>第◯週</label>
                    <select 
                      bind:value={details.week_of_period}
                      class="w-full p-2 border border-border rounded bg-background text-foreground"
                      onchange={updatePreview}
                    >
                      <option value="">選択なし</option>
                      {#each weekOfMonthOptions as option}
                        <option value={option.value}>{option.label}</option>
                      {/each}
                    </select>
                  </div>
                </div>

                {#if details.week_of_period}
                  <div>
                    <label>曜日</label>
                    <select 
                      bind:value={details.weekday_of_week}
                      class="w-full p-2 border border-border rounded bg-background text-foreground"
                      onchange={updatePreview}
                    >
                      {#each dayOfWeekOptions as option}
                        <option value={option.value}>{option.label}</option>
                      {/each}
                    </select>
                  </div>
                {/if}
              </div>
            {/if}
          </section>

          <!-- 3. 補正条件 -->
          {#if showAdvancedSettings}
          <section class="space-y-3">
            <h3 class="text-lg font-semibold">補正条件</h3>
            
            <!-- 日付条件 -->
            <div class="space-y-2">
              <div class="flex items-center justify-between">
                <h4 class="font-medium">日付条件</h4>
                <Button size="sm" onclick={addDateCondition}>
                  <Plus class="h-4 w-4 mr-1" />
                  追加
                </Button>
              </div>
              
              {#each dateConditions as condition}
                <div class="flex items-center gap-2 p-3 border border-border rounded bg-card">
                  <select 
                    value={condition.relation}
                    onchange={(e) => {
                      const target = e.target as HTMLSelectElement;
                      updateDateCondition(condition.id, { relation: target.value as DateRelation });
                      updatePreview();
                    }}
                    class="p-1 border border-border rounded bg-background text-foreground"
                  >
                    {#each dateRelationOptions as option}
                      <option value={option.value}>{option.label}</option>
                    {/each}
                  </select>
                  
                  <input 
                    type="date"
                    value={condition.reference_date.toISOString().split('T')[0]}
                    onchange={(e) => {
                      const target = e.target as HTMLInputElement;
                      updateDateCondition(condition.id, { reference_date: new Date(target.value) });
                      updatePreview();
                    }}
                    class="p-1 border border-border rounded bg-background text-foreground"
                  />
                  
                  <button 
                    type="button"
                    onclick={() => { removeDateCondition(condition.id); updatePreview(); }}
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
                <h4 class="font-medium">曜日条件</h4>
                <Button size="sm" onclick={addWeekdayCondition}>
                  <Plus class="h-4 w-4 mr-1" />
                  追加
                </Button>
              </div>
              
              {#each weekdayConditions as condition}
                <WeekdayConditionEditor
                  {condition}
                  onUpdate={(updates) => { updateWeekdayCondition(condition.id, updates); updatePreview(); }}
                  onRemove={() => { removeWeekdayCondition(condition.id); updatePreview(); }}
                />
              {/each}
            </div>
          </section>
          {/if}
        {/if}
      </div>

      <!-- 右側：プレビューパネル -->
      <div class="space-y-4">
        <section>
          <h3 class="text-lg font-semibold mb-3">プレビュー</h3>
          {#if showBasicSettings && previewDates.length > 0}
            <div class="space-y-2">
              <p class="text-sm text-muted-foreground">
                次回以降の実行日（{previewDates.length}回分{repeatCount && repeatCount <= 5 ? '' : '、最大5回まで表示'}）
              </p>
              <div class="space-y-1">
                {#each previewDates as date, index}
                  <div class="flex items-center gap-2 p-2 bg-muted rounded text-sm">
                    <Calendar class="h-4 w-4 text-muted-foreground" />
                    <span class="font-mono">{index + 1}.</span>
                    <span>{formatDate(date)}</span>
                  </div>
                {/each}
              </div>
            </div>
          {:else if showBasicSettings}
            <p class="text-sm text-muted-foreground">プレビューを生成中...</p>
          {:else}
            <p class="text-sm text-muted-foreground">繰り返しが無効です</p>
          {/if}
        </section>
      </div>
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