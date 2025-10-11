import { SettingsService } from '$lib/services/domain/settings';
import type { Settings } from '$lib/types/settings';
import { applySettingsPatch, SETTINGS_STORAGE_KEY } from './defaults';

export class SettingsPersistence {
  private isInitialized = false;

  constructor(private readonly state: Settings) {}

  markInitialized() {
    this.isInitialized = true;
  }

  async save(partial: Partial<Settings>) {
    if (!this.isInitialized) {
      return;
    }

    try {
      const updated = await SettingsService.updateSettingsPartially(partial);
      if (updated) {
        applySettingsPatch(this.state, updated);
        this.persistToLocalStorage();
      }
    } catch (error) {
      this.persistToLocalStorage();
      throw error;
    }
  }

  async load() {
    try {
      const loaded = await SettingsService.loadSettings();
      if (loaded) {
        applySettingsPatch(this.state, loaded);
        this.persistToLocalStorage();
        return;
      }
    } catch (error) {
      console.error('Failed to load settings from backends:', error);
    }

    this.restoreFromLocalStorage();
  }

  private restoreFromLocalStorage() {
    if (typeof localStorage === 'undefined') {
      return;
    }

    const stored = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!stored) {
      return;
    }

    try {
      const parsed = JSON.parse(stored) as Partial<Settings>;
      applySettingsPatch(this.state, parsed);
    } catch (error) {
      console.error('Failed to parse settings from localStorage:', error);
    }
  }

  private persistToLocalStorage() {
    if (typeof localStorage === 'undefined') {
      return;
    }

    try {
      const snapshot = JSON.stringify(this.state);
      localStorage.setItem(SETTINGS_STORAGE_KEY, snapshot);
    } catch (error) {
      console.warn('Failed to persist settings to localStorage:', error);
    }
  }
}
