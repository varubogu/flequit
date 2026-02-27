import { invoke } from '@tauri-apps/api/core';
import type { CustomDateFormat } from '$lib/types/settings';

/**
 * カスタム日付フォーマット管理サービス
 */
export class CustomDateFormatService {
  async getCustomDateFormatSetting(formatId: string): Promise<CustomDateFormat | null> {
    try {
      const result = (await invoke('get_custom_date_format_setting', {
        id: formatId
      })) as CustomDateFormat | null;
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
      await invoke('add_custom_date_format_setting', {
        format: formatSetting
      });
      return true;
    } catch (error) {
      console.error('Failed to add custom date format setting:', error);
      return false;
    }
  }

  async updateCustomDateFormatSetting(formatSetting: CustomDateFormat): Promise<boolean> {
    try {
      await invoke('update_custom_date_format_setting', {
        format: formatSetting
      });
      return true;
    } catch (error) {
      console.error('Failed to update custom date format setting:', error);
      return false;
    }
  }

  async deleteCustomDateFormatSetting(formatId: string): Promise<boolean> {
    try {
      await invoke('delete_custom_date_format_setting', {
        id: formatId
      });
      return true;
    } catch (error) {
      console.error('Failed to delete custom date format setting:', error);
      return false;
    }
  }
}
