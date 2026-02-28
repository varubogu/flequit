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
      // 2025-01-15 12:00:00 UTC に固定
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2025-01-15T12:00:00Z'));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('undefinedの場合は空文字を返す', () => {
      expect(formatDate(undefined, 'UTC')).toBe('');
    });

    it('今日の日付は"Today"を返す', () => {
      const today = new Date('2025-01-15T14:30:00Z');
      expect(formatDate(today, 'UTC')).toBe('Today');
    });

    it('明日の日付は"Tomorrow"を返す', () => {
      const tomorrow = new Date('2025-01-16T10:00:00Z');
      expect(formatDate(tomorrow, 'UTC')).toBe('Tomorrow');
    });

    it('昨日の日付は"Yesterday"を返す', () => {
      const yesterday = new Date('2025-01-14T18:00:00Z');
      expect(formatDate(yesterday, 'UTC')).toBe('Yesterday');
    });

    it('それ以外の日付はロケール形式を返す', () => {
      const otherDate = new Date('2025-01-20T10:00:00Z');
      const result = formatDate(otherDate, 'UTC');
      expect(result).toBeTruthy();
      expect(result).not.toBe('Today');
      expect(result).not.toBe('Tomorrow');
      expect(result).not.toBe('Yesterday');
    });

    describe('タイムゾーン境界ケース', () => {
      it('UTC深夜15時（JST翌日00時）の場合、UTCとJSTで「今日」判定が異なる', () => {
        // システム時刻: 2025-01-15T15:00:00Z = JST 2025-01-16 00:00
        vi.setSystemTime(new Date('2025-01-15T15:00:00Z'));

        // タスク日時: 2025-01-16T00:00:00Z = JST 2025-01-16 09:00
        const task = new Date('2025-01-16T00:00:00Z');

        // UTC基準では「明日」
        expect(formatDate(task, 'UTC')).toBe('Tomorrow');
        // JST基準では「今日」（JSTでは既に1月16日のため）
        expect(formatDate(task, 'Asia/Tokyo')).toBe('Today');
      });

      it('UTC午後23時30分（JST翌日08時30分）の日付を正しく処理する', () => {
        // システム時刻: 2025-01-15T12:00:00Z = JST 2025-01-15 21:00（同日）
        vi.setSystemTime(new Date('2025-01-15T12:00:00Z'));

        // タスク日時: 2025-01-15T23:30:00Z = JST 2025-01-16 08:30
        const task = new Date('2025-01-15T23:30:00Z');

        // UTC基準では「今日」
        expect(formatDate(task, 'UTC')).toBe('Today');
        // JST基準では「明日」（JSTではすでに翌日）
        expect(formatDate(task, 'Asia/Tokyo')).toBe('Tomorrow');
      });
    });
  });

  describe('formatDateTime', () => {
    it('日付をロケール形式の文字列にフォーマットする', () => {
      const date = new Date('2025-01-15T14:30:00Z');
      const result = formatDateTime(date, 'UTC');
      expect(result).toBeTruthy();
      expect(typeof result).toBe('string');
    });
  });

  describe('formatDateForInput', () => {
    it('undefinedの場合は空文字を返す', () => {
      expect(formatDateForInput(undefined, 'UTC')).toBe('');
    });

    it('YYYY-MM-DD形式にフォーマットする', () => {
      const date = new Date('2025-01-15T14:30:00Z');
      expect(formatDateForInput(date, 'UTC')).toBe('2025-01-15');
    });

    it('月と日が1桁の場合はゼロ埋めする', () => {
      const date = new Date('2025-03-05T14:30:00Z');
      expect(formatDateForInput(date, 'UTC')).toBe('2025-03-05');
    });
  });

  describe('formatDetailedDate', () => {
    it('undefinedの場合は"No due date"を返す', () => {
      expect(formatDetailedDate(undefined, 'UTC')).toBe('No due date');
    });

    it('詳細形式（曜日、年、月名、日）にフォーマットする', () => {
      const date = new Date('2025-01-15T14:30:00Z');
      const result = formatDetailedDate(date, 'UTC');
      expect(result).toContain('2025');
      expect(result).toContain('January');
      expect(result).toContain('15');
    });
  });

  describe('getDueDateClass', () => {
    beforeEach(() => {
      // 2025-01-15 12:00:00 UTC に固定
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2025-01-15T12:00:00Z'));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('undefinedの場合は空文字を返す', () => {
      expect(getDueDateClass(undefined)).toBe('');
    });

    it('期限切れの場合は赤色のクラスを返す', () => {
      const overdueDate = new Date('2025-01-14T10:00:00Z');
      const result = getDueDateClass(overdueDate, undefined, 'UTC');
      expect(result).toContain('red');
    });

    it('完了済みの場合は期限切れでも赤色にしない', () => {
      const overdueDate = new Date('2025-01-14T10:00:00Z');
      const result = getDueDateClass(overdueDate, 'completed', 'UTC');
      expect(result).not.toContain('red');
    });

    it('今日が期限の場合はオレンジ色のクラスを返す', () => {
      const todayDate = new Date('2025-01-15T14:30:00Z');
      const result = getDueDateClass(todayDate, undefined, 'UTC');
      expect(result).toContain('orange');
    });

    it('未来の日付の場合はmuted-foregroundクラスを返す', () => {
      const futureDate = new Date('2025-01-20T10:00:00Z');
      const result = getDueDateClass(futureDate, undefined, 'UTC');
      expect(result).toContain('muted-foreground');
    });

    describe('日時付き期限の場合', () => {
      it('今日の過去の時刻は期限切れ（赤）', () => {
        // 現在: 2025-01-15 12:00:00Z
        // 期限: 2025-01-15 10:00:00Z（2時間前）
        const overdueDate = new Date('2025-01-15T10:00:00Z');
        const result = getDueDateClass(overdueDate, undefined, 'UTC');
        expect(result).toContain('red');
      });

      it('今日の未来の時刻は今日扱い（オレンジ）', () => {
        // 現在: 2025-01-15 12:00:00Z
        // 期限: 2025-01-15 18:00:00Z（6時間後）
        const todayFutureDate = new Date('2025-01-15T18:00:00Z');
        const result = getDueDateClass(todayFutureDate, undefined, 'UTC');
        expect(result).toContain('orange');
      });

      it('明日以降の日時は未来扱い（muted）', () => {
        // 現在: 2025-01-15 12:00:00Z
        // 期限: 2025-01-16 09:00:00Z
        const futureDate = new Date('2025-01-16T09:00:00Z');
        const result = getDueDateClass(futureDate, undefined, 'UTC');
        expect(result).toContain('muted-foreground');
      });
    });

    describe('日付のみ期限の場合（UTC midnight）', () => {
      it('昨日の日付（UTC midnight）は期限切れ（赤）', () => {
        // 現在: 2025-01-15 12:00:00Z
        // 期限: 2025-01-14 00:00:00Z
        const overdueDate = new Date('2025-01-14T00:00:00Z');
        const result = getDueDateClass(overdueDate, undefined, 'UTC');
        expect(result).toContain('red');
      });

      it('今日の日付（UTC midnight）は今日扱い（オレンジ）', () => {
        // 現在: 2025-01-15 12:00:00Z
        // 期限: 2025-01-15 00:00:00Z（今日中という意味）
        const todayDate = new Date('2025-01-15T00:00:00Z');
        const result = getDueDateClass(todayDate, undefined, 'UTC');
        expect(result).toContain('orange');
      });

      it('明日以降の日付（UTC midnight）は未来扱い（muted）', () => {
        // 現在: 2025-01-15 12:00:00Z
        // 期限: 2025-01-16 00:00:00Z
        const futureDate = new Date('2025-01-16T00:00:00Z');
        const result = getDueDateClass(futureDate, undefined, 'UTC');
        expect(result).toContain('muted-foreground');
      });
    });
  });

  describe('hasTime', () => {
    it('undefinedの場合はfalseを返す', () => {
      expect(hasTime(undefined)).toBe(false);
    });

    it('UTC midnight（T00:00:00Z）の場合はfalseを返す（日付のみの規約）', () => {
      const date = new Date('2025-01-15T00:00:00Z');
      expect(hasTime(date)).toBe(false);
    });

    it('UTC時刻が00:00以外の場合はtrueを返す（時のみ）', () => {
      const date = new Date('2025-01-15T14:00:00Z');
      expect(hasTime(date)).toBe(true);
    });

    it('UTC時刻が00:00以外の場合はtrueを返す（分のみ）', () => {
      const date = new Date('2025-01-15T00:30:00Z');
      expect(hasTime(date)).toBe(true);
    });
  });

  describe('formatTime', () => {
    it('時刻をHH:MM形式にフォーマットする', () => {
      const date = new Date('2025-01-15T14:30:00Z');
      expect(formatTime(date, 'UTC')).toBe('14:30');
    });

    it('時刻が1桁の場合はゼロ埋めする', () => {
      const date = new Date('2025-01-15T09:05:00Z');
      expect(formatTime(date, 'UTC')).toBe('09:05');
    });
  });

  describe('formatDate1', () => {
    it('YYYY-MM-DD形式にフォーマットする', () => {
      const date = new Date('2025-01-15T14:30:00Z');
      expect(formatDate1(date, 'UTC')).toBe('2025-01-15');
    });

    it('月と日が1桁の場合はゼロ埋めする', () => {
      const date = new Date('2025-03-05T14:30:00Z');
      expect(formatDate1(date, 'UTC')).toBe('2025-03-05');
    });
  });

  describe('formatTime1', () => {
    it('HH:MM:SS形式にフォーマットする', () => {
      const date = new Date('2025-01-15T14:30:45Z');
      expect(formatTime1(date, 'UTC')).toBe('14:30:45');
    });

    it('時分秒が1桁の場合はゼロ埋めする', () => {
      const date = new Date('2025-01-15T09:05:03Z');
      expect(formatTime1(date, 'UTC')).toBe('09:05:03');
    });
  });

  describe('エッジケース', () => {
    it('閏年の2月29日を正しく扱う', () => {
      const date = new Date('2024-02-29T10:00:00Z');
      expect(formatDateForInput(date, 'UTC')).toBe('2024-02-29');
      expect(formatDate1(date, 'UTC')).toBe('2024-02-29');
    });

    it('年末年始の日付を正しく扱う', () => {
      const newYear = new Date('2025-01-01T00:00:00Z');
      const newYearsEve = new Date('2024-12-31T23:59:59Z');

      expect(formatDateForInput(newYear, 'UTC')).toBe('2025-01-01');
      expect(formatDateForInput(newYearsEve, 'UTC')).toBe('2024-12-31');
    });

    it('UTC midnight の時刻を正しく扱う', () => {
      const midnight = new Date('2025-01-15T00:00:00Z');
      expect(formatTime(midnight, 'UTC')).toBe('00:00');
      expect(formatTime1(midnight, 'UTC')).toBe('00:00:00');
    });

    it('正午（12:00:00）の時刻を正しく扱う', () => {
      const noon = new Date('2025-01-15T12:00:00Z');
      expect(formatTime(noon, 'UTC')).toBe('12:00');
      expect(formatTime1(noon, 'UTC')).toBe('12:00:00');
    });
  });
});
