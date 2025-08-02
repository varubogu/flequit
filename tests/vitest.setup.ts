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

    // ステータス関連
    status_not_started: 'Not Started',
    status_in_progress: 'In Progress',
    status_waiting: 'Waiting',
    status_completed: 'Completed',
    status_cancelled: 'Cancelled',

    // 優先度関連
    high_priority: 'High',
    medium_priority: 'Medium',
    low_priority: 'Low',
    lowest_priority: 'Lowest',

    // 検索関連
    search_tasks: 'Search tasks',
    search: 'Search',
    show_all_results_for: 'Show all results for',
    add_new_task: 'Add new task',
    view_all_tasks: 'View all tasks',

    // 繰り返し関連
    no_recurrence: 'No recurrence',
    every: 'Every',
    day: 'day',
    days: 'days',
    day_plural: 'days',
    week: 'week',
    weeks: 'weeks',
    week_plural: 'weeks',
    month: 'month',
    months: 'months',
    month_plural: 'months',
    year: 'year',
    years: 'years',
    year_plural: 'years',
    minute: 'minute',
    minute_plural: 'minutes',
    hour: 'hour',
    hour_plural: 'hours',
    quarter: 'quarter',
    quarter_plural: 'quarters',
    half_year: 'half year',
    half_year_plural: 'half years',
    every_interval_unit: 'Every {interval} {unit}',
    recurrence_weekly_days: 'on {days}',
    recurrence_monthly_detail: '({detail})',
    recurrence_end_date: 'until {endDate}',
    recurrence_max_occurrences: 'for {count} times',
    day_of_month: '{day}',
    sunday: 'Sunday',
    monday: 'Monday',
    tuesday: 'Tuesday',
    wednesday: 'Wednesday',
    thursday: 'Thursday',
    friday: 'Friday',
    saturday: 'Saturday',
    day_short_sun: 'Sun',
    day_short_mon: 'Mon',
    day_short_tue: 'Tue',
    day_short_wed: 'Wed',
    day_short_thu: 'Thu',
    day_short_fri: 'Fri',
    day_short_sat: 'Sat',
    first_week: 'first',
    second_week: 'second',
    third_week: 'third',
    fourth_week: 'fourth',
    last_week: 'last',

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
    overdue: 'Overdue',
    tomorrow: 'Tomorrow',
    next_3_days: 'Next 3 Days',
    next_week: 'Next Week',
    this_month: 'This Month',
    os_timezone: 'OS Timezone',

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

    // ステータス関連
    status_not_started: '未開始',
    status_in_progress: '進行中',
    status_waiting: '待機中',
    status_completed: '完了',
    status_cancelled: 'キャンセル',

    // 優先度関連
    high_priority: '高',
    medium_priority: '中',
    low_priority: '低',
    lowest_priority: '最低',

    // 検索関連
    search_tasks: 'タスクを検索',
    search: '検索',
    show_all_results_for: 'すべての結果を表示',
    add_new_task: '新しいタスクを追加',
    view_all_tasks: '全てのタスクを表示',

    // 繰り返し関連
    no_recurrence: '繰り返しなし',
    every: '毎',
    day: '日',
    days: '日',
    day_plural: '日',
    week: '週',
    weeks: '週',
    week_plural: '週',
    month: '月',
    months: '月',
    month_plural: '月',
    year: '年',
    years: '年',
    year_plural: '年',
    minute: '分',
    minute_plural: '分',
    hour: '時間',
    hour_plural: '時間',
    quarter: '四半期',
    quarter_plural: '四半期',
    half_year: '半年',
    half_year_plural: '半年',
    every_interval_unit: '毎{interval}{unit}',
    recurrence_weekly_days: '{days}',
    recurrence_monthly_detail: '({detail})',
    recurrence_end_date: '{endDate}まで',
    recurrence_max_occurrences: '{count}回',
    day_of_month: '{day}',
    sunday: '日曜日',
    monday: '月曜日',
    tuesday: '火曜日',
    wednesday: '水曜日',
    thursday: '木曜日',
    friday: '金曜日',
    saturday: '土曜日',
    day_short_sun: '日',
    day_short_mon: '月',
    day_short_tue: '火',
    day_short_wed: '水',
    day_short_thu: '木',
    day_short_fri: '金',
    day_short_sat: '土',
    first_week: '第1',
    second_week: '第2',
    third_week: '第3',
    fourth_week: '第4',
    last_week: '最終',

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
    overdue: '期限切れ',
    tomorrow: '明日',
    next_3_days: '次の3日',
    next_week: '来週',
    this_month: '今月',
    os_timezone: 'OSタイムゾーン',

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
