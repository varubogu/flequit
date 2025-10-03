import {
  getLocale,
  setLocale as paraglidSetLocale,
  locales,
  type Locale
} from '$paraglide/runtime';
import type {
  ITranslationServiceWithNotification,
  LocaleChangeCallback
} from './translation-service';
import * as m from '$paraglide/messages.js';
import { getBackendService } from '../infrastructure/backends';
import { settingsInitService } from './settings-init-service';

/**
 * Paraglideを使用した翻訳サービスの実装
 */
class ParaglideTranslationService implements ITranslationServiceWithNotification {
  private localeChangeCounter = $state(0);
  private subscribers = new Set<LocaleChangeCallback>();
  private messageMap: Record<string, (...args: unknown[]) => string>;
  private backendService: Awaited<ReturnType<typeof getBackendService>> | null = null;
  private isInitialized = false;

  constructor() {
    // Paraglidのメッセージマップを作成
    this.messageMap = m as unknown as Record<string, (...args: unknown[]) => string>;
  }

  getCurrentLocale(): string {
    // カウンターを参照することで、変更時に依存関係が更新される
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
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
      this.subscribers.forEach((callback) => callback(locale));

      // バックエンドに保存
      this.saveLocale(locale);
    }
  }

  reactiveMessage<T extends (...args: unknown[]) => string>(messageFn: T): T {
    return ((...args: unknown[]) => {
      // getCurrentLocaleを参照して依存関係を作成
      this.getCurrentLocale();
      return messageFn(...args);
    }) as T;
  }

  getMessage(key: string, params?: Record<string, unknown>): () => string {
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

  private async initBackendService() {
    if (!this.backendService) {
      this.backendService = await getBackendService();
    }
    return this.backendService;
  }

  private async saveLocale(locale: string) {
    // 初期化が完了していない場合は保存しない
    if (!this.isInitialized) {
      return;
    }

    try {
      const backend = await this.initBackendService();
      if (!backend) {
        throw new Error('Backend service not available');
      }

      // 新しい部分更新システムを使用
      await backend.settingsManagement.updateSettingsPartially({ language: locale });
      console.log(`Locale '${locale}' saved successfully`);
    } catch (error) {
      console.error('Failed to save locale:', error);
      // フォールバックとしてlocalStorageに保存
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('flequit-locale', locale);
      }
    }
  }

  private async loadLocale() {
    try {
      // 統合初期化サービスから全設定を取得
      const allSettings = await settingsInitService.getAllSettings();
      const localeSetting = settingsInitService.getSettingByKey(allSettings, 'language');

      if (localeSetting) {
        paraglidSetLocale(localeSetting.value as Locale, { reload: false });
        this.localeChangeCounter++;
        console.log(`Locale loaded from backend: ${localeSetting.value}`);
      } else {
        console.log('No locale setting found in backends, using default');
      }
    } catch (error) {
      console.error('Failed to load locale from backends:', error);

      // フォールバックとしてlocalStorageから読み込み
      if (typeof localStorage !== 'undefined') {
        const stored = localStorage.getItem('flequit-locale');
        if (stored && locales.includes(stored as Locale)) {
          paraglidSetLocale(stored as Locale, { reload: false });
          this.localeChangeCounter++;
          console.log('Locale loaded from localStorage fallback');
        }
      }
    }
  }

  async init() {
    await this.loadLocale();
    this.isInitialized = true;
  }
}

// シングルトンインスタンスを作成・エクスポート
export const translationService = new ParaglideTranslationService();

// 初期化の実行
translationService.init().catch((error) => {
  console.error('Failed to initialize translation service:', error);
});
