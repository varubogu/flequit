
/**
 * 翻訳サービスのインターフェース
 * 将来的にParaglide以外の翻訳システムに変更する可能性を考慮した抽象化層
 */
export interface ITranslationService {
  /**
   * 現在のロケールを取得
   */
  getCurrentLocale(): string;

  /**
   * ロケールを設定
   * @param locale ロケール
   */
  setLocale(locale: string): void;

  /**
   * メッセージ関数をリアクティブにラップする
   * @param messageFn メッセージ関数
   * @returns リアクティブなメッセージ関数
   */
  reactiveMessage<T extends (...args: any[]) => string>(messageFn: T): T;

  /**
   * メッセージキーから翻訳メッセージを取得（リアクティブ）
   * @param key メッセージキー
   * @param params パラメータ（オプション）
   * @returns リアクティブな翻訳メッセージ関数
   */
  getMessage(key: string, params?: Record<string, any>): () => string;

  /**
   * 利用可能なロケール一覧を取得
   */
  getAvailableLocales(): readonly string[];
}

/**
 * 翻訳システムの変更通知を受け取るためのコールバック型
 */
export type LocaleChangeCallback = (locale: string) => void;

/**
 * 翻訳サービスの拡張インターフェース
 * 変更通知の購読機能を提供
 */
export interface ITranslationServiceWithNotification extends ITranslationService {
  /**
   * ロケール変更通知を購読
   * @param callback コールバック関数
   * @returns 購読解除関数
   */
  subscribe(callback: LocaleChangeCallback): () => void;
}