import { settingsStore } from '$lib/stores/settings.svelte';

/**
 * ローカル日時文字列をUTC Dateオブジェクトに変換
 */
export function localDateTimeToUTC(localDateTime: string): Date {
  // ISO形式の文字列をそのままUTCとして扱う
  return new Date(localDateTime + 'Z');
}

/**
 * UTC DateオブジェクトをローカルタイムゾーンでのISO文字列に変換
 */
export function utcToLocalDateTime(utcDate: Date | null | undefined): string {
  if (!utcDate) return '';

  const timezone = settingsStore.effectiveTimezone;

  try {
    // UTCタイムスタンプを取得
    const utcTime = utcDate.getTime();

    // 指定タイムゾーンでのローカル時刻を取得
    const localDate = new Date(utcTime);
    const offset = getTimezoneOffset(timezone, localDate);

    // オフセットを適用してローカル時刻を計算
    const localTime = new Date(utcTime + offset);

    // YYYY-MM-DDTHH:mm:ss形式で返す
    return localTime.toISOString().slice(0, 19);
  } catch (error) {
    console.error('Timezone conversion error:', error);
    // フォールバック: システムタイムゾーンを使用
    return new Date(utcDate.getTime() - utcDate.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 19);
  }
}

/**
 * UTC Dateオブジェクトを指定タイムゾーンで表示用にフォーマット
 */
export function formatDateTimeInTimezone(
  utcDate: Date | null | undefined,
  includeTime: boolean = true
): string {
  if (!utcDate) return '';

  const timezone = settingsStore.effectiveTimezone;

  try {
    const formatter = new Intl.DateTimeFormat('ja-JP', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      ...(includeTime && {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      })
    });

    return formatter.format(utcDate);
  } catch (error) {
    console.error('Date formatting error:', error);
    // フォールバック
    return (
      utcDate.toLocaleDateString('ja-JP') +
      (includeTime ? ' ' + utcDate.toLocaleTimeString('ja-JP', { hour12: false }) : '')
    );
  }
}

/**
 * 指定タイムゾーンのオフセット（ミリ秒）を取得
 */
function getTimezoneOffset(timezone: string, date: Date): number {
  try {
    // 指定タイムゾーンでの時刻を取得
    const utcDate = new Date(date.toLocaleString('en-US', { timeZone: 'UTC' }));
    const tzDate = new Date(date.toLocaleString('en-US', { timeZone: timezone }));

    return tzDate.getTime() - utcDate.getTime();
  } catch (error) {
    console.error('Timezone offset calculation error:', error);
    return 0;
  }
}

/**
 * 日付文字列をUTC Dateに変換（入力フィールド用）
 */
export function parseInputDateTime(dateTimeString: string): Date | null {
  if (!dateTimeString) return null;

  try {
    // YYYY-MM-DD または YYYY-MM-DDTHH:mm:ss 形式
    if (dateTimeString.includes('T')) {
      return localDateTimeToUTC(dateTimeString);
    } else {
      // 日付のみの場合は00:00:00を追加
      return localDateTimeToUTC(dateTimeString + 'T00:00:00');
    }
  } catch (error) {
    console.error('Date parsing error:', error);
    return null;
  }
}
