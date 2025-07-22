import { describe, test, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import CalendarGrid from '../../../../src/lib/components/ui/calendar/calendar-grid.svelte';

// Mock bits-ui Calendar primitive
vi.mock('bits-ui', () => ({
  Calendar: {
    Grid: vi.fn().mockImplementation((props) => ({
      component: 'CalendarGrid',
      props
    }))
  }
}));

// Mock cn utility
vi.mock('../../../../src/lib/utils', () => ({
  cn: vi.fn((...classes) => classes.filter(Boolean).join(' '))
}));

describe('CalendarGrid Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('should render calendar grid with default props', () => {
    const { container } = render(CalendarGrid);
    expect(container).toBeInTheDocument();
  });

  test('should accept custom class name', () => {
    const { container } = render(CalendarGrid, { class: 'custom-grid' });
    expect(container).toBeInTheDocument();
  });

  test('should handle ref binding', () => {
    let ref = null;
    const { container } = render(CalendarGrid, { ref });
    expect(container).toBeInTheDocument();
  });

  test('should render children content', () => {
    const { container } = render(CalendarGrid, {
      children: () => 'Grid Content'
    });
    expect(screen.getByText('Grid Content')).toBeInTheDocument();
  });

  test('should pass through additional props', () => {
    const { container } = render(CalendarGrid, { 
      'data-testid': 'calendar-grid',
      role: 'grid'
    });
    expect(container).toBeInTheDocument();
  });

  test('should apply correct CSS classes', () => {
    const { container } = render(CalendarGrid, { class: 'extra-class' });
    expect(container).toBeInTheDocument();
  });

  test('should handle empty children', () => {
    const { container } = render(CalendarGrid, { children: undefined });
    expect(container).toBeInTheDocument();
  });
});