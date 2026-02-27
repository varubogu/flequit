import type { DateChangePayload, TaskDetailRecurrenceActions } from '$lib/stores/task-detail/task-detail-types';
import type { TaskDetailViewStore } from '$lib/stores/task-detail-view-store.svelte';

/**
 * 期日クリックハンドラ（日付ピッカーを開く）
 */
export function handleDueDateClickImpl(store: TaskDetailViewStore, event?: Event): void {
  event?.preventDefault();
  event?.stopPropagation();

  const rect = event?.target
    ? (event.target as HTMLElement).getBoundingClientRect()
    : { left: 0, bottom: 0 };

  const position = {
    x: Math.min(rect.left, window.innerWidth - 300),
    y: rect.bottom + 8
  };

  store.dialogs.openDatePicker(position);
}

/**
 * 日付変更ハンドラ
 */
export async function handleDateChangeImpl(
  store: TaskDetailViewStore,
  data: DateChangePayload,
  onRecurrenceChange: (
    rule: Parameters<TaskDetailRecurrenceActions['save']>[0]['rule']
  ) => Promise<void>
): Promise<void> {
  const { dateTime, range, isRangeDate, recurrenceRule } = data;

  if (isRangeDate && range) {
    store.form.updateDates({ start: range.start, end: range.end, isRange: true });
  } else {
    store.form.updateDates({ end: dateTime, isRange: false });
  }

  if (recurrenceRule !== undefined) {
    const nextRule = recurrenceRule ?? null;
    store.form.updateRecurrence(nextRule);
    await onRecurrenceChange(nextRule);
  }
}

/**
 * 日付クリアハンドラ
 */
export function handleDateClearImpl(store: TaskDetailViewStore): void {
  store.form.clearDates();
}

/**
 * 日付ピッカークローズハンドラ
 */
export function handleDatePickerCloseImpl(store: TaskDetailViewStore): void {
  store.dialogs.closeDatePicker();
}
