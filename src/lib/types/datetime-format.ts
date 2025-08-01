// 日時フォーマット関連の型定義

export type DateTimeFormatGroup = 'デフォルト' | 'プリセット' | 'カスタム' | 'カスタムフォーマット';

export interface DateTimeFormat {
  id: string | number; // アプリ固定: 負の整数、カスタム: UUID
  name: string;
  format: string;
  group: DateTimeFormatGroup;
  order: number;
}

// アプリ固定フォーマット（デフォルト・プリセット）
export interface AppPresetFormat extends DateTimeFormat {
  id: number; // 負の整数
}

// ユーザーカスタムフォーマット
export interface CustomDateTimeFormat extends DateTimeFormat {
  id: string; // UUID
  group: 'カスタムフォーマット';
}
