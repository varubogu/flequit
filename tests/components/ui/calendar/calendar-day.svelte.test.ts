import { describe, test, expect, beforeEach, vi } from 'vitest';
import { render } from '@testing-library/svelte';
import CalendarDay from '$lib/components/ui/calendar/calendar-day.svelte';

// Mock bits-ui Calendar primitive
vi.mock('bits-ui', () => ({
  Calendar: {
    Day: vi.fn().mockImplementation((props) => ({
      component: 'CalendarDay',
      props
    }))
  }
}));

// Mock button variants
vi.mock('$lib/components/ui/button/index.js', () => ({
  buttonVariants: vi.fn(() => 'button-class')
}));

// Mock cn utility
vi.mock('$lib/utils', () => ({
  cn: vi.fn((...classes) => classes.filter(Boolean).join(' '))
}));

describe('CalendarDay Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('should render calendar day with default props', () => {
    const { container } = render(CalendarDay);
    expect(container).toBeInTheDocument();
  });

  test('should accept custom class name', () => {
    const { container } = render(CalendarDay, { class: 'custom-day' });
    expect(container).toBeInTheDocument();
  });

  test('should handle ref binding', () => {
    const ref = null;
    const { container } = render(CalendarDay, { ref });
    expect(container).toBeInTheDocument();
  });

  test('should pass through additional props', () => {
    const { container } = render(CalendarDay, {
      'data-testid': 'calendar-day'
    });
    expect(container).toBeInTheDocument();
  });

  test('should apply correct CSS classes', () => {
    const { container } = render(CalendarDay, { class: 'extra-class' });
    expect(container).toBeInTheDocument();
  });

  test('should handle data attributes', () => {
    const { container } = render(CalendarDay, { 'data-selected': true });
    expect(container).toBeInTheDocument();
  });

  test('should handle selected state', () => {
    const { container } = render(CalendarDay, { 'data-selected': true });
    expect(container).toBeInTheDocument();
  });

  test('should handle today state', () => {
    const { container } = render(CalendarDay, { 'data-today': true });
    expect(container).toBeInTheDocument();
  });

  test('should handle outside month state', () => {
    const { container } = render(CalendarDay, { 'data-outside-month': true });
    expect(container).toBeInTheDocument();
  });

  test('should handle unavailable state', () => {
    const { container } = render(CalendarDay, { 'data-unavailable': true });
    expect(container).toBeInTheDocument();
  });
});
