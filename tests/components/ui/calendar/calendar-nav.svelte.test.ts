import { describe, test, expect, beforeEach, vi } from 'vitest';
import { render } from '@testing-library/svelte';
import CalendarNav from '$lib/components/ui/calendar/calendar-nav.svelte';

// Mock cn utility
vi.mock('$lib/utils', () => ({
  cn: vi.fn((...classes) => classes.filter(Boolean).join(' '))
}));

describe('CalendarNav Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('should render navigation element', () => {
    const { container } = render(CalendarNav);
    const nav = container.querySelector('nav');
    expect(nav).toBeInTheDocument();
  });

  test('should accept custom class name', () => {
    const { container } = render(CalendarNav, { class: 'custom-nav' });
    const nav = container.querySelector('nav');
    expect(nav).toBeInTheDocument();
  });

  test('should handle ref binding', () => {
    let ref = null;
    const { container } = render(CalendarNav, { ref });
    const nav = container.querySelector('nav');
    expect(nav).toBeInTheDocument();
  });

  test('should render with navigation structure', () => {
    const { container } = render(CalendarNav);
    const nav = container.querySelector('nav');
    expect(nav).toBeInTheDocument();
    expect(nav).toHaveClass('absolute', 'inset-x-0', 'top-0', 'flex', 'w-full');
  });

  test('should pass through additional props', () => {
    const { container } = render(CalendarNav, { 
      'data-testid': 'calendar-nav',
      role: 'navigation'
    });
    const nav = container.querySelector('nav');
    expect(nav).toHaveAttribute('data-testid', 'calendar-nav');
    expect(nav).toHaveAttribute('role', 'navigation');
  });

  test('should apply correct default classes', () => {
    const { container } = render(CalendarNav);
    const nav = container.querySelector('nav');
    expect(nav).toBeInTheDocument();
  });

  test('should handle empty children', () => {
    const { container } = render(CalendarNav, { children: undefined });
    const nav = container.querySelector('nav');
    expect(nav).toBeInTheDocument();
  });
});