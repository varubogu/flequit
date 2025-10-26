import { invoke } from '@tauri-apps/api/core';
import type { TimeLabel } from '$lib/types/settings';

/**
 * 時間ラベル管理サービス
 */
export class TimeLabelService {
  async getTimeLabelSetting(labelId: string): Promise<TimeLabel | null> {
    try {
      const result = (await invoke('get_time_label_setting', {
        label_id: labelId
      })) as TimeLabel | null;
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
      const result = await invoke('add_time_label_setting', {
        label_setting: labelSetting
      });
      return result as boolean;
    } catch (error) {
      console.error('Failed to add time label setting:', error);
      return false;
    }
  }

  async updateTimeLabelSetting(labelSetting: TimeLabel): Promise<boolean> {
    try {
      const result = await invoke('update_time_label_setting', {
        label_setting: labelSetting
      });
      return result as boolean;
    } catch (error) {
      console.error('Failed to update time label setting:', error);
      return false;
    }
  }

  async deleteTimeLabelSetting(labelId: string): Promise<boolean> {
    try {
      const result = await invoke('delete_time_label_setting', {
        label_id: labelId
      });
      return result as boolean;
    } catch (error) {
      console.error('Failed to delete time label setting:', error);
      return false;
    }
  }
}
