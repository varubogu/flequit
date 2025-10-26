import { invoke } from '@tauri-apps/api/core';
import type { Settings, CustomDateFormat, TimeLabel, ViewItem } from '$lib/types/settings';
import type { SettingsManagementService } from '$lib/infrastructure/backends/settings-management-service';
import { CustomDueDayService } from './settings-categories/custom-due-day-service';
import { CustomDateFormatService } from './settings-categories/custom-date-format-service';
import { DateTimeFormatService } from './settings-categories/datetime-format-service';
import { TimeLabelService } from './settings-categories/time-label-service';
import { ViewItemService } from './settings-categories/view-item-service';

/**
 * Tauri設定管理サービス（Facade）
 * 
 * カテゴリ別サービスを統合し、統一的なインターフェースを提供します。
 */
export class SettingsManagementTauriService implements SettingsManagementService {
  private customDueDayService = new CustomDueDayService();
  private customDateFormatService = new CustomDateFormatService();
  private dateTimeFormatService = new DateTimeFormatService();
  private timeLabelService = new TimeLabelService();
  private viewItemService = new ViewItemService();

  // 基本設定操作
  async loadSettings(): Promise<Settings | null> {
    try {
      const result = (await invoke('load_settings')) as Settings | null;
      return result;
    } catch (error) {
      console.error('Failed to load settings:', error);
      return null;
    }
  }

  async saveSettings(settings: Settings): Promise<boolean> {
    try {
      await invoke('save_settings', { settings });
      return true;
    } catch (error) {
      console.error('Failed to save settings:', error);
      return false;
    }
  }

  async updateSettingsPartially(partialSettings: Partial<Settings>): Promise<Settings | null> {
    try {
      const result = (await invoke('update_settings_partially', {
        partialSettings
      })) as Settings | null;
      return result;
    } catch (error) {
      console.error('Failed to update settings partially:', error);
      return null;
    }
  }

  async settingsFileExists(): Promise<boolean> {
    try {
      const result = await invoke('settings_file_exists');
      return result as boolean;
    } catch (error) {
      console.error('Failed to check settings file existence:', error);
      return false;
    }
  }

  async initializeSettingsWithDefaults(): Promise<boolean> {
    try {
      await invoke('initialize_settings_with_defaults');
      return true;
    } catch (error) {
      console.error('Failed to initialize settings with defaults:', error);
      return false;
    }
  }

  async getSettingsFilePath(): Promise<string> {
    try {
      const result = (await invoke('get_settings_file_path')) as string;
      return result;
    } catch (error) {
      console.error('Failed to get settings file path:', error);
      return '';
    }
  }

  // カスタム期日管理 - delegateパターン
  async addCustomDueDay(days: number): Promise<boolean> {
    return this.customDueDayService.addCustomDueDay(days);
  }

  async updateCustomDueDay(oldDays: number, newDays: number): Promise<boolean> {
    return this.customDueDayService.updateCustomDueDay(oldDays, newDays);
  }

  async deleteCustomDueDay(days: number): Promise<boolean> {
    return this.customDueDayService.deleteCustomDueDay(days);
  }

  // 日時フォーマット管理 - delegateパターン
  async addDateTimeFormatSetting(formatSetting: Record<string, unknown>): Promise<boolean> {
    return this.dateTimeFormatService.addDateTimeFormatSetting(formatSetting);
  }

  async upsertDateTimeFormatSetting(formatSetting: Record<string, unknown>): Promise<boolean> {
    return this.dateTimeFormatService.upsertDateTimeFormatSetting(formatSetting);
  }

  async deleteDateTimeFormatSetting(formatId: string): Promise<boolean> {
    return this.dateTimeFormatService.deleteDateTimeFormatSetting(formatId);
  }

  // カスタム日付フォーマット管理 - delegateパターン
  async getCustomDateFormatSetting(formatId: string): Promise<CustomDateFormat | null> {
    return this.customDateFormatService.getCustomDateFormatSetting(formatId);
  }

  async getAllCustomDateFormatSettings(): Promise<CustomDateFormat[]> {
    return this.customDateFormatService.getAllCustomDateFormatSettings();
  }

  async addCustomDateFormatSetting(formatSetting: CustomDateFormat): Promise<boolean> {
    return this.customDateFormatService.addCustomDateFormatSetting(formatSetting);
  }

  async updateCustomDateFormatSetting(formatSetting: CustomDateFormat): Promise<boolean> {
    return this.customDateFormatService.updateCustomDateFormatSetting(formatSetting);
  }

  async deleteCustomDateFormatSetting(formatId: string): Promise<boolean> {
    return this.customDateFormatService.deleteCustomDateFormatSetting(formatId);
  }

  // 時間ラベル管理 - delegateパターン
  async getTimeLabelSetting(labelId: string): Promise<TimeLabel | null> {
    return this.timeLabelService.getTimeLabelSetting(labelId);
  }

  async getAllTimeLabelSettings(): Promise<TimeLabel[]> {
    return this.timeLabelService.getAllTimeLabelSettings();
  }

  async addTimeLabelSetting(labelSetting: TimeLabel): Promise<boolean> {
    return this.timeLabelService.addTimeLabelSetting(labelSetting);
  }

  async updateTimeLabelSetting(labelSetting: TimeLabel): Promise<boolean> {
    return this.timeLabelService.updateTimeLabelSetting(labelSetting);
  }

  async deleteTimeLabelSetting(labelId: string): Promise<boolean> {
    return this.timeLabelService.deleteTimeLabelSetting(labelId);
  }

  // ビューアイテム管理 - delegateパターン
  async getViewItemSetting(itemId: string): Promise<ViewItem | null> {
    return this.viewItemService.getViewItemSetting(itemId);
  }

  async getAllViewItemSettings(): Promise<ViewItem[]> {
    return this.viewItemService.getAllViewItemSettings();
  }

  async addViewItemSetting(itemSetting: ViewItem): Promise<boolean> {
    return this.viewItemService.addViewItemSetting(itemSetting);
  }

  async updateViewItemSetting(itemSetting: ViewItem): Promise<boolean> {
    return this.viewItemService.updateViewItemSetting(itemSetting);
  }

  async deleteViewItemSetting(itemId: string): Promise<boolean> {
    return this.viewItemService.deleteViewItemSetting(itemId);
  }
}
