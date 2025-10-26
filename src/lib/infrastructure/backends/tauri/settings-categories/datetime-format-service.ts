import { invoke } from '@tauri-apps/api/core';

/**
 * 日時フォーマット管理サービス
 */
export class DateTimeFormatService {
  async addDateTimeFormatSetting(formatSetting: Record<string, unknown>): Promise<boolean> {
    try {
      const result = await invoke('add_datetime_format_setting', {
        format_setting: formatSetting
      });
      return result as boolean;
    } catch (error) {
      console.error('Failed to add datetime format setting:', error);
      return false;
    }
  }

  async upsertDateTimeFormatSetting(formatSetting: Record<string, unknown>): Promise<boolean> {
    try {
      const result = await invoke('upsert_datetime_format_setting', {
        format_setting: formatSetting
      });
      return result as boolean;
    } catch (error) {
      console.error('Failed to upsert datetime format setting:', error);
      return false;
    }
  }

  async deleteDateTimeFormatSetting(formatId: string): Promise<boolean> {
    try {
      const result = await invoke('delete_datetime_format_setting', {
        format_id: formatId
      });
      return result as boolean;
    } catch (error) {
      console.error('Failed to delete datetime format setting:', error);
      return false;
    }
  }
}
