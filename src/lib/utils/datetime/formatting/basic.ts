/**
 * 基本的な日付フォーマットユーティリティ
 *
 * 全ての関数はUTC Dateオブジェクトを受け取り、指定されたタイムゾーンで表示する。
 * タイムゾーンを省略した場合はシステムのタイムゾーンが使用される。
 * 内部での「日付のみ」判定はUTC midnight (T00:00:00Z) を基準とする。
 */

/**
 * 指定タイムゾーンでの YYYY-MM-DD キーを取得するヘルパー
 * 無効な日付の場合は空文字を返す
 */
function getDateKey(date: Date, timezone: string): string {
  if (isNaN(date.getTime())) return '';
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
 * 日付を「今日」「明日」「昨日」または通常の日付形式でフォーマットする
 * @param date フォーマット対象の日付（undefinedの場合は空文字を返す）
 * @param timezone 表示に使用するタイムゾーン（デフォルト: システムタイムゾーン）
 * @returns フォーマットされた日付文字列
 */
export function formatDate(
  date: Date | undefined,
  timezone: string = Intl.DateTimeFormat().resolvedOptions().timeZone
): string {
  if (!date) return '';

  const todayKey = getDateKey(new Date(), timezone);
  const taskKey = getDateKey(new Date(date), timezone);

  const toMs = (key: string) => new Date(`${key}T00:00:00Z`).getTime();
  const diff = Math.round((toMs(taskKey) - toMs(todayKey)) / 86400000);

  if (diff === 0) return 'Today';
  if (diff === 1) return 'Tomorrow';
  if (diff === -1) return 'Yesterday';
  return new Date(date).toLocaleDateString(undefined, { timeZone: timezone });
}

/**
 * 日付と時刻をロケール形式の文字列でフォーマットする
 * @param date フォーマット対象の日付
 * @param timezone 表示に使用するタイムゾーン（デフォルト: システムタイムゾーン）
 * @returns ロケール形式の日時文字列
 */
export function formatDateTime(
  date: Date,
  timezone: string = Intl.DateTimeFormat().resolvedOptions().timeZone
): string {
  return new Date(date).toLocaleString(undefined, { timeZone: timezone });
}

/**
 * 日付をHTML input[type="date"]用のYYYY-MM-DD形式でフォーマットする
 * @param date フォーマット対象の日付（undefinedの場合は空文字を返す）
 * @param timezone 表示に使用するタイムゾーン（デフォルト: システムタイムゾーン）
 * @returns YYYY-MM-DD形式の日付文字列
 */
export function formatDateForInput(
  date: Date | undefined,
  timezone: string = Intl.DateTimeFormat().resolvedOptions().timeZone
): string {
  if (!date) return '';
  return getDateKey(new Date(date), timezone);
}

/**
 * 日付を詳細形式（曜日、年、月名、日）でフォーマットする
 * @param date フォーマット対象の日付（undefinedの場合は「No due date」を返す）
 * @param timezone 表示に使用するタイムゾーン（デフォルト: システムタイムゾーン）
 * @returns 詳細形式の日付文字列
 */
export function formatDetailedDate(
  date: Date | undefined,
  timezone: string = Intl.DateTimeFormat().resolvedOptions().timeZone
): string {
  if (!date) return 'No due date';
  return new Date(date).toLocaleDateString('en-US', {
    timeZone: timezone,
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

/**
 * 日付が時刻情報を持っているかどうかを判定する
 * UTC midnight (T00:00:00Z) を「日付のみ」の規約として、UTC時刻で判定する。
 * @param date 判定対象の日付
 * @returns UTC時刻（時分）が0以外の場合true
 */
export function hasTime(date?: Date): boolean {
  return !!date && (date.getUTCHours() !== 0 || date.getUTCMinutes() !== 0);
}

/**
 * 時刻をHH:MM形式でフォーマットする
 * @param date 時刻を含む日付オブジェクト
 * @param timezone 表示に使用するタイムゾーン（デフォルト: システムタイムゾーン）
 * @returns HH:MM形式の時刻文字列
 */
export function formatTime(
  date: Date,
  timezone: string = Intl.DateTimeFormat().resolvedOptions().timeZone
): string {
  const fmt = new Intl.DateTimeFormat('en-GB', {
    timeZone: timezone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
  return fmt.format(date);
}

/**
 * 期限日に基づいてCSSクラスを決定する
 * @param date 期限日（undefinedの場合は空文字を返す）
 * @param status タスクのステータス（完了済みの場合は期限切れ表示しない）
 * @param timezone 表示に使用するタイムゾーン（デフォルト: システムタイムゾーン）
 * @returns 期限状態に応じたCSSクラス文字列
 */
export function getDueDateClass(
  date: Date | undefined,
  status?: string,
  timezone: string = Intl.DateTimeFormat().resolvedOptions().timeZone
): string {
  if (!date) return '';

  const now = new Date();
  const taskDate = new Date(date);

  if (hasTime(taskDate)) {
    // 日時での比較（時刻まで考慮）
    if (taskDate < now && status !== 'completed') {
      return 'text-red-600 font-semibold'; // Overdue
    }
    // 「今日」判定はタイムゾーン考慮で日付部分のみで判定
    const todayKey = getDateKey(now, timezone);
    const taskKey = getDateKey(taskDate, timezone);
    if (taskKey === todayKey) {
      return 'text-orange-300 font-medium'; // Due today
    }
    return 'text-muted-foreground'; // Future
  } else {
    // 日付のみでの比較
    const todayKey = getDateKey(now, timezone);
    const taskKey = getDateKey(taskDate, timezone);
    const toMs = (key: string) => new Date(`${key}T00:00:00Z`).getTime();
    const diff = toMs(taskKey) - toMs(todayKey);

    if (diff < 0 && status !== 'completed') {
      return 'text-red-600 font-semibold'; // Overdue
    } else if (diff === 0) {
      return 'text-orange-300 font-medium'; // Due today
    } else {
      return 'text-muted-foreground'; // Future
    }
  }
}

/**
 * 時刻をHH:MM:SS形式でフォーマットする
 * @param date 時刻を含む日付オブジェクト
 * @param timezone 表示に使用するタイムゾーン（デフォルト: システムタイムゾーン）
 * @returns HH:MM:SS形式の時刻文字列
 */
export function formatTime1(
  date: Date,
  timezone: string = Intl.DateTimeFormat().resolvedOptions().timeZone
): string {
  const fmt = new Intl.DateTimeFormat('en-GB', {
    timeZone: timezone,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });
  return fmt.format(date);
}

/**
 * 日付をYYYY-MM-DD形式でフォーマットする
 * @param date フォーマット対象の日付
 * @param timezone 表示に使用するタイムゾーン（デフォルト: システムタイムゾーン）
 * @returns YYYY-MM-DD形式の日付文字列
 */
export function formatDate1(
  date: Date,
  timezone: string = Intl.DateTimeFormat().resolvedOptions().timeZone
): string {
  return getDateKey(date, timezone);
}
