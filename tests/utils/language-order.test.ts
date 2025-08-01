import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { LanguageOrderUtils } from '$lib/utils/language-order';
import { translationService } from '$lib/services/paraglide-translation-service.svelte';

// translation service をモック
vi.mock('$lib/services/paraglide-translation-service.svelte', () => ({
  translationService: {
    getCurrentLocale: vi.fn()
  }
}));

describe('LanguageOrderUtils', () => {
  const mockTranslationService = vi.mocked(translationService);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('getWeekdayConditionOrder', () => {
    it('日本語ロケールの場合はjaを返す', () => {
      mockTranslationService.getCurrentLocale.mockReturnValue('ja');
      const result = LanguageOrderUtils.getWeekdayConditionOrder();
      expect(result).toBe('ja');
    });

    it('日本語ロケール（地域指定あり）の場合はjaを返す', () => {
      mockTranslationService.getCurrentLocale.mockReturnValue('ja-JP');
      const result = LanguageOrderUtils.getWeekdayConditionOrder();
      expect(result).toBe('ja');
    });

    it('英語ロケールの場合はenを返す', () => {
      mockTranslationService.getCurrentLocale.mockReturnValue('en');
      const result = LanguageOrderUtils.getWeekdayConditionOrder();
      expect(result).toBe('en');
    });

    it('英語ロケール（地域指定あり）の場合はenを返す', () => {
      mockTranslationService.getCurrentLocale.mockReturnValue('en-US');
      const result = LanguageOrderUtils.getWeekdayConditionOrder();
      expect(result).toBe('en');
    });

    it('その他のロケールの場合はenを返す', () => {
      mockTranslationService.getCurrentLocale.mockReturnValue('fr-FR');
      const result = LanguageOrderUtils.getWeekdayConditionOrder();
      expect(result).toBe('en');
    });

    it('言語パラメータが指定された場合はそれを優先する', () => {
      mockTranslationService.getCurrentLocale.mockReturnValue('en');
      const result = LanguageOrderUtils.getWeekdayConditionOrder('ja');
      expect(result).toBe('ja');
    });

    it('言語パラメータがnullの場合はgetLocaleの値を使用', () => {
      mockTranslationService.getCurrentLocale.mockReturnValue('ja');
      const result = LanguageOrderUtils.getWeekdayConditionOrder(undefined);
      expect(result).toBe('ja');
    });
  });

  describe('formatWeekdayConditionJa', () => {
    it('日本語形式で条件表示テンプレートを生成', () => {
      const result = LanguageOrderUtils.formatWeekdayConditionJa('土曜日', '次', '月曜日');

      expect(result.template).toBe('{condition}なら{direction}の{target}にずらす');
      expect(result.parts).toEqual([
        { type: 'select', content: '土曜日', key: 'condition' },
        { type: 'text', content: 'なら' },
        { type: 'select', content: '次', key: 'direction' },
        { type: 'text', content: 'の' },
        { type: 'select', content: '月曜日', key: 'target' },
        { type: 'text', content: 'にずらす' }
      ]);
    });

    it('空文字列でも適切に処理される', () => {
      const result = LanguageOrderUtils.formatWeekdayConditionJa('', '', '');

      expect(result.template).toBe('{condition}なら{direction}の{target}にずらす');
      expect(result.parts).toHaveLength(6);
      expect(result.parts[0]).toEqual({ type: 'select', content: '', key: 'condition' });
    });
  });

  describe('formatWeekdayConditionEn', () => {
    it('英語形式で条件表示テンプレートを生成', () => {
      const result = LanguageOrderUtils.formatWeekdayConditionEn('Saturday', 'next', 'Monday');

      expect(result.template).toBe('If {condition}, move to {direction} {target}');
      expect(result.parts).toEqual([
        { type: 'text', content: 'If' },
        { type: 'select', content: 'Saturday', key: 'condition' },
        { type: 'text', content: ', move to' },
        { type: 'select', content: 'next', key: 'direction' },
        { type: 'select', content: 'Monday', key: 'target' }
      ]);
    });

    it('空文字列でも適切に処理される', () => {
      const result = LanguageOrderUtils.formatWeekdayConditionEn('', '', '');

      expect(result.template).toBe('If {condition}, move to {direction} {target}');
      expect(result.parts).toHaveLength(5);
      expect(result.parts[1]).toEqual({ type: 'select', content: '', key: 'condition' });
    });
  });

  describe('formatWeekdayCondition', () => {
    it('日本語ロケールの場合は日本語フォーマットを返す', () => {
      mockTranslationService.getCurrentLocale.mockReturnValue('ja');

      const result = LanguageOrderUtils.formatWeekdayCondition('土曜日', '次', '月曜日');

      expect(result.template).toBe('{condition}なら{direction}の{target}にずらす');
    });

    it('英語ロケールの場合は英語フォーマットを返す', () => {
      mockTranslationService.getCurrentLocale.mockReturnValue('en');

      const result = LanguageOrderUtils.formatWeekdayCondition('Saturday', 'next', 'Monday');

      expect(result.template).toBe('If {condition}, move to {direction} {target}');
    });

    it('言語パラメータが指定された場合はそれを優先する', () => {
      mockTranslationService.getCurrentLocale.mockReturnValue('en');

      const result = LanguageOrderUtils.formatWeekdayCondition('土曜日', '次', '月曜日', 'ja');

      expect(result.template).toBe('{condition}なら{direction}の{target}にずらす');
    });

    it('未知の言語の場合は英語フォーマットを返す', () => {
      mockTranslationService.getCurrentLocale.mockReturnValue('fr');

      const result = LanguageOrderUtils.formatWeekdayCondition('Saturday', 'next', 'Monday');

      expect(result.template).toBe('If {condition}, move to {direction} {target}');
    });
  });
});
