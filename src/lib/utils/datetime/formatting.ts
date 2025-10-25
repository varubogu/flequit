import { format } from 'date-fns';

/**
 * 日付を「今日」「明日」「昨日」または通常の日付形式でフォーマットする
 * @param date フォーマット対象の日付（undefinedの場合は空文字を返す）
 * @returns フォーマットされた日付文字列
 */
export function formatDate(date: Date | undefined): string {
  if (!date) return '';

  const now = new Date();
  const taskDate = new Date(date);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const taskDay = new Date(taskDate.getFullYear(), taskDate.getMonth(), taskDate.getDate());

  if (taskDay.getTime() === today.getTime()) {
    return 'Today';
  } else if (taskDay.getTime() === today.getTime() + 24 * 60 * 60 * 1000) {
    return 'Tomorrow';
  } else if (taskDay.getTime() === today.getTime() - 24 * 60 * 60 * 1000) {
    return 'Yesterday';
  } else {
    return taskDate.toLocaleDateString();
  }
}

/**
 * 日付と時刻をロケール形式の文字列でフォーマットする
 * @param date フォーマット対象の日付
 * @returns ロケール形式の日時文字列
 */
export function formatDateTime(date: Date): string {
  return new Date(date).toLocaleString();
}

/**
 * 日付をHTML input[type="date"]用のYYYY-MM-DD形式でフォーマットする
 * @param date フォーマット対象の日付（undefinedの場合は空文字を返す）
 * @returns YYYY-MM-DD形式の日付文字列
 */
export function formatDateForInput(date: Date | undefined): string {
  if (!date) return '';
  const d = new Date(date);
  // Use local date to avoid timezone shift
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * 日付を詳細形式（曜日、年、月名、日）でフォーマットする
 * @param date フォーマット対象の日付（undefinedの場合は「No due date」を返す）
 * @returns 詳細形式の日付文字列
 */
export function formatDetailedDate(date: Date | undefined): string {
  if (!date) return 'No due date';
  return new Date(date).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

/**
 * 期限日に基づいてCSSクラスを決定する
 * @param date 期限日（undefinedの場合は空文字を返す）
 * @param status タスクのステータス（完了済みの場合は期限切れ表示しない）
 * @returns 期限状態に応じたCSSクラス文字列
 */
export function getDueDateClass(date: Date | undefined, status?: string): string {
  if (!date) return '';

  const now = new Date();
  const taskDate = new Date(date);

  // 時刻情報があるかどうかで判定方法を変える
  if (hasTime(taskDate)) {
    // 日時での比較（時刻まで考慮）
    if (taskDate < now && status !== 'completed') {
      return 'text-red-600 font-semibold'; // Overdue
    }
    // 「今日」判定は日付部分のみで判定
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const taskDay = new Date(taskDate.getFullYear(), taskDate.getMonth(), taskDate.getDate());
    if (taskDay.getTime() === today.getTime()) {
      return 'text-orange-300 font-medium'; // Due today
    }
    return 'text-muted-foreground'; // Future
  } else {
    // 日付のみでの比較
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const taskDay = new Date(taskDate.getFullYear(), taskDate.getMonth(), taskDate.getDate());

    if (taskDay < today && status !== 'completed') {
      return 'text-red-600 font-semibold'; // Overdue
    } else if (taskDay.getTime() === today.getTime()) {
      return 'text-orange-300 font-medium'; // Due today
    } else {
      return 'text-muted-foreground'; // Future
    }
  }
}

/**
 * 日付が時刻情報を持っているかどうかを判定する
 * @param date 判定対象の日付
 * @returns 時刻情報（時分）が0以外の場合true
 */
export function hasTime(date?: Date): boolean {
  return !!date && (date.getHours() !== 0 || date.getMinutes() !== 0);
}

/**
 * 時刻をHH:MM形式でフォーマットする
 * @param date 時刻を含む日付オブジェクト
 * @returns HH:MM形式の時刻文字列
 */
export function formatTime(date: Date): string {
  return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
}

/**
 * 設定ストアの日付フォーマットを使用して日付をフォーマットする
 * @param date フォーマット対象の日付
 * @returns 設定に基づいた日付文字列（エラー時は日本語形式でフォールバック）
 */
export function formatDateJapanese(date: Date, formatPattern = 'yyyy年MM月dd日(EEE) HH:mm:ss'): string {
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

/**
 * 時刻をHH:MM:SS形式でフォーマットする
 * @param date 時刻を含む日付オブジェクト
 * @returns HH:MM:SS形式の時刻文字列
 */
export function formatTime1(date: Date): string {
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `${hours}:${minutes}:${seconds}`;
}

/**
 * 日付をYYYY-MM-DD形式でフォーマットする
 * @param date フォーマット対象の日付
 * @returns YYYY-MM-DD形式の日付文字列
 */
export function formatDate1(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
