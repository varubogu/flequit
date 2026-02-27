/**
 * 基本的な日付フォーマットユーティリティ
 */

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
