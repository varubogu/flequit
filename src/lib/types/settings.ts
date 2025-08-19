/**
 * 設定関連の型定義
 */

/**
 * アプリケーション設定項目
 */
export interface Setting {
  /** 設定ID */
  id: string;
  /** 設定キー */
  key: string;
  /** 設定値 */
  value: string;
  /** データ型 */
  data_type: 'string' | 'number' | 'boolean' | 'json';
  /** 作成日時 */
  created_at: Date;
  /** 更新日時 */
  updated_at: Date;
}

/**
 * ユーザーアカウント情報
 */
export interface Account {
  /** アカウントID */
  id: string;
  /** メールアドレス */
  email?: string;
  /** 表示名 */
  display_name?: string;
  /** アバターURL */
  avatar_url?: string;
  /** 認証プロバイダー */
  provider: 'local' | 'google' | 'github' | 'microsoft';
  /** プロバイダー固有ID */
  provider_id?: string;
  /** アカウント有効状態 */
  is_active: boolean;
  /** 作成日時 */
  created_at: Date;
  /** 更新日時 */
  updated_at: Date;
}

/**
 * 週の開始曜日
 */
export type WeekStart = 'sunday' | 'monday';

/**
 * テーマ設定
 */
export type Theme = 'system' | 'light' | 'dark';

/**
 * ビューアイテム（タスク表示設定用）
 */
export interface ViewItem {
  id: string;
  label: string;
  icon: string;
  visible: boolean;
  order: number;
}

/**
 * カスタム日付フォーマット
 */
export interface CustomDateFormat {
  /** フォーマットID */
  id: string;
  /** フォーマット名 */
  name: string;
  /** フォーマット文字列 */
  format: string;
}

/**
 * 時刻ラベル
 */
export interface TimeLabel {
  /** ラベルID */
  id: string;
  /** ラベル名 */
  name: string;
  /** 時刻（HH:mm形式） */
  time: string;
}

/**
 * アプリケーション設定（フラット構造）
 */
export interface Settings {
  // テーマ・外観設定
  /** UIテーマ */
  theme: Theme;
  /** 言語設定（ISO 639-1形式） */
  language: string;
  /** フォント名 */
  font: string;
  /** フォントサイズ */
  fontSize: number;
  /** フォント色 */
  fontColor: string;
  /** 背景色 */
  backgroundColor: string;

  // 基本設定
  /** 週の開始曜日 */
  weekStart: WeekStart;
  /** タイムゾーン */
  timezone: string;
  /** 日付フォーマット */
  dateFormat: string;
  /** カスタム期日日数 */
  customDueDays: number[];
  /** カスタム日付フォーマット */
  customDateFormats: CustomDateFormat[];
  /** 時刻ラベル */
  timeLabels: TimeLabel[];

  // 表示設定
  /** 期日ボタンの表示設定 */
  dueDateButtons: {
    /** 期限切れ */
    overdue: boolean;
    /** 今日 */
    today: boolean;
    /** 明日 */
    tomorrow: boolean;
    /** 3日以内 */
    threeDays: boolean;
    /** 今週 */
    thisWeek: boolean;
    /** 今月 */
    thisMonth: boolean;
    /** 今四半期 */
    thisQuarter: boolean;
    /** 今年 */
    thisYear: boolean;
    /** 年末 */
    thisYearEnd: boolean;
  };
  /** ビューアイテム設定 */
  viewItems: ViewItem[];

  // アカウント設定
  /** 選択中のアカウント */
  selectedAccount: string;
  /** アカウントアイコン */
  accountIcon: string | null;
  /** アカウント名 */
  accountName: string;
  /** メールアドレス */
  email: string;
  /** パスワード */
  password: string;
  /** サーバーURL */
  serverUrl: string;
}
