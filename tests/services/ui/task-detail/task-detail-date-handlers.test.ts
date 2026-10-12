import { describe, expect, it, vi } from 'vitest';
import {
  handleDateChangeImpl,
  handleDateClearImpl,
  handleDatePickerCloseImpl,
  handleDueDateClickImpl
} from '$lib/services/ui/task-detail/task-detail-date-handlers';
import type { TaskDetailViewStore } from '$lib/stores/task-detail-view-store.svelte';

function createStore() {
  return {
    dialogs: {
      openDatePicker: vi.fn(),
      closeDatePicker: vi.fn()
    },
    form: {
      updateDates: vi.fn(),
      updateRecurrence: vi.fn(),
      clearDates: vi.fn()
    }
  } as unknown as TaskDetailViewStore;
}

describe('task detail date handlers', () => {
  it('opens the date picker from the event target and clamps the x position', () => {
    const store = createStore();
    const target = document.createElement('button');
    target.getBoundingClientRect = () =>
      ({ left: 900, bottom: 40, top: 0, right: 0, width: 0, height: 0, x: 0, y: 0, toJSON() {} }) as DOMRect;
    const event = new MouseEvent('click', { bubbles: true });
    Object.defineProperty(event, 'target', { value: target });
    const preventDefault = vi.spyOn(event, 'preventDefault');
    const stopPropagation = vi.spyOn(event, 'stopPropagation');
    vi.spyOn(window, 'innerWidth', 'get').mockReturnValue(400);

    handleDueDateClickImpl(store, event);

    expect(preventDefault).toHaveBeenCalled();
    expect(stopPropagation).toHaveBeenCalled();
    expect(store.dialogs.openDatePicker).toHaveBeenCalledWith({ x: 100, y: 48 });
  });

  it('uses a zero origin when the click has no target', () => {
    const store = createStore();
    const event = new MouseEvent('click');
    Object.defineProperty(event, 'target', { value: null });

    handleDueDateClickImpl(store, event);

    expect(store.dialogs.openDatePicker).toHaveBeenCalledWith({ x: 0, y: 8 });
  });

  it('uses a zero origin when there is no event', () => {
    const store = createStore();

    handleDueDateClickImpl(store);

    expect(store.dialogs.openDatePicker).toHaveBeenCalledWith({ x: 0, y: 8 });
  });

  it('stores a date range and a recurrence rule', async () => {
    const store = createStore();
    const onRecurrenceChange = vi.fn().mockResolvedValue(undefined);
    const start = new Date('2024-04-01T00:00:00Z');
    const end = new Date('2024-04-03T00:00:00Z');
    const rule = { unit: 'day', interval: 1 } as never;

    await handleDateChangeImpl(
      store,
      { dateTime: end, range: { start, end }, isRangeDate: true, recurrenceRule: rule },
      onRecurrenceChange
    );

    expect(store.form.updateDates).toHaveBeenCalledWith({ start, end, isRange: true });
    expect(store.form.updateRecurrence).toHaveBeenCalledWith(rule);
    expect(onRecurrenceChange).toHaveBeenCalledWith(rule);
  });

  it('stores a single date and clears recurrence when the rule is null', async () => {
    const store = createStore();
    const onRecurrenceChange = vi.fn().mockResolvedValue(undefined);
    const dateTime = new Date('2024-04-02T00:00:00Z');

    await handleDateChangeImpl(
      store,
      { dateTime, isRangeDate: false, recurrenceRule: null },
      onRecurrenceChange
    );

    expect(store.form.updateDates).toHaveBeenCalledWith({ end: dateTime, isRange: false });
    expect(store.form.updateRecurrence).toHaveBeenCalledWith(null);
    expect(onRecurrenceChange).toHaveBeenCalledWith(null);
  });

  it('leaves recurrence untouched when the payload omits it', async () => {
    const store = createStore();
    const onRecurrenceChange = vi.fn();
    const dateTime = new Date('2024-04-02T00:00:00Z');

    await handleDateChangeImpl(
      store,
      { dateTime, isRangeDate: true },
      onRecurrenceChange
    );

    expect(store.form.updateDates).toHaveBeenCalledWith({ end: dateTime, isRange: false });
    expect(store.form.updateRecurrence).not.toHaveBeenCalled();
    expect(onRecurrenceChange).not.toHaveBeenCalled();
  });

  it('clears dates and closes the picker', () => {
    const store = createStore();

    handleDateClearImpl(store);
    handleDatePickerCloseImpl(store);

    expect(store.form.clearDates).toHaveBeenCalled();
    expect(store.dialogs.closeDatePicker).toHaveBeenCalled();
  });
});
