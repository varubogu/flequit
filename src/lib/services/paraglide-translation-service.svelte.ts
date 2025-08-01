import { getLocale, setLocale as paraglidSetLocale, locales, type Locale } from '$paraglide/runtime';
import type { ITranslationServiceWithNotification, LocaleChangeCallback } from './translation-service';
import * as m from '$paraglide/messages.js';

/**
 * Paraglideを使用した翻訳サービスの実装
 */
class ParaglideTranslationService implements ITranslationServiceWithNotification {
  private localeChangeCounter = $state(0);
  private subscribers = new Set<LocaleChangeCallback>();
  private messageMap: Record<string, (...args: any[]) => string>;

  constructor() {
    // Paraglidのメッセージマップを作成
    this.messageMap = m as any;
  }

  getCurrentLocale(): string {
    // カウンターを参照することで、変更時に依存関係が更新される
    this.localeChangeCounter;
    return getLocale();
  }

  setLocale(locale: string): void {
    const oldLocale = getLocale();
    paraglidSetLocale(locale as Locale, { reload: false });
    
    // カウンターを増やして、依存している全てのコンポーネントに再評価を促す
    this.localeChangeCounter++;
    
    // 購読者に変更を通知
    if (oldLocale !== locale) {
      this.subscribers.forEach(callback => callback(locale));
    }
  }

  reactiveMessage<T extends (...args: any[]) => string>(messageFn: T): T {
    return ((...args: any[]) => {
      // getCurrentLocaleを参照して依存関係を作成
      this.getCurrentLocale();
      return messageFn(...args);
    }) as T;
  }

  getMessage(key: string, params?: Record<string, any>): () => string {
    return () => {
      // getCurrentLocaleを参照して依存関係を作成
      this.getCurrentLocale();
      
      const messageFn = this.messageMap[key];
      if (!messageFn) {
        console.warn(`Translation key not found: ${key}`);
        return key;
      }
      
      try {
        // Paraglidの関数はobjectを受け取る
        return messageFn(params || {});
      } catch (error) {
        console.warn(`Error translating key ${key}:`, error);
        return key;
      }
    };
  }

  getAvailableLocales(): readonly string[] {
    return locales;
  }

  subscribe(callback: LocaleChangeCallback): () => void {
    this.subscribers.add(callback);
    return () => {
      this.subscribers.delete(callback);
    };
  }
}

// シングルトンインスタンスを作成・エクスポート
export const translationService = new ParaglideTranslationService();