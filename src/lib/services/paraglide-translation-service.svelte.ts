import { getLocale, setLocale as paraglidSetLocale, locales, type Locale } from '$paraglide/runtime';
import type { ITranslationServiceWithNotification, LocaleChangeCallback } from './translation-service';

/**
 * Paraglideを使用した翻訳サービスの実装
 */
class ParaglideTranslationService implements ITranslationServiceWithNotification {
  private localeChangeCounter = $state(0);
  private subscribers = new Set<LocaleChangeCallback>();

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