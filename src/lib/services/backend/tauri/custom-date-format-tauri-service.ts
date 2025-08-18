import { invoke } from '@tauri-apps/api/core';
import type { CustomDateFormat } from '$lib/types/settings';

export interface CustomDateFormatService {
  create(format: CustomDateFormat): Promise<CustomDateFormat | null>;
  get(id: string): Promise<CustomDateFormat | null>;
  getAll(): Promise<CustomDateFormat[]>;
  update(format: CustomDateFormat): Promise<CustomDateFormat | null>;
  delete(id: string): Promise<boolean>;
}

export class CustomDateFormatTauriService implements CustomDateFormatService {
  async create(format: CustomDateFormat): Promise<CustomDateFormat | null> {
    try {
      const result = await invoke('add_custom_date_format_setting', { format }) as CustomDateFormat;
      return result;
    } catch (error) {
      console.error('Failed to create custom date format:', error);
      return null;
    }
  }

  async get(id: string): Promise<CustomDateFormat | null> {
    try {
      const result = await invoke('get_custom_date_format_setting', { id }) as CustomDateFormat | null;
      return result;
    } catch (error) {
      console.error('Failed to get custom date format:', error);
      return null;
    }
  }

  async getAll(): Promise<CustomDateFormat[]> {
    try {
      const result = await invoke('get_all_custom_date_format_settings') as CustomDateFormat[];
      return result;
    } catch (error) {
      console.error('Failed to get all custom date formats:', error);
      return [];
    }
  }

  async update(format: CustomDateFormat): Promise<CustomDateFormat | null> {
    try {
      const result = await invoke('update_custom_date_format_setting', { format }) as CustomDateFormat;
      return result;
    } catch (error) {
      console.error('Failed to update custom date format:', error);
      return null;
    }
  }

  async delete(id: string): Promise<boolean> {
    try {
      await invoke('delete_custom_date_format_setting', { id });
      return true;
    } catch (error) {
      console.error('Failed to delete custom date format:', error);
      return false;
    }
  }
}