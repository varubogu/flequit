import type { CustomDateFormat, Settings, TimeLabel, WeekStart } from '$lib/types/settings';
import { getLocale } from '$paraglide/runtime';
import { DEFAULT_SETTINGS } from './defaults';
import { getDefaultDateFormatForLocale } from './date-format-helpers';
import { SettingsPersistence } from './settings-persistence';

type PersistenceLike = Pick<SettingsPersistence, 'load' | 'markInitialized' | 'save'>;

export class GeneralSettingsStore {
  private _settings = $state<Settings>({ ...DEFAULT_SETTINGS });
  private isInitialized = false;
  private persistence: PersistenceLike;

  constructor(persistence?: PersistenceLike) {
    this.persistence = persistence ?? new SettingsPersistence(this._settings);
  }

  get settings(): Settings {
    return this._settings;
  }

  get language(): string {
    return this._settings.language;
  }

  setLanguage(language: string): void {
    this._settings.language = language;
    this.persistPartial({ language }, 'Failed to save language setting:');
  }

  get weekStart(): WeekStart {
    return this._settings.weekStart;
  }

  setWeekStart(weekStart: WeekStart): void {
    this._settings.weekStart = weekStart;
    this.persistPartial({ weekStart }, 'Failed to update weekStart:');
  }

  get timezone(): string {
    return this._settings.timezone;
  }

  get effectiveTimezone(): string {
    if (this._settings.timezone === 'system') {
      return Intl.DateTimeFormat().resolvedOptions().timeZone;
    }
    return this._settings.timezone;
  }

  setTimezone(timezone: string): void {
    this._settings.timezone = timezone;
    this.persistPartial({ timezone }, 'Failed to update timezone:');
  }

  get dateFormat(): string {
    return this._settings.dateFormat;
  }

  setDateFormat(dateFormat: string): void {
    this._settings.dateFormat = dateFormat;
    this.persistPartial({ dateFormat }, 'Failed to update date format:');
  }

  resetDateFormatToDefault(): void {
    const locale = getLocale();
    this.setDateFormat(getDefaultDateFormatForLocale(locale));
  }

  get customDateFormats(): CustomDateFormat[] {
    return this._settings.customDateFormats;
  }

  addCustomDateFormat(name: string, format: string): string {
    const id = this.generateId('custom');
    const next = [...this._settings.customDateFormats, { id, name, format }];
    this.updateArray('customDateFormats', next, 'Failed to add custom date format:');
    return id;
  }

  updateCustomDateFormat(id: string, updates: Partial<Omit<CustomDateFormat, 'id'>>): void {
    const existing = this._settings.customDateFormats.map((formatItem) =>
      formatItem.id === id ? { ...formatItem, ...updates } : formatItem
    );
    this.updateArray('customDateFormats', existing, 'Failed to update custom date format:');
  }

  removeCustomDateFormat(id: string): void {
    const remaining = this._settings.customDateFormats.filter((formatItem) => formatItem.id !== id);
    this.updateArray('customDateFormats', remaining, 'Failed to remove custom date format:');
  }

  get timeLabels(): TimeLabel[] {
    return this._settings.timeLabels;
  }

  addTimeLabel(name: string, time: string): string {
    const id = this.generateId('time');
    const next = [...this._settings.timeLabels, { id, name, time }];
    this.updateArray('timeLabels', next, 'Failed to add time label:');
    return id;
  }

  updateTimeLabel(id: string, updates: Partial<Omit<TimeLabel, 'id'>>): void {
    const next = this._settings.timeLabels.map((label) =>
      label.id === id ? { ...label, ...updates } : label
    );
    this.updateArray('timeLabels', next, 'Failed to update time label:');
  }

  removeTimeLabel(id: string): void {
    const next = this._settings.timeLabels.filter((label) => label.id !== id);
    this.updateArray('timeLabels', next, 'Failed to remove time label:');
  }

  getTimeLabelsByTime(time: string): TimeLabel[] {
    return this._settings.timeLabels.filter((label) => label.time === time);
  }

  async init() {
    await this.persistence.load();
    this.persistence.markInitialized();
    this.isInitialized = true;
  }

  private persistPartial(partial: Partial<Settings>, errorMessage: string) {
    if (!this.isInitialized) {
      return;
    }

    this.persistence.save(partial).catch((error) => {
      console.error(errorMessage, error);
    });
  }

  private updateArray<K extends 'customDateFormats' | 'timeLabels'>(
    key: K,
    next: Settings[K],
    errorMessage: string
  ) {
    this._settings[key] = next;
    this.persistPartial({ [key]: next } as Pick<Settings, K>, errorMessage);
  }

  private generateId(prefix: string) {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }
}

export const generalSettingsStore = new GeneralSettingsStore();

generalSettingsStore.init().catch((error) => {
  console.error('Failed to initialize general settings store:', error);
});
