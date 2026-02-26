/* eslint-disable no-restricted-imports -- TODO [計画02]: フロントエンド層方針の再定義と移行で対応予定。期限: 2026-04-30 */
import type { CustomDateTimeFormat } from '$lib/types/datetime-format';
import type { CustomDateFormat } from '$lib/types/settings';
import {
  CustomDateFormatTauriService,
  type CustomDateFormatService
} from '$lib/infrastructure/backends/tauri/custom-date-format-tauri-service';

const STORAGE_KEY = 'flequit-datetime-format';

/**
 * フォーマット設定の永続化
 *
 * 責務: localStorageとTauriバックエンドからのフォーマット読み書き
 */
export class FormatStorage {
  constructor(
    private readonly customDateFormatService: CustomDateFormatService = new CustomDateFormatTauriService()
  ) {}

  private getLocalStorage(): Pick<Storage, 'getItem' | 'setItem'> | null {
    const storage = globalThis.localStorage;
    if (
      !storage ||
      typeof storage.getItem !== 'function' ||
      typeof storage.setItem !== 'function'
    ) {
      return null;
    }
    return storage;
  }

  /**
   * 現在のフォーマットをlocalStorageに保存
   */
  saveCurrentFormat(format: string): void {
    const storage = this.getLocalStorage();
    if (storage) {
      const data = { currentFormat: format };
      storage.setItem(STORAGE_KEY, JSON.stringify(data));
    }
  }

  /**
   * localStorageから現在のフォーマットを読み込み
   */
  loadCurrentFormat(defaultFormat: string): string {
    const storage = this.getLocalStorage();
    if (storage) {
      const stored = storage.getItem(STORAGE_KEY);
      if (stored) {
        try {
          const data = JSON.parse(stored);
          if (data.currentFormat) {
            return data.currentFormat;
          }
        } catch (error) {
          console.error('Failed to load datetime format settings:', error);
        }
      }
    }
    return defaultFormat;
  }

  /**
   * Tauriバックエンドからカスタムフォーマット一覧を読み込み
   */
  async loadCustomFormatsFromTauri(): Promise<CustomDateTimeFormat[]> {
    try {
      const tauriFormats = await this.customDateFormatService.getAll();
      return tauriFormats.map((f) => this.convertFromTauri(f));
    } catch (error) {
      console.error('Failed to load custom formats from Tauri:', error);
      return [];
    }
  }

  /**
   * Tauriから取得したデータをフロントエンド形式に変換
   */
  private convertFromTauri(tauriFormat: CustomDateFormat): CustomDateTimeFormat {
    return {
      id: tauriFormat.id,
      name: tauriFormat.name,
      format: tauriFormat.format,
      group: 'カスタムフォーマット',
      order: 0
    };
  }
}
