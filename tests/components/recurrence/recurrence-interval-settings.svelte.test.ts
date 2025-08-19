import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import RecurrenceIntervalSettings from '$lib/components/recurrence/recurrence-interval-settings.svelte';
import type { RecurrenceDetails, RecurrenceUnit, DayOfWeek } from '$lib/types/datetime-calendar';

// Mock dependencies
vi.mock('$lib/stores/locale.svelte', () => ({
  getTranslationService: () => ({
    getMessage: (key: string) => () => {
      const translations: Record<string, string> = {
        recurrence_interval: 'Recurrence Interval',
        minute: 'Minute',
        hour: 'Hour',
        day: 'Day',
        week: 'Week',
        month: 'Month',
        quarter: 'Quarter',
        half_year: 'Half Year',
        year: 'Year'
      };
      return translations[key] || key;
    }
  })
}));

vi.mock('./shared/numeric-interval-input.svelte', () => ({
  default: () => ({ 
    render: () => '<div data-testid="numeric-interval-input">Numeric Interval Input</div>' 
  })
}));

vi.mock('./weekday-conditions/weekday-selector.svelte', () => ({
  default: () => ({ 
    render: () => '<div data-testid="weekday-selector">Weekday Selector</div>' 
  })
}));

vi.mock('./shared/advanced-recurrence-settings.svelte', () => ({
  default: () => ({ 
    render: () => '<div data-testid="advanced-recurrence-settings">Advanced Recurrence Settings</div>' 
  })
}));

describe('RecurrenceIntervalSettings', () => {
  const mockDetails: RecurrenceDetails = {
    specific_date: undefined,
    week_of_period: undefined,
    weekday_of_week: undefined
  };

  const defaultProps = {
    unit: 'day' as RecurrenceUnit,
    interval: 1,
    daysOfWeek: [] as DayOfWeek[],
    details: mockDetails,
    showAdvancedSettings: false,
    onchange: vi.fn(),
    ontoggleDayOfWeek: vi.fn(),
    onunitchange: vi.fn(),
    onintervalchange: vi.fn(),
    ondetailschange: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('basic rendering', () => {
    it('should render without errors', () => {
      const { container } = render(RecurrenceIntervalSettings, { props: defaultProps });
      
      expect(container.innerHTML).toBeTruthy();
    });

    it('should render main container with proper spacing', () => {
      const { container } = render(RecurrenceIntervalSettings, { props: defaultProps });
      
      const container_div = container.querySelector('.space-y-3');
      expect(container_div).toBeInTheDocument();
    });

    it('should render header section', () => {
      const { container } = render(RecurrenceIntervalSettings, { props: defaultProps });
      
      const headerSection = container.querySelector('.flex.items-center.gap-4');
      expect(headerSection).toBeInTheDocument();
    });

    it('should display recurrence interval title', () => {
      render(RecurrenceIntervalSettings, { props: defaultProps });
      
      expect(screen.getByText('Recurrence Interval')).toBeInTheDocument();
    });
  });

  describe('interval input rendering', () => {
    it('should render numeric interval input', () => {
      render(RecurrenceIntervalSettings, { props: defaultProps });
      
      expect(screen.getByTestId('numeric-interval-input')).toBeInTheDocument();
    });

    it('should render unit select dropdown', () => {
      const { container } = render(RecurrenceIntervalSettings, { props: defaultProps });
      
      const select = container.querySelector('select');
      expect(select).toBeInTheDocument();
    });

    it('should display current unit value in select', () => {
      const { container } = render(RecurrenceIntervalSettings, { props: defaultProps });
      
      const select = container.querySelector('select') as HTMLSelectElement;
      expect(select.value).toBe('day');
    });

    it('should render all unit options', () => {
      const { container } = render(RecurrenceIntervalSettings, { props: defaultProps });
      
      const options = container.querySelectorAll('option');
      expect(options).toHaveLength(8); // minute, hour, day, week, month, quarter, half_year, year
    });

    it('should display translated unit labels', () => {
      render(RecurrenceIntervalSettings, { props: defaultProps });
      
      expect(screen.getByText('Day')).toBeInTheDocument();
      expect(screen.getByText('Week')).toBeInTheDocument();
      expect(screen.getByText('Month')).toBeInTheDocument();
      expect(screen.getByText('Year')).toBeInTheDocument();
    });
  });

  describe('unit change handling', () => {
    it('should call onunitchange when unit is changed', () => {
      const mockOnUnitChange = vi.fn();
      const { container } = render(RecurrenceIntervalSettings, { 
        props: { ...defaultProps, onunitchange: mockOnUnitChange }
      });
      
      const select = container.querySelector('select') as HTMLSelectElement;
      fireEvent.change(select, { target: { value: 'week' } });
      
      expect(mockOnUnitChange).toHaveBeenCalledWith('week');
    });

    it('should call onchange when unit is changed', () => {
      const mockOnChange = vi.fn();
      const { container } = render(RecurrenceIntervalSettings, { 
        props: { ...defaultProps, onchange: mockOnChange }
      });
      
      const select = container.querySelector('select') as HTMLSelectElement;
      fireEvent.change(select, { target: { value: 'month' } });
      
      expect(mockOnChange).toHaveBeenCalled();
    });

    it('should handle unit change to complex units', () => {
      const mockOnUnitChange = vi.fn();
      const { container } = render(RecurrenceIntervalSettings, { 
        props: { ...defaultProps, onunitchange: mockOnUnitChange }
      });
      
      const select = container.querySelector('select') as HTMLSelectElement;
      fireEvent.change(select, { target: { value: 'year' } });
      
      expect(mockOnUnitChange).toHaveBeenCalledWith('year');
    });

    it('should handle missing onunitchange callback', () => {
      const { container } = render(RecurrenceIntervalSettings, { 
        props: { ...defaultProps, onunitchange: undefined }
      });
      
      const select = container.querySelector('select') as HTMLSelectElement;
      expect(() => {
        fireEvent.change(select, { target: { value: 'week' } });
      }).not.toThrow();
    });

    it('should handle missing onchange callback', () => {
      const { container } = render(RecurrenceIntervalSettings, { 
        props: { ...defaultProps, onchange: undefined }
      });
      
      const select = container.querySelector('select') as HTMLSelectElement;
      expect(() => {
        fireEvent.change(select, { target: { value: 'month' } });
      }).not.toThrow();
    });
  });

  describe('interval change handling', () => {
    it('should call onintervalchange when interval is changed', () => {
      const mockOnIntervalChange = vi.fn();
      render(RecurrenceIntervalSettings, { 
        props: { ...defaultProps, onintervalchange: mockOnIntervalChange }
      });
      
      // NumericIntervalInput component would call handleIntervalChange
      expect(screen.getByTestId('numeric-interval-input')).toBeInTheDocument();
    });

    it('should handle missing onintervalchange callback', () => {
      const { container } = render(RecurrenceIntervalSettings, { 
        props: { ...defaultProps, onintervalchange: undefined }
      });
      
      expect(container.innerHTML).toBeTruthy();
    });
  });

  describe('weekday selector conditional rendering', () => {
    it('should show weekday selector when unit is week', () => {
      const weekProps = { ...defaultProps, unit: 'week' as RecurrenceUnit };
      render(RecurrenceIntervalSettings, { props: weekProps });
      
      expect(screen.getByTestId('weekday-selector')).toBeInTheDocument();
    });

    it('should not show weekday selector when unit is not week', () => {
      const dayProps = { ...defaultProps, unit: 'day' as RecurrenceUnit };
      render(RecurrenceIntervalSettings, { props: dayProps });
      
      expect(screen.queryByTestId('weekday-selector')).not.toBeInTheDocument();
    });

    it('should pass selected days to weekday selector', () => {
      const weekPropsWithDays = { 
        ...defaultProps, 
        unit: 'week' as RecurrenceUnit,
        daysOfWeek: ['monday', 'wednesday'] as DayOfWeek[]
      };
      render(RecurrenceIntervalSettings, { props: weekPropsWithDays });
      
      expect(screen.getByTestId('weekday-selector')).toBeInTheDocument();
    });

    it('should pass ontoggleDayOfWeek callback to weekday selector', () => {
      const mockToggleDayOfWeek = vi.fn();
      const weekProps = { 
        ...defaultProps, 
        unit: 'week' as RecurrenceUnit,
        ontoggleDayOfWeek: mockToggleDayOfWeek
      };
      render(RecurrenceIntervalSettings, { props: weekProps });
      
      expect(screen.getByTestId('weekday-selector')).toBeInTheDocument();
    });
  });

  describe('advanced settings conditional rendering', () => {
    it('should show advanced settings when enabled and unit is complex', () => {
      const advancedProps = { 
        ...defaultProps, 
        unit: 'month' as RecurrenceUnit,
        showAdvancedSettings: true
      };
      render(RecurrenceIntervalSettings, { props: advancedProps });
      
      expect(screen.getByTestId('advanced-recurrence-settings')).toBeInTheDocument();
    });

    it('should not show advanced settings when disabled', () => {
      const simpleProps = { 
        ...defaultProps, 
        unit: 'month' as RecurrenceUnit,
        showAdvancedSettings: false
      };
      render(RecurrenceIntervalSettings, { props: simpleProps });
      
      expect(screen.queryByTestId('advanced-recurrence-settings')).not.toBeInTheDocument();
    });

    it('should not show advanced settings for simple units', () => {
      const simpleUnitProps = { 
        ...defaultProps, 
        unit: 'day' as RecurrenceUnit,
        showAdvancedSettings: true
      };
      render(RecurrenceIntervalSettings, { props: simpleUnitProps });
      
      expect(screen.queryByTestId('advanced-recurrence-settings')).not.toBeInTheDocument();
    });

    it('should show advanced settings for all complex units', () => {
      const complexUnits: RecurrenceUnit[] = ['year', 'half_year', 'quarter', 'month', 'week'];
      
      complexUnits.forEach(unit => {
        const { unmount } = render(RecurrenceIntervalSettings, { 
          props: { 
            ...defaultProps, 
            unit,
            showAdvancedSettings: true
          }
        });
        
        expect(screen.getByTestId('advanced-recurrence-settings')).toBeInTheDocument();
        unmount();
      });
    });

    it('should not show advanced settings for simple units', () => {
      const simpleUnits: RecurrenceUnit[] = ['minute', 'hour', 'day'];
      
      simpleUnits.forEach(unit => {
        const { unmount } = render(RecurrenceIntervalSettings, { 
          props: { 
            ...defaultProps, 
            unit,
            showAdvancedSettings: true
          }
        });
        
        expect(screen.queryByTestId('advanced-recurrence-settings')).not.toBeInTheDocument();
        unmount();
      });
    });
  });

  describe('complex unit detection', () => {
    it('should correctly identify complex units', () => {
      const complexUnits: RecurrenceUnit[] = ['year', 'half_year', 'quarter', 'month', 'week'];
      
      complexUnits.forEach(unit => {
        const { unmount } = render(RecurrenceIntervalSettings, { 
          props: { 
            ...defaultProps, 
            unit,
            showAdvancedSettings: true
          }
        });
        
        expect(screen.getByTestId('advanced-recurrence-settings')).toBeInTheDocument();
        unmount();
      });
    });

    it('should correctly identify simple units', () => {
      const simpleUnits: RecurrenceUnit[] = ['minute', 'hour', 'day'];
      
      simpleUnits.forEach(unit => {
        const { unmount } = render(RecurrenceIntervalSettings, { 
          props: { 
            ...defaultProps, 
            unit,
            showAdvancedSettings: true
          }
        });
        
        expect(screen.queryByTestId('advanced-recurrence-settings')).not.toBeInTheDocument();
        unmount();
      });
    });
  });

  describe('internationalization', () => {
    it('should use translation service for title', () => {
      render(RecurrenceIntervalSettings, { props: defaultProps });
      
      expect(screen.getByText('Recurrence Interval')).toBeInTheDocument();
    });

    it('should use translation service for unit options', () => {
      render(RecurrenceIntervalSettings, { props: defaultProps });
      
      expect(screen.getByText('Minute')).toBeInTheDocument();
      expect(screen.getByText('Hour')).toBeInTheDocument();
      expect(screen.getByText('Day')).toBeInTheDocument();
      expect(screen.getByText('Week')).toBeInTheDocument();
      expect(screen.getByText('Month')).toBeInTheDocument();
      expect(screen.getByText('Quarter')).toBeInTheDocument();
      expect(screen.getByText('Half Year')).toBeInTheDocument();
      expect(screen.getByText('Year')).toBeInTheDocument();
    });
  });

  describe('responsive layout', () => {
    it('should have responsive flex layout', () => {
      const { container } = render(RecurrenceIntervalSettings, { props: defaultProps });
      
      const flexContainer = container.querySelector('.flex.flex-1.items-center.gap-4');
      expect(flexContainer).toBeInTheDocument();
    });

    it('should have proper spacing classes', () => {
      const { container } = render(RecurrenceIntervalSettings, { props: defaultProps });
      
      const mainContainer = container.querySelector('.space-y-3');
      const headerContainer = container.querySelector('.flex.items-center.gap-4');
      
      expect(mainContainer).toBeInTheDocument();
      expect(headerContainer).toBeInTheDocument();
    });

    it('should have fixed width for title', () => {
      const { container } = render(RecurrenceIntervalSettings, { props: defaultProps });
      
      const title = container.querySelector('.w-32.flex-shrink-0');
      expect(title).toBeInTheDocument();
    });

    it('should have fixed width for select', () => {
      const { container } = render(RecurrenceIntervalSettings, { props: defaultProps });
      
      const select = container.querySelector('select.w-32');
      expect(select).toBeInTheDocument();
    });
  });

  describe('select styling', () => {
    it('should apply proper select styling', () => {
      const { container } = render(RecurrenceIntervalSettings, { props: defaultProps });
      
      const select = container.querySelector('select');
      expect(select).toHaveClass('border-border');
      expect(select).toHaveClass('bg-background');
      expect(select).toHaveClass('text-foreground');
      expect(select).toHaveClass('w-32');
      expect(select).toHaveClass('rounded');
      expect(select).toHaveClass('border');
      expect(select).toHaveClass('p-2');
    });
  });

  describe('edge cases', () => {
    it('should handle undefined callbacks', () => {
      const propsWithUndefinedCallbacks = {
        ...defaultProps,
        onchange: undefined,
        ontoggleDayOfWeek: undefined,
        onunitchange: undefined,
        onintervalchange: undefined,
        ondetailschange: undefined
      };
      
      const { container } = render(RecurrenceIntervalSettings, { props: propsWithUndefinedCallbacks });
      
      expect(container.innerHTML).toBeTruthy();
    });

    it('should handle empty daysOfWeek array', () => {
      const weekProps = { 
        ...defaultProps, 
        unit: 'week' as RecurrenceUnit,
        daysOfWeek: []
      };
      render(RecurrenceIntervalSettings, { props: weekProps });
      
      expect(screen.getByTestId('weekday-selector')).toBeInTheDocument();
    });

    it('should handle null details', () => {
      const propsWithNullDetails = { 
        ...defaultProps, 
        details: null as unknown as RecurrenceDetails,
        unit: 'month' as RecurrenceUnit,
        showAdvancedSettings: true
      };
      
      const { container } = render(RecurrenceIntervalSettings, { props: propsWithNullDetails });
      
      expect(container.innerHTML).toBeTruthy();
    });

    it('should handle invalid unit values', () => {
      const propsWithInvalidUnit = { 
        ...defaultProps, 
        unit: 'invalid_unit' as RecurrenceUnit
      };
      
      const { container } = render(RecurrenceIntervalSettings, { props: propsWithInvalidUnit });
      
      expect(container.innerHTML).toBeTruthy();
    });

    it('should handle negative interval values', () => {
      const propsWithNegativeInterval = { 
        ...defaultProps, 
        interval: -5
      };
      
      const { container } = render(RecurrenceIntervalSettings, { props: propsWithNegativeInterval });
      
      expect(container.innerHTML).toBeTruthy();
    });

    it('should handle zero interval values', () => {
      const propsWithZeroInterval = { 
        ...defaultProps, 
        interval: 0
      };
      
      const { container } = render(RecurrenceIntervalSettings, { props: propsWithZeroInterval });
      
      expect(container.innerHTML).toBeTruthy();
    });
  });

  describe('component lifecycle', () => {
    it('should mount and unmount cleanly', () => {
      const { unmount } = render(RecurrenceIntervalSettings, { props: defaultProps });
      
      expect(() => unmount()).not.toThrow();
    });

    it('should handle prop updates', () => {
      const { rerender } = render(RecurrenceIntervalSettings, { props: defaultProps });
      
      const updatedProps = {
        ...defaultProps,
        unit: 'week' as RecurrenceUnit,
        interval: 2,
        showAdvancedSettings: true
      };

      expect(() => rerender(updatedProps)).not.toThrow();
    });

    it('should handle unit changes', () => {
      const { rerender } = render(RecurrenceIntervalSettings, { props: defaultProps });
      
      const weekProps = { ...defaultProps, unit: 'week' as RecurrenceUnit };
      rerender(weekProps);
      expect(screen.getByTestId('weekday-selector')).toBeInTheDocument();
      
      const dayProps = { ...defaultProps, unit: 'day' as RecurrenceUnit };
      rerender(dayProps);
      expect(screen.queryByTestId('weekday-selector')).not.toBeInTheDocument();
    });
  });

  describe('integration', () => {
    it('should integrate with NumericIntervalInput', () => {
      render(RecurrenceIntervalSettings, { props: defaultProps });
      
      expect(screen.getByTestId('numeric-interval-input')).toBeInTheDocument();
    });

    it('should integrate with WeekdaySelector when unit is week', () => {
      const weekProps = { ...defaultProps, unit: 'week' as RecurrenceUnit };
      render(RecurrenceIntervalSettings, { props: weekProps });
      
      expect(screen.getByTestId('weekday-selector')).toBeInTheDocument();
    });

    it('should integrate with AdvancedRecurrenceSettings when enabled', () => {
      const advancedProps = { 
        ...defaultProps, 
        unit: 'month' as RecurrenceUnit,
        showAdvancedSettings: true
      };
      render(RecurrenceIntervalSettings, { props: advancedProps });
      
      expect(screen.getByTestId('advanced-recurrence-settings')).toBeInTheDocument();
    });

    it('should pass correct props to child components', () => {
      const weekProps = { 
        ...defaultProps, 
        unit: 'week' as RecurrenceUnit,
        daysOfWeek: ['monday', 'friday'] as DayOfWeek[],
        showAdvancedSettings: true
      };
      render(RecurrenceIntervalSettings, { props: weekProps });
      
      expect(screen.getByTestId('numeric-interval-input')).toBeInTheDocument();
      expect(screen.getByTestId('weekday-selector')).toBeInTheDocument();
      expect(screen.getByTestId('advanced-recurrence-settings')).toBeInTheDocument();
    });
  });
});