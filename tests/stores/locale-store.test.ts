import { describe, it, expect, beforeEach, vi } from 'vitest';
import { localeStore, reactiveMessage } from '$lib/stores/locale.svelte';

// Paraglidのランタイムをモック
vi.mock('$paraglide/runtime', () => ({
  getLocale: vi.fn(() => 'en'),
  setLocale: vi.fn(),
  type: {}
}));

import { getLocale, setLocale } from '$paraglide/runtime';

describe('localeStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('locale getter', () => {
    it('ParaglidのgetLocaleを呼び出して現在のロケールを取得', () => {
      vi.mocked(getLocale).mockReturnValue('ja');
      
      const locale = localeStore.locale;
      
      expect(getLocale).toHaveBeenCalled();
      expect(locale).toBe('ja');
    });

    it('デフォルトロケールが英語の場合', () => {
      vi.mocked(getLocale).mockReturnValue('en');
      
      const locale = localeStore.locale;
      
      expect(locale).toBe('en');
    });
  });

  describe('setLocale', () => {
    it('新しいロケールを設定できる', () => {
      localeStore.setLocale('ja');
      
      expect(setLocale).toHaveBeenCalledWith('ja', { reload: false });
    });

    it('ロケール変更後にlocaleプロパティが更新される', () => {
      vi.mocked(getLocale).mockReturnValue('en');
      const initialLocale = localeStore.locale;
      
      vi.mocked(getLocale).mockReturnValue('ja');
      localeStore.setLocale('ja');
      
      const updatedLocale = localeStore.locale;
      
      expect(initialLocale).toBe('en');
      expect(updatedLocale).toBe('ja');
    });

    it('複数回のロケール変更を正しく処理', () => {
      localeStore.setLocale('ja');
      localeStore.setLocale('en');
      localeStore.setLocale('ja');
      
      expect(setLocale).toHaveBeenCalledTimes(3);
      expect(setLocale).toHaveBeenNthCalledWith(1, 'ja', { reload: false });
      expect(setLocale).toHaveBeenNthCalledWith(2, 'en', { reload: false });
      expect(setLocale).toHaveBeenNthCalledWith(3, 'ja', { reload: false });
    });
  });

  describe('reactiveMessage', () => {
    it('メッセージ関数をリアクティブにラップ', () => {
      const mockMessage = vi.fn((name: string) => `Hello, ${name}!`);
      vi.mocked(getLocale).mockReturnValue('en');
      
      const reactiveMsg = reactiveMessage(mockMessage);
      const result = reactiveMsg('World');
      
      expect(result).toBe('Hello, World!');
      expect(mockMessage).toHaveBeenCalledWith('World');
      expect(getLocale).toHaveBeenCalled();
    });

    it('引数なしのメッセージ関数も正しく動作', () => {
      const mockMessage = vi.fn(() => 'Hello World');
      vi.mocked(getLocale).mockReturnValue('en');
      
      const reactiveMsg = reactiveMessage(mockMessage);
      const result = reactiveMsg();
      
      expect(result).toBe('Hello World');
      expect(mockMessage).toHaveBeenCalled();
      expect(getLocale).toHaveBeenCalled();
    });

    it('複数の引数を持つメッセージ関数を正しく処理', () => {
      const mockMessage = vi.fn((greeting: string, name: string, punctuation: string) => 
        `${greeting}, ${name}${punctuation}`
      );
      vi.mocked(getLocale).mockReturnValue('en');
      
      const reactiveMsg = reactiveMessage(mockMessage);
      const result = reactiveMsg('Hello', 'World', '!');
      
      expect(result).toBe('Hello, World!');
      expect(mockMessage).toHaveBeenCalledWith('Hello', 'World', '!');
    });

    it('ロケール変更時にメッセージ関数が再評価される', () => {
      const mockMessage = vi.fn(() => 'test message');
      vi.mocked(getLocale).mockReturnValue('en');
      
      const reactiveMsg = reactiveMessage(mockMessage);
      
      // 最初の呼び出し
      reactiveMsg();
      expect(getLocale).toHaveBeenCalledTimes(1);
      
      // ロケール変更
      vi.mocked(getLocale).mockReturnValue('ja');
      localeStore.setLocale('ja');
      
      // 再度呼び出し
      reactiveMsg();
      expect(getLocale).toHaveBeenCalledTimes(2);
    });
  });

  describe('エッジケース', () => {
    it('空文字列のロケール設定', () => {
      localeStore.setLocale('');
      
      expect(setLocale).toHaveBeenCalledWith('', { reload: false });
    });

    it('未定義のロケール設定', () => {
      localeStore.setLocale(undefined as any);
      
      expect(setLocale).toHaveBeenCalledWith(undefined, { reload: false });
    });

    it('同じロケールを連続設定', () => {
      localeStore.setLocale('en');
      localeStore.setLocale('en');
      localeStore.setLocale('en');
      
      expect(setLocale).toHaveBeenCalledTimes(3);
    });

    it('reactiveMessageでnull関数を渡した場合', () => {
      expect(() => {
        reactiveMessage(null as any);
      }).not.toThrow();
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
      expect(setLocale).toHaveBeenCalledTimes(100);
    });

    it('リアクティブメッセージの大量呼び出し', () => {
      const mockMessage = vi.fn(() => 'test');
      const reactiveMsg = reactiveMessage(mockMessage);
      
      const start = Date.now();
      
      for (let i = 0; i < 100; i++) {
        reactiveMsg();
      }
      
      const end = Date.now();
      expect(end - start).toBeLessThan(100); // 100ms以内で完了
      expect(mockMessage).toHaveBeenCalledTimes(100);
    });
  });
});