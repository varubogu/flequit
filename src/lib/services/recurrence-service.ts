import type { RecurrenceRule, DayOfWeek } from '$lib/types/task';

/**
 * 繰り返しタスクの次回実行日を計算するサービス
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
        return this.calculateWeeklyNext(nextDate, rule);
      case 'month':
        return this.calculateMonthlyNext(nextDate, rule);
      case 'quarter':
        nextDate.setMonth(nextDate.getMonth() + (rule.interval * 3));
        break;
      case 'half_year':
        nextDate.setMonth(nextDate.getMonth() + (rule.interval * 6));
        break;
      case 'year':
        return this.calculateYearlyNext(nextDate, rule);
      default:
        return null;
    }
    
    // 日付補正を適用
    if (rule.adjustment?.enabled) {
      nextDate = this.applyDateAdjustment(nextDate, rule.adjustment);
    }
    
    // 終了条件をチェック
    if (this.shouldEndRecurrence(nextDate, rule)) {
      return null;
    }
    
    return nextDate;
  }
  
  /**
   * 週単位の次回日付計算
   */
  private static calculateWeeklyNext(baseDate: Date, rule: RecurrenceRule): Date | null {
    if (!rule.days_of_week || rule.days_of_week.length === 0) {
      // 曜日指定がない場合は通常の週間隔
      baseDate.setDate(baseDate.getDate() + (rule.interval * 7));
      return baseDate;
    }
    
    const targetDays = rule.days_of_week.map(day => this.dayOfWeekToNumber(day));
    const currentDay = baseDate.getDay();
    
    // 今週の残りの対象曜日を探す
    const remainingDaysThisWeek = targetDays.filter(day => day > currentDay);
    
    if (remainingDaysThisWeek.length > 0) {
      // 今週にまだ対象曜日がある
      const nextDay = Math.min(...remainingDaysThisWeek);
      baseDate.setDate(baseDate.getDate() + (nextDay - currentDay));
      return baseDate;
    }
    
    // 次の対象週の最初の曜日
    const weeksToAdd = rule.interval;
    const nextTargetDay = Math.min(...targetDays);
    const daysToAdd = (weeksToAdd * 7) + (nextTargetDay - currentDay);
    
    baseDate.setDate(baseDate.getDate() + daysToAdd);
    return baseDate;
  }
  
  /**
   * 月単位の次回日付計算
   */
  private static calculateMonthlyNext(baseDate: Date, rule: RecurrenceRule): Date | null {
    const currentDate = new Date(baseDate);
    
    if (rule.day_of_month) {
      // 特定の日付指定
      currentDate.setMonth(currentDate.getMonth() + rule.interval);
      currentDate.setDate(Math.min(rule.day_of_month, this.getLastDayOfMonth(currentDate)));
      return currentDate;
    }
    
    if (rule.week_of_month && rule.days_of_week && rule.days_of_week.length > 0) {
      // 第X曜日指定（例：第2日曜日）
      return this.calculateWeekOfMonth(currentDate, rule);
    }
    
    // デフォルト：同じ日付で次月
    currentDate.setMonth(currentDate.getMonth() + rule.interval);
    return currentDate;
  }
  
  /**
   * 年単位の次回日付計算
   */
  private static calculateYearlyNext(baseDate: Date, rule: RecurrenceRule): Date | null {
    const currentDate = new Date(baseDate);
    
    if (rule.months && rule.months.length > 0) {
      // 特定の月指定
      const currentMonth = currentDate.getMonth() + 1; // 1-12
      const targetMonths = [...rule.months].sort((a, b) => a - b);
      
      // 今年の残りの対象月を探す
      const remainingMonthsThisYear = targetMonths.filter(month => month > currentMonth);
      
      if (remainingMonthsThisYear.length > 0) {
        // 今年にまだ対象月がある
        currentDate.setMonth(remainingMonthsThisYear[0] - 1);
        return currentDate;
      }
      
      // 来年の最初の対象月
      currentDate.setFullYear(currentDate.getFullYear() + rule.interval);
      currentDate.setMonth(targetMonths[0] - 1);
      return currentDate;
    }
    
    // デフォルト：同じ日付で来年
    currentDate.setFullYear(currentDate.getFullYear() + rule.interval);
    return currentDate;
  }
  
  /**
   * 第X曜日の計算（例：第2日曜日）
   */
  private static calculateWeekOfMonth(baseDate: Date, rule: RecurrenceRule): Date | null {
    if (!rule.week_of_month || !rule.days_of_week || rule.days_of_week.length === 0) {
      return null;
    }
    
    const targetDay = this.dayOfWeekToNumber(rule.days_of_week[0]);
    const nextMonth = new Date(baseDate.getFullYear(), baseDate.getMonth() + rule.interval, 1);
    
    if (rule.week_of_month === 'last') {
      // 最後の曜日
      const lastDay = this.getLastDayOfMonth(nextMonth);
      const lastDate = new Date(nextMonth.getFullYear(), nextMonth.getMonth(), lastDay);
      const lastDayOfWeek = lastDate.getDay();
      
      let daysBack = (lastDayOfWeek - targetDay + 7) % 7;
      if (daysBack === 0 && lastDayOfWeek !== targetDay) {
        daysBack = 7;
      }
      
      lastDate.setDate(lastDay - daysBack);
      return lastDate;
    }
    
    // 第1-4週
    const weekNumber = this.weekOfMonthToNumber(rule.week_of_month);
    const firstDay = new Date(nextMonth.getFullYear(), nextMonth.getMonth(), 1);
    const firstDayOfWeek = firstDay.getDay();
    
    // その月の最初の対象曜日を見つける
    let daysToAdd = (targetDay - firstDayOfWeek + 7) % 7;
    // 指定された週まで進める
    daysToAdd += (weekNumber - 1) * 7;
    
    const resultDate = new Date(firstDay);
    resultDate.setDate(1 + daysToAdd);
    
    // 月をまたいでいないかチェック
    if (resultDate.getMonth() !== nextMonth.getMonth()) {
      return null;
    }
    
    return resultDate;
  }
  
  /**
   * 日付補正を適用
   */
  private static applyDateAdjustment(date: Date, adjustment: NonNullable<RecurrenceRule['adjustment']>): Date {
    const dayOfWeek = date.getDay();
    const isHoliday = this.isHoliday(date); // 祝日判定（実装は簡略化）
    
    let shouldAdjust = false;
    
    // 曜日条件チェック
    if (adjustment.if_weekday) {
      const targetDay = this.dayOfWeekToNumber(adjustment.if_weekday);
      shouldAdjust = shouldAdjust || (dayOfWeek === targetDay);
    }
    
    // 祝日条件チェック
    if (adjustment.if_holiday) {
      shouldAdjust = shouldAdjust || isHoliday;
    }
    
    if (!shouldAdjust) {
      return date;
    }
    
    // 補正を適用
    const targetWeekday = this.dayOfWeekToNumber(adjustment.to_weekday);
    const adjustedDate = new Date(date);
    
    if (adjustment.then_adjust === 'next') {
      // 次の指定曜日まで進める
      let daysToAdd = (targetWeekday - dayOfWeek + 7) % 7;
      if (daysToAdd === 0) daysToAdd = 7; // 同じ曜日の場合は翌週
      adjustedDate.setDate(date.getDate() + daysToAdd);
    } else {
      // 前の指定曜日まで戻す
      let daysToSubtract = (dayOfWeek - targetWeekday + 7) % 7;
      if (daysToSubtract === 0) daysToSubtract = 7; // 同じ曜日の場合は前週
      adjustedDate.setDate(date.getDate() - daysToSubtract);
    }
    
    return adjustedDate;
  }
  
  /**
   * 繰り返し終了条件をチェック
   */
  private static shouldEndRecurrence(date: Date, rule: RecurrenceRule): boolean {
    if (rule.end_date && date > rule.end_date) {
      return true;
    }
    
    // max_occurrencesの実装は実際の実行回数を追跡する必要があるため、
    // ここでは簡略化してfalseを返す
    return false;
  }
  
  /**
   * 曜日文字列を数値に変換（0=日曜日）
   */
  private static dayOfWeekToNumber(day: DayOfWeek): number {
    const mapping: Record<DayOfWeek, number> = {
      sunday: 0,
      monday: 1,
      tuesday: 2,
      wednesday: 3,
      thursday: 4,
      friday: 5,
      saturday: 6
    };
    return mapping[day];
  }
  
  /**
   * 週番号文字列を数値に変換
   */
  private static weekOfMonthToNumber(week: NonNullable<RecurrenceRule['week_of_month']>): number {
    const mapping = {
      first: 1,
      second: 2,
      third: 3,
      fourth: 4,
      last: -1 // 特別扱い
    };
    return mapping[week];
  }
  
  /**
   * 月の最後の日を取得
   */
  private static getLastDayOfMonth(date: Date): number {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  }
  
  /**
   * 祝日判定（簡略化実装）
   * 実際の実装では祝日カレンダーAPIやライブラリを使用
   */
  private static isHoliday(date: Date): boolean {
    // 土日を祝日として扱う簡略化実装
    const dayOfWeek = date.getDay();
    return dayOfWeek === 0 || dayOfWeek === 6;
  }
  
  /**
   * 複数の繰り返し回数を実行してテスト用の日付リストを生成
   */
  static generateRecurrenceDates(startDate: Date, rule: RecurrenceRule, maxCount: number = 10): Date[] {
    const dates: Date[] = [];
    let currentDate = new Date(startDate);
    
    for (let i = 0; i < maxCount; i++) {
      const nextDate = this.calculateNextDate(currentDate, rule);
      if (!nextDate) break;
      
      dates.push(new Date(nextDate));
      currentDate = nextDate;
    }
    
    return dates;
  }
}