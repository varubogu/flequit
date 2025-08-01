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
    // モックでは単純にそのまま返すか、設定されたメッセージを返す
    return messageFn;
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
