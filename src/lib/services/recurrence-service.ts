import type { RecurrenceRule, DayOfWeek, DateCondition, WeekdayCondition, WeekOfMonth } from '$lib/types/task';

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
    if (rule.adjustment && (rule.adjustment.date_conditions.length > 0 || rule.adjustment.weekday_conditions.length > 0)) {
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
    
    // 新しい詳細設定を使用
    if (rule.details?.specific_date) {
      // 特定の日付指定
      currentDate.setMonth(currentDate.getMonth() + rule.interval);
      currentDate.setDate(Math.min(rule.details.specific_date, this.getLastDayOfMonth(currentDate)));
      return currentDate;
    }
    
    if (rule.details?.week_of_period && rule.details?.weekday_of_week) {
      // 第X曜日指定（例：第2日曜日）
      return this.calculateWeekOfMonthNew(currentDate, rule);
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
    
    // デフォルト：同じ日付で来年
    currentDate.setFullYear(currentDate.getFullYear() + rule.interval);
    return currentDate;
  }
  
  /**
   * 第X曜日の計算（例：第2日曜日）- 新しい型定義用
   */
  private static calculateWeekOfMonthNew(baseDate: Date, rule: RecurrenceRule): Date | null {
    if (!rule.details?.week_of_period || !rule.details?.weekday_of_week) {
      return null;
    }
    
    const targetDay = this.dayOfWeekToNumber(rule.details.weekday_of_week);
    const nextMonth = new Date(baseDate.getFullYear(), baseDate.getMonth() + rule.interval, 1);
    
    if (rule.details.week_of_period === 'last') {
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
    const weekNumber = this.weekOfMonthToNumber(rule.details.week_of_period);
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
    let adjustedDate = new Date(date);
    
    // 日付条件をチェック
    for (const condition of adjustment.date_conditions) {
      if (this.checkDateCondition(adjustedDate, condition)) {
        // 日付条件に該当する場合、該当しないように調整
        adjustedDate = this.adjustDateForCondition(adjustedDate, condition);
      }
    }
    
    // 曜日条件をチェック
    for (const condition of adjustment.weekday_conditions) {
      if (this.checkWeekdayCondition(adjustedDate, condition)) {
        adjustedDate = this.applyWeekdayAdjustment(adjustedDate, condition);
      }
    }
    
    return adjustedDate;
  }
  
  /**
   * 日付条件に基づいて日付を調整
   */
  private static adjustDateForCondition(date: Date, condition: DateCondition): Date {
    const refDate = new Date(condition.reference_date);
    const adjustedDate = new Date(date);
    
    switch (condition.relation) {
      case 'before':
        // 参照日より前にする必要がある場合、参照日の前日に設定
        if (date >= refDate) {
          adjustedDate.setTime(refDate.getTime() - 24 * 60 * 60 * 1000);
        }
        break;
      case 'on_or_before':
        // 参照日以前にする必要がある場合、参照日に設定
        if (date > refDate) {
          adjustedDate.setTime(refDate.getTime());
        }
        break;
      case 'on_or_after':
        // 参照日以降にする必要がある場合、参照日に設定
        if (date < refDate) {
          adjustedDate.setTime(refDate.getTime());
        }
        break;
      case 'after':
        // 参照日より後にする必要がある場合、参照日の翌日に設定
        if (date <= refDate) {
          adjustedDate.setTime(refDate.getTime() + 24 * 60 * 60 * 1000);
        }
        break;
    }
    
    return adjustedDate;
  }

  /**
   * 日付条件をチェック
   */
  private static checkDateCondition(date: Date, condition: DateCondition): boolean {
    const refDate = new Date(condition.reference_date);
    
    switch (condition.relation) {
      case 'before':
        return date < refDate;
      case 'on_or_before':
        return date <= refDate;
      case 'on_or_after':
        return date >= refDate;
      case 'after':
        return date > refDate;
      default:
        return false;
    }
  }
  
  /**
   * 曜日条件をチェック
   */
  private static checkWeekdayCondition(date: Date, condition: WeekdayCondition): boolean {
    const dayOfWeek = date.getDay();
    
    // 特定の曜日の場合
    if (['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'].includes(condition.if_weekday)) {
      const targetDay = this.dayOfWeekToNumber(condition.if_weekday as any);
      return dayOfWeek === targetDay;
    }
    
    // その他の条件（平日、休日、祝日、非祝日など）の場合
    switch (condition.if_weekday) {
      case 'weekday':
        return dayOfWeek >= 1 && dayOfWeek <= 5; // 月曜日〜金曜日
      case 'weekend':
        return dayOfWeek === 0 || dayOfWeek === 6; // 日曜日・土曜日
      case 'holiday':
        return this.isHoliday(date);
      case 'non_holiday':
        return !this.isHoliday(date);
      case 'weekend_only':
        return dayOfWeek === 0 || dayOfWeek === 6; // 土日のみ
      case 'non_weekend':
        return dayOfWeek >= 1 && dayOfWeek <= 5; // 土日以外（平日）
      case 'weekend_holiday':
        return (dayOfWeek === 0 || dayOfWeek === 6) || this.isHoliday(date); // 土日祝日
      case 'non_weekend_holiday':
        return (dayOfWeek >= 1 && dayOfWeek <= 5) && !this.isHoliday(date); // 土日祝日以外
      default:
        return false;
    }
  }
  
  /**
   * 曜日補正を適用
   */
  private static applyWeekdayAdjustment(date: Date, condition: WeekdayCondition): Date {
    let adjustedDate = new Date(date);
    const dayOfWeek = date.getDay();
    
    if (condition.then_target === 'specific_weekday' && condition.then_weekday) {
      const targetWeekday = this.dayOfWeekToNumber(condition.then_weekday);
      
      if (condition.then_direction === 'next') {
        let daysToAdd = (targetWeekday - dayOfWeek + 7) % 7;
        if (daysToAdd === 0) daysToAdd = 7;
        adjustedDate.setDate(date.getDate() + daysToAdd);
      } else {
        let daysToSubtract = (dayOfWeek - targetWeekday + 7) % 7;
        if (daysToSubtract === 0) daysToSubtract = 7;
        adjustedDate.setDate(date.getDate() - daysToSubtract);
      }
    } else if (condition.then_target === 'weekday') {
      // 平日への移動
      adjustedDate = this.moveToWeekday(adjustedDate, condition.then_direction);
    } else if (condition.then_target === 'weekend') {
      // 休日への移動
      adjustedDate = this.moveToWeekend(adjustedDate, condition.then_direction);
    } else if (condition.then_target === 'holiday') {
      // 祝日への移動
      adjustedDate = this.moveToHoliday(adjustedDate, condition.then_direction);
    } else if (condition.then_target === 'non_holiday') {
      // 非祝日への移動
      adjustedDate = this.moveToNonHoliday(adjustedDate, condition.then_direction);
    } else if (condition.then_target === 'weekend_only') {
      // 土日のみへの移動
      adjustedDate = this.moveToWeekend(adjustedDate, condition.then_direction);
    } else if (condition.then_target === 'non_weekend') {
      // 土日以外（平日）への移動
      adjustedDate = this.moveToWeekday(adjustedDate, condition.then_direction);
    } else if (condition.then_target === 'weekend_holiday') {
      // 土日祝日への移動
      adjustedDate = this.moveToWeekendOrHoliday(adjustedDate, condition.then_direction);
    } else if (condition.then_target === 'non_weekend_holiday') {
      // 土日祝日以外への移動
      adjustedDate = this.moveToNonWeekendHoliday(adjustedDate, condition.then_direction);
    } else if (condition.then_days) {
      const days = condition.then_direction === 'next' ? condition.then_days : -condition.then_days;
      adjustedDate.setDate(date.getDate() + days);
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
  private static weekOfMonthToNumber(week: WeekOfMonth): number {
    const mapping: Record<WeekOfMonth, number> = {
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
   * 平日への移動
   */
  private static moveToWeekday(date: Date, direction: 'next' | 'previous'): Date {
    const adjustedDate = new Date(date);
    const increment = direction === 'next' ? 1 : -1;
    
    while (true) {
      const dayOfWeek = adjustedDate.getDay();
      if (dayOfWeek >= 1 && dayOfWeek <= 5) { // 月曜日〜金曜日
        break;
      }
      adjustedDate.setDate(adjustedDate.getDate() + increment);
    }
    
    return adjustedDate;
  }

  /**
   * 休日（土日）への移動
   */
  private static moveToWeekend(date: Date, direction: 'next' | 'previous'): Date {
    const adjustedDate = new Date(date);
    const increment = direction === 'next' ? 1 : -1;
    
    while (true) {
      const dayOfWeek = adjustedDate.getDay();
      if (dayOfWeek === 0 || dayOfWeek === 6) { // 日曜日または土曜日
        break;
      }
      adjustedDate.setDate(adjustedDate.getDate() + increment);
    }
    
    return adjustedDate;
  }

  /**
   * 祝日への移動
   */
  private static moveToHoliday(date: Date, direction: 'next' | 'previous'): Date {
    const adjustedDate = new Date(date);
    const increment = direction === 'next' ? 1 : -1;
    
    while (true) {
      if (this.isHoliday(adjustedDate)) {
        break;
      }
      adjustedDate.setDate(adjustedDate.getDate() + increment);
    }
    
    return adjustedDate;
  }

  /**
   * 非祝日への移動
   */
  private static moveToNonHoliday(date: Date, direction: 'next' | 'previous'): Date {
    const adjustedDate = new Date(date);
    const increment = direction === 'next' ? 1 : -1;
    
    while (true) {
      if (!this.isHoliday(adjustedDate)) {
        break;
      }
      adjustedDate.setDate(adjustedDate.getDate() + increment);
    }
    
    return adjustedDate;
  }

  /**
   * 土日祝日への移動
   */
  private static moveToWeekendOrHoliday(date: Date, direction: 'next' | 'previous'): Date {
    const adjustedDate = new Date(date);
    const increment = direction === 'next' ? 1 : -1;
    
    while (true) {
      const dayOfWeek = adjustedDate.getDay();
      if (dayOfWeek === 0 || dayOfWeek === 6 || this.isHoliday(adjustedDate)) {
        break;
      }
      adjustedDate.setDate(adjustedDate.getDate() + increment);
    }
    
    return adjustedDate;
  }

  /**
   * 土日祝日以外への移動
   */
  private static moveToNonWeekendHoliday(date: Date, direction: 'next' | 'previous'): Date {
    const adjustedDate = new Date(date);
    const increment = direction === 'next' ? 1 : -1;
    
    while (true) {
      const dayOfWeek = adjustedDate.getDay();
      if ((dayOfWeek >= 1 && dayOfWeek <= 5) && !this.isHoliday(adjustedDate)) {
        break;
      }
      adjustedDate.setDate(adjustedDate.getDate() + increment);
    }
    
    return adjustedDate;
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
    
    // 初回の日付にも補正条件を適用
    if (rule.adjustment && (rule.adjustment.date_conditions.length > 0 || rule.adjustment.weekday_conditions.length > 0)) {
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