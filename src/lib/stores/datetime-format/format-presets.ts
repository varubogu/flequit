import type { AppPresetFormat } from '$lib/types/datetime-format';
import { getLocale } from '$paraglide/runtime';

/**
 * デフォルトフォーマットを取得（ID: -1）
 */
export function getDefaultFormat(): AppPresetFormat {
  return {
    id: -1,
    name: 'デフォルト',
    format: '',
    group: 'デフォルト',
    order: 0
  };
}

/**
 * プリセットフォーマット一覧を取得（ID: 負の整数）
 */
export function getPresetFormats(): AppPresetFormat[] {
  const locale = getLocale();

  if (locale.startsWith('ja')) {
    return [
      {
        id: -2,
        name: '日本（西暦、24時間表記）',
        format: 'yyyy年MM月dd日 HH:mm:ss',
        group: 'プリセット',
        order: 0
      },
      {
        id: -3,
        name: '日本（和暦、12時間表記）',
        format: 'yyyy年MM月dd日 hh:mm:ss',
        group: 'プリセット',
        order: 1
      },
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

/**
 * カスタムエントリを取得（ID: -10）
 */
export function getCustomEntry(): AppPresetFormat {
  return {
    id: -10,
    name: 'カスタム',
    format: '',
    group: 'カスタム',
    order: 0
  };
}
