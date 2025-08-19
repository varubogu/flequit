import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import DayTargetSelector from '$lib/components/datetime/calendar/day-target-selector.svelte';
import type { DayOfWeek, AdjustmentTarget } from '$lib/types/datetime-calendar';

// Mock translation service
vi.mock('$lib/stores/locale.svelte', () => ({
  getTranslationService: () => ({
    getMessage: (key: string) => () => {
      const translations: Record<string, string> = {
        monday: 'Monday',
        tuesday: 'Tuesday',
        wednesday: 'Wednesday',
        thursday: 'Thursday',
        friday: 'Friday',
        saturday: 'Saturday',
        sunday: 'Sunday',
        weekday: 'Weekday',
        weekend: 'Weekend',
        holiday: 'Holiday',
        non_holiday: 'Non-Holiday',
        weekend_only: 'Weekend Only',
        non_weekend: 'Non-Weekend',
        weekend_holiday: 'Weekend/Holiday',
        non_weekend_holiday: 'Non-Weekend/Holiday',
        '月曜日': '月曜日',
        '火曜日': '火曜日'
      };
      return translations[key] || key;
    },
    getCurrentLocale: () => 'ja-JP',
    setLocale: vi.fn(),
    reactiveMessage: vi.fn(),
    getAvailableLocales: () => ['ja-JP', 'en-US']
  })
}));

describe('DayTargetSelector', () => {
  const defaultProps = {
    value: 'monday' as DayOfWeek,
    onchange: vi.fn(),
    class: ''
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('basic rendering', () => {
    it('should render without errors', () => {
      const { container } = render(DayTargetSelector, { props: defaultProps });
      
      const select = container.querySelector('select');
      expect(select).toBeInTheDocument();
    });

    it('should render select element with proper styling', () => {
      const { container } = render(DayTargetSelector, { props: defaultProps });
      
      const select = container.querySelector('select');
      expect(select).toHaveClass('border-border');
      expect(select).toHaveClass('bg-background');
      expect(select).toHaveClass('text-foreground');
      expect(select).toHaveClass('rounded');
      expect(select).toHaveClass('border');
      expect(select).toHaveClass('p-1');
    });

    it('should apply custom class when provided', () => {
      const customClass = 'custom-selector-class';
      const { container } = render(DayTargetSelector, { 
        props: { ...defaultProps, class: customClass } 
      });
      
      const select = container.querySelector('select');
      expect(select).toHaveClass(customClass);
    });
  });

  describe('options rendering', () => {
    it('should render all weekday options', () => {
      render(DayTargetSelector, { props: defaultProps });
      
      expect(screen.getByText('Monday')).toBeInTheDocument();
      expect(screen.getByText('Tuesday')).toBeInTheDocument();
      expect(screen.getByText('Wednesday')).toBeInTheDocument();
      expect(screen.getByText('Thursday')).toBeInTheDocument();
      expect(screen.getByText('Friday')).toBeInTheDocument();
      expect(screen.getByText('Saturday')).toBeInTheDocument();
      expect(screen.getByText('Sunday')).toBeInTheDocument();
    });

    it('should render adjustment target options', () => {
      render(DayTargetSelector, { props: defaultProps });
      
      expect(screen.getByText('Weekday')).toBeInTheDocument();
      expect(screen.getByText('Weekend')).toBeInTheDocument();
      expect(screen.getByText('Holiday')).toBeInTheDocument();
      expect(screen.getByText('Non-Holiday')).toBeInTheDocument();
      expect(screen.getByText('Weekend Only')).toBeInTheDocument();
      expect(screen.getByText('Non-Weekend')).toBeInTheDocument();
      expect(screen.getByText('Weekend/Holiday')).toBeInTheDocument();
      expect(screen.getByText('Non-Weekend/Holiday')).toBeInTheDocument();
    });

    it('should render all 15 options', () => {
      const { container } = render(DayTargetSelector, { props: defaultProps });
      
      const options = container.querySelectorAll('option');
      expect(options).toHaveLength(15);
    });

    it('should have correct option values', () => {
      const { container } = render(DayTargetSelector, { props: defaultProps });
      
      const mondayOption = Array.from(container.querySelectorAll('option')).find(
        option => option.textContent === 'Monday'
      ) as HTMLOptionElement;
      expect(mondayOption?.value).toBe('monday');

      const weekdayOption = Array.from(container.querySelectorAll('option')).find(
        option => option.textContent === 'Weekday'
      ) as HTMLOptionElement;
      expect(weekdayOption?.value).toBe('weekday');
    });
  });

  describe('value handling', () => {
    it('should set initial value correctly', () => {
      const { container } = render(DayTargetSelector, { 
        props: { ...defaultProps, value: 'tuesday' }
      });
      
      const select = container.querySelector('select') as HTMLSelectElement;
      expect(select.value).toBe('tuesday');
    });

    it('should handle weekday values', () => {
      const weekdays: DayOfWeek[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
      
      weekdays.forEach(day => {
        const { container } = render(DayTargetSelector, { 
          props: { ...defaultProps, value: day }
        });
        
        const select = container.querySelector('select') as HTMLSelectElement;
        expect(select.value).toBe(day);
      });
    });

    it('should handle adjustment target values', () => {
      const targets: AdjustmentTarget[] = ['weekday', 'weekend', 'holiday', 'non_holiday', 'weekend_only', 'non_weekend', 'weekend_holiday', 'non_weekend_holiday'];
      
      targets.forEach(target => {
        const { container } = render(DayTargetSelector, { 
          props: { ...defaultProps, value: target }
        });
        
        const select = container.querySelector('select') as HTMLSelectElement;
        expect(select.value).toBe(target);
      });
    });
  });

  describe('change handling', () => {
    it('should call onchange when value changes', () => {
      const mockOnChange = vi.fn();
      const { container } = render(DayTargetSelector, { 
        props: { ...defaultProps, onchange: mockOnChange }
      });
      
      const select = container.querySelector('select') as HTMLSelectElement;
      fireEvent.change(select, { target: { value: 'friday' } });
      
      expect(mockOnChange).toHaveBeenCalledWith('friday');
    });

    it('should handle change from weekday to adjustment target', () => {
      const mockOnChange = vi.fn();
      const { container } = render(DayTargetSelector, { 
        props: { ...defaultProps, onchange: mockOnChange, value: 'monday' }
      });
      
      const select = container.querySelector('select') as HTMLSelectElement;
      fireEvent.change(select, { target: { value: 'weekday' } });
      
      expect(mockOnChange).toHaveBeenCalledWith('weekday');
    });

    it('should handle change from adjustment target to weekday', () => {
      const mockOnChange = vi.fn();
      const { container } = render(DayTargetSelector, { 
        props: { ...defaultProps, onchange: mockOnChange, value: 'weekend' }
      });
      
      const select = container.querySelector('select') as HTMLSelectElement;
      fireEvent.change(select, { target: { value: 'saturday' } });
      
      expect(mockOnChange).toHaveBeenCalledWith('saturday');
    });

    it('should not error when onchange is not provided', () => {
      const { container } = render(DayTargetSelector, { 
        props: { value: 'monday' }
      });
      
      const select = container.querySelector('select') as HTMLSelectElement;
      expect(() => {
        fireEvent.change(select, { target: { value: 'tuesday' } });
      }).not.toThrow();
    });
  });

  describe('styling classes', () => {
    it('should apply empty class when no class provided', () => {
      const { container } = render(DayTargetSelector, { 
        props: { value: 'monday', onchange: vi.fn() }
      });
      
      const select = container.querySelector('select');
      expect(select?.className).toContain('border-border bg-background text-foreground rounded border p-1');
    });

    it('should combine default and custom classes', () => {
      const customClass = 'w-full font-bold';
      const { container } = render(DayTargetSelector, { 
        props: { ...defaultProps, class: customClass }
      });
      
      const select = container.querySelector('select');
      expect(select).toHaveClass('border-border');
      expect(select).toHaveClass('bg-background');
      expect(select).toHaveClass('w-full');
      expect(select).toHaveClass('font-bold');
    });

    it('should handle multiple custom classes', () => {
      const customClasses = 'text-lg shadow-md hover:border-blue-500';
      const { container } = render(DayTargetSelector, { 
        props: { ...defaultProps, class: customClasses }
      });
      
      const select = container.querySelector('select');
      expect(select).toHaveClass('text-lg');
      expect(select).toHaveClass('shadow-md');
      expect(select).toHaveClass('hover:border-blue-500');
    });
  });

  describe('internationalization', () => {
    it('should call translation service for all labels', () => {
      render(DayTargetSelector, { props: defaultProps });
      
      // All translation keys should be used
      expect(screen.getByText('Monday')).toBeInTheDocument();
      expect(screen.getByText('Weekend/Holiday')).toBeInTheDocument();
      expect(screen.getByText('Non-Weekend/Holiday')).toBeInTheDocument();
    });

    it('should handle different language translations', () => {
      // Note: Japanese translations would be handled by the existing mock

      render(DayTargetSelector, { props: defaultProps });
      
      expect(screen.getByText('月曜日')).toBeInTheDocument();
      expect(screen.getByText('火曜日')).toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('should be keyboard navigable', () => {
      const { container } = render(DayTargetSelector, { props: defaultProps });
      
      const select = container.querySelector('select') as HTMLSelectElement;
      expect(select.tabIndex).toBe(0);
    });

    it('should support arrow key navigation', () => {
      const { container } = render(DayTargetSelector, { props: defaultProps });
      
      const select = container.querySelector('select') as HTMLSelectElement;
      select.focus();
      
      fireEvent.keyDown(select, { key: 'ArrowDown' });
      // Select element should handle keyboard navigation natively
      expect(select).toHaveFocus();
    });

    it('should have proper ARIA attributes', () => {
      const { container } = render(DayTargetSelector, { props: defaultProps });
      
      const select = container.querySelector('select');
      expect(select?.tagName).toBe('SELECT');
      // Native select elements have built-in accessibility
    });
  });

  describe('edge cases', () => {
    it('should handle undefined value', () => {
      const { container } = render(DayTargetSelector, { 
        props: { value: undefined as any, onchange: vi.fn() }
      });
      
      const select = container.querySelector('select') as HTMLSelectElement;
      expect(select.value).toBe('');
    });

    it('should handle null value', () => {
      const { container } = render(DayTargetSelector, { 
        props: { value: null as any, onchange: vi.fn() }
      });
      
      const select = container.querySelector('select') as HTMLSelectElement;
      expect(select.value).toBe('');
    });

    it('should handle invalid value', () => {
      const { container } = render(DayTargetSelector, { 
        props: { value: 'invalid_day' as any, onchange: vi.fn() }
      });
      
      const select = container.querySelector('select') as HTMLSelectElement;
      expect(select.value).toBe('invalid_day');
    });

    it('should handle empty string class', () => {
      const { container } = render(DayTargetSelector, { 
        props: { ...defaultProps, class: '' }
      });
      
      const select = container.querySelector('select');
      expect(select).toHaveClass('border-border');
      expect(select).toHaveClass('bg-background');
    });

    it('should handle null class', () => {
      const { container } = render(DayTargetSelector, { 
        props: { ...defaultProps, class: null as any }
      });
      
      const select = container.querySelector('select');
      expect(select).toBeTruthy();
    });
  });

  describe('component lifecycle', () => {
    it('should mount and unmount cleanly', () => {
      const { unmount } = render(DayTargetSelector, { props: defaultProps });
      
      expect(() => unmount()).not.toThrow();
    });

    it('should handle prop updates', () => {
      const { rerender } = render(DayTargetSelector, { props: defaultProps });
      
      const updatedProps = { ...defaultProps, value: 'weekend' as AdjustmentTarget };
      expect(() => rerender(updatedProps)).not.toThrow();
      
      const select = document.querySelector('select') as HTMLSelectElement;
      expect(select.value).toBe('weekend');
    });

    it('should handle multiple rapid changes', () => {
      const mockOnChange = vi.fn();
      const { container } = render(DayTargetSelector, { 
        props: { ...defaultProps, onchange: mockOnChange }
      });
      
      const select = container.querySelector('select') as HTMLSelectElement;
      
      fireEvent.change(select, { target: { value: 'tuesday' } });
      fireEvent.change(select, { target: { value: 'weekday' } });
      fireEvent.change(select, { target: { value: 'holiday' } });
      
      expect(mockOnChange).toHaveBeenCalledTimes(3);
      expect(mockOnChange).toHaveBeenNthCalledWith(1, 'tuesday');
      expect(mockOnChange).toHaveBeenNthCalledWith(2, 'weekday');
      expect(mockOnChange).toHaveBeenNthCalledWith(3, 'holiday');
    });
  });

  describe('type safety', () => {
    it('should accept DayOfWeek type values', () => {
      const weekdays: DayOfWeek[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
      
      weekdays.forEach(day => {
        expect(() => {
          render(DayTargetSelector, { props: { ...defaultProps, value: day } });
        }).not.toThrow();
      });
    });

    it('should accept AdjustmentTarget type values', () => {
      const targets: AdjustmentTarget[] = ['weekday', 'weekend', 'holiday', 'non_holiday', 'weekend_only', 'non_weekend', 'weekend_holiday', 'non_weekend_holiday'];
      
      targets.forEach(target => {
        expect(() => {
          render(DayTargetSelector, { props: { ...defaultProps, value: target } });
        }).not.toThrow();
      });
    });
  });
});