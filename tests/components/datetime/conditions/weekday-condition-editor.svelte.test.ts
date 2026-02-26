import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render } from '@testing-library/svelte';
import WeekdayConditionEditor from '$lib/components/datetime/conditions/weekday-condition-editor.svelte';
import type {
  WeekdayCondition,
  DayOfWeek,
  AdjustmentDirection,
  AdjustmentTarget
} from '$lib/types/datetime-calendar';

// Mock dependencies
vi.mock('$lib/stores/locale.svelte', () => ({
  getTranslationService: vi.fn(() => ({
    getMessage: vi.fn((key: string) => {
      return () => {
        const messages: Record<string, string> = {
          previous: '前の',
          next: '次の'
        };
        return messages[key] || key;
      };
    }),
    getCurrentLocale: vi.fn(() => 'ja-JP'),
    setLocale: vi.fn(),
    reactiveMessage: vi.fn(),
    getAvailableLocales: vi.fn(() => ['ja-JP', 'en-US'])
  }))
}));

vi.mock('lucide-svelte', () => ({
  X: vi.fn().mockReturnValue({})
}));

vi.mock('$lib/components/datetime/calendar/day-target-selector.svelte', () => ({
  default: vi.fn().mockReturnValue({})
}));

describe('WeekdayConditionEditor', () => {
  const mockCondition: WeekdayCondition = {
    id: 'weekday-1',
    ifWeekday: 'monday' as DayOfWeek,
    thenDirection: 'next' as AdjustmentDirection,
    thenTarget: 'weekday' as AdjustmentTarget
  };

  const defaultProps = {
    condition: mockCondition,
    onUpdate: vi.fn(),
    onRemove: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('basic rendering', () => {
    it('should render without errors', () => {
      expect(() => {
        render(WeekdayConditionEditor, { props: defaultProps });
      }).not.toThrow();
    });

    it('should render main container', () => {
      const { container } = render(WeekdayConditionEditor, { props: defaultProps });

      const mainDiv = container.querySelector('div');
      expect(mainDiv).toBeInTheDocument();
    });

    it('should render select element for direction', () => {
      const { container } = render(WeekdayConditionEditor, { props: defaultProps });

      const select = container.querySelector('select');
      expect(select).toBeInTheDocument();
    });

    it('should render remove button', () => {
      const { container } = render(WeekdayConditionEditor, { props: defaultProps });

      const button = container.querySelector('button[type="button"]');
      expect(button).toBeInTheDocument();
    });
  });

  describe('Japanese language layout', () => {
    it('should render Japanese text when locale is ja-JP', () => {
      const { container } = render(WeekdayConditionEditor, { props: defaultProps });

      expect(container.textContent).toContain('なら');
      expect(container.textContent).toContain('の');
      expect(container.textContent).toContain('にずらす');
    });
  });

  describe('form interactions', () => {
    it('should display correct initial direction value', () => {
      const { container } = render(WeekdayConditionEditor, { props: defaultProps });

      const select = container.querySelector('select') as HTMLSelectElement;
      expect(select?.value).toBe('next');
    });

    it('should render direction options', () => {
      const { container } = render(WeekdayConditionEditor, { props: defaultProps });

      const options = container.querySelectorAll('option');
      expect(options).toHaveLength(2);
      expect(options[0]).toHaveAttribute('value', 'previous');
      expect(options[1]).toHaveAttribute('value', 'next');
    });
  });

  describe('props handling', () => {
    it('should handle different condition values', () => {
      const differentProps = {
        ...defaultProps,
        condition: {
          ...mockCondition,
          thenDirection: 'previous' as AdjustmentDirection
        }
      };

      const { container } = render(WeekdayConditionEditor, { props: differentProps });

      const select = container.querySelector('select') as HTMLSelectElement;
      expect(select?.value).toBe('previous');
    });

    it('should handle specific weekday target', () => {
      const specificWeekdayProps = {
        ...defaultProps,
        condition: {
          ...mockCondition,
          thenTarget: 'specific_weekday' as AdjustmentTarget,
          thenWeekday: 'friday' as DayOfWeek
        }
      };

      expect(() => {
        render(WeekdayConditionEditor, { props: specificWeekdayProps });
      }).not.toThrow();
    });
  });

  describe('styling', () => {
    it('should apply correct CSS classes to main container', () => {
      const { container } = render(WeekdayConditionEditor, { props: defaultProps });

      const mainDiv = container.querySelector('div');
      expect(mainDiv).toHaveClass('border-border');
      expect(mainDiv).toHaveClass('bg-card');
      expect(mainDiv).toHaveClass('flex');
      expect(mainDiv).toHaveClass('flex-wrap');
      expect(mainDiv).toHaveClass('items-center');
      expect(mainDiv).toHaveClass('gap-2');
      expect(mainDiv).toHaveClass('rounded');
      expect(mainDiv).toHaveClass('border');
      expect(mainDiv).toHaveClass('p-3');
    });

    it('should apply correct CSS classes to select element', () => {
      const { container } = render(WeekdayConditionEditor, { props: defaultProps });

      const select = container.querySelector('select');
      expect(select).toHaveClass('border-border');
      expect(select).toHaveClass('bg-background');
      expect(select).toHaveClass('text-foreground');
      expect(select).toHaveClass('rounded');
      expect(select).toHaveClass('border');
      expect(select).toHaveClass('p-1');
    });

    it('should apply correct CSS classes to remove button', () => {
      const { container } = render(WeekdayConditionEditor, { props: defaultProps });

      const button = container.querySelector('button[type="button"]');
      expect(button).toHaveClass('text-destructive');
      expect(button).toHaveClass('hover:bg-destructive/10');
      expect(button).toHaveClass('ml-auto');
      expect(button).toHaveClass('rounded');
      expect(button).toHaveClass('p-1');
    });
  });

  describe('accessibility', () => {
    it('should have accessible remove button', () => {
      const { container } = render(WeekdayConditionEditor, { props: defaultProps });

      const button = container.querySelector('button[type="button"]');
      expect(button).toHaveAttribute('aria-label', 'Remove condition');
    });

    it('should have semantic form elements', () => {
      const { container } = render(WeekdayConditionEditor, { props: defaultProps });

      const select = container.querySelector('select');
      expect(select).toBeInTheDocument();

      const button = container.querySelector('button');
      expect(button).toHaveAttribute('type', 'button');
    });
  });

  describe('component lifecycle', () => {
    it('should mount and unmount cleanly', () => {
      const { unmount } = render(WeekdayConditionEditor, { props: defaultProps });

      expect(() => unmount()).not.toThrow();
    });

    it('should handle prop updates', () => {
      const { rerender } = render(WeekdayConditionEditor, { props: defaultProps });

      const updatedProps = {
        ...defaultProps,
        condition: {
          ...mockCondition,
          thenDirection: 'previous' as AdjustmentDirection
        }
      };

      expect(() => rerender(updatedProps)).not.toThrow();
    });

    it('should maintain state consistency', () => {
      const { container, rerender } = render(WeekdayConditionEditor, { props: defaultProps });

      rerender(defaultProps);

      const select = container.querySelector('select') as HTMLSelectElement;
      expect(select?.value).toBe('next');
    });
  });

  describe('edge cases', () => {
    it('should handle undefined then_weekday', () => {
      const undefinedWeekdayProps = {
        ...defaultProps,
        condition: {
          ...mockCondition,
          thenWeekday: undefined
        }
      };

      expect(() => {
        render(WeekdayConditionEditor, { props: undefinedWeekdayProps });
      }).not.toThrow();
    });

    it('should handle minimum required properties', () => {
      const minimalProps = {
        ...defaultProps,
        condition: {
          id: 'minimal',
          ifWeekday: 'monday' as DayOfWeek,
          thenDirection: 'next' as AdjustmentDirection,
          thenTarget: 'weekday' as AdjustmentTarget
        }
      };

      expect(() => {
        render(WeekdayConditionEditor, { props: minimalProps });
      }).not.toThrow();
    });

    it('should handle invalid direction gracefully', () => {
      const invalidDirectionProps = {
        ...defaultProps,
        condition: {
          ...mockCondition,
          thenDirection: 'invalid' as AdjustmentDirection
        }
      };

      expect(() => {
        render(WeekdayConditionEditor, { props: invalidDirectionProps });
      }).not.toThrow();
    });
  });

  describe('integration', () => {
    it('should integrate with translation service', () => {
      const { container } = render(WeekdayConditionEditor, { props: defaultProps });

      // Should use translated labels for direction options
      const options = container.querySelectorAll('option');
      expect(options[0]).toHaveTextContent('前の');
      expect(options[1]).toHaveTextContent('次の');
    });

    it('should handle different target types', () => {
      const holidayTargetProps = {
        ...defaultProps,
        condition: {
          ...mockCondition,
          thenTarget: 'holiday' as AdjustmentTarget,
          thenWeekday: undefined
        }
      };

      expect(() => {
        render(WeekdayConditionEditor, { props: holidayTargetProps });
      }).not.toThrow();
    });

    it('should work with all weekday values', () => {
      const weekdays: DayOfWeek[] = [
        'monday',
        'tuesday',
        'wednesday',
        'thursday',
        'friday',
        'saturday',
        'sunday'
      ];

      weekdays.forEach((weekday) => {
        const weekdayProps = {
          ...defaultProps,
          condition: {
            ...mockCondition,
            ifWeekday: weekday
          }
        };

        expect(() => {
          render(WeekdayConditionEditor, { props: weekdayProps });
        }).not.toThrow();
      });
    });
  });
});
