import { getLocale } from '$paraglide/runtime';
import type { CustomDateFormat } from '$lib/types/settings';

type StandardFormat = {
  id: string;
  name: string;
  format: string;
  isStandard: true;
};

type CombinedFormat =
  | StandardFormat
  | (CustomDateFormat & { isStandard: false })
  | {
      id: 'custom';
      name: string;
      format: string;
      isStandard: false;
    };

export function getDefaultDateFormatForLocale(locale: string): string {
  if (locale.startsWith('ja')) {
    return 'yyyy年MM月dd日(E) HH:mm:ss';
  }
  return 'EEEE, MMMM do, yyyy HH:mm:ss';
}

export function getStandardDateFormatsForLocale(locale: string): StandardFormat[] {
  if (locale.startsWith('ja')) {
    return [
      { id: 'standard', name: '標準形式', format: 'yyyy年MM月dd日(E) HH:mm:ss', isStandard: true },
      { id: 'short', name: '短縮形式', format: 'yyyy/MM/dd HH:mm', isStandard: true },
      { id: 'date_only', name: '日付のみ', format: 'yyyy年MM月dd日', isStandard: true },
      { id: 'time_only', name: '時刻のみ', format: 'HH:mm:ss', isStandard: true },
      { id: 'iso', name: 'ISO形式', format: 'yyyy-MM-dd HH:mm:ss', isStandard: true }
    ];
  }

  return [
    { id: 'standard', name: 'Standard format', format: 'EEEE, MMMM do, yyyy HH:mm:ss', isStandard: true },
    { id: 'short', name: 'Short format', format: 'MM/dd/yyyy HH:mm', isStandard: true },
    { id: 'date_only', name: 'Date only', format: 'MMMM do, yyyy', isStandard: true },
    { id: 'time_only', name: 'Time only', format: 'HH:mm:ss', isStandard: true },
    { id: 'iso', name: 'ISO format', format: 'yyyy-MM-dd HH:mm:ss', isStandard: true }
  ];
}

export function buildAllDateFormats(customFormats: CustomDateFormat[]): CombinedFormat[] {
  const locale = getLocale();
  const standardFormats = getStandardDateFormatsForLocale(locale);
  const extendedCustomFormats: Array<CustomDateFormat & { isStandard: false }> = customFormats.map((f) => ({
    ...f,
    isStandard: false
  }));

  const customLabel = locale.startsWith('ja') ? 'カスタム' : 'Custom';
  const placeholder: CombinedFormat = { id: 'custom', name: customLabel, format: '', isStandard: false };

  return [...standardFormats, ...extendedCustomFormats, placeholder];
}

export type { CombinedFormat };
