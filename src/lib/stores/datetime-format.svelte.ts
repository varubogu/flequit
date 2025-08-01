import { getLocale } from '$paraglide/runtime';
import type { DateTimeFormat, AppPresetFormat, CustomDateTimeFormat } from '$lib/types/datetime-format';
import { getTranslationService } from '$lib/stores/locale.svelte';

// デフォルトフォーマット（ID: -1）
function getDefaultFormat(): AppPresetFormat {
  return {
    id: -1,
    name: 'デフォルト',
    format: '',
    group: 'デフォルト',
    order: 0
  };
}

// プリセットフォーマット（ID: 負の整数）
function getPresetFormats(): AppPresetFormat[] {
  const locale = getLocale();
  
  if (locale.startsWith('ja')) {
    return [
      { id: -2, name: '日本（西暦、24時間表記）', format: 'yyyy年MM月dd日 HH:mm:ss', group: 'プリセット', order: 0 },
      { id: -3, name: '日本（和暦、12時間表記）', format: 'yyyy年MM月dd日 hh:mm:ss', group: 'プリセット', order: 1 },
      { id: -4, name: '短縮形式', format: 'yyyy/MM/dd HH:mm', group: 'プリセット', order: 2 },
      { id: -5, name: '日付のみ', format: 'yyyy年MM月dd日', group: 'プリセット', order: 3 },
      { id: -6, name: '時刻のみ', format: 'HH:mm:ss', group: 'プリセット', order: 4 },
      { id: -7, name: 'ISO形式', format: 'yyyy-MM-dd HH:mm:ss', group: 'プリセット', order: 5 }
    ];
  } else {
    return [
      { id: -2, name: 'America', format: 'MM/dd/yyyy HH:mm:ss', group: 'プリセット', order: 0 },
      { id: -3, name: 'Europe', format: 'dd/MM/yyyy HH:mm:ss', group: 'プリセット', order: 1 },
      { id: -4, name: 'Short format', format: 'MM/dd/yyyy HH:mm', group: 'プリセット', order: 2 },
      { id: -5, name: 'Date only', format: 'MMMM do, yyyy', group: 'プリセット', order: 3 },
      { id: -6, name: 'Time only', format: 'HH:mm:ss', group: 'プリセット', order: 4 },
      { id: -7, name: 'ISO format', format: 'yyyy-MM-dd HH:mm:ss', group: 'プリセット', order: 5 }
    ];
  }
}

// カスタムエントリ（ID: -10）
function getCustomEntry(): AppPresetFormat {
  return {
    id: -10,
    name: 'カスタム',
    format: '',
    group: 'カスタム',
    order: 0
  };
}

class DateTimeFormatStore {
  // 現在の日時フォーマット（ストア管理、即座反映）
  currentFormat = $state('yyyy年MM月dd日 HH:mm:ss');
  
  // ユーザー定義カスタムフォーマット（ストア管理、即座反映）
  customFormats = $state<CustomDateTimeFormat[]>([]);
  
  // 全フォーマットの統合リスト（$derived）
  allFormats = $derived(() => {
    const defaultFormat = getDefaultFormat();
    const presetFormats = getPresetFormats();
    const customEntry = getCustomEntry();
    
    return [
      defaultFormat,
      ...presetFormats,
      ...this.customFormats,
      customEntry
    ] as DateTimeFormat[];
  });

  // デフォルトフォーマットを取得
  getDefaultFormatString(locale: string = getLocale()): string {
    if (locale.startsWith('ja')) {
      return 'yyyy年MM月dd日(E) HH:mm:ss';
    } else {
      return 'EEEE, MMMM do, yyyy HH:mm:ss';
    }
  }

  // 現在フォーマットを設定（即座反映）
  setCurrentFormat(format: string) {
    this.currentFormat = format;
    this.saveToStorage();
  }

  // カスタムフォーマットを追加（即座反映）
  addCustomFormat(name: string, format: string): string {
    const uuid = this.generateUUID();
    let attempts = 0;
    let finalUuid = uuid;
    
    // 衝突回避（最大10回試行）
    while (attempts < 10 && this.customFormats.some(f => f.id === finalUuid)) {
      finalUuid = this.generateUUID();
      attempts++;
    }
    
    if (attempts >= 10) {
      throw new Error('Failed to generate unique UUID after 10 attempts');
    }
    
    const newFormat: CustomDateTimeFormat = {
      id: finalUuid,
      name,
      format,
      group: 'カスタムフォーマット',
      order: this.customFormats.length
    };
    
    this.customFormats.push(newFormat);
    this.saveToStorage();
    return finalUuid;
  }

  // カスタムフォーマットを更新（即座反映）
  updateCustomFormat(id: string, updates: Partial<Pick<CustomDateTimeFormat, 'name' | 'format'>>) {
    const index = this.customFormats.findIndex(f => f.id === id);
    if (index !== -1) {
      this.customFormats[index] = { ...this.customFormats[index], ...updates };
      this.saveToStorage();
    }
  }

  // カスタムフォーマットを削除（即座反映）
  removeCustomFormat(id: string) {
    this.customFormats = this.customFormats.filter(f => f.id !== id);
    this.saveToStorage();
  }

  // UUIDを生成
  private generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  // ローカルストレージに保存
  private saveToStorage() {
    if (typeof localStorage !== 'undefined') {
      const data = {
        currentFormat: this.currentFormat,
        customFormats: this.customFormats
      };
      localStorage.setItem('flequit-datetime-format', JSON.stringify(data));
    }
  }

  // ローカルストレージから読み込み
  private loadFromStorage() {
    if (typeof localStorage !== 'undefined') {
      const stored = localStorage.getItem('flequit-datetime-format');
      if (stored) {
        try {
          const data = JSON.parse(stored);
          if (data.currentFormat) {
            this.currentFormat = data.currentFormat;
          }
          if (Array.isArray(data.customFormats)) {
            this.customFormats = data.customFormats;
          }
        } catch (error) {
          console.error('Failed to load datetime format settings:', error);
        }
      }
    }
  }

  constructor() {
    this.loadFromStorage();
  }
}

export const dateTimeFormatStore = new DateTimeFormatStore();