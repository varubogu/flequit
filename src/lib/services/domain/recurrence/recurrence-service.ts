import type { RecurrenceRule } from '$lib/types/datetime-calendar';
import { calculateWeeklyNext } from './calculators/weekly';
import { calculateMonthlyNext } from './calculators/monthly';
import { calculateYearlyNext } from './calculators/yearly';
import { checkDateCondition, adjustDateForCondition } from './adjustment/date-adjuster';
import { checkWeekdayCondition, applyWeekdayAdjustment } from './adjustment/weekday-adjuster';
import { shouldEndRecurrence } from './validation';

/**
 * 繰り返しタスクの次回実行日を計算するサービス
 *
 * 単位別計算ロジックを分離したモジュラー構成
 */
export class RecurrenceService {
  /**
   * 指定されたベース日付と繰り返しルールから次回実行日を計算
   */
  static calculateNextDate(baseDate: Date, rule: RecurrenceRule): Date | null {
    if (!rule) return null;

    let nextDate = new Date(baseDate);

    switch (rule.unit) {
      case 'minute':
        nextDate.setMinutes(nextDate.getMinutes() + rule.interval);
        break;
      case 'hour':
        nextDate.setHours(nextDate.getHours() + rule.interval);
        break;
      case 'day':
        nextDate.setDate(nextDate.getDate() + rule.interval);
        break;
      case 'week':
        return calculateWeeklyNext(nextDate, rule);
      case 'month':
        return calculateMonthlyNext(nextDate, rule);
      case 'quarter':
        nextDate.setMonth(nextDate.getMonth() + rule.interval * 3);
        break;
      case 'halfyear':
        nextDate.setMonth(nextDate.getMonth() + rule.interval * 6);
        break;
      case 'year':
        return calculateYearlyNext(nextDate, rule);
      default:
        return null;
    }

    // 日付補正を適用
    if (
      rule.adjustment &&
      ((rule.adjustment.dateConditions?.length ?? 0) > 0 || (rule.adjustment.weekdayConditions?.length ?? 0) > 0)
    ) {
      nextDate = this.applyDateAdjustment(nextDate, rule.adjustment);
    }

    // 終了条件をチェック
    if (shouldEndRecurrence(nextDate, rule)) {
      return null;
    }

    return nextDate;
  }

  /**
   * 日付補正を適用
   */
  private static applyDateAdjustment(
    date: Date,
    adjustment: NonNullable<RecurrenceRule['adjustment']>
  ): Date {
    let adjustedDate = new Date(date);

    // 日付条件をチェック
    if (adjustment.dateConditions) {
      for (const condition of adjustment.dateConditions) {
        if (checkDateCondition(adjustedDate, condition)) {
          // 日付条件に該当する場合、該当しないように調整
          adjustedDate = adjustDateForCondition(adjustedDate, condition);
        }
      }
    }

    // 曜日条件をチェック
    if (adjustment.weekdayConditions) {
      for (const condition of adjustment.weekdayConditions) {
        if (checkWeekdayCondition(adjustedDate, condition)) {
          adjustedDate = applyWeekdayAdjustment(adjustedDate, condition);
        }
      }
    }

    return adjustedDate;
  }

  /**
   * 複数の繰り返し回数を実行してテスト用の日付リストを生成
   */
  static generateRecurrenceDates(
    startDate: Date,
    rule: RecurrenceRule,
    maxCount: number = 10
  ): Date[] {
    const dates: Date[] = [];
    let currentDate = new Date(startDate);

    // 初回の日付にも補正条件を適用
    if (
      rule.adjustment &&
      ((rule.adjustment.dateConditions?.length ?? 0) > 0 || (rule.adjustment.weekdayConditions?.length ?? 0) > 0)
    ) {
      currentDate = this.applyDateAdjustment(currentDate, rule.adjustment);
    }

    for (let i = 0; i < maxCount; i++) {
      const nextDate = this.calculateNextDate(currentDate, rule);
      if (!nextDate) break;

      dates.push(new Date(nextDate));
      currentDate = nextDate;
    }

    return dates;
  }
}
