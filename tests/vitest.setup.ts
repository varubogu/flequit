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
    all_tasks: 'All Tasks'
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
    all_tasks: '全てのタスク'
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
