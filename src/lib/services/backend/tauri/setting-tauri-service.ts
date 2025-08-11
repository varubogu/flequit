import { invoke } from '@tauri-apps/api/core';
import type { Setting } from '$lib/types/task';
import type { SettingService } from '$lib/services/backend/setting-service';

export class SettingTauriService implements SettingService {
  async get(key: string): Promise<Setting | null> {
    try {
      const result = (await invoke('get_setting', { key })) as Setting | null;
      return result;
    } catch (error) {
      console.error('Failed to get setting:', error);
      return null;
    }
  }

  async getAll(): Promise<Setting[]> {
    try {
      const result = (await invoke('get_all_settings')) as Setting[];
      return result;
    } catch (error) {
      console.error('Failed to get all settings:', error);
      return [];
    }
  }

  async update(setting: Setting): Promise<boolean> {
    try {
      await invoke('update_setting', { setting });
      return true;
    } catch (error) {
      console.error('Failed to update setting:', error);
      return false;
    }
  }
}
