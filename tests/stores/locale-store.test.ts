import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  localeStore,
  setTranslationService,
  getTranslationService
} from '$lib/stores/locale.svelte';
import { MockTranslationService } from '$lib/services/mock-translation-service';

describe('localeStore', () => {
  let mockService: MockTranslationService;
  let originalService: any;

  beforeEach(() => {
    vi.clearAllMocks();
    originalService = getTranslationService();
    mockService = new MockTranslationService('en', {
      en: { test_message: 'Test Message' },
      ja: { test_message: 'テストメッセージ' }
    });
    setTranslationService(mockService);
  });

  afterEach(() => {
    setTranslationService(originalService);
  });

  describe('locale getter', () => {
    it('翻訳サービスから現在のロケールを取得', () => {
      mockService.setLocale('ja');

      const locale = localeStore.locale;

      expect(locale).toBe('ja');
    });

    it('デフォルトロケールが英語の場合', () => {
      const locale = localeStore.locale;

      expect(locale).toBe('en');
    });
  });

  describe('setLocale', () => {
    it('新しいロケールを設定できる', () => {
      localeStore.setLocale('ja');

      expect(mockService.getCurrentLocale()).toBe('ja');
    });

    it('ロケール変更後にlocaleプロパティが更新される', () => {
      const initialLocale = localeStore.locale;

      localeStore.setLocale('ja');
      const updatedLocale = localeStore.locale;

      expect(initialLocale).toBe('en');
      expect(updatedLocale).toBe('ja');
    });

    it('複数回のロケール変更を正しく処理', () => {
      localeStore.setLocale('ja');
      expect(localeStore.locale).toBe('ja');

      localeStore.setLocale('en');
      expect(localeStore.locale).toBe('en');

      localeStore.setLocale('ja');
      expect(localeStore.locale).toBe('ja');
    });
  });

  describe('translation service integration', () => {
    it('翻訳サービスのgetMessageが使用される', () => {
      const getMessage = mockService.getMessage('test_message');
      const result = getMessage();

      expect(result).toBe('Test Message');
    });

    it('ロケール変更時にメッセージが更新される', () => {
      const getMessage = mockService.getMessage('test_message');

      // 英語の場合
      expect(getMessage()).toBe('Test Message');

      // 日本語に変更
      mockService.setLocale('ja');
      expect(getMessage()).toBe('テストメッセージ');
    });

    it('存在しないキーの場合はキー自体を返す', () => {
      const getMessage = mockService.getMessage('non_existent_key');
      const result = getMessage();

      expect(result).toBe('non_existent_key');
    });
  });

  describe('エッジケース', () => {
    it('空文字列のロケール設定', () => {
      localeStore.setLocale('');

      expect(mockService.getCurrentLocale()).toBe('');
    });

    it('未定義のロケール設定', () => {
      localeStore.setLocale(undefined as any);

      expect(mockService.getCurrentLocale()).toBe(undefined);
    });

    it('同じロケールを連続設定', () => {
      localeStore.setLocale('en');
      localeStore.setLocale('en');
      localeStore.setLocale('en');

      expect(mockService.getCurrentLocale()).toBe('en');
    });
  });

  describe('パフォーマンステスト', () => {
    it('大量のロケール変更処理', () => {
      const start = Date.now();

      for (let i = 0; i < 100; i++) {
        localeStore.setLocale(i % 2 === 0 ? 'en' : 'ja');
      }

      const end = Date.now();
      expect(end - start).toBeLessThan(100); // 100ms以内で完了
      expect(mockService.getCurrentLocale()).toBe('ja'); // 最後は99(奇数)なのでja
    });

    it('リアクティブメッセージの大量呼び出し', () => {
      const getMessage = mockService.getMessage('test_message');

      const start = Date.now();

      for (let i = 0; i < 100; i++) {
        getMessage();
      }

      const end = Date.now();
      expect(end - start).toBeLessThan(100); // 100ms以内で完了
    });
  });
});
