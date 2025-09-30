/**
 * 繰り返し設定型変換ユーティリティ
 *
 * UI側とTauri側、既存型との間での型変換を行います。
 * データの整合性を保ちながら安全な変換を提供します。
 */

import type { RecurrenceRule as LegacyRecurrenceRule } from '$lib/types/datetime-calendar';
import type { RecurrenceRule as BackendRecurrenceRule } from '$lib/types/recurrence-rule';
import type {
  UnifiedRecurrenceRule,
  TauriRecurrenceRule,
  RecurrenceUnit,
  DayOfWeek,
  RecurrenceDetails,
  RecurrenceAdjustment
} from '$lib/types/unified-recurrence';
import { SvelteDate } from 'svelte/reactivity';

/**
 * 既存のUI側RecurrenceRule型から統一型への変換
 */
export function fromLegacyRecurrenceRule(
  legacy: LegacyRecurrenceRule | null | undefined
): UnifiedRecurrenceRule | undefined {
  if (!legacy) return undefined;

  const unified: UnifiedRecurrenceRule = {
    unit: legacy.unit === 'half_year' ? 'halfyear' : legacy.unit as RecurrenceUnit,
    interval: legacy.interval || 1,
    daysOfWeek: legacy.daysOfWeek as DayOfWeek[] | undefined,
    endDate: legacy.endDate,
    maxOccurrences: legacy.maxOccurrences
  };

  // 詳細設定の変換
  if (legacy.details) {
    if (typeof legacy.details === 'string') {
      try {
        unified.details = JSON.parse(legacy.details) as RecurrenceDetails;
      } catch (e) {
        console.warn('Failed to parse recurrence details:', e);
      }
    } else {
      unified.details = legacy.details as RecurrenceDetails;
    }
  }

  // 補正条件の変換
  if (legacy.adjustment) {
    if (typeof legacy.adjustment === 'string') {
      try {
        unified.adjustment = JSON.parse(legacy.adjustment) as RecurrenceAdjustment;
      } catch (e) {
        console.warn('Failed to parse recurrence adjustment:', e);
      }
    } else {
      unified.adjustment = legacy.adjustment as RecurrenceAdjustment;
    }
  }

  return unified;
}

/**
 * 統一型から既存のUI側RecurrenceRule型への変換
 */
export function toLegacyRecurrenceRule(
  unified: UnifiedRecurrenceRule | null | undefined
): LegacyRecurrenceRule | undefined {
  if (!unified) return undefined;

  const legacy: LegacyRecurrenceRule = {
    unit: unified.unit === 'halfyear' ? 'half_year' : (unified.unit as LegacyRecurrenceRule['unit']),
    interval: unified.interval,
    daysOfWeek: unified.daysOfWeek as LegacyRecurrenceRule['daysOfWeek'],
    endDate: unified.endDate,
    maxOccurrences: unified.maxOccurrences
  };

  // 詳細設定の変換 - 既存型の構造に合わせる
  if (unified.details) {
    legacy.details = {
      specificDate: unified.details.monthly?.dayOfMonth,
      weekOfPeriod: unified.details.monthly?.weekOfMonth as NonNullable<LegacyRecurrenceRule['details']>['weekOfPeriod'],
      weekdayOfWeek: unified.details.monthly?.dayOfWeek as NonNullable<LegacyRecurrenceRule['details']>['weekdayOfWeek'],
      dateConditions: []
    };
  }

  // 補正条件の変換 - 既存型の構造に合わせる
  if (unified.adjustment) {
    legacy.adjustment = {
      dateConditions: [],
      weekdayConditions: []
    };
  }

  return legacy;
}

/**
 * バックエンド側RecurrenceRule型から統一型への変換
 */
export function fromBackendRecurrenceRule(
  backend: BackendRecurrenceRule | null | undefined
): UnifiedRecurrenceRule | undefined {
  if (!backend) return undefined;

  const unified: UnifiedRecurrenceRule = {
    id: backend.id,
    unit: backend.unit as RecurrenceUnit,
    interval: backend.interval,
    daysOfWeek: backend.daysOfWeek as DayOfWeek[] | undefined,
    maxOccurrences: backend.maxOccurrences
  };

  // 終了日の変換
  if (backend.endDate) {
    if (typeof backend.endDate === 'string') {
      unified.endDate = new Date(backend.endDate);
    } else {
      unified.endDate = backend.endDate;
    }
  }

  // 詳細設定の変換
  if (backend.details) {
    try {
      unified.details = JSON.parse(backend.details) as RecurrenceDetails;
    } catch (e) {
      console.warn('Failed to parse backend recurrence details:', e);
    }
  }

  // 補正条件の変換
  if (backend.adjustment) {
    try {
      unified.adjustment = JSON.parse(backend.adjustment) as RecurrenceAdjustment;
    } catch (e) {
      console.warn('Failed to parse backend recurrence adjustment:', e);
    }
  }

  return unified;
}

/**
 * 統一型からTauri送信用型への変換
 */
export function toTauriRecurrenceRule(
  unified: UnifiedRecurrenceRule | null | undefined
): TauriRecurrenceRule | undefined {
  if (!unified) return undefined;

  // フロントエンド（小文字）からRust（大文字）へのマッピング
  const unitMapping: Record<string, string> = {
    'minute': 'Minute',
    'hour': 'Hour',
    'day': 'Day',
    'week': 'Week',
    'month': 'Month',
    'quarter': 'Quarter',
    'halfyear': 'HalfYear',
    'half_year': 'HalfYear',
    'year': 'Year'
  };

  const tauri: TauriRecurrenceRule = {
    id: unified.id || crypto.randomUUID(),
    unit: unitMapping[unified.unit] || unified.unit,
    interval: unified.interval,
    days_of_week: unified.daysOfWeek,
    max_occurrences: unified.maxOccurrences
  };

  // 終了日の変換
  if (unified.endDate) {
    if (unified.endDate instanceof SvelteDate) {
      tauri.end_date = unified.endDate.toISOString();
    } else if (unified.endDate instanceof Date) {
      tauri.end_date = unified.endDate.toISOString();
    }
  }

  // 詳細設定の変換
  if (unified.details) {
    tauri.details = JSON.stringify(unified.details);
  }

  // 補正条件の変換
  if (unified.adjustment) {
    tauri.adjustment = JSON.stringify(unified.adjustment);
  }

  return tauri;
}

/**
 * Tauri受信用型から統一型への変換
 */
export function fromTauriRecurrenceRule(
  tauri: TauriRecurrenceRule | null | undefined
): UnifiedRecurrenceRule | undefined {
  if (!tauri) return undefined;

  // Rust（大文字）からフロントエンド（小文字）へのマッピング
  const unitMapping: Record<string, RecurrenceUnit> = {
    'Minute': 'minute',
    'Hour': 'hour',
    'Day': 'day',
    'Week': 'week',
    'Month': 'month',
    'Quarter': 'quarter',
    'HalfYear': 'halfyear',
    'Year': 'year'
  };

  const unified: UnifiedRecurrenceRule = {
    id: tauri.id,
    unit: unitMapping[tauri.unit] || tauri.unit as RecurrenceUnit,
    interval: tauri.interval,
    daysOfWeek: tauri.days_of_week as DayOfWeek[] | undefined,
    maxOccurrences: tauri.max_occurrences
  };

  // 終了日の変換
  if (tauri.end_date) {
    unified.endDate = new Date(tauri.end_date);
  }

  // 詳細設定の変換
  if (tauri.details) {
    try {
      unified.details = JSON.parse(tauri.details) as RecurrenceDetails;
    } catch (e) {
      console.warn('Failed to parse tauri recurrence details:', e);
    }
  }

  // 補正条件の変換
  if (tauri.adjustment) {
    try {
      unified.adjustment = JSON.parse(tauri.adjustment) as RecurrenceAdjustment;
    } catch (e) {
      console.warn('Failed to parse tauri recurrence adjustment:', e);
    }
  }

  return unified;
}

/**
 * 繰り返しルールのバリデーション
 */
export function validateRecurrenceRule(rule: UnifiedRecurrenceRule): string[] {
  const errors: string[] = [];

  if (!rule.unit) {
    errors.push('繰り返し単位が指定されていません');
  }

  if (!rule.interval || rule.interval < 1) {
    errors.push('繰り返し間隔は1以上である必要があります');
  }

  if (rule.unit === 'week' && (!rule.daysOfWeek || rule.daysOfWeek.length === 0)) {
    errors.push('週単位の場合は曜日の指定が必要です');
  }

  if (rule.maxOccurrences && rule.maxOccurrences < 1) {
    errors.push('最大繰り返し回数は1以上である必要があります');
  }

  if (rule.endDate && rule.endDate < new Date()) {
    errors.push('終了日は現在日時より後である必要があります');
  }

  return errors;
}

/**
 * デバッグ用の詳細ログ出力
 */
export function logRecurrenceConversion(
  from: string,
  to: string,
  input: unknown,
  output: unknown
): void {
  if (process.env.NODE_ENV === 'development') {
    console.group(`🔄 RecurrenceRule変換: ${from} → ${to}`);
    console.log('Input:', input);
    console.log('Output:', output);
    console.groupEnd();
  }
}