<script lang="ts">
  import { Button } from "$lib/components/ui/button/index.js";
  import { Repeat, RotateCcw } from "lucide-svelte";
  import type { RecurrenceRule, RecurrenceUnit, DayOfWeek, WeekOfMonth } from '$lib/types/task';
  import * as m from '$paraglide/messages.js';
  import { getLocale } from '$paraglide/runtime';
  import { reactiveMessage } from '$lib/stores/locale.svelte';

  interface Props {
    recurrenceRule?: RecurrenceRule | null;
    onEdit?: () => void;
    disabled?: boolean;
  }

  let { recurrenceRule, onEdit, disabled = false }: Props = $props();

  // リアクティブメッセージ
  const noRecurrence = reactiveMessage(m.no_recurrence);

  function getOrdinalSuffix(n: number): string {
    if (getLocale() !== 'en') return '';
    const s = ['th', 'st', 'nd', 'rd'];
    const v = n % 100;
    return s[(v - 20) % 10] || s[v] || s[0];
  }

  // 繰り返し設定の表示テキストを生成
  function getRecurrenceText(rule: RecurrenceRule | null | undefined): string {
    if (!rule) return noRecurrence();
    
    const interval = rule.interval ?? '?';
    const unitText = getUnitText(rule.unit, interval);
    
    let text = m.every_interval_unit({ interval: String(interval), unit: unitText });
    
    // 週単位の場合の曜日指定
    if (rule.unit === 'week' && rule.days_of_week?.length) {
      const dayNames = rule.days_of_week.map(day => getDayOfWeekText(day, true)).join(', ');
      text += ' ' + m.recurrence_weekly_days({ days: dayNames });
    }
    
    // 月単位の場合の詳細
    if (rule.unit === 'month') {
      if (rule.details?.specific_date) {
        const dayOfMonth = rule.details.specific_date;
        const detail = m.day_of_month({ day: dayOfMonth }) + getOrdinalSuffix(dayOfMonth);
        text += ' ' + m.recurrence_monthly_detail({ detail });
      } else if (rule.details?.week_of_period && rule.details?.weekday_of_week) {
        const detail = `${getWeekOfMonthText(rule.details.week_of_period)} ${getDayOfWeekText(rule.details.weekday_of_week, false)}`;
        text += ' ' + m.recurrence_monthly_detail({ detail });
      }
    }
    
    // 終了条件
    if (rule.end_date) {
      const endDate = new Date(rule.end_date).toLocaleDateString(getLocale());
      text += ' ' + m.recurrence_end_date({ endDate });
    } else if (rule.max_occurrences) {
      text += ' ' + m.recurrence_max_occurrences({ count: rule.max_occurrences });
    }
    
    return text;
  }
  
  function getUnitText(unit: RecurrenceUnit, interval: number | '?'): string {
    const locale = getLocale();
    if (locale === 'en' && interval !== 1 && interval !== '?') {
      const unitMapPlural: Record<RecurrenceUnit, () => string> = {
        minute: m.minute_plural,
        hour: m.hour_plural,
        day: m.day_plural,
        week: m.week_plural,
        month: m.month_plural,
        quarter: m.quarter_plural,
        half_year: m.half_year_plural,
        year: m.year_plural
      };
      return (unitMapPlural[unit] || (() => unit))();
    }

    const unitMap: Record<RecurrenceUnit, () => string> = {
      minute: m.minute,
      hour: m.hour,
      day: m.day,
      week: m.week,
      month: m.month,
      quarter: m.quarter,
      half_year: m.half_year,
      year: m.year
    };
    return (unitMap[unit] || (() => unit))();
  }
  
  function getDayOfWeekText(day: DayOfWeek, short: boolean): string {
    const dayMap: Record<DayOfWeek, () => string> = {
      sunday: short ? m.day_short_sun : m.sunday,
      monday: short ? m.day_short_mon : m.monday,
      tuesday: short ? m.day_short_tue : m.tuesday,
      wednesday: short ? m.day_short_wed : m.wednesday,
      thursday: short ? m.day_short_thu : m.thursday,
      friday: short ? m.day_short_fri : m.friday,
      saturday: short ? m.day_short_sat : m.saturday
    };
    return (dayMap[day] || (() => day))();
  }
  
  function getWeekOfMonthText(week: WeekOfMonth): string {
    const weekMap: Record<WeekOfMonth, () => string> = {
      first: m.first_week,
      second: m.second_week,
      third: m.third_week,
      fourth: m.fourth_week,
      last: m.last_week
    };
    return (weekMap[week] || (() => week))();
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
