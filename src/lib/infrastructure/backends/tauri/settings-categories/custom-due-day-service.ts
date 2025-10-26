import { invoke } from '@tauri-apps/api/core';

/**
 * カスタム期日管理サービス
 */
export class CustomDueDayService {
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
      const result = await invoke('update_custom_due_day', {
        old_days: oldDays,
        new_days: newDays
      });
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
}
