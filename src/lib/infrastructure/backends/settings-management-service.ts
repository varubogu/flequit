import type { Settings, CustomDateFormat, TimeLabel, ViewItem } from '$lib/types/settings';

/**
 * 新しい設定管理サービスのインターフェース
 */
export interface SettingsManagementService {
  /**
   * 設定ファイルを読み込む
   * @returns 設定オブジェクト
   */
  loadSettings(): Promise<Settings | null>;

  /**
   * 設定ファイルを保存する
   * @param settings 保存する設定
   * @returns 成功したかどうか
   */
  saveSettings(settings: Settings): Promise<boolean>;

  /**
   * 設定を部分的に更新する
   * @param partialSettings 部分更新する設定
   * @returns 更新された完全な設定オブジェクト
   */
  updateSettingsPartially(partialSettings: Partial<Settings>): Promise<Settings | null>;

  /**
   * 設定ファイルが存在するかチェックする
   * @returns ファイルの存在確認結果
   */
  settingsFileExists(): Promise<boolean>;

  /**
   * 設定をデフォルト値で初期化する
   * @returns 成功したかどうか
   */
  initializeSettingsWithDefaults(): Promise<boolean>;

  /**
   * 設定ファイルのパスを取得する
   * @returns 設定ファイルのパス
   */
  getSettingsFilePath(): Promise<string>;

  // カスタム期日管理
  /**
   * カスタム期日を追加する
   * @param days 期日の日数
   * @returns 成功したかどうか
   */
  addCustomDueDay(days: number): Promise<boolean>;

  /**
   * カスタム期日を更新する
   * @param oldDays 既存の日数
   * @param newDays 新しい日数
   * @returns 成功したかどうか
   */
  updateCustomDueDay(oldDays: number, newDays: number): Promise<boolean>;

  /**
   * カスタム期日を削除する
   * @param days 削除する日数
   * @returns 成功したかどうか
   */
  deleteCustomDueDay(days: number): Promise<boolean>;

  // 日時フォーマット管理
  /**
   * 日時フォーマット設定を追加する
   * @param formatSetting 日時フォーマット設定
   * @returns 成功したかどうか
   */
  addDateTimeFormatSetting(formatSetting: Record<string, unknown>): Promise<boolean>;

  /**
   * 日時フォーマット設定を更新/挿入する
   * @param formatSetting 日時フォーマット設定
   * @returns 成功したかどうか
   */
  upsertDateTimeFormatSetting(formatSetting: Record<string, unknown>): Promise<boolean>;

  /**
   * 日時フォーマット設定を削除する
   * @param formatId フォーマットID
   * @returns 成功したかどうか
   */
  deleteDateTimeFormatSetting(formatId: string): Promise<boolean>;

  // カスタム日付フォーマット管理
  /**
   * カスタム日付フォーマット設定を取得する
   * @param formatId フォーマットID
   * @returns カスタム日付フォーマット（存在しない場合はnull）
   */
  getCustomDateFormatSetting(formatId: string): Promise<CustomDateFormat | null>;

  /**
   * 全てのカスタム日付フォーマット設定を取得する
   * @returns カスタム日付フォーマットの配列
   */
  getAllCustomDateFormatSettings(): Promise<CustomDateFormat[]>;

  /**
   * カスタム日付フォーマット設定を追加する
   * @param formatSetting カスタム日付フォーマット設定
   * @returns 成功したかどうか
   */
  addCustomDateFormatSetting(formatSetting: CustomDateFormat): Promise<boolean>;

  /**
   * カスタム日付フォーマット設定を更新する
   * @param formatSetting カスタム日付フォーマット設定
   * @returns 成功したかどうか
   */
  updateCustomDateFormatSetting(formatSetting: CustomDateFormat): Promise<boolean>;

  /**
   * カスタム日付フォーマット設定を削除する
   * @param formatId フォーマットID
   * @returns 成功したかどうか
   */
  deleteCustomDateFormatSetting(formatId: string): Promise<boolean>;

  // 時間ラベル管理
  /**
   * 時間ラベル設定を取得する
   * @param labelId ラベルID
   * @returns 時間ラベル（存在しない場合はnull）
   */
  getTimeLabelSetting(labelId: string): Promise<TimeLabel | null>;

  /**
   * 全ての時間ラベル設定を取得する
   * @returns 時間ラベルの配列
   */
  getAllTimeLabelSettings(): Promise<TimeLabel[]>;

  /**
   * 時間ラベル設定を追加する
   * @param labelSetting 時間ラベル設定
   * @returns 成功したかどうか
   */
  addTimeLabelSetting(labelSetting: TimeLabel): Promise<boolean>;

  /**
   * 時間ラベル設定を更新する
   * @param labelSetting 時間ラベル設定
   * @returns 成功したかどうか
   */
  updateTimeLabelSetting(labelSetting: TimeLabel): Promise<boolean>;

  /**
   * 時間ラベル設定を削除する
   * @param labelId ラベルID
   * @returns 成功したかどうか
   */
  deleteTimeLabelSetting(labelId: string): Promise<boolean>;

  // ビューアイテム管理
  /**
   * ビューアイテム設定を取得する
   * @param itemId アイテムID
   * @returns ビューアイテム（存在しない場合はnull）
   */
  getViewItemSetting(itemId: string): Promise<ViewItem | null>;

  /**
   * 全てのビューアイテム設定を取得する
   * @returns ビューアイテムの配列
   */
  getAllViewItemSettings(): Promise<ViewItem[]>;

  /**
   * ビューアイテム設定を追加する
   * @param itemSetting ビューアイテム設定
   * @returns 成功したかどうか
   */
  addViewItemSetting(itemSetting: ViewItem): Promise<boolean>;

  /**
   * ビューアイテム設定を更新する
   * @param itemSetting ビューアイテム設定
   * @returns 成功したかどうか
   */
  updateViewItemSetting(itemSetting: ViewItem): Promise<boolean>;

  /**
   * ビューアイテム設定を削除する
   * @param itemId アイテムID
   * @returns 成功したかどうか
   */
  deleteViewItemSetting(itemId: string): Promise<boolean>;
}
