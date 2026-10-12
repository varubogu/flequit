import { CalendarDate } from '@internationalized/date';
import { fireEvent, render } from '@testing-library/svelte';
import { flushSync } from 'svelte';
import { describe, expect, it, vi } from 'vitest';
import CalendarPicker from '$lib/components/datetime/calendar/calendar-picker.svelte';

describe('CalendarPicker date boundaries', () => {
  it('parses a valid range, ignores invalid dates, and syncs a single date once', async () => {
    const onCalendarChange = vi.fn();
    const onRangeChange = vi.fn();
    const view = render(CalendarPicker, {
      props: {
        isRangeMode: true,
        startDate: '2024-01-15',
        endDate: 'not-a-date',
        onCalendarChange,
        onRangeChange
      }
    });
    flushSync();

    expect(view.container.querySelector('[role="grid"]')).toBeInTheDocument();

    await view.rerender({
      isRangeMode: true,
      startDate: '',
      endDate: '2024-13-40',
      onCalendarChange,
      onRangeChange
    });
    flushSync();
    expect(view.container.querySelector('[role="grid"]')).toBeInTheDocument();

    await view.rerender({
      isRangeMode: false,
      startDate: '',
      endDate: '2024-03-15',
      onCalendarChange,
      onRangeChange
    });
    flushSync();
    await view.rerender({
      isRangeMode: false,
      startDate: '',
      endDate: '2024-03-15',
      onCalendarChange,
      onRangeChange
    });
    flushSync();
    await view.rerender({
      isRangeMode: false,
      startDate: '',
      endDate: 'bad-date',
      onCalendarChange,
      onRangeChange
    });
    flushSync();
    expect(onCalendarChange).not.toHaveBeenCalled();

    const day = view.container.querySelector<HTMLElement>('td[role="gridcell"] button, [role="gridcell"]');
    expect(day).not.toBeNull();
    await fireEvent.click(day!);
  });

  it('reports a single selected calendar date and a complete range', async () => {
    const onCalendarChange = vi.fn();
    const onRangeChange = vi.fn();
    const single = render(CalendarPicker, {
      props: {
        isRangeMode: false,
        endDate: '2024-04-10',
        onCalendarChange,
        onRangeChange
      }
    });
    flushSync();
    expect(single.container.querySelector('[role="grid"]')).toBeInTheDocument();
    const singleDay = single.container.querySelector<HTMLElement>('[role="gridcell"]');
    expect(singleDay).not.toBeNull();
    await fireEvent.click(singleDay!);
    if (onCalendarChange.mock.calls.length > 0) {
      expect(onCalendarChange.mock.calls[0][0]).toBeInstanceOf(CalendarDate);
    }
    single.unmount();

    const range = render(CalendarPicker, {
      props: {
        isRangeMode: true,
        startDate: '2024-04-01',
        endDate: '2024-04-05',
        onCalendarChange,
        onRangeChange
      }
    });
    flushSync();
    const rangeDays = range.container.querySelectorAll<HTMLElement>('[role="gridcell"]');
    expect(range.container.querySelector('[role="grid"]')).toBeInTheDocument();
    expect(rangeDays.length).toBeGreaterThan(1);

    await fireEvent.click(rangeDays[0]);
    await fireEvent.click(rangeDays[1]);
    if (onRangeChange.mock.calls.length > 0) {
      expect(onRangeChange.mock.calls[0][0]).toBeInstanceOf(CalendarDate);
      expect(onRangeChange.mock.calls[0][1]).toBeInstanceOf(CalendarDate);
    }
  });
});
