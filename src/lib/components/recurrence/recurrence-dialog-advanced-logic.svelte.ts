import { getTranslationService } from '$lib/stores/locale.svelte';
import type { RecurrenceRule } from "$lib/types/datetime-calendar";
import type { RecurrenceDetails } from "$lib/types/datetime-calendar";
import type { WeekdayCondition } from "$lib/types/datetime-calendar";
import type { DateCondition } from "$lib/types/datetime-calendar";
import type { RecurrenceLevel } from "$lib/types/datetime-calendar";
import type { RecurrenceUnit } from "$lib/types/datetime-calendar";
import type { DayOfWeek } from "$lib/types/datetime-calendar";
import { RecurrenceService } from '$lib/services/recurrence-service';
import { generateRandomId } from '$lib/utils/id-utils';
import { SvelteDate } from 'svelte/reactivity';

export class RecurrenceDialogAdvancedLogic {
  // Props
  recurrenceRule?: RecurrenceRule | null;
  onSave?: (rule: RecurrenceRule | null) => void;
  startDateTime?: Date;
  endDateTime?: Date;
  isRangeDate?: boolean;

  // State
  recurrenceLevel = $state<RecurrenceLevel>('disabled');
  unit = $state<RecurrenceUnit>('day');
  interval = $state(1);
  daysOfWeek = $state<DayOfWeek[]>([]);
  details = $state<RecurrenceDetails>({});
  dateConditions = $state<DateCondition[]>([]);
  weekdayConditions = $state<WeekdayCondition[]>([]);
  endDate = $state<Date | undefined>(undefined);
  repeatCount = $state<number | undefined>(undefined);
  previewDates = $state<Date[]>([]);
  displayCount = $state(15);

  // Translation service
  private translationService = getTranslationService();

  constructor(
    recurrenceRule?: RecurrenceRule | null,
    onSave?: (rule: RecurrenceRule | null) => void,
    startDateTime?: Date,
    endDateTime?: Date,
    isRangeDate?: boolean
  ) {
    this.recurrenceRule = recurrenceRule;
    this.onSave = onSave;
    this.startDateTime = startDateTime;
    this.endDateTime = endDateTime;
    this.isRangeDate = isRangeDate;

    this.initializeState();
    this.setupEffect();
  }

  // Derived State
  showBasicSettings = $derived(
    this.recurrenceLevel === 'enabled' || this.recurrenceLevel === 'advanced'
  );
  showAdvancedSettings = $derived(this.recurrenceLevel === 'advanced');
  isComplexUnit = $derived(['year', 'half_year', 'quarter', 'month', 'week'].includes(this.unit));

  // Messages
  recurrenceSettings = this.translationService.getMessage('recurrence_settings');

  private initializeState() {
    this.recurrenceLevel = !this.recurrenceRule
      ? 'disabled'
      : (this.recurrenceRule.adjustment &&
            (this.recurrenceRule.adjustment.date_conditions.length > 0 ||
              this.recurrenceRule.adjustment.weekday_conditions.length > 0)) ||
          (this.recurrenceRule.details && Object.keys(this.recurrenceRule.details).length > 0)
        ? 'advanced'
        : 'enabled';

    this.unit = this.recurrenceRule?.unit || 'day';
    this.interval = this.recurrenceRule?.interval || 1;
    this.daysOfWeek = this.recurrenceRule?.days_of_week || [];
    this.details = this.recurrenceRule?.details || {};
    this.dateConditions = this.recurrenceRule?.adjustment?.date_conditions || [];
    this.weekdayConditions = this.recurrenceRule?.adjustment?.weekday_conditions || [];
    this.endDate = this.recurrenceRule?.end_date;
    this.repeatCount = this.recurrenceRule?.max_occurrences;
  }

  private setupEffect() {
    $effect(() => {
      if (this.showBasicSettings) {
        this.updatePreview();
      } else {
        this.previewDates = [];
      }
    });
  }

  buildRecurrenceRule(): RecurrenceRule | null {
    if (this.recurrenceLevel === 'disabled') return null;
    const rule: RecurrenceRule = {
      unit: this.unit,
      interval: this.interval,
      ...(this.unit === 'week' && this.daysOfWeek.length > 0 && { days_of_week: this.daysOfWeek }),
      ...(this.showAdvancedSettings &&
        this.isComplexUnit &&
        Object.keys(this.details).length > 0 && { details: this.details }),
      ...(this.showAdvancedSettings &&
        (this.dateConditions.length > 0 || this.weekdayConditions.length > 0) && {
          adjustment: {
            date_conditions: this.dateConditions,
            weekday_conditions: this.weekdayConditions
          }
        }),
      ...(this.endDate && { end_date: this.endDate }),
      ...(this.repeatCount && this.repeatCount > 0 && { max_occurrences: this.repeatCount })
    };
    return rule;
  }

  handleImmediateSave() {
    const rule = this.buildRecurrenceRule();
    this.onSave?.(rule);
  }

  updatePreview() {
    try {
      const rule = this.buildRecurrenceRule();
      if (rule) {
        const baseDate = this.startDateTime || this.endDateTime || new SvelteDate();
        const previewLimit = 20;
        this.previewDates = RecurrenceService.generateRecurrenceDates(baseDate, rule, previewLimit);
      } else {
        this.previewDates = [];
      }
    } catch (error) {
      console.error('プレビュー生成エラー:', error);
      this.previewDates = [];
    }
  }

  // Event Handlers
  toggleDayOfWeek(day: DayOfWeek) {
    this.daysOfWeek = this.daysOfWeek.includes(day)
      ? this.daysOfWeek.filter((d) => d !== day)
      : [...this.daysOfWeek, day];
    this.handleImmediateSave();
  }

  addDateCondition() {
    this.dateConditions = [
      ...this.dateConditions,
      { id: generateRandomId(), relation: 'before', reference_date: new SvelteDate() }
    ];
    this.handleImmediateSave();
  }

  removeDateCondition(id: string) {
    this.dateConditions = this.dateConditions.filter((c) => c.id !== id);
    this.handleImmediateSave();
  }

  updateDateCondition(id: string, updates: Partial<DateCondition>) {
    this.dateConditions = this.dateConditions.map((c) => (c.id === id ? { ...c, ...updates } : c));
    this.handleImmediateSave();
  }

  addWeekdayCondition() {
    this.weekdayConditions = [
      ...this.weekdayConditions,
      {
        id: generateRandomId(),
        if_weekday: 'monday',
        then_direction: 'next',
        then_target: 'weekday'
      }
    ];
    this.handleImmediateSave();
  }

  removeWeekdayCondition(id: string) {
    this.weekdayConditions = this.weekdayConditions.filter((c) => c.id !== id);
    this.handleImmediateSave();
  }

  updateWeekdayCondition(id: string, updates: Partial<WeekdayCondition>) {
    this.weekdayConditions = this.weekdayConditions.map((c) =>
      c.id === id ? { ...c, ...updates } : c
    );
    this.handleImmediateSave();
  }

  // セッター関数
  setUnit(unit: RecurrenceUnit) {
    this.unit = unit;
    this.handleImmediateSave();
  }

  setInterval(interval: number) {
    this.interval = interval;
    this.handleImmediateSave();
  }

  setDaysOfWeek(daysOfWeek: DayOfWeek[]) {
    this.daysOfWeek = daysOfWeek;
    this.handleImmediateSave();
  }

  setDetails(details: RecurrenceDetails) {
    this.details = details;
    this.handleImmediateSave();
  }

  setDateConditions(dateConditions: DateCondition[]) {
    this.dateConditions = dateConditions;
    this.handleImmediateSave();
  }

  setWeekdayConditions(weekdayConditions: WeekdayCondition[]) {
    this.weekdayConditions = weekdayConditions;
    this.handleImmediateSave();
  }
}
