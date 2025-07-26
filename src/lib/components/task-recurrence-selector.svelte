<script lang="ts">
  import { Button } from "$lib/components/ui/button/index.js";
  import { Repeat, RotateCcw } from "lucide-svelte";
  import type { RecurrenceRule } from '$lib/types/task';
  import * as m from '$paraglide/messages.js';
  import { reactiveMessage } from '$lib/stores/locale.svelte';

  interface Props {
    recurrenceRule?: RecurrenceRule | null;
    onEdit?: () => void;
    disabled?: boolean;
  }

  let { recurrenceRule, onEdit, disabled = false }: Props = $props();

  // リアクティブメッセージ
  const recurrenceSettings = reactiveMessage(m.recurrence_settings);
  const noRecurrence = reactiveMessage(m.no_recurrence);

  // 繰り返し設定の表示テキストを生成
  function getRecurrenceText(rule: RecurrenceRule | null | undefined): string {
    if (!rule) return noRecurrence();
    
    const unit = getUnitText(rule.unit);
    const interval = rule.interval ?? '?';
    
    let text = `${interval}${unit}ごと`;
    
    // 週単位の場合の曜日指定
    if (rule.unit === 'week' && rule.days_of_week?.length) {
      const dayNames = rule.days_of_week.map(day => getDayOfWeekText(day)).join('、');
      text += ` (${dayNames})`;
    }
    
    // 月単位の場合の詳細
    if (rule.unit === 'month') {
      if (rule.details?.specific_date) {
        text += ` (${rule.details.specific_date}日)`;
      } else if (rule.details?.week_of_period && rule.details?.weekday_of_week) {
        text += ` (${getWeekOfMonthText(rule.details.week_of_period)}${getDayOfWeekText(rule.details.weekday_of_week)})`;
      }
    }
    
    // 終了条件
    if (rule.end_date) {
      const endDate = new Date(rule.end_date).toLocaleDateString('ja-JP');
      text += ` 〜 ${endDate}まで`;
    } else if (rule.max_occurrences) {
      text += ` (最大${rule.max_occurrences}回)`;
    }
    
    return text;
  }
  
  function getUnitText(unit: string): string {
    switch (unit) {
      case 'minute': return '分';
      case 'hour': return '時間';
      case 'day': return '日';
      case 'week': return '週';
      case 'month': return 'ヶ月';
      case 'quarter': return '四半期';
      case 'half_year': return '半期';
      case 'year': return '年';
      default: return unit;
    }
  }
  
  function getDayOfWeekText(day: string): string {
    switch (day) {
      case 'sunday': return '日';
      case 'monday': return '月';
      case 'tuesday': return '火';
      case 'wednesday': return '水';
      case 'thursday': return '木';
      case 'friday': return '金';
      case 'saturday': return '土';
      default: return day;
    }
  }
  
  function getWeekOfMonthText(week: string): string {
    switch (week) {
      case 'first': return '第1';
      case 'second': return '第2';
      case 'third': return '第3';
      case 'fourth': return '第4';
      case 'last': return '最後';
      default: return week;
    }
  }
</script>

<div class="flex items-center gap-2">
  <Button
    variant="outline"
    size="sm" 
    onclick={onEdit}
    {disabled}
    class="flex items-center gap-1 text-left justify-start min-w-0 px-2 py-1 text-xs h-7"
  >
    {#if recurrenceRule}
      <RotateCcw class="h-3 w-3 flex-shrink-0" />
    {:else}
      <Repeat class="h-3 w-3 flex-shrink-0" />
    {/if}
    <span class="truncate">
      {getRecurrenceText(recurrenceRule)}
    </span>
  </Button>
</div>