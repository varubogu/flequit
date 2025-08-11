// 設定関連の型定義

export interface Setting {
  id: string;
  key: string;
  value: string;
  data_type: 'string' | 'number' | 'boolean' | 'json';
  created_at: Date;
  updated_at: Date;
}

export interface Account {
  id: string;
  email?: string;
  display_name?: string;
  avatar_url?: string;
  provider: 'local' | 'google' | 'github' | 'microsoft';
  provider_id?: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

// 週の開始曜日の型定義
export type WeekStart = 'sunday' | 'monday';

// UI設定用の型定義
export interface AppearanceSettings {
  font: string;
  fontSize: number;
  fontColor: string;
  backgroundColor: string;
}

export interface BasicSettings {
  weekStart: WeekStart;
  timezone: string;
  dateFormat: string;
  customDueDays: number[];
}

export interface ViewSettings {
  dueDateButtons: {
    overdue: boolean;
    today: boolean;
    tomorrow: boolean;
    threeDays: boolean;
    thisWeek: boolean;
    thisMonth: boolean;
    thisQuarter: boolean;
    thisYear: boolean;
    thisYearEnd: boolean;
  };
}

export interface AccountSettings {
  selectedAccount: string;
  accountIcon: string | null;
  accountName: string;
  email: string;
  password: string;
  serverUrl: string;
}

// カスタム日付フォーマット
export interface CustomDateFormat {
  id: string;
  name: string;
  format: string;
}

// 時刻ラベル
export interface TimeLabel {
  id: string;
  name: string;
  time: string; // HH:mm format
}

// 全設定をまとめた型
export interface AllSettings {
  basic: BasicSettings;
  appearance: AppearanceSettings;
  views: ViewSettings;
  account: AccountSettings;
}