import type { ITranslationServiceWithNotification, LocaleChangeCallback } from './translation-service';

/**
 * テスト用のモック翻訳サービス
 */
export class MockTranslationService implements ITranslationServiceWithNotification {
  private currentLocale = 'en';
  private messages = new Map<string, Map<string, string>>();
  private subscribers = new Set<LocaleChangeCallback>();

  constructor(
    initialLocale = 'en',
    messages: Record<string, Record<string, string>> = {}
  ) {
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
      this.subscribers.forEach(callback => callback(locale));
    }
  }

  reactiveMessage<T extends (...args: any[]) => string>(messageFn: T): T {
    // モックでは単純にそのまま返すか、設定されたメッセージを返す
    return messageFn;
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
   * テスト用: 特定のキーのメッセージを取得
   */
  getMessage(key: string): string {
    const localeMessages = this.messages.get(this.currentLocale);
    return localeMessages?.get(key) || key;
  }

  /**
   * テスト用: 購読者の数を取得
   */
  getSubscriberCount(): number {
    return this.subscribers.size;
  }
}