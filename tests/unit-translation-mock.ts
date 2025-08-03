/**
 * 単体テスト用の翻訳モック
 * 全ての翻訳キーに対して一意のテスト値を提供します
 * 本来の翻訳とは異なり、キーが違えば必ず異なる値になるため、テストでの区別が容易です
 */

export const unitTestTranslations = {
  // 共通メッセージ
  ok: 'TEST_OK',
  cancel: 'TEST_CANCEL',
  delete: 'TEST_DELETE',
  edit: 'TEST_EDIT',
  save: 'TEST_SAVE',
  close: 'TEST_CLOSE',
  yes: 'TEST_YES',
  no: 'TEST_NO',
  loading: 'TEST_LOADING',
  error: 'TEST_ERROR',
  success: 'TEST_SUCCESS',
  warning: 'TEST_WARNING',

  // タスク関連
  task_title: 'TEST_TASK_TITLE',
  task_description: 'TEST_TASK_DESCRIPTION',
  task_status: 'TEST_TASK_STATUS',
  task_priority: 'TEST_TASK_PRIORITY',
  task_due_date: 'TEST_TASK_DUE_DATE',
  add_task: 'TEST_ADD_TASK',
  edit_task: 'TEST_EDIT_TASK',
  delete_task: 'TEST_DELETE_TASK',

  // ステータス関連
  status_not_started: 'TEST_STATUS_NOT_STARTED',
  status_in_progress: 'TEST_STATUS_IN_PROGRESS',
  status_waiting: 'TEST_STATUS_WAITING',
  status_completed: 'TEST_STATUS_COMPLETED',
  status_cancelled: 'TEST_STATUS_CANCELLED',

  // 優先度関連
  high_priority: 'TEST_HIGH_PRIORITY',
  medium_priority: 'TEST_MEDIUM_PRIORITY',
  low_priority: 'TEST_LOW_PRIORITY',
  lowest_priority: 'TEST_LOWEST_PRIORITY',

  // 検索関連
  search_tasks: 'TEST_SEARCH_TASKS',
  search: 'TEST_SEARCH',
  show_all_results_for: 'TEST_SHOW_ALL_RESULTS_FOR',
  add_new_task: 'TEST_ADD_NEW_TASK',
  view_all_tasks: 'TEST_VIEW_ALL_TASKS',
  type_a_command: 'TEST_TYPE_A_COMMAND',
  no_commands_found: 'TEST_NO_COMMANDS_FOUND',
  no_tasks_found: 'TEST_NO_TASKS_FOUND',
  commands: 'TEST_COMMANDS',
  jump_to_task: 'TEST_JUMP_TO_TASK',
  results: 'TEST_RESULTS',
  no_matching_tasks_found: 'TEST_NO_MATCHING_TASKS_FOUND',
  show_all_tasks: 'TEST_SHOW_ALL_TASKS',
  quick_actions: 'TEST_QUICK_ACTIONS',

  // 繰り返し関連
  no_recurrence: 'TEST_NO_RECURRENCE',
  every: 'TEST_EVERY',
  day: 'TEST_DAY',
  days: 'TEST_DAYS',
  day_plural: 'TEST_DAY_PLURAL',
  week: 'TEST_WEEK',
  weeks: 'TEST_WEEKS',
  week_plural: 'TEST_WEEK_PLURAL',
  month: 'TEST_MONTH',
  months: 'TEST_MONTHS',
  month_plural: 'TEST_MONTH_PLURAL',
  year: 'TEST_YEAR',
  years: 'TEST_YEARS',
  year_plural: 'TEST_YEAR_PLURAL',
  minute: 'TEST_MINUTE',
  minute_plural: 'TEST_MINUTE_PLURAL',
  hour: 'TEST_HOUR',
  hour_plural: 'TEST_HOUR_PLURAL',
  quarter: 'TEST_QUARTER',
  quarter_plural: 'TEST_QUARTER_PLURAL',
  half_year: 'TEST_HALF_YEAR',
  half_year_plural: 'TEST_HALF_YEAR_PLURAL',
  every_interval_unit: 'TEST_EVERY_INTERVAL_UNIT',
  recurrence_weekly_days: 'TEST_RECURRENCE_WEEKLY_DAYS',
  recurrence_monthly_detail: 'TEST_RECURRENCE_MONTHLY_DETAIL',
  recurrence_end_date: 'TEST_RECURRENCE_END_DATE',
  recurrence_max_occurrences: 'TEST_RECURRENCE_MAX_OCCURRENCES',
  day_of_month: 'TEST_DAY_OF_MONTH',
  recurrence: 'TEST_RECURRENCE',
  recurrence_disabled: 'TEST_RECURRENCE_DISABLED',
  recurrence_enabled: 'TEST_RECURRENCE_ENABLED',
  recurrence_advanced: 'TEST_RECURRENCE_ADVANCED',
  recurrence_settings: 'TEST_RECURRENCE_SETTINGS',
  recurrence_level: 'TEST_RECURRENCE_LEVEL',
  recurrence_interval: 'TEST_RECURRENCE_INTERVAL',
  recurrence_adjustment: 'TEST_RECURRENCE_ADJUSTMENT',
  no_adjustment: 'TEST_NO_ADJUSTMENT',
  weekday_adjustment: 'TEST_WEEKDAY_ADJUSTMENT',
  max_occurrences_placeholder: 'TEST_MAX_OCCURRENCES_PLACEHOLDER',
  adjustment_conditions: 'TEST_ADJUSTMENT_CONDITIONS',
  date_conditions: 'TEST_DATE_CONDITIONS',
  weekday_conditions: 'TEST_WEEKDAY_CONDITIONS',
  add: 'TEST_ADD',
  before: 'TEST_BEFORE',
  on_or_before: 'TEST_ON_OR_BEFORE',
  on_or_after: 'TEST_ON_OR_AFTER',
  after: 'TEST_AFTER',
  repeat_count: 'TEST_REPEAT_COUNT',
  infinite_repeat_placeholder: 'TEST_INFINITE_REPEAT_PLACEHOLDER',
  infinite_repeat_description: 'TEST_INFINITE_REPEAT_DESCRIPTION',
  sunday: 'TEST_SUNDAY',
  monday: 'TEST_MONDAY',
  tuesday: 'TEST_TUESDAY',
  wednesday: 'TEST_WEDNESDAY',
  thursday: 'TEST_THURSDAY',
  friday: 'TEST_FRIDAY',
  saturday: 'TEST_SATURDAY',
  day_short_sun: 'TEST_DAY_SHORT_SUN',
  day_short_mon: 'TEST_DAY_SHORT_MON',
  day_short_tue: 'TEST_DAY_SHORT_TUE',
  day_short_wed: 'TEST_DAY_SHORT_WED',
  day_short_thu: 'TEST_DAY_SHORT_THU',
  day_short_fri: 'TEST_DAY_SHORT_FRI',
  day_short_sat: 'TEST_DAY_SHORT_SAT',
  first_week: 'TEST_FIRST_WEEK',
  second_week: 'TEST_SECOND_WEEK',
  third_week: 'TEST_THIRD_WEEK',
  fourth_week: 'TEST_FOURTH_WEEK',
  last_week: 'TEST_LAST_WEEK',

  // 設定関連
  settings: 'TEST_SETTINGS',
  general_settings: 'TEST_GENERAL_SETTINGS',
  account_settings: 'TEST_ACCOUNT_SETTINGS',
  account_type: 'TEST_ACCOUNT_TYPE',
  local_account: 'TEST_LOCAL_ACCOUNT',
  cloud_account: 'TEST_CLOUD_ACCOUNT',
  account_name: 'TEST_ACCOUNT_NAME',
  email: 'TEST_EMAIL',
  password: 'TEST_PASSWORD',
  server_url: 'TEST_SERVER_URL',
  using_local_account: 'TEST_USING_LOCAL_ACCOUNT',
  to_access_cloud_features: 'TEST_TO_ACCESS_CLOUD_FEATURES',
  local_account_description: 'TEST_LOCAL_ACCOUNT_DESCRIPTION',
  organization: 'TEST_ORGANIZATION',
  choose_file: 'TEST_CHOOSE_FILE',
  email_address: 'TEST_EMAIL_ADDRESS',
  account_icon: 'TEST_ACCOUNT_ICON',
  language: 'TEST_LANGUAGE',
  timezone: 'TEST_TIMEZONE',
  date_format: 'TEST_DATE_FORMAT',
  week_starts_on: 'TEST_WEEK_STARTS_ON',
  preview: 'TEST_PREVIEW',
  current_effective_timezone: 'TEST_CURRENT_EFFECTIVE_TIMEZONE',
  edit_date_format: 'TEST_EDIT_DATE_FORMAT',
  add_custom_due_date_button: 'TEST_ADD_CUSTOM_DUE_DATE_BUTTON',
  add_custom_due_date: 'TEST_ADD_CUSTOM_DUE_DATE',

  // プロジェクト関連
  project: 'TEST_PROJECT',
  projects: 'TEST_PROJECTS',
  add_project: 'TEST_ADD_PROJECT',
  edit_project: 'TEST_EDIT_PROJECT',
  delete_project: 'TEST_DELETE_PROJECT',

  // タグ関連
  tag: 'TEST_TAG',
  tags: 'TEST_TAGS',
  add_tag: 'TEST_ADD_TAG',
  edit_tag: 'TEST_EDIT_TAG',
  delete_tag: 'TEST_DELETE_TAG',

  // ビュー関連
  views: 'TEST_VIEWS',
  today: 'TEST_TODAY',
  upcoming: 'TEST_UPCOMING',
  completed: 'TEST_COMPLETED',
  all_tasks: 'TEST_ALL_TASKS',
  overdue: 'TEST_OVERDUE',
  tomorrow: 'TEST_TOMORROW',
  next_3_days: 'TEST_NEXT_3_DAYS',
  next_week: 'TEST_NEXT_WEEK',
  this_month: 'TEST_THIS_MONTH',
  os_timezone: 'TEST_OS_TIMEZONE',

  // 外観・テーマ関連
  appearance: 'TEST_APPEARANCE',
  appearance_description: 'TEST_APPEARANCE_DESCRIPTION',
  appearance_settings: 'TEST_APPEARANCE_SETTINGS',
  background_color: 'TEST_BACKGROUND_COLOR',
  dark: 'TEST_DARK',
  light: 'TEST_LIGHT',
  system: 'TEST_SYSTEM',
  theme: 'TEST_THEME',
  default_font: 'TEST_DEFAULT_FONT',

  // 日付フォーマット関連
  date_format_editor: 'TEST_DATE_FORMAT_EDITOR',
  enter_format_name: 'TEST_ENTER_FORMAT_NAME',
  delete_format_title: 'TEST_DELETE_FORMAT_TITLE',
  delete_format_message: 'TEST_DELETE_FORMAT_MESSAGE',
  add_new: 'TEST_ADD_NEW',

  // その他
  configure_preferences: 'TEST_CONFIGURE_PREFERENCES',
  account: 'TEST_ACCOUNT',
  account_description: 'TEST_ACCOUNT_DESCRIPTION',
  utc: 'TEST_UTC',
  eastern_time: 'TEST_EASTERN_TIME',
  japan_time: 'TEST_JAPAN_TIME',
  subtasks_completed: 'TEST_SUBTASKS_COMPLETED',
  example_organization: 'TEST_EXAMPLE_ORGANIZATION',

  // 日付関連
  add_date: 'TEST_ADD_DATE',

  // 曜日選択関連
  weekday: 'TEST_WEEKDAY',
  weekend: 'TEST_WEEKEND',
  holiday: 'TEST_HOLIDAY',
  non_holiday: 'TEST_NON_HOLIDAY',
  weekend_only: 'TEST_WEEKEND_ONLY',
  non_weekend: 'TEST_NON_WEEKEND',
  weekend_holiday: 'TEST_WEEKEND_HOLIDAY',
  non_weekend_holiday: 'TEST_NON_WEEKEND_HOLIDAY',

  // 条件エディター関連
  if: 'TEST_IF',
  is: 'TEST_IS',
  then: 'TEST_THEN',
  during: 'TEST_DURING',
  set_time_to: 'TEST_SET_TIME_TO',

  // ダイアログ関連
  confirm_discard_changes: 'TEST_CONFIRM_DISCARD_CHANGES',
  unsaved_task_message: 'TEST_UNSAVED_TASK_MESSAGE',
  discard: 'TEST_DISCARD',
  discard_changes: 'TEST_DISCARD_CHANGES',
  keep_editing: 'TEST_KEEP_EDITING',

  // アカウント・設定関連
  not_signed_in: 'TEST_NOT_SIGNED_IN',
  sign_in: 'TEST_SIGN_IN',
  switch_account: 'TEST_SWITCH_ACCOUNT',
  sign_out: 'TEST_SIGN_OUT',


  // プロジェクト・タスク関連
  new_task: 'TEST_NEW_TASK',
  task_list: 'TEST_TASK_LIST',
  subtask: 'TEST_SUBTASK',
  subtasks: 'TEST_SUBTASKS',

  // フォーム関連
  title: 'TEST_TITLE',
  description: 'TEST_DESCRIPTION',
  priority: 'TEST_PRIORITY',
  status: 'TEST_STATUS',
  due_date: 'TEST_DUE_DATE',

  // その他のUI要素
  menu: 'TEST_MENU',
  more_options: 'TEST_MORE_OPTIONS',
  help: 'TEST_HELP',
  open: 'TEST_OPEN',
  back: 'TEST_BACK',
  forward: 'TEST_FORWARD',
  refresh: 'TEST_REFRESH',

  // 方向関連
  previous: 'TEST_PREVIOUS',
  next: 'TEST_NEXT',

  // 時間関連
  select_date: 'TEST_SELECT_DATE',

  // その他のメッセージ
  search_results: 'TEST_SEARCH_RESULTS',
  no_results: 'TEST_NO_RESULTS',

  // コンテキストメニュー関連
  remove_tag_from_sidebar: 'TEST_REMOVE_TAG_FROM_SIDEBAR',
  add_task_list: 'TEST_ADD_TASK_LIST',
  edit_task_list: 'TEST_EDIT_TASK_LIST',
  delete_task_list: 'TEST_DELETE_TASK_LIST',
  toggle_task_lists: 'TEST_TOGGLE_TASK_LISTS',
  no_projects_yet: 'TEST_NO_PROJECTS_YET',

  // ビュー表示名
  all_tasks_view: 'All Tasks',
  today_view: 'Today',
  overdue_view: 'Overdue',
  views_title: 'TEST_VIEWS'
};

/**
 * 単体テスト用のモック翻訳サービス
 * getTranslationService()のモック化で使用することを想定
 */
export const createUnitTestTranslationService = (locale: string = 'en') => ({
  getCurrentLocale: () => locale,
  setLocale: () => {},
  getAvailableLocales: () => ['en', 'ja'] as const,
  reactiveMessage: <T extends (...args: unknown[]) => string>(messageFn: T): T => messageFn,
  getMessage: (key: string) => () => {
    // キーが存在する場合はテスト値を返し、存在しない場合はキー自体を返す
    return unitTestTranslations[key as keyof typeof unitTestTranslations] || key;
  },
  subscribe: () => () => {} // unsubscribe function
});

/**
 * 日本語モード用のモック翻訳サービス
 */
export const createJapaneseTestTranslationService = () => createUnitTestTranslationService('ja');
