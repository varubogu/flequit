import { invoke } from '@tauri-apps/api/core';
import type { ViewItem } from '$lib/types/settings';

/**
 * ビューアイテム管理サービス
 */
export class ViewItemService {
  async getViewItemSetting(itemId: string): Promise<ViewItem | null> {
    try {
      const result = (await invoke('get_view_item_setting', {
        item_id: itemId
      })) as ViewItem | null;
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
      const result = await invoke('add_view_item_setting', {
        item_setting: itemSetting
      });
      return result as boolean;
    } catch (error) {
      console.error('Failed to add view item setting:', error);
      return false;
    }
  }

  async updateViewItemSetting(itemSetting: ViewItem): Promise<boolean> {
    try {
      const result = await invoke('update_view_item_setting', {
        item_setting: itemSetting
      });
      return result as boolean;
    } catch (error) {
      console.error('Failed to update view item setting:', error);
      return false;
    }
  }

  async deleteViewItemSetting(itemId: string): Promise<boolean> {
    try {
      const result = await invoke('delete_view_item_setting', {
        item_id: itemId
      });
      return result as boolean;
    } catch (error) {
      console.error('Failed to delete view item setting:', error);
      return false;
    }
  }
}
