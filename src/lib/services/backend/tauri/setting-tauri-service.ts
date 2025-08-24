import { invoke } from '@tauri-apps/api/core';
import type { Setting } from '$lib/types/settings';
import type { SettingService } from '$lib/services/backend/setting-service';

// Tauriコマンドの戻り値用型定義
interface TauriSettingsCommand {
  // テーマ・外観設定
  theme: string;
  language: string;
  font: string;
  font_size: number;
  font_color: string;
  background_color: string;
  // 基本設定
  week_start: string;
  timezone: string;
  date_format: string;
  custom_due_days: number[];
  // 表示設定
  // アカウント設定
  last_selected_account: string;
}

export class SettingTauriService implements SettingService {
  async get(key: string): Promise<Setting | null> {
    try {
      const result = (await invoke('get_setting', { key })) as string | null;
      if (result === null) {
        return null;
      }
      // Tauriコマンドは値（string）のみを返すので、Settingオブジェクトを構築する必要がある
      // 実際のアプリケーションでは、keyからSettingオブジェクトを構築するロジックが必要
      console.warn(
        'get_setting returns only value, not full Setting object. Consider using get_all_settings instead.'
      );
      return null; // 一時的にnullを返す
    } catch (error) {
      console.error('Failed to get setting:', error);
      return null;
    }
  }

  async getAll(): Promise<Setting[]> {
    try {
      const result = (await invoke('get_all_settings')) as TauriSettingsCommand;

      // TauriSettingsCommandをSetting[]に変換
      const settings: Setting[] = [];
      const now = new Date();

      // 各フィールドをSettingオブジェクトに変換
      Object.entries(result).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          settings.push({
            id: `setting-${key}`,
            key,
            value: typeof value === 'string' ? value : JSON.stringify(value),
            data_type:
              typeof value === 'string'
                ? 'string'
                : typeof value === 'number'
                  ? 'number'
                  : typeof value === 'boolean'
                    ? 'boolean'
                    : 'json',
            created_at: now,
            updated_at: now
          });
        }
      });

      return settings;
    } catch (error) {
      console.error('Failed to get all settings:', error);
      return [];
    }
  }

  async update(setting: Setting): Promise<boolean> {
    try {
      // valueをJSON Valueに変換
      let jsonValue: string | number | boolean | object;
      if (setting.data_type === 'json') {
        try {
          jsonValue = JSON.parse(setting.value);
        } catch {
          jsonValue = setting.value;
        }
      } else if (setting.data_type === 'number') {
        jsonValue = parseFloat(setting.value);
      } else if (setting.data_type === 'boolean') {
        jsonValue = setting.value === 'true';
      } else {
        jsonValue = setting.value;
      }

      await invoke('update_setting', { key: setting.key, value: jsonValue });
      return true;
    } catch (error) {
      console.error('Failed to update setting:', error);
      return false;
    }
  }
}
