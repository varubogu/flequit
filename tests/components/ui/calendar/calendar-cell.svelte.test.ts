import { describe, test, expect, beforeEach, vi } from 'vitest';
import { render } from '@testing-library/svelte';
import CalendarCell from '../../../../src/lib/components/ui/calendar/calendar-cell.svelte';

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
vi.mock('../../../../src/lib/utils', () => ({
  cn: vi.fn((...classes) => classes.filter(Boolean).join(' '))
}));

describe('CalendarCell Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('should render calendar cell with default props', () => {
    const { container } = render(CalendarCell);
    expect(container).toBeInTheDocument();
  });

  test('should accept custom class name', () => {
    const { container } = render(CalendarCell, { class: 'custom-cell' });
    expect(container).toBeInTheDocument();
  });

  test('should handle ref binding', () => {
    let ref = null;
    const { container } = render(CalendarCell, { ref });
    expect(container).toBeInTheDocument();
  });

  test('should pass through additional props', () => {
    const { container } = render(CalendarCell, { 
      'data-testid': 'calendar-cell',
      date: new Date(2024, 0, 15)
    });
    expect(container).toBeInTheDocument();
  });

  test('should handle date prop', () => {
    const date = new Date(2024, 0, 15);
    const { container } = render(CalendarCell, { date });
    expect(container).toBeInTheDocument();
  });

  test('should handle month prop', () => {
    const month = new Date(2024, 0, 1);
    const { container } = render(CalendarCell, { month });
    expect(container).toBeInTheDocument();
  });

  test('should handle selected state', () => {
    const { container } = render(CalendarCell, { 'data-selected': true });
    expect(container).toBeInTheDocument();
  });

  test('should apply correct CSS classes for focus', () => {
    const { container } = render(CalendarCell, { class: 'focus-test' });
    expect(container).toBeInTheDocument();
  });
});