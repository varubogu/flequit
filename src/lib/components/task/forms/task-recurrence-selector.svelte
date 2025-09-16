<script lang="ts">
  import { getTranslationService } from '$lib/stores/locale.svelte';
  import { Button } from '$lib/components/ui/button/index.js';
  import { Repeat, RotateCcw } from 'lucide-svelte';
  import type { RecurrenceRule } from '$lib/types/datetime-calendar';
  import type { RecurrenceUnit } from '$lib/types/datetime-calendar';
  import type { WeekOfMonth } from '$lib/types/datetime-calendar';
  import type { DayOfWeek } from '$lib/types/datetime-calendar';
  import { getLocale } from '$paraglide/runtime';

  interface Props {
    recurrenceRule?: RecurrenceRule | null;
    onEdit?: () => void;
    disabled?: boolean;
  }

  let { recurrenceRule, onEdit, disabled = false }: Props = $props();

  const translationService = getTranslationService();
  // リアクティブメッセージ
  const noRecurrence = translationService.getMessage('no_recurrence');

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

    let text = translationService.getMessage('every_interval_unit', {
      interval: String(interval),
      unit: unitText
    })();

    // 週単位の場合の曜日指定
    if (rule.unit === 'week' && rule.daysOfWeek?.length) {
      const dayNames = rule.daysOfWeek.map((day) => getDayOfWeekText(day, true)).join(', ');
      text += ' ' + translationService.getMessage('recurrence_weekly_days', { days: dayNames })();
    }

    // 月単位の場合の詳細
    if (rule.unit === 'month') {
      if (rule.details?.specificDate) {
        const dayOfMonth = rule.details.specificDate;
        const detail =
          translationService.getMessage('day_of_month', { day: dayOfMonth })() +
          getOrdinalSuffix(dayOfMonth);
        text += ' ' + translationService.getMessage('recurrence_monthly_detail', { detail })();
      } else if (rule.details?.weekOfPeriod && rule.details?.weekdayOfWeek) {
        const detail = `${getWeekOfMonthText(rule.details.weekOfPeriod)} ${getDayOfWeekText(rule.details.weekdayOfWeek, false)}`;
        text += ' ' + translationService.getMessage('recurrence_monthly_detail', { detail })();
      }
    }

    // 終了条件
    if (rule.endDate) {
      const endDate = new Date(rule.endDate).toLocaleDateString(getLocale());
      text += ' ' + translationService.getMessage('recurrence_end_date', { endDate })();
    } else if (rule.maxOccurrences) {
      text +=
        ' ' +
        translationService.getMessage('recurrence_max_occurrences', {
          count: rule.maxOccurrences
        })();
    }

    return text;
  }

  function getUnitText(unit: RecurrenceUnit, interval: number | '?'): string {
    const locale = getLocale();
    if (locale === 'en' && interval !== 1 && interval !== '?') {
      const unitMapPlural: Record<RecurrenceUnit, string> = {
        minute: 'minute_plural',
        hour: 'hour_plural',
        day: 'day_plural',
        week: 'week_plural',
        month: 'month_plural',
        quarter: 'quarter_plural',
        half_year: 'half_year_plural',
        year: 'year_plural'
      };
      return translationService.getMessage(unitMapPlural[unit] || unit)();
    }

    const unitMap: Record<RecurrenceUnit, string> = {
      minute: 'minute',
      hour: 'hour',
      day: 'day',
      week: 'week',
      month: 'month',
      quarter: 'quarter',
      half_year: 'half_year',
      year: 'year'
    };
    return translationService.getMessage(unitMap[unit] || unit)();
  }

  function getDayOfWeekText(day: DayOfWeek, short: boolean): string {
    const dayMap: Record<DayOfWeek, string> = {
      sunday: short ? 'day_short_sun' : 'sunday',
      monday: short ? 'day_short_mon' : 'monday',
      tuesday: short ? 'day_short_tue' : 'tuesday',
      wednesday: short ? 'day_short_wed' : 'wednesday',
      thursday: short ? 'day_short_thu' : 'thursday',
      friday: short ? 'day_short_fri' : 'friday',
      saturday: short ? 'day_short_sat' : 'saturday'
    };
    return translationService.getMessage(dayMap[day] || day)();
  }

  function getWeekOfMonthText(week: WeekOfMonth): string {
    const weekMap: Record<WeekOfMonth, string> = {
      first: 'first_week',
      second: 'second_week',
      third: 'third_week',
      fourth: 'fourth_week',
      last: 'last_week'
    };
    return translationService.getMessage(weekMap[week] || week)();
  }
</script>

<div class="flex items-center gap-2">
  <Button
    variant="outline"
    size="sm"
    onclick={onEdit}
    {disabled}
    class="flex h-7 min-w-0 items-center justify-start gap-1 px-2 py-1 text-left text-xs"
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
