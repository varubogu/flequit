import { format } from 'date-fns';
import { hasTime, formatTime } from './basic';

/**
 * 設定ストアの日付フォーマットを使用して日付をフォーマットする
 * @param date フォーマット対象の日付
 * @returns 設定に基づいた日付文字列（エラー時は日本語形式でフォールバック）
 */
export function formatDateJapanese(
  date: Date,
  formatPattern = 'yyyy年MM月dd日(EEE) HH:mm:ss'
): string {
  try {
    return format(date, formatPattern);
  } catch {
    // Fallback to original format if user format is invalid
    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      weekday: 'short'
    });
  }
}

/**
 * 日付と時刻を組み合わせてフォーマットする
 * @param date ベース日付
 * @param time 時刻情報（省略可能）
 * @returns 日付文字列（時刻がある場合は時刻も含む）
 */
export function formatSingleDate(date: Date, time?: Date, formatPattern?: string): string {
  const baseFormatted = formatDateJapanese(date, formatPattern);
  if (hasTime(time)) {
    return `${baseFormatted} ${formatTime(time!)}`;
  }
  return baseFormatted;
}

/**
 * 開始日から終了日までの期間を表示用にフォーマットする
 * @param start 開始日
 * @param end 終了日
 * @returns 期間の表示文字列（同日の場合は1つの日付のみ表示）
 */
export function formatDateDisplayRange(start: Date, end: Date, formatPattern?: string): string {
  const startFormatted = formatDateJapanese(start, formatPattern);
  const endFormatted = formatDateJapanese(end, formatPattern);

  const startTime = hasTime(start) ? ` ${formatTime(start)}` : '';
  const endTime = hasTime(end) ? ` ${formatTime(end)}` : '';

  if (start.toDateString() === end.toDateString()) {
    if (startTime || endTime) {
      return `${startFormatted}${startTime} 〜${endTime}`;
    }
    return startFormatted;
  } else {
    return `${startFormatted}${startTime} 〜 ${endFormatted}${endTime}`;
  }
}

/**
 * 日付と時刻の範囲を複数のオプションでフォーマットする
 * @param date ベース日付
 * @param options フォーマットオプション
 * @param options.startDateTime 開始日時
 * @param options.endDateTime 終了日時
 * @param options.isRangeDate 範囲日付として扱うかどうか
 * @returns フォーマットされた日時範囲文字列
 */
export function formatDateTimeRange(
  date: Date,
  options: {
    startDateTime?: Date;
    endDateTime?: Date;
    isRangeDate?: boolean;
  }
): string {
  const { startDateTime, endDateTime, isRangeDate } = options;

  if (isRangeDate && startDateTime && endDateTime) {
    const rangeStartDate = new Date(date);
    const startDateOnly = new Date(
      startDateTime.getFullYear(),
      startDateTime.getMonth(),
      startDateTime.getDate()
    );
    const endDateOnly = new Date(
      endDateTime.getFullYear(),
      endDateTime.getMonth(),
      endDateTime.getDate()
    );
    const originalDayDiff = Math.round(
      (endDateOnly.getTime() - startDateOnly.getTime()) / (1000 * 60 * 60 * 24)
    );

    rangeStartDate.setHours(startDateTime.getHours(), startDateTime.getMinutes(), 0, 0);

    const rangeEndDate = new Date(rangeStartDate);
    rangeEndDate.setDate(rangeStartDate.getDate() + originalDayDiff);
    rangeEndDate.setHours(endDateTime.getHours(), endDateTime.getMinutes(), 0, 0);

    return formatDateDisplayRange(rangeStartDate, rangeEndDate);
  }

  if (endDateTime) {
    return formatSingleDate(date, endDateTime);
  }

  return formatDateJapanese(date);
}
