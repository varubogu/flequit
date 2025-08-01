import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { MockTranslationService } from '$lib/services/mock-translation-service';
import {
  setTranslationService,
  getTranslationService,
  localeStore,
  reactiveMessage
} from '$lib/stores/locale.svelte';
import { translationService } from '$lib/services/paraglide-translation-service.svelte';

describe('Translation Service', () => {
  let mockService: MockTranslationService;
  let originalService: any;

  beforeEach(() => {
    originalService = getTranslationService();
    mockService = new MockTranslationService('en', {
      en: {
        test_message: 'Test Message',
        hello_world: 'Hello World'
      },
      ja: {
        test_message: 'テストメッセージ',
        hello_world: 'こんにちは世界'
      }
    });
    setTranslationService(mockService);
  });

  afterEach(() => {
    setTranslationService(originalService);
  });

  describe('MockTranslationService', () => {
    it('初期ロケールが正しく設定される', () => {
      expect(mockService.getCurrentLocale()).toBe('en');
    });

    it('ロケールを変更できる', () => {
      mockService.setLocale('ja');
      expect(mockService.getCurrentLocale()).toBe('ja');
    });

    it('利用可能ロケール一覧を取得できる', () => {
      const locales = mockService.getAvailableLocales();
      expect(locales).toEqual(['en', 'ja']);
    });

    it('ロケール変更通知が動作する', () => {
      let notifiedLocale = '';
      const unsubscribe = mockService.subscribe((locale) => {
        notifiedLocale = locale;
      });

      mockService.setLocale('ja');
      expect(notifiedLocale).toBe('ja');

      unsubscribe();
      mockService.setLocale('en');
      expect(notifiedLocale).toBe('ja'); // 購読解除後なので変更されない
    });

    it('購読者数を正しく管理する', () => {
      expect(mockService.getSubscriberCount()).toBe(0);

      const unsubscribe1 = mockService.subscribe(() => {});
      expect(mockService.getSubscriberCount()).toBe(1);

      const unsubscribe2 = mockService.subscribe(() => {});
      expect(mockService.getSubscriberCount()).toBe(2);

      unsubscribe1();
      expect(mockService.getSubscriberCount()).toBe(1);

      unsubscribe2();
      expect(mockService.getSubscriberCount()).toBe(0);
    });
  });

  describe('locale store integration', () => {
    it('localeStoreがモックサービスを使用する', () => {
      expect(localeStore.locale).toBe('en');

      localeStore.setLocale('ja');
      expect(localeStore.locale).toBe('ja');
      expect(mockService.getCurrentLocale()).toBe('ja');
    });

    it('reactiveMessageがモックサービスを使用する', () => {
      const testMessageFn = () => 'Test Message';
      const reactiveTestMessage = reactiveMessage(testMessageFn);

      // モックでは単純に元の関数を返すので、元の結果と同じになる
      expect(reactiveTestMessage()).toBe('Test Message');
    });
  });

  describe('パラメータ付きメッセージ', () => {
    it('パラメータ付きメッセージが正しく動作する', () => {
      mockService.setMessages('en', {
        welcome_user: 'Welcome, {name}!',
        item_count: 'You have {count} items'
      });

      const welcomeMessage = mockService.getMessage('welcome_user', { name: 'John' });
      expect(welcomeMessage()).toBe('Welcome, John!');

      const countMessage = mockService.getMessage('item_count', { count: 5 });
      expect(countMessage()).toBe('You have 5 items');
    });

    it('パラメータなしでパラメータ付きメッセージを呼んでも動作する', () => {
      mockService.setMessages('en', {
        welcome_user: 'Welcome, {name}!'
      });

      const welcomeMessage = mockService.getMessage('welcome_user');
      expect(welcomeMessage()).toBe('Welcome, {name}!');
    });

    it('複数パラメータが正しく置換される', () => {
      mockService.setMessages('en', {
        greeting: 'Hello {name}, you have {count} new messages!'
      });

      const greetingMessage = mockService.getMessage('greeting', {
        name: 'Alice',
        count: 3
      });
      expect(greetingMessage()).toBe('Hello Alice, you have 3 new messages!');
    });
  });

  describe('service replacement', () => {
    it('翻訳サービスを差し替えられる', () => {
      const newMockService = new MockTranslationService('ja');
      setTranslationService(newMockService);

      expect(getTranslationService()).toBe(newMockService);
      expect(localeStore.locale).toBe('ja');
    });

    it('元のサービスに戻すことができる', () => {
      setTranslationService(translationService);
      expect(getTranslationService()).toBe(translationService);
    });
  });
});
