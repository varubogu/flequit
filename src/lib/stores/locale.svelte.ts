import { translationService } from '$lib/services/paraglide-translation-service.svelte';
import type { ITranslationService } from '$lib/services/translation-service';

// 翻訳サービスのインスタンス（テスト時に差し替え可能）
let currentTranslationService: ITranslationService = translationService;

/**
 * テスト用に翻訳サービスを差し替える関数
 * @param service 翻訳サービスのインスタンス
 */
export function setTranslationService(service: ITranslationService): void {
  currentTranslationService = service;
}

/**
 * 現在の翻訳サービスを取得
 */
export function getTranslationService(): ITranslationService {
  return currentTranslationService;
}

// 既存のAPIとの互換性を保つためのラッパー
export const localeStore = {
  get locale() {
    return currentTranslationService.getCurrentLocale();
  },
  
  setLocale(newLocale: string) {
    currentTranslationService.setLocale(newLocale);
  }
};

// メッセージ関数をreactiveにラップするヘルパー関数
export function reactiveMessage<T extends (...args: any[]) => string>(messageFn: T): T {
  return currentTranslationService.reactiveMessage(messageFn);
}