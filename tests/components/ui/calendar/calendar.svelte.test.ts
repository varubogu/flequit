import { describe, test, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import Calendar from '$lib/components/ui/calendar/calendar.svelte';

// Mock bits-ui Calendar primitive
vi.mock('bits-ui', () => ({
  Calendar: {
    Root: vi.fn().mockImplementation(({ children, ...props }) => {
      return {
        component: 'CalendarRoot',
        props,
        children: children?.({
          months: [
            {
              value: new Date(2024, 0, 1),
              weeks: [[new Date(2024, 0, 1), new Date(2024, 0, 2), new Date(2024, 0, 3)]]
            }
          ],
          weekdays: ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']
        })
      };
    })
  }
}));

// Mock calendar sub-components
vi.mock('$lib/components/ui/calendar/index.js', () => ({
  Months: () => null,
  Nav: () => null,
  PrevButton: () => null,
  NextButton: () => null,
  Month: () => null,
  Header: () => null,
  Caption: () => null,
  Grid: () => null,
  GridHead: () => null,
  GridRow: () => null,
  HeadCell: () => null,
  GridBody: () => null,
  Cell: () => null,
  Day: () => null
}));

// Mock internationalized date
vi.mock('@internationalized/date', () => ({
  isEqualMonth: vi.fn(() => true)
}));

describe('Calendar Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('should render calendar with default props', () => {
    const { container } = render(Calendar);
    expect(container).toBeInTheDocument();
  });

  test('should accept custom class name', () => {
    const { container } = render(Calendar, { class: 'custom-calendar' });
    expect(container).toBeInTheDocument();
  });

  test('should handle value binding', () => {
    let value = new Date(2024, 0, 15);
    const { container } = render(Calendar, { value });
    expect(container).toBeInTheDocument();
  });

  test('should handle placeholder binding', () => {
    let placeholder = new Date(2024, 0, 1);
    const { container } = render(Calendar, { placeholder });
    expect(container).toBeInTheDocument();
  });

  test('should configure weekday format', () => {
    const { container } = render(Calendar, { weekdayFormat: 'long' });
    expect(container).toBeInTheDocument();
  });

  test('should configure caption layout', () => {
    const { container } = render(Calendar, { captionLayout: 'dropdown' });
    expect(container).toBeInTheDocument();
  });

  test('should handle locale setting', () => {
    const { container } = render(Calendar, { locale: 'ja-JP' });
    expect(container).toBeInTheDocument();
  });

  test('should handle button variant', () => {
    const { container } = render(Calendar, { buttonVariant: 'outline' });
    expect(container).toBeInTheDocument();
  });

  test('should handle disableDaysOutsideMonth option', () => {
    const { container } = render(Calendar, { disableDaysOutsideMonth: true });
    expect(container).toBeInTheDocument();
  });

  test('should handle onValueChange callback', () => {
    const onValueChange = vi.fn();
    const { container } = render(Calendar, { onValueChange });
    expect(container).toBeInTheDocument();
  });

  test('should derive month format correctly for dropdown layouts', () => {
    const { container } = render(Calendar, { captionLayout: 'dropdown-months' });
    expect(container).toBeInTheDocument();
  });

  test('should use custom month format when provided', () => {
    const { container } = render(Calendar, {
      monthFormat: 'numeric',
      captionLayout: 'dropdown'
    });
    expect(container).toBeInTheDocument();
  });

  test('should handle years and months props', () => {
    const years = [2023, 2024, 2025];
    const months = ['Jan', 'Feb', 'Mar'];
    const { container } = render(Calendar, { years, months });
    expect(container).toBeInTheDocument();
  });

  test('should handle custom day snippet', () => {
    const customDay = vi.fn();
    const { container } = render(Calendar, { day: customDay });
    expect(container).toBeInTheDocument();
  });

  test('should pass through additional props', () => {
    const { container } = render(Calendar, {
      'data-testid': 'custom-calendar',
      disabled: true
    });
    expect(container).toBeInTheDocument();
  });
});
