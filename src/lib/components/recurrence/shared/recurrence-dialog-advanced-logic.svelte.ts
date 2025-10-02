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

  // Flags for preventing unwanted saves
  private isInitializing = false;
  private isSaving = false;

  constructor(
    recurrenceRule?: RecurrenceRule | null,
    onSave?: (rule: RecurrenceRule | null) => void,
    startDateTime?: Date,
    endDateTime?: Date,
    isRangeDate?: boolean
  ) {
    this.isInitializing = true;
    this.recurrenceRule = recurrenceRule;
    this.onSave = onSave;
    this.startDateTime = startDateTime;
    this.endDateTime = endDateTime;
    this.isRangeDate = isRangeDate;

    this.initializeState();
    this.setupEffect();
    this.setupAutoSaveEffect();

    // Clear the initialization flag after setup completes
    queueMicrotask(() => {
      this.isInitializing = false;
    });
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
    // レベル変更時に即座に保存
    if (!this.isInitializing) {
      this.saveCurrentRule();
    }
  }
  set repeatCount(value: number | undefined) {
    this.state.repeatCount = value;
  }
  set displayCount(value: number) {
    this.previewManager.setDisplayCount(value);
  }
  isComplexUnit = $derived(['year', 'halfyear', 'quarter', 'month', 'week'].includes(this.unit));

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

  /**
   * Update state from new recurrenceRule prop
   * Called when the recurrenceRule prop changes externally
   */
  updateFromRecurrenceRule(recurrenceRule?: RecurrenceRule | null) {
    this.isInitializing = true;
    this.recurrenceRule = recurrenceRule;
    this.initializeState();

    // Clear the flag after initialization completes
    queueMicrotask(() => {
      this.isInitializing = false;
    });
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

  private setupAutoSaveEffect() {
    $effect(() => {
      // Track all state changes by referencing them
      void this.state.recurrenceLevel;
      void this.state.unit;
      void this.state.interval;
      void this.state.daysOfWeek;
      void this.state.details;
      void this.state.endDate;
      void this.state.repeatCount;
      void this.dateConditionManager.conditions;
      void this.weekdayConditionManager.conditions;

      // Skip during initialization or saving
      if (this.isInitializing || this.isSaving) return;

      // Skip if onSave is not provided
      if (!this.onSave) return;

      // Save the current rule
      this.saveCurrentRule();
    });
  }

  private saveCurrentRule() {
    this.isSaving = true;
    const rule = this.buildRecurrenceRule();
    this.onSave?.(rule);

    // Clear the flag after save completes
    queueMicrotask(() => {
      this.isSaving = false;
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

  updatePreview() {
    const rule = this.buildRecurrenceRule();
    this.previewManager.updatePreview(rule, this.startDateTime, this.endDateTime);
  }

  // Event Handlers
  toggleDayOfWeek(day: DayOfWeek) {
    this.state.toggleDayOfWeek(day);
  }

  addDateCondition() {
    this.dateConditionManager.addCondition();
  }

  removeDateCondition(id: string) {
    this.dateConditionManager.removeCondition(id);
  }

  updateDateCondition(id: string, updates: Partial<DateCondition>) {
    this.dateConditionManager.updateCondition(id, updates);
  }

  addWeekdayCondition() {
    this.weekdayConditionManager.addCondition();
  }

  removeWeekdayCondition(id: string) {
    this.weekdayConditionManager.removeCondition(id);
  }

  updateWeekdayCondition(id: string, updates: Partial<WeekdayCondition>) {
    this.weekdayConditionManager.updateCondition(id, updates);
  }

  // セッター関数
  setUnit(unit: RecurrenceUnit) {
    this.state.setUnit(unit);
  }

  setInterval(interval: number) {
    this.state.setInterval(interval);
  }

  setDaysOfWeek(daysOfWeek: DayOfWeek[]) {
    this.state.setDaysOfWeek(daysOfWeek);
  }

  setDetails(details: RecurrenceDetails) {
    this.state.setDetails(details);
  }
}
