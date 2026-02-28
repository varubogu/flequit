import { format } from 'date-fns';
import { hasTime, formatTime } from './basic';

/**
 * UTC Dateオブジェクトを指定タイムゾーンのローカル時刻として表現する「擬似ローカルDate」を生成する
 * date-fns の format() はローカルタイムゾーンで動作するため、
 * UTC DateをタイムゾーンオフセットでシフトしたDateを渡すことで正しい表示を実現する
 */
function toTimezoneDate(utcDate: Date, timezone: string): Date {
  try {
    // 指定タイムゾーンでのオフセットを計算
    const utcStr = utcDate.toLocaleString('en-US', { timeZone: 'UTC' });
    const tzStr = utcDate.toLocaleString('en-US', { timeZone: timezone });
    const utcMs = new Date(utcStr).getTime();
    const tzMs = new Date(tzStr).getTime();
    const offsetMs = tzMs - utcMs;
    return new Date(utcDate.getTime() + offsetMs);
  } catch {
    return utcDate;
  }
}

/**
 * 指定タイムゾーンでの YYYY-MM-DD キーを取得するヘルパー（同日判定用）
 */
function getDateKey(date: Date, timezone: string): string {
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  const parts = fmt.formatToParts(date);
  const p = parts.reduce(
    (acc, x) => ({ ...acc, [x.type]: x.value }),
    {} as Record<string, string>
  );
  return `${p.year}-${p.month}-${p.day}`;
}

/**
 * 設定ストアの日付フォーマットを使用して日付をフォーマットする
 * @param date フォーマット対象のUTC Dateオブジェクト
 * @param formatPattern date-fns 形式のフォーマットパターン
 * @param timezone 表示に使用するタイムゾーン（デフォルト: システムタイムゾーン）
 * @returns 設定に基づいた日付文字列（エラー時は日本語形式でフォールバック）
 */
export function formatDateJapanese(
  date: Date,
  formatPattern = 'yyyy年MM月dd日(EEE) HH:mm:ss',
  timezone: string = Intl.DateTimeFormat().resolvedOptions().timeZone
): string {
  try {
    // UTC Dateを指定タイムゾーンのローカル時刻に変換してから date-fns でフォーマット
    const localDate = toTimezoneDate(date, timezone);
    return format(localDate, formatPattern);
  } catch {
    // Fallback to original format if user format is invalid
    return date.toLocaleDateString('ja-JP', {
      timeZone: timezone,
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
 * @param formatPattern date-fns 形式のフォーマットパターン
 * @param timezone 表示に使用するタイムゾーン（デフォルト: システムタイムゾーン）
 * @returns 日付文字列（時刻がある場合は時刻も含む）
 */
export function formatSingleDate(
  date: Date,
  time?: Date,
  formatPattern?: string,
  timezone: string = Intl.DateTimeFormat().resolvedOptions().timeZone
): string {
  const baseFormatted = formatDateJapanese(date, formatPattern, timezone);
  if (hasTime(time)) {
    return `${baseFormatted} ${formatTime(time!, timezone)}`;
  }
  return baseFormatted;
}

/**
 * 開始日から終了日までの期間を表示用にフォーマットする
 * @param start 開始日
 * @param end 終了日
 * @param formatPattern date-fns 形式のフォーマットパターン
 * @param timezone 表示に使用するタイムゾーン（デフォルト: システムタイムゾーン）
 * @returns 期間の表示文字列（同日の場合は1つの日付のみ表示）
 */
export function formatDateDisplayRange(
  start: Date,
  end: Date,
  formatPattern?: string,
  timezone: string = Intl.DateTimeFormat().resolvedOptions().timeZone
): string {
  const startFormatted = formatDateJapanese(start, formatPattern, timezone);
  const endFormatted = formatDateJapanese(end, formatPattern, timezone);

  const startTime = hasTime(start) ? ` ${formatTime(start, timezone)}` : '';
  const endTime = hasTime(end) ? ` ${formatTime(end, timezone)}` : '';

  // タイムゾーン考慮で同日かどうかを判定
  if (getDateKey(start, timezone) === getDateKey(end, timezone)) {
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
 * @param timezone 表示に使用するタイムゾーン（デフォルト: システムタイムゾーン）
 * @returns フォーマットされた日時範囲文字列
 */
export function formatDateTimeRange(
  date: Date,
  options: {
    startDateTime?: Date;
    endDateTime?: Date;
    isRangeDate?: boolean;
  },
  timezone: string = Intl.DateTimeFormat().resolvedOptions().timeZone
): string {
  const { startDateTime, endDateTime, isRangeDate } = options;

  if (isRangeDate && startDateTime && endDateTime) {
    // UTC ベースで日数差を計算し、ベース日付に適用する
    const startDayKey = getDateKey(startDateTime, timezone);
    const endDayKey = getDateKey(endDateTime, timezone);
    const startMs = new Date(`${startDayKey}T00:00:00Z`).getTime();
    const endMs = new Date(`${endDayKey}T00:00:00Z`).getTime();
    const originalDayDiff = Math.round((endMs - startMs) / (1000 * 60 * 60 * 24));

    // ベース日付の UTC 時刻に開始時刻の UTC 時分を組み合わせる
    const rangeStartDate = new Date(date);
    rangeStartDate.setUTCHours(
      startDateTime.getUTCHours(),
      startDateTime.getUTCMinutes(),
      0,
      0
    );

    const rangeEndDate = new Date(rangeStartDate);
    rangeEndDate.setUTCDate(rangeStartDate.getUTCDate() + originalDayDiff);
    rangeEndDate.setUTCHours(
      endDateTime.getUTCHours(),
      endDateTime.getUTCMinutes(),
      0,
      0
    );

    return formatDateDisplayRange(rangeStartDate, rangeEndDate, undefined, timezone);
  }

  if (endDateTime) {
    return formatSingleDate(date, endDateTime, undefined, timezone);
  }

  return formatDateJapanese(date, undefined, timezone);
}
