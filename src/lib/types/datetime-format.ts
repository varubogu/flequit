/**
 * 日時フォーマット関連の型定義
 */

/**
 * フォーマットのグループ分け
 */
export type DateTimeFormatGroup = 'デフォルト' | 'プリセット' | 'カスタム' | 'カスタムフォーマット';

/**
 * 日時フォーマットの基本インターフェース
 */
export interface DateTimeFormat {
  /** ID（アプリ固定: 負の整数、カスタム: UUID） */
  id: string | number;
  /** フォーマット名 */
  name: string;
  /** フォーマット文字列 */
  format: string;
  /** フォーマットのグループ */
  group: DateTimeFormatGroup;
  /** 表示順序 */
  order: number;
}

/**
 * アプリ固定フォーマット（デフォルト・プリセット）
 */
export interface AppPresetFormat extends DateTimeFormat {
  /** 負の整数ID */
  id: number;
}

/**
 * ユーザーカスタムフォーマット
 */
export interface CustomDateTimeFormat extends DateTimeFormat {
  /** UUID */
  id: string;
  /** カスタムフォーマットグループ */
  group: 'カスタムフォーマット';
}
