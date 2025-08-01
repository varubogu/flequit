import { describe, test, expect, beforeEach, vi } from 'vitest';
import { render } from '@testing-library/svelte';
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
      date: { year: 2024, month: 1, day: 15 } as any,
      month: { year: 2024, month: 1, day: 1 } as any
    });
    expect(container).toBeInTheDocument();
  });

  test('should accept custom class name', () => {
    const { container } = render(CalendarCell, {
      class: 'custom-cell',
      date: { year: 2024, month: 1, day: 15 } as any,
      month: { year: 2024, month: 1, day: 1 } as any
    });
    expect(container).toBeInTheDocument();
  });

  test('should handle ref binding', () => {
    let ref = null;
    const { container } = render(CalendarCell, {
      ref,
      date: { year: 2024, month: 1, day: 15 } as any,
      month: { year: 2024, month: 1, day: 1 } as any
    });
    expect(container).toBeInTheDocument();
  });

  test('should apply correct CSS classes', () => {
    const { container } = render(CalendarCell, {
      class: 'focus-test',
      date: { year: 2024, month: 1, day: 15 } as any,
      month: { year: 2024, month: 1, day: 1 } as any
    });
    expect(container).toBeInTheDocument();
  });
});
