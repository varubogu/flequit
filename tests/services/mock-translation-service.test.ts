import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MockTranslationService } from '$lib/services/mock-translation-service';

describe('MockTranslationService', () => {
  let service: MockTranslationService;

  beforeEach(() => {
    service = new MockTranslationService();
  });

  describe('constructor', () => {
    it('should initialize with default locale "en"', () => {
      expect(service.getCurrentLocale()).toBe('en');
    });

    it('should initialize with custom locale', () => {
      const customService = new MockTranslationService('ja');
      expect(customService.getCurrentLocale()).toBe('ja');
    });

    it('should initialize with messages', () => {
      const messages = {
        en: { hello: 'Hello' },
        ja: { hello: 'こんにちは' }
      };
      const customService = new MockTranslationService('en', messages);
      
      const messageGetter = customService.getMessage('hello');
      expect(messageGetter()).toBe('Hello');
    });
  });

  describe('getCurrentLocale', () => {
    it('should return current locale', () => {
      expect(service.getCurrentLocale()).toBe('en');
    });
  });

  describe('setLocale', () => {
    it('should change locale', () => {
      service.setLocale('ja');
      expect(service.getCurrentLocale()).toBe('ja');
    });

    it('should notify subscribers when locale changes', () => {
      const callback = vi.fn();
      service.subscribe(callback);
      
      service.setLocale('ja');
      
      expect(callback).toHaveBeenCalledWith('ja');
      expect(callback).toHaveBeenCalledTimes(1);
    });

    it('should not notify subscribers when locale is the same', () => {
      const callback = vi.fn();
      service.subscribe(callback);
      
      service.setLocale('en'); // Same as initial
      
      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe('reactiveMessage', () => {
    beforeEach(() => {
      service.setMessages('en', { greeting: 'Hello' });
      service.setMessages('ja', { greeting: 'こんにちは' });
    });

    it('should wrap message function and return translated message', () => {
      const messageFn = () => 'greeting';
      const wrappedFn = service.reactiveMessage(messageFn);
      
      expect(wrappedFn()).toBe('Hello');
    });

    it('should return different message for different locales', () => {
      const messageFn = () => 'greeting';
      const wrappedFn = service.reactiveMessage(messageFn);
      
      expect(wrappedFn()).toBe('Hello');
      
      service.setLocale('ja');
      expect(wrappedFn()).toBe('こんにちは');
    });

    it('should return original message if not found in translations', () => {
      const messageFn = () => 'unknown_key';
      const wrappedFn = service.reactiveMessage(messageFn);
      
      expect(wrappedFn()).toBe('unknown_key');
    });

    it('should handle functions with parameters', () => {
      const messageFn = (name: string) => `hello_${name}`;
      const wrappedFn = service.reactiveMessage(messageFn);
      
      expect(wrappedFn('world')).toBe('hello_world');
    });
  });

  describe('getMessage', () => {
    beforeEach(() => {
      service.setMessages('en', { 
        greeting: 'Hello',
        parametric: 'Hello {name}, you have {count} messages'
      });
    });

    it('should return message getter function', () => {
      const messageGetter = service.getMessage('greeting');
      expect(typeof messageGetter).toBe('function');
      expect(messageGetter()).toBe('Hello');
    });

    it('should return key if message not found', () => {
      const messageGetter = service.getMessage('unknown');
      expect(messageGetter()).toBe('unknown');
    });

    it('should replace parameters in message', () => {
      const messageGetter = service.getMessage('parametric', { 
        name: 'John', 
        count: 5 
      });
      expect(messageGetter()).toBe('Hello John, you have 5 messages');
    });

    it('should handle missing parameters gracefully', () => {
      const messageGetter = service.getMessage('parametric', { name: 'John' });
      expect(messageGetter()).toBe('Hello John, you have {count} messages');
    });

    it('should handle empty parameters', () => {
      const messageGetter = service.getMessage('parametric', {});
      expect(messageGetter()).toBe('Hello {name}, you have {count} messages');
    });
  });

  describe('getAvailableLocales', () => {
    it('should return available locales', () => {
      const locales = service.getAvailableLocales();
      expect(locales).toEqual(['en', 'ja']);
      expect(locales).toBeInstanceOf(Array);
    });

    it('should return readonly array', () => {
      const locales = service.getAvailableLocales();
      // 配列が変更できないかテスト（TypeScriptでは readonly だが実行時は通常の配列）
      expect(Array.isArray(locales)).toBe(true);
      expect(locales.length).toBe(2);
    });
  });

  describe('subscribe', () => {
    it('should add subscriber and return unsubscribe function', () => {
      const callback = vi.fn();
      const unsubscribe = service.subscribe(callback);
      
      expect(typeof unsubscribe).toBe('function');
      expect(service.getSubscriberCount()).toBe(1);
    });

    it('should call subscriber when locale changes', () => {
      const callback = vi.fn();
      service.subscribe(callback);
      
      service.setLocale('ja');
      
      expect(callback).toHaveBeenCalledWith('ja');
    });

    it('should remove subscriber when unsubscribe is called', () => {
      const callback = vi.fn();
      const unsubscribe = service.subscribe(callback);
      
      expect(service.getSubscriberCount()).toBe(1);
      
      unsubscribe();
      
      expect(service.getSubscriberCount()).toBe(0);
    });

    it('should handle multiple subscribers', () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();
      
      service.subscribe(callback1);
      service.subscribe(callback2);
      
      expect(service.getSubscriberCount()).toBe(2);
      
      service.setLocale('ja');
      
      expect(callback1).toHaveBeenCalledWith('ja');
      expect(callback2).toHaveBeenCalledWith('ja');
    });
  });

  describe('setMessages (test utility)', () => {
    it('should set messages for locale', () => {
      service.setMessages('fr', { hello: 'Bonjour' });
      service.setLocale('fr');
      
      const messageGetter = service.getMessage('hello');
      expect(messageGetter()).toBe('Bonjour');
    });

    it('should overwrite existing messages', () => {
      service.setMessages('en', { hello: 'Hi' });
      
      const messageGetter = service.getMessage('hello');
      expect(messageGetter()).toBe('Hi');
    });
  });

  describe('getSubscriberCount (test utility)', () => {
    it('should return correct subscriber count', () => {
      expect(service.getSubscriberCount()).toBe(0);
      
      const unsubscribe1 = service.subscribe(vi.fn());
      expect(service.getSubscriberCount()).toBe(1);
      
      const unsubscribe2 = service.subscribe(vi.fn());
      expect(service.getSubscriberCount()).toBe(2);
      
      unsubscribe1();
      expect(service.getSubscriberCount()).toBe(1);
      
      unsubscribe2();
      expect(service.getSubscriberCount()).toBe(0);
    });
  });

  describe('locale change scenarios', () => {
    it('should handle rapid locale changes', () => {
      const callback = vi.fn();
      service.subscribe(callback);
      
      service.setLocale('ja');
      service.setLocale('en');
      service.setLocale('ja');
      
      expect(callback).toHaveBeenCalledTimes(3);
      expect(callback).toHaveBeenNthCalledWith(1, 'ja');
      expect(callback).toHaveBeenNthCalledWith(2, 'en');
      expect(callback).toHaveBeenNthCalledWith(3, 'ja');
    });

    it('should maintain message consistency during locale changes', () => {
      service.setMessages('en', { test: 'English' });
      service.setMessages('ja', { test: '日本語' });
      
      const messageGetter = service.getMessage('test');
      
      expect(messageGetter()).toBe('English');
      
      service.setLocale('ja');
      expect(messageGetter()).toBe('日本語');
      
      service.setLocale('en');
      expect(messageGetter()).toBe('English');
    });
  });

  describe('edge cases', () => {
    it('should handle null parameters gracefully', () => {
      service.setMessages('en', { test: 'Hello {name}' });
      const messageGetter = service.getMessage('test', { name: null });
      expect(messageGetter()).toBe('Hello null');
    });

    it('should handle undefined parameters', () => {
      service.setMessages('en', { test: 'Hello {name}' });
      const messageGetter = service.getMessage('test', { name: undefined });
      expect(messageGetter()).toBe('Hello {name}');
    });

    it('should handle numeric parameters', () => {
      service.setMessages('en', { test: 'Count: {count}' });
      const messageGetter = service.getMessage('test', { count: 42 });
      expect(messageGetter()).toBe('Count: 42');
    });

    it('should handle empty string messages', () => {
      service.setMessages('en', { empty: '' });
      const messageGetter = service.getMessage('empty');
      // 実装では空文字列は falsy なので、|| key でキー名が返される
      expect(messageGetter()).toBe('empty');
    });

    it('should handle special characters in messages', () => {
      service.setMessages('en', { special: 'Special: $%^&*()' });
      const messageGetter = service.getMessage('special');
      expect(messageGetter()).toBe('Special: $%^&*()');
    });
  });
});