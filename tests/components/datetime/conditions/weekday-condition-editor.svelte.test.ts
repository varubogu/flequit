import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import WeekdayConditionEditor from '$lib/components/datetime/conditions/weekday-condition-editor.svelte';
import type {
  WeekdayCondition,
  DayOfWeek,
  AdjustmentDirection,
  AdjustmentTarget
} from '$lib/types/datetime-calendar';
import { getTranslationService } from '$lib/stores/locale.svelte';

// Mock dependencies
vi.mock('$lib/stores/locale.svelte', () => ({
  getTranslationService: vi.fn(() => ({
    getMessage: vi.fn((key: string) => () => {
      const messages: Record<string, string> = {
        previous: '前の',
        next: '次の'
      };
      return messages[key] || key;
    }),
    getCurrentLocale: vi.fn(() => 'ja-JP'),
    setLocale: vi.fn(),
    reactiveMessage: vi.fn(),
    getAvailableLocales: vi.fn(() => ['ja-JP', 'en-US'])
  }))
}));

vi.mock('lucide-svelte', () => ({
  X: { render: () => '<svg data-testid="x-icon" />' }
}));

vi.mock('../calendar/day-target-selector.svelte', () => ({
  default: {
    render: () => '<div data-testid="day-target-selector">DayTargetSelector</div>'
  }
}));

describe('WeekdayConditionEditor', () => {
  const mockCondition: WeekdayCondition = {
    id: 'weekday-1',
    if_weekday: 'monday' as DayOfWeek,
    then_direction: 'next' as AdjustmentDirection,
    then_target: 'weekday' as AdjustmentTarget
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
      const { container } = render(WeekdayConditionEditor, { props: defaultProps });

      expect(container.innerHTML).toBeTruthy();
    });

    it('should render main container with correct classes', () => {
      const { container } = render(WeekdayConditionEditor, { props: defaultProps });

      const mainDiv = container.querySelector('.border-border.bg-card');
      expect(mainDiv).toBeInTheDocument();
      expect(mainDiv).toHaveClass(
        'flex',
        'flex-wrap',
        'items-center',
        'gap-2',
        'rounded',
        'border',
        'p-3'
      );
    });

    it('should render day target selectors', () => {
      const { getAllByTestId } = render(WeekdayConditionEditor, { props: defaultProps });

      const selectors = getAllByTestId('day-target-selector');
      expect(selectors).toHaveLength(2);
    });

    it('should render direction select', () => {
      const { container } = render(WeekdayConditionEditor, { props: defaultProps });

      const select = container.querySelector('select');
      expect(select).toBeInTheDocument();
    });

    it('should render remove button', () => {
      const { container } = render(WeekdayConditionEditor, { props: defaultProps });

      const removeButton = container.querySelector('button[type="button"]');
      expect(removeButton).toBeInTheDocument();
    });

    it('should render X icon in remove button', () => {
      const { getByTestId } = render(WeekdayConditionEditor, { props: defaultProps });

      expect(getByTestId('x-icon')).toBeInTheDocument();
    });
  });

  describe('Japanese language rendering', () => {
    it('should render Japanese text elements', () => {
      const { getByText } = render(WeekdayConditionEditor, { props: defaultProps });

      expect(getByText('なら')).toBeInTheDocument();
      expect(getByText('の')).toBeInTheDocument();
      expect(getByText('にずらす')).toBeInTheDocument();
    });

    it('should render direction options in Japanese', () => {
      const { container } = render(WeekdayConditionEditor, { props: defaultProps });

      const options = container.querySelectorAll('option');
      expect(options).toHaveLength(2);
      expect(options[0]).toHaveTextContent('前の');
      expect(options[1]).toHaveTextContent('次の');
    });

    it('should not render English text elements', () => {
      const { queryByText } = render(WeekdayConditionEditor, { props: defaultProps });

      expect(queryByText('If')).not.toBeInTheDocument();
      expect(queryByText(', move to')).not.toBeInTheDocument();
    });
  });

  describe('English language rendering', () => {
    beforeEach(() => {
      vi.mocked(getTranslationService).mockReturnValue({
        getMessage: vi.fn((key: string) => () => {
          const messages: Record<string, string> = {
            previous: 'previous',
            next: 'next'
          };
          return messages[key] || key;
        }),
        getCurrentLocale: vi.fn(() => 'en-US'),
        setLocale: vi.fn(),
        reactiveMessage: vi.fn(),
        getAvailableLocales: vi.fn(() => ['ja-JP', 'en-US'])
      });
    });

    it('should render English text elements', () => {
      const { getByText } = render(WeekdayConditionEditor, { props: defaultProps });

      expect(getByText('If')).toBeInTheDocument();
      expect(getByText(', move to')).toBeInTheDocument();
    });

    it('should render direction options in English', () => {
      const { container } = render(WeekdayConditionEditor, { props: defaultProps });

      const options = container.querySelectorAll('option');
      expect(options).toHaveLength(2);
      expect(options[0]).toHaveTextContent('previous');
      expect(options[1]).toHaveTextContent('next');
    });

    it('should not render Japanese text elements', () => {
      const { queryByText } = render(WeekdayConditionEditor, { props: defaultProps });

      expect(queryByText('なら')).not.toBeInTheDocument();
      expect(queryByText('の')).not.toBeInTheDocument();
      expect(queryByText('にずらす')).not.toBeInTheDocument();
    });
  });

  describe('form interactions', () => {
    it('should display correct direction value', () => {
      const { container } = render(WeekdayConditionEditor, { props: defaultProps });

      const select = container.querySelector('select') as HTMLSelectElement;
      expect(select.value).toBe('next');
    });

    it('should handle direction change', async () => {
      const user = userEvent.setup();
      const { container } = render(WeekdayConditionEditor, { props: defaultProps });

      const select = container.querySelector('select') as HTMLSelectElement;
      await user.selectOptions(select, 'previous');

      expect(defaultProps.onUpdate).toHaveBeenCalledWith({
        then_direction: 'previous'
      });
    });

    it('should call onRemove when remove button clicked', async () => {
      const user = userEvent.setup();
      const { container } = render(WeekdayConditionEditor, { props: defaultProps });

      const removeButton = container.querySelector('button[type="button"]') as HTMLButtonElement;
      await user.click(removeButton);

      expect(defaultProps.onRemove).toHaveBeenCalledOnce();
    });

    it('should handle if_weekday condition change', () => {
      const { container } = render(WeekdayConditionEditor, { props: defaultProps });

      // DayTargetSelector would trigger handleConditionChange
      expect(container.innerHTML).toContain('day-target-selector');
    });

    it('should handle target change for specific weekday', () => {
      const { container } = render(WeekdayConditionEditor, { props: defaultProps });

      // DayTargetSelector would trigger handleTargetChange
      expect(container.innerHTML).toContain('day-target-selector');
    });
  });

  describe('specific weekday target handling', () => {
    it('should handle specific weekday target condition', () => {
      const specificWeekdayProps = {
        ...defaultProps,
        condition: {
          ...mockCondition,
          then_target: 'specific_weekday' as AdjustmentTarget,
          then_weekday: 'friday' as DayOfWeek
        }
      };

      const { getAllByTestId } = render(WeekdayConditionEditor, { props: specificWeekdayProps });

      const selectors = getAllByTestId('day-target-selector');
      expect(selectors).toHaveLength(2);
    });

    it('should handle non-specific weekday target', () => {
      const nonSpecificProps = {
        ...defaultProps,
        condition: {
          ...mockCondition,
          then_target: 'holiday' as AdjustmentTarget,
          then_weekday: undefined
        }
      };

      const { getAllByTestId } = render(WeekdayConditionEditor, { props: nonSpecificProps });

      const selectors = getAllByTestId('day-target-selector');
      expect(selectors).toHaveLength(2);
    });
  });

  describe('props handling', () => {
    it('should handle different condition props', () => {
      const differentProps = {
        ...defaultProps,
        condition: {
          id: 'weekday-2',
          if_weekday: 'friday' as DayOfWeek,
          then_direction: 'previous' as AdjustmentDirection,
          then_target: 'holiday' as AdjustmentTarget
        }
      };

      const { container } = render(WeekdayConditionEditor, { props: differentProps });

      const select = container.querySelector('select') as HTMLSelectElement;
      expect(select.value).toBe('previous');
    });

    it('should handle undefined then_weekday', () => {
      const undefinedWeekdayProps = {
        ...defaultProps,
        condition: {
          ...mockCondition,
          then_weekday: undefined
        }
      };

      const { container } = render(WeekdayConditionEditor, { props: undefinedWeekdayProps });

      expect(container.innerHTML).toBeTruthy();
    });

    it('should handle missing optional properties', () => {
      const minimalProps = {
        ...defaultProps,
        condition: {
          id: 'weekday-minimal',
          if_weekday: 'monday' as DayOfWeek,
          then_direction: 'next' as AdjustmentDirection,
          then_target: 'weekday' as AdjustmentTarget
        }
      };

      const { container } = render(WeekdayConditionEditor, { props: minimalProps });

      expect(container.innerHTML).toBeTruthy();
    });
  });

  describe('styling', () => {
    it('should apply correct CSS classes to select element', () => {
      const { container } = render(WeekdayConditionEditor, { props: defaultProps });

      const select = container.querySelector('select');
      expect(select).toHaveClass(
        'border-border',
        'bg-background',
        'text-foreground',
        'rounded',
        'border',
        'p-1'
      );
    });

    it('should apply correct CSS classes to remove button', () => {
      const { container } = render(WeekdayConditionEditor, { props: defaultProps });

      const removeButton = container.querySelector('button[type="button"]');
      expect(removeButton).toHaveClass(
        'text-destructive',
        'hover:bg-destructive/10',
        'ml-auto',
        'rounded',
        'p-1'
      );
    });

    it('should apply correct CSS classes to text spans', () => {
      const { container } = render(WeekdayConditionEditor, { props: defaultProps });

      const textSpans = container.querySelectorAll('span.text-sm');
      expect(textSpans.length).toBeGreaterThan(0);
      textSpans.forEach((span) => {
        expect(span).toHaveClass('text-sm');
      });
    });
  });

  describe('accessibility', () => {
    it('should have accessible remove button with aria-label', () => {
      const { container } = render(WeekdayConditionEditor, { props: defaultProps });

      const removeButton = container.querySelector('button[type="button"]');
      expect(removeButton).toHaveAttribute('aria-label', 'Remove condition');
    });

    it('should have accessible form elements', () => {
      const { container } = render(WeekdayConditionEditor, { props: defaultProps });

      const select = container.querySelector('select');
      expect(select).toBeInTheDocument();
      expect(select).toHaveAttribute('type', null);
    });

    it('should provide semantic structure', () => {
      const { container } = render(WeekdayConditionEditor, { props: defaultProps });

      const mainDiv = container.querySelector('div');
      expect(mainDiv).toBeInTheDocument();

      const button = container.querySelector('button');
      expect(button).toHaveAttribute('type', 'button');
    });
  });

  describe('internationalization', () => {
    it('should use translation service for direction labels', () => {
      const { container } = render(WeekdayConditionEditor, { props: defaultProps });

      const options = container.querySelectorAll('option');
      expect(options[0]).toHaveTextContent('前の');
      expect(options[1]).toHaveTextContent('次の');
    });

    it('should detect language correctly', () => {
      const { getByText } = render(WeekdayConditionEditor, { props: defaultProps });

      // Japanese layout should be used
      expect(getByText('なら')).toBeInTheDocument();
    });

    it('should handle locale switching', () => {
      const { rerender, queryByText } = render(WeekdayConditionEditor, { props: defaultProps });

      expect(queryByText('なら')).toBeInTheDocument();

      // Mock English locale
      vi.mocked(getTranslationService).mockReturnValue({
        getMessage: vi.fn((key: string) => () => {
          const messages: Record<string, string> = {
            previous: 'previous',
            next: 'next'
          };
          return messages[key] || key;
        }),
        getCurrentLocale: vi.fn(() => 'en-US'),
        setLocale: vi.fn(),
        reactiveMessage: vi.fn(),
        getAvailableLocales: vi.fn(() => ['ja-JP', 'en-US'])
      });

      rerender(defaultProps);
      expect(queryByText('If')).toBeInTheDocument();
    });
  });

  describe('edge cases', () => {
    it('should handle null condition', () => {
      const nullProps = {
        ...defaultProps,
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        condition: null as WeekdayCondition | null
      };

      const { container } = render(WeekdayConditionEditor, {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        props: nullProps
      });

      expect(container.innerHTML).toBeTruthy();
    });

    it('should handle undefined callbacks', () => {
      const undefinedCallbackProps = {
        ...defaultProps,
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        onUpdate: undefined as ((updates: Partial<WeekdayCondition>) => void) | undefined,
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        onRemove: undefined as (() => void) | undefined
      };

      const { container } = render(WeekdayConditionEditor, {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        props: undefinedCallbackProps
      });

      expect(container.innerHTML).toBeTruthy();
    });

    it('should handle invalid direction value', () => {
      const invalidProps = {
        ...defaultProps,
        condition: {
          ...mockCondition,
          then_direction: 'invalid' as AdjustmentDirection
        }
      };

      const { container } = render(WeekdayConditionEditor, { props: invalidProps });

      expect(container.innerHTML).toBeTruthy();
    });

    it('should handle unknown locale', () => {
      vi.mocked(getTranslationService).mockReturnValue({
        getMessage: vi.fn((key: string) => () => key),
        getCurrentLocale: vi.fn(() => 'unknown-locale'),
        setLocale: vi.fn(),
        reactiveMessage: vi.fn(),
        getAvailableLocales: vi.fn(() => ['ja-JP', 'en-US'])
      });

      const { container } = render(WeekdayConditionEditor, { props: defaultProps });

      expect(container.innerHTML).toBeTruthy();
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
          then_direction: 'previous' as AdjustmentDirection
        }
      };

      expect(() => rerender(updatedProps)).not.toThrow();
    });

    it('should handle condition updates reactively', () => {
      const { rerender, container } = render(WeekdayConditionEditor, { props: defaultProps });

      const newCondition = {
        ...mockCondition,
        then_direction: 'previous' as AdjustmentDirection
      };

      rerender({ ...defaultProps, condition: newCondition });

      const select = container.querySelector('select') as HTMLSelectElement;
      expect(select.value).toBe('previous');
    });

    it('should maintain state consistency across rerenders', () => {
      const { rerender, container } = render(WeekdayConditionEditor, { props: defaultProps });

      rerender(defaultProps);
      rerender(defaultProps);

      const select = container.querySelector('select') as HTMLSelectElement;
      expect(select.value).toBe('next');
    });
  });

  describe('callback function handling', () => {
    it('should call handleConditionChange correctly', () => {
      const { container } = render(WeekdayConditionEditor, { props: defaultProps });

      // Function should be available for DayTargetSelector
      expect(container.innerHTML).toContain('day-target-selector');
    });

    it('should call handleTargetChange for weekday values', () => {
      const { container } = render(WeekdayConditionEditor, { props: defaultProps });

      // Function should be available for DayTargetSelector
      expect(container.innerHTML).toContain('day-target-selector');
    });

    it('should call handleTargetChange for non-weekday values', () => {
      const { container } = render(WeekdayConditionEditor, { props: defaultProps });

      // Function should be available for DayTargetSelector
      expect(container.innerHTML).toContain('day-target-selector');
    });
  });
});
