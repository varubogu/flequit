import '@testing-library/jest-dom';
import { setTranslationService } from '$lib/stores/locale.svelte';
import { MockTranslationService } from '$lib/services/mock-translation-service';

// 全テストでモック翻訳サービスを使用
const mockTranslationService = new MockTranslationService('en', {
  en: {
    // 共通メッセージ
    ok: 'OK',
    cancel: 'Cancel',
    delete: 'Delete',
    edit: 'Edit',
    save: 'Save',
    close: 'Close',
    yes: 'Yes',
    no: 'No',
    loading: 'Loading...',
    error: 'Error',
    success: 'Success',
    warning: 'Warning',

    // タスク関連
    task_title: 'Task Title',
    task_description: 'Description',
    task_status: 'Status',
    task_priority: 'Priority',
    task_due_date: 'Due Date',
    add_task: 'Add Task',
    edit_task: 'Edit Task',
    delete_task: 'Delete Task',

    // 設定関連
    settings: 'Settings',
    general_settings: 'General Settings',
    account_settings: 'Account Settings',
    account_type: 'Account Type',
    local_account: 'Local Account',
    cloud_account: 'Cloud Account',
    account_name: 'Account Name',
    email: 'Email',
    password: 'Password',
    server_url: 'Server URL',
    using_local_account: 'Using local account',
    to_access_cloud_features: 'To access cloud features',
    local_account_description:
      'Using local account. To access cloud features, switch to cloud account.',
    organization: 'Organization',
    choose_file: 'Choose File',
    email_address: 'Email',
    account_icon: 'Account Icon',
    language: 'Language',
    timezone: 'Timezone',
    date_format: 'Date Format',
    week_starts_on: 'Week starts on',
    sunday: 'Sunday',
    monday: 'Monday',
    preview: 'Preview',
    current_effective_timezone: 'Current Effective Timezone',
    edit_date_format: 'Edit Date Format',
    add_custom_due_date_button: 'Add Custom Due Date',
    add_custom_due_date: 'Add Custom Due Date',

    // プロジェクト関連
    project: 'Project',
    projects: 'Projects',
    add_project: 'Add Project',
    edit_project: 'Edit Project',
    delete_project: 'Delete Project',

    // タグ関連
    tag: 'Tag',
    tags: 'Tags',
    add_tag: 'Add Tag',
    edit_tag: 'Edit Tag',
    delete_tag: 'Delete Tag',

    // ビュー関連
    views: 'Views',
    today: 'Today',
    upcoming: 'Upcoming',
    completed: 'Completed',
    all_tasks: 'All Tasks',

    // 外観・テーマ関連
    appearance: 'Appearance',
    appearance_description: 'Customize the app appearance',
    appearance_settings: 'Appearance Settings',
    background_color: 'Background Color',
    dark: 'Dark',
    light: 'Light',
    system: 'System',
    theme: 'Theme',
    default_font: 'Default Font',

    // 日付フォーマット関連
    date_format_editor: 'Date Format Editor',
    enter_format_name: 'Enter format name',
    delete_format_title: 'Delete Format',
    delete_format_message: 'Are you sure you want to delete this format?',
    add_new: 'Add New',

    // その他
    configure_preferences: 'Configure your preferences',
    account: 'Account',
    account_description: 'Manage your account settings',
    utc: 'UTC',
    eastern_time: 'Eastern Time',
    japan_time: 'Japan Time',
    subtasks_completed: '{completed} of {total} subtasks completed',
    example_organization: 'Example Organization'
  },
  ja: {
    // 共通メッセージ
    ok: 'OK',
    cancel: 'キャンセル',
    delete: '削除',
    edit: '編集',
    save: '保存',
    close: '閉じる',
    yes: 'はい',
    no: 'いいえ',
    loading: '読み込み中...',
    error: 'エラー',
    success: '成功',
    warning: '警告',

    // タスク関連
    task_title: 'タスクタイトル',
    task_description: '説明',
    task_status: 'ステータス',
    task_priority: '優先度',
    task_due_date: '期限',
    add_task: 'タスクを追加',
    edit_task: 'タスクを編集',
    delete_task: 'タスクを削除',

    // 設定関連
    settings: '設定',
    general_settings: '一般設定',
    account_settings: 'アカウント設定',
    account_type: 'アカウントタイプ',
    local_account: 'ローカルアカウント',
    cloud_account: 'クラウドアカウント',
    account_name: 'アカウント名',
    email: 'メールアドレス',
    password: 'パスワード',
    server_url: 'サーバーURL',
    using_local_account: 'ローカルアカウントを使用中',
    to_access_cloud_features: 'クラウド機能にアクセスするには',
    local_account_description:
      'ローカルアカウントを使用中。クラウド機能にアクセスするには、クラウドアカウントに切り替えてください。',
    organization: '組織',
    choose_file: 'ファイルを選択',
    email_address: 'メールアドレス',
    account_icon: 'アカウントアイコン',
    language: '言語',
    timezone: 'タイムゾーン',
    date_format: '日付フォーマット',
    week_starts_on: '週の始まり',
    sunday: '日曜日',
    monday: '月曜日',
    preview: 'プレビュー',
    current_effective_timezone: '現在の有効なタイムゾーン',
    edit_date_format: '日付フォーマットを編集',
    add_custom_due_date_button: 'カスタム期限を追加',
    add_custom_due_date: 'カスタム期限を追加',

    // プロジェクト関連
    project: 'プロジェクト',
    projects: 'プロジェクト',
    add_project: 'プロジェクトを追加',
    edit_project: 'プロジェクトを編集',
    delete_project: 'プロジェクトを削除',

    // タグ関連
    tag: 'タグ',
    tags: 'タグ',
    add_tag: 'タグを追加',
    edit_tag: 'タグを編集',
    delete_tag: 'タグを削除',

    // ビュー関連
    views: 'ビュー',
    today: '今日',
    upcoming: '今後',
    completed: '完了',
    all_tasks: '全てのタスク',

    // 外観・テーマ関連
    appearance: '外観',
    appearance_description: 'アプリの外観をカスタマイズ',
    appearance_settings: '外観設定',
    background_color: '背景色',
    dark: 'ダーク',
    light: 'ライト',
    system: 'システム',
    theme: 'テーマ',
    default_font: 'デフォルトフォント',

    // 日付フォーマット関連
    date_format_editor: '日付フォーマットエディター',
    enter_format_name: 'フォーマット名を入力',
    delete_format_title: 'フォーマットを削除',
    delete_format_message: 'このフォーマットを削除してもよろしいですか？',
    add_new: '新規追加',

    // その他
    configure_preferences: '設定を構成',
    account: 'アカウント',
    account_description: 'アカウント設定を管理',
    utc: 'UTC',
    eastern_time: '東部時間',
    japan_time: '日本時間',
    subtasks_completed: '{total}個中{completed}個のサブタスクが完了',
    example_organization: 'サンプル組織'
  }
});

setTranslationService(mockTranslationService);

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  root = null;
  rootMargin = '';
  thresholds = [];

  constructor() {}
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() {
    return [];
  }
} as unknown as ResizeObserver;

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => {}
  })
});

// Mock scrollIntoView
Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
  value: () => {},
  writable: true
});

// Mock console methods to avoid noise in tests
const originalConsole = console;
global.console = {
  ...originalConsole,
  // Keep error and warn for debugging
  log: () => {},
  debug: () => {},
  info: () => {}
};
