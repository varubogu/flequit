import { describe, test, expect, beforeEach, vi } from 'vitest';
import { render } from '@testing-library/svelte';
import { CalendarDate } from '@internationalized/date';
import CalendarCell from '$lib/components/ui/calendar/calendar-cell.svelte';

// Mock bits-ui Calendar primitive
vi.mock('bits-ui', () => ({
  Calendar: {
    Cell: vi.fn().mockImplementation((props) => ({
      component: 'CalendarCell',
      props
    }))
  }
}));

// Mock cn utility
vi.mock('$lib/utils', () => ({
  cn: vi.fn((...classes) => classes.filter(Boolean).join(' '))
}));

describe('CalendarCell Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('should render calendar cell component', () => {
    const { container } = render(CalendarCell, {
      date: new CalendarDate(2024, 1, 15),
      month: new CalendarDate(2024, 1, 1)
    });
    expect(container).toBeInTheDocument();
  });

  test('should accept custom class name', () => {
    const { container } = render(CalendarCell, {
      class: 'custom-cell',
      date: new CalendarDate(2024, 1, 15),
      month: new CalendarDate(2024, 1, 1)
    });
    expect(container).toBeInTheDocument();
  });

  test('should handle ref binding', () => {
    const ref = null;
    const { container } = render(CalendarCell, {
      ref,
      date: new CalendarDate(2024, 1, 15),
      month: new CalendarDate(2024, 1, 1)
    });
    expect(container).toBeInTheDocument();
  });

  test('should apply correct CSS classes', () => {
    const { container } = render(CalendarCell, {
      class: 'focus-test',
      date: new CalendarDate(2024, 1, 15),
      month: new CalendarDate(2024, 1, 1)
    });
    expect(container).toBeInTheDocument();
  });
});
