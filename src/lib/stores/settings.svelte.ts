import { getLocale } from '$paraglide/runtime';
import { generalSettingsStore } from '$lib/stores/settings/general-settings-store.svelte';
import {
  getDefaultDateFormatForLocale,
  getStandardDateFormatsForLocale,
  buildAllDateFormats
} from './settings/date-format-helpers';
import { getAvailableTimezones } from './settings/timezone-options';
export { DEFAULT_SETTINGS } from './settings/defaults';

export const mainSettingsStore = generalSettingsStore;
export const settingsStore = generalSettingsStore;

export { getAvailableTimezones };

export function getDefaultDateFormat(locale?: string) {
  return getDefaultDateFormatForLocale(locale ?? getLocale());
}

export function getStandardDateFormats(locale?: string) {
  return getStandardDateFormatsForLocale(locale ?? getLocale());
}

export function getAllDateFormats() {
  return buildAllDateFormats(generalSettingsStore.customDateFormats);
}
