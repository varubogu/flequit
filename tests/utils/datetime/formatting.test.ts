import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  formatDate,
  formatDateTime,
  formatDateForInput,
  formatDetailedDate,
  getDueDateClass,
  hasTime,
  formatTime,
  formatDate1,
  formatTime1
} from '$lib/utils/datetime/formatting';

describe('datetime/formatting', () => {
  describe('formatDate', () => {
    beforeEach(() => {
      // 2025-01-15 12:00:00 に固定
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2025-01-15T12:00:00'));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('undefinedの場合は空文字を返す', () => {
      expect(formatDate(undefined)).toBe('');
    });

    it('今日の日付は"Today"を返す', () => {
      const today = new Date('2025-01-15T14:30:00');
      expect(formatDate(today)).toBe('Today');
    });

    it('明日の日付は"Tomorrow"を返す', () => {
      const tomorrow = new Date('2025-01-16T10:00:00');
      expect(formatDate(tomorrow)).toBe('Tomorrow');
    });

    it('昨日の日付は"Yesterday"を返す', () => {
      const yesterday = new Date('2025-01-14T18:00:00');
      expect(formatDate(yesterday)).toBe('Yesterday');
    });

    it('それ以外の日付はロケール形式を返す', () => {
      const otherDate = new Date('2025-01-20T10:00:00');
      const result = formatDate(otherDate);
      expect(result).toBeTruthy();
      expect(result).not.toBe('Today');
      expect(result).not.toBe('Tomorrow');
      expect(result).not.toBe('Yesterday');
    });
  });

  describe('formatDateTime', () => {
    it('日付をロケール形式の文字列にフォーマットする', () => {
      const date = new Date('2025-01-15T14:30:00');
      const result = formatDateTime(date);
      expect(result).toBeTruthy();
      expect(typeof result).toBe('string');
    });
  });

  describe('formatDateForInput', () => {
    it('undefinedの場合は空文字を返す', () => {
      expect(formatDateForInput(undefined)).toBe('');
    });

    it('YYYY-MM-DD形式にフォーマットする', () => {
      const date = new Date('2025-01-15T14:30:00');
      expect(formatDateForInput(date)).toBe('2025-01-15');
    });

    it('月と日が1桁の場合はゼロ埋めする', () => {
      const date = new Date('2025-03-05T14:30:00');
      expect(formatDateForInput(date)).toBe('2025-03-05');
    });
  });

  describe('formatDetailedDate', () => {
    it('undefinedの場合は"No due date"を返す', () => {
      expect(formatDetailedDate(undefined)).toBe('No due date');
    });

    it('詳細形式（曜日、年、月名、日）にフォーマットする', () => {
      const date = new Date('2025-01-15T14:30:00');
      const result = formatDetailedDate(date);
      expect(result).toContain('2025');
      expect(result).toContain('January');
      expect(result).toContain('15');
    });
  });

  describe('getDueDateClass', () => {
    beforeEach(() => {
      // 2025-01-15 12:00:00 に固定
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2025-01-15T12:00:00'));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('undefinedの場合は空文字を返す', () => {
      expect(getDueDateClass(undefined)).toBe('');
    });

    it('期限切れの場合は赤色のクラスを返す', () => {
      const overdueDate = new Date('2025-01-14T10:00:00');
      const result = getDueDateClass(overdueDate);
      expect(result).toContain('red');
    });

    it('完了済みの場合は期限切れでも赤色にしない', () => {
      const overdueDate = new Date('2025-01-14T10:00:00');
      const result = getDueDateClass(overdueDate, 'completed');
      expect(result).not.toContain('red');
    });

    it('今日が期限の場合はオレンジ色のクラスを返す', () => {
      const todayDate = new Date('2025-01-15T14:30:00');
      const result = getDueDateClass(todayDate);
      expect(result).toContain('orange');
    });

    it('未来の日付の場合はmuted-foregroundクラスを返す', () => {
      const futureDate = new Date('2025-01-20T10:00:00');
      const result = getDueDateClass(futureDate);
      expect(result).toContain('muted-foreground');
    });

    describe('日時付き期限の場合', () => {
      it('今日の過去の時刻は期限切れ（赤）', () => {
        // 現在: 2025-01-15 12:00:00
        // 期限: 2025-01-15 10:00:00（2時間前）
        const overdueDate = new Date('2025-01-15T10:00:00');
        const result = getDueDateClass(overdueDate);
        expect(result).toContain('red');
      });

      it('今日の未来の時刻は今日扱い（オレンジ）', () => {
        // 現在: 2025-01-15 12:00:00
        // 期限: 2025-01-15 18:00:00（6時間後）
        const todayFutureDate = new Date('2025-01-15T18:00:00');
        const result = getDueDateClass(todayFutureDate);
        expect(result).toContain('orange');
      });

      it('明日以降の日時は未来扱い（muted）', () => {
        // 現在: 2025-01-15 12:00:00
        // 期限: 2025-01-16 09:00:00
        const futureDate = new Date('2025-01-16T09:00:00');
        const result = getDueDateClass(futureDate);
        expect(result).toContain('muted-foreground');
      });
    });

    describe('日付のみ期限の場合', () => {
      it('昨日の日付（時刻00:00）は期限切れ（赤）', () => {
        // 現在: 2025-01-15 12:00:00
        // 期限: 2025-01-14 00:00:00
        const overdueDate = new Date('2025-01-14T00:00:00');
        const result = getDueDateClass(overdueDate);
        expect(result).toContain('red');
      });

      it('今日の日付（時刻00:00）は今日扱い（オレンジ）', () => {
        // 現在: 2025-01-15 12:00:00
        // 期限: 2025-01-15 00:00:00（今日中という意味）
        const todayDate = new Date('2025-01-15T00:00:00');
        const result = getDueDateClass(todayDate);
        expect(result).toContain('orange');
      });

      it('明日以降の日付（時刻00:00）は未来扱い（muted）', () => {
        // 現在: 2025-01-15 12:00:00
        // 期限: 2025-01-16 00:00:00
        const futureDate = new Date('2025-01-16T00:00:00');
        const result = getDueDateClass(futureDate);
        expect(result).toContain('muted-foreground');
      });
    });
  });

  describe('hasTime', () => {
    it('undefinedの場合はfalseを返す', () => {
      expect(hasTime(undefined)).toBe(false);
    });

    it('時刻が00:00の場合はfalseを返す', () => {
      const date = new Date('2025-01-15T00:00:00');
      expect(hasTime(date)).toBe(false);
    });

    it('時刻が00:00以外の場合はtrueを返す（時のみ）', () => {
      const date = new Date('2025-01-15T14:00:00');
      expect(hasTime(date)).toBe(true);
    });

    it('時刻が00:00以外の場合はtrueを返す（分のみ）', () => {
      const date = new Date('2025-01-15T00:30:00');
      expect(hasTime(date)).toBe(true);
    });
  });

  describe('formatTime', () => {
    it('時刻をHH:MM形式にフォーマットする', () => {
      const date = new Date('2025-01-15T14:30:00');
      expect(formatTime(date)).toBe('14:30');
    });

    it('時刻が1桁の場合はゼロ埋めする', () => {
      const date = new Date('2025-01-15T09:05:00');
      expect(formatTime(date)).toBe('09:05');
    });
  });

  describe('formatDate1', () => {
    it('YYYY-MM-DD形式にフォーマットする', () => {
      const date = new Date('2025-01-15T14:30:00');
      expect(formatDate1(date)).toBe('2025-01-15');
    });

    it('月と日が1桁の場合はゼロ埋めする', () => {
      const date = new Date('2025-03-05T14:30:00');
      expect(formatDate1(date)).toBe('2025-03-05');
    });
  });

  describe('formatTime1', () => {
    it('HH:MM:SS形式にフォーマットする', () => {
      const date = new Date('2025-01-15T14:30:45');
      expect(formatTime1(date)).toBe('14:30:45');
    });

    it('時分秒が1桁の場合はゼロ埋めする', () => {
      const date = new Date('2025-01-15T09:05:03');
      expect(formatTime1(date)).toBe('09:05:03');
    });
  });

  describe('エッジケース', () => {
    it('閏年の2月29日を正しく扱う', () => {
      const date = new Date('2024-02-29T10:00:00');
      expect(formatDateForInput(date)).toBe('2024-02-29');
      expect(formatDate1(date)).toBe('2024-02-29');
    });

    it('年末年始の日付を正しく扱う', () => {
      const newYear = new Date('2025-01-01T00:00:00');
      const newYearsEve = new Date('2024-12-31T23:59:59');

      expect(formatDateForInput(newYear)).toBe('2025-01-01');
      expect(formatDateForInput(newYearsEve)).toBe('2024-12-31');
    });

    it('真夜中（00:00:00）の時刻を正しく扱う', () => {
      const midnight = new Date('2025-01-15T00:00:00');
      expect(formatTime(midnight)).toBe('00:00');
      expect(formatTime1(midnight)).toBe('00:00:00');
    });

    it('正午（12:00:00）の時刻を正しく扱う', () => {
      const noon = new Date('2025-01-15T12:00:00');
      expect(formatTime(noon)).toBe('12:00');
      expect(formatTime1(noon)).toBe('12:00:00');
    });
  });
});
