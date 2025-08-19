import { getTranslationService } from '$lib/stores/locale.svelte';
import type { RecurrenceRule } from '$lib/types/datetime-calendar';
import type { RecurrenceDetails } from '$lib/types/datetime-calendar';
import type { WeekdayCondition } from '$lib/types/datetime-calendar';
import type { DateCondition } from '$lib/types/datetime-calendar';
import type { RecurrenceLevel } from '$lib/types/datetime-calendar';
import type { RecurrenceUnit } from '$lib/types/datetime-calendar';
import type { DayOfWeek } from '$lib/types/datetime-calendar';
import { RecurrenceState } from './recurrence-state.svelte';
import { DateConditionManager } from '../date-conditions/date-condition-manager.svelte';
import { WeekdayConditionManager } from '../weekday-conditions/weekday-condition-manager.svelte';
import { RecurrenceRuleBuilder } from './recurrence-rule-builder.svelte';
import { RecurrencePreviewManager } from '../preview/recurrence-preview-manager.svelte';
import { RecurrenceInitializer } from './recurrence-initializer.svelte';

export class RecurrenceDialogAdvancedLogic {
  // Props
  recurrenceRule?: RecurrenceRule | null;
  onSave?: (rule: RecurrenceRule | null) => void;
  startDateTime?: Date;
  endDateTime?: Date;
  isRangeDate?: boolean;

  // Composed managers
  private state = new RecurrenceState();
  private dateConditionManager = new DateConditionManager();
  private weekdayConditionManager = new WeekdayConditionManager();
  private ruleBuilder = new RecurrenceRuleBuilder();
  private previewManager = new RecurrencePreviewManager();

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

  // Property getters for external access
  get recurrenceLevel() {
    return this.state.recurrenceLevel;
  }
  get unit() {
    return this.state.unit;
  }
  get interval() {
    return this.state.interval;
  }
  get daysOfWeek() {
    return this.state.daysOfWeek;
  }
  get details() {
    return this.state.details;
  }
  get endDate() {
    return this.state.endDate;
  }
  get repeatCount() {
    return this.state.repeatCount;
  }
  get previewDates() {
    return this.previewManager.getPreviewDates();
  }
  get displayCount() {
    return this.previewManager.getDisplayCount();
  }
  get dateConditions() {
    return this.dateConditionManager.getConditions();
  }
  get weekdayConditions() {
    return this.weekdayConditionManager.getConditions();
  }
  get showBasicSettings() {
    return this.state.showBasicSettings;
  }
  get showAdvancedSettings() {
    return this.state.showAdvancedSettings;
  }

  // Property setters
  set recurrenceLevel(value: RecurrenceLevel) {
    this.state.recurrenceLevel = value;
  }
  set repeatCount(value: number | undefined) {
    this.state.repeatCount = value;
  }
  set displayCount(value: number) {
    this.previewManager.setDisplayCount(value);
  }
  isComplexUnit = $derived(['year', 'half_year', 'quarter', 'month', 'week'].includes(this.unit));

  // Messages
  recurrenceSettings = this.translationService.getMessage('recurrence_settings');

  private initializeState() {
    RecurrenceInitializer.initializeFromRule(
      this.recurrenceRule || null,
      this.state,
      this.dateConditionManager,
      this.weekdayConditionManager
    );
  }

  private setupEffect() {
    $effect(() => {
      if (this.showBasicSettings) {
        this.updatePreview();
      } else {
        this.previewManager.clearPreview();
      }
    });
  }

  buildRecurrenceRule(): RecurrenceRule | null {
    return this.ruleBuilder.buildRule(
      this.recurrenceLevel,
      this.unit,
      this.interval,
      this.daysOfWeek,
      this.details,
      this.dateConditions,
      this.weekdayConditions,
      this.endDate,
      this.repeatCount,
      this.showAdvancedSettings
    );
  }

  handleImmediateSave() {
    const rule = this.buildRecurrenceRule();
    this.onSave?.(rule);
  }

  updatePreview() {
    const rule = this.buildRecurrenceRule();
    this.previewManager.updatePreview(rule, this.startDateTime, this.endDateTime);
  }

  // Event Handlers
  toggleDayOfWeek(day: DayOfWeek) {
    this.state.toggleDayOfWeek(day);
    this.handleImmediateSave();
  }

  addDateCondition() {
    this.dateConditionManager.addCondition();
    this.handleImmediateSave();
  }

  removeDateCondition(id: string) {
    this.dateConditionManager.removeCondition(id);
    this.handleImmediateSave();
  }

  updateDateCondition(id: string, updates: Partial<DateCondition>) {
    this.dateConditionManager.updateCondition(id, updates);
    this.handleImmediateSave();
  }

  addWeekdayCondition() {
    this.weekdayConditionManager.addCondition();
    this.handleImmediateSave();
  }

  removeWeekdayCondition(id: string) {
    this.weekdayConditionManager.removeCondition(id);
    this.handleImmediateSave();
  }

  updateWeekdayCondition(id: string, updates: Partial<WeekdayCondition>) {
    this.weekdayConditionManager.updateCondition(id, updates);
    this.handleImmediateSave();
  }

  // セッター関数
  setUnit(unit: RecurrenceUnit) {
    this.state.setUnit(unit);
    this.handleImmediateSave();
  }

  setInterval(interval: number) {
    this.state.setInterval(interval);
    this.handleImmediateSave();
  }

  setDaysOfWeek(daysOfWeek: DayOfWeek[]) {
    this.state.setDaysOfWeek(daysOfWeek);
    this.handleImmediateSave();
  }

  setDetails(details: RecurrenceDetails) {
    this.state.setDetails(details);
    this.handleImmediateSave();
  }
}
