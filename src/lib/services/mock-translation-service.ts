import type {
  ITranslationServiceWithNotification,
  LocaleChangeCallback
} from './translation-service';

/**
 * テスト用のモック翻訳サービス
 */
export class MockTranslationService implements ITranslationServiceWithNotification {
  private currentLocale = 'en';
  private messages = new Map<string, Map<string, string>>();
  private subscribers = new Set<LocaleChangeCallback>();

  constructor(initialLocale = 'en', messages: Record<string, Record<string, string>> = {}) {
    this.currentLocale = initialLocale;

    // メッセージを設定
    Object.entries(messages).forEach(([locale, localeMessages]) => {
      const localeMap = new Map(Object.entries(localeMessages));
      this.messages.set(locale, localeMap);
    });
  }

  getCurrentLocale(): string {
    return this.currentLocale;
  }

  setLocale(locale: string): void {
    const oldLocale = this.currentLocale;
    this.currentLocale = locale;

    // 購読者に変更を通知
    if (oldLocale !== locale) {
      this.subscribers.forEach((callback) => callback(locale));
    }
  }

  reactiveMessage<T extends (...args: unknown[]) => string>(messageFn: T): T {
    // モックでは関数を実行してメッセージを取得し、それを返すファンクションを作成
    const wrappedFn = ((...args: unknown[]) => {
      const result = messageFn(...args);
      // 関数の結果がmessageKeyの可能性があるので、登録されたメッセージから取得を試みる
      const localeMessages = this.messages.get(this.currentLocale);
      return localeMessages?.get(result) || result;
    }) as T;
    
    return wrappedFn;
  }

  getMessage(key: string, params?: Record<string, unknown>): () => string {
    return () => {
      const localeMessages = this.messages.get(this.currentLocale);
      let message = localeMessages?.get(key) || key;

      // パラメータがある場合は置換を行う
      if (params && Object.keys(params).length > 0) {
        // {paramName} 形式の置換
        message = message.replace(/\{(\w+)\}/g, (match, paramName) => {
          return params[paramName] !== undefined ? String(params[paramName]) : match;
        });
      }

      return message;
    };
  }

  getAvailableLocales(): readonly string[] {
    return ['en', 'ja'];
  }

  subscribe(callback: LocaleChangeCallback): () => void {
    this.subscribers.add(callback);
    return () => {
      this.subscribers.delete(callback);
    };
  }

  /**
   * テスト用: メッセージを設定
   */
  setMessages(locale: string, messages: Record<string, string>): void {
    const localeMap = new Map(Object.entries(messages));
    this.messages.set(locale, localeMap);
  }

  /**
   * テスト用: 購読者の数を取得
   */
  getSubscriberCount(): number {
    return this.subscribers.size;
  }
}
