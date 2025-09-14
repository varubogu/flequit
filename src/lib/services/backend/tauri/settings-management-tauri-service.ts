import { invoke } from '@tauri-apps/api/core';
import type { Settings, CustomDateFormat, TimeLabel, ViewItem } from '$lib/types/settings';
import type { SettingsManagementService } from '$lib/services/backend/settings-management-service';

export class SettingsManagementTauriService implements SettingsManagementService {
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
      const result = await invoke('save_settings', { settings });
      return result as boolean;
    } catch (error) {
      console.error('Failed to save settings:', error);
      return false;
    }
  }

  async updateSettingsPartially(partialSettings: Partial<Settings>): Promise<Settings | null> {
    try {
      const result = (await invoke('update_settings_partially', { partialSettings })) as Settings | null;
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
      const result = await invoke('initialize_settings_with_defaults');
      return result as boolean;
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

  // カスタム期日管理
  async addCustomDueDay(days: number): Promise<boolean> {
    try {
      const result = await invoke('add_custom_due_day', { days });
      return result as boolean;
    } catch (error) {
      console.error('Failed to add custom due day:', error);
      return false;
    }
  }

  async updateCustomDueDay(oldDays: number, newDays: number): Promise<boolean> {
    try {
      const result = await invoke('update_custom_due_day', { old_days: oldDays, new_days: newDays });
      return result as boolean;
    } catch (error) {
      console.error('Failed to update custom due day:', error);
      return false;
    }
  }

  async deleteCustomDueDay(days: number): Promise<boolean> {
    try {
      const result = await invoke('delete_custom_due_day', { days });
      return result as boolean;
    } catch (error) {
      console.error('Failed to delete custom due day:', error);
      return false;
    }
  }

  // 日時フォーマット管理
  async addDateTimeFormatSetting(formatSetting: any): Promise<boolean> {
    try {
      const result = await invoke('add_datetime_format_setting', { format_setting: formatSetting });
      return result as boolean;
    } catch (error) {
      console.error('Failed to add datetime format setting:', error);
      return false;
    }
  }

  async upsertDateTimeFormatSetting(formatSetting: any): Promise<boolean> {
    try {
      const result = await invoke('upsert_datetime_format_setting', { format_setting: formatSetting });
      return result as boolean;
    } catch (error) {
      console.error('Failed to upsert datetime format setting:', error);
      return false;
    }
  }

  async deleteDateTimeFormatSetting(formatId: string): Promise<boolean> {
    try {
      const result = await invoke('delete_datetime_format_setting', { format_id: formatId });
      return result as boolean;
    } catch (error) {
      console.error('Failed to delete datetime format setting:', error);
      return false;
    }
  }

  // カスタム日付フォーマット管理
  async getCustomDateFormatSetting(formatId: string): Promise<CustomDateFormat | null> {
    try {
      const result = (await invoke('get_custom_date_format_setting', { format_id: formatId })) as CustomDateFormat | null;
      return result;
    } catch (error) {
      console.error('Failed to get custom date format setting:', error);
      return null;
    }
  }

  async getAllCustomDateFormatSettings(): Promise<CustomDateFormat[]> {
    try {
      const result = (await invoke('get_all_custom_date_format_settings')) as CustomDateFormat[];
      return result;
    } catch (error) {
      console.error('Failed to get all custom date format settings:', error);
      return [];
    }
  }

  async addCustomDateFormatSetting(formatSetting: CustomDateFormat): Promise<boolean> {
    try {
      const result = await invoke('add_custom_date_format_setting', { format_setting: formatSetting });
      return result as boolean;
    } catch (error) {
      console.error('Failed to add custom date format setting:', error);
      return false;
    }
  }

  async updateCustomDateFormatSetting(formatSetting: CustomDateFormat): Promise<boolean> {
    try {
      const result = await invoke('update_custom_date_format_setting', { format_setting: formatSetting });
      return result as boolean;
    } catch (error) {
      console.error('Failed to update custom date format setting:', error);
      return false;
    }
  }

  async deleteCustomDateFormatSetting(formatId: string): Promise<boolean> {
    try {
      const result = await invoke('delete_custom_date_format_setting', { format_id: formatId });
      return result as boolean;
    } catch (error) {
      console.error('Failed to delete custom date format setting:', error);
      return false;
    }
  }

  // 時間ラベル管理
  async getTimeLabelSetting(labelId: string): Promise<TimeLabel | null> {
    try {
      const result = (await invoke('get_time_label_setting', { label_id: labelId })) as TimeLabel | null;
      return result;
    } catch (error) {
      console.error('Failed to get time label setting:', error);
      return null;
    }
  }

  async getAllTimeLabelSettings(): Promise<TimeLabel[]> {
    try {
      const result = (await invoke('get_all_time_label_settings')) as TimeLabel[];
      return result;
    } catch (error) {
      console.error('Failed to get all time label settings:', error);
      return [];
    }
  }

  async addTimeLabelSetting(labelSetting: TimeLabel): Promise<boolean> {
    try {
      const result = await invoke('add_time_label_setting', { label_setting: labelSetting });
      return result as boolean;
    } catch (error) {
      console.error('Failed to add time label setting:', error);
      return false;
    }
  }

  async updateTimeLabelSetting(labelSetting: TimeLabel): Promise<boolean> {
    try {
      const result = await invoke('update_time_label_setting', { label_setting: labelSetting });
      return result as boolean;
    } catch (error) {
      console.error('Failed to update time label setting:', error);
      return false;
    }
  }

  async deleteTimeLabelSetting(labelId: string): Promise<boolean> {
    try {
      const result = await invoke('delete_time_label_setting', { label_id: labelId });
      return result as boolean;
    } catch (error) {
      console.error('Failed to delete time label setting:', error);
      return false;
    }
  }

  // ビューアイテム管理
  async getViewItemSetting(itemId: string): Promise<ViewItem | null> {
    try {
      const result = (await invoke('get_view_item_setting', { item_id: itemId })) as ViewItem | null;
      return result;
    } catch (error) {
      console.error('Failed to get view item setting:', error);
      return null;
    }
  }

  async getAllViewItemSettings(): Promise<ViewItem[]> {
    try {
      const result = (await invoke('get_all_view_item_settings')) as ViewItem[];
      return result;
    } catch (error) {
      console.error('Failed to get all view item settings:', error);
      return [];
    }
  }

  async addViewItemSetting(itemSetting: ViewItem): Promise<boolean> {
    try {
      const result = await invoke('add_view_item_setting', { item_setting: itemSetting });
      return result as boolean;
    } catch (error) {
      console.error('Failed to add view item setting:', error);
      return false;
    }
  }

  async updateViewItemSetting(itemSetting: ViewItem): Promise<boolean> {
    try {
      const result = await invoke('update_view_item_setting', { item_setting: itemSetting });
      return result as boolean;
    } catch (error) {
      console.error('Failed to update view item setting:', error);
      return false;
    }
  }

  async deleteViewItemSetting(itemId: string): Promise<boolean> {
    try {
      const result = await invoke('delete_view_item_setting', { item_id: itemId });
      return result as boolean;
    } catch (error) {
      console.error('Failed to delete view item setting:', error);
      return false;
    }
  }
}