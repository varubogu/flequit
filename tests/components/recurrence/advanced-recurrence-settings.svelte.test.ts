import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import AdvancedRecurrenceSettings from '$lib/components/recurrence/advanced-recurrence-settings.svelte';
import type { RecurrenceDetails } from '$lib/types/datetime-calendar';

// Mock translation service
vi.mock('$lib/stores/locale.svelte', () => ({
  getTranslationService: () => ({
    getMessage: (key: string) => () => {
      const messages: Record<string, string> = {
        advanced_settings: 'Advanced Settings',
        specific_date: 'Specific Date',
        specific_date_example: 'e.g. 15',
        week_of_month: 'Week of Month',
        no_selection: 'No Selection',
        weekday_of_week: 'Weekday of Week',
        sunday: 'Sunday',
        monday: 'Monday',
        tuesday: 'Tuesday',
        wednesday: 'Wednesday',
        thursday: 'Thursday',
        friday: 'Friday',
        saturday: 'Saturday',
        first_week: 'First Week',
        second_week: 'Second Week',
        third_week: 'Third Week',
        fourth_week: 'Fourth Week',
        last_week: 'Last Week'
      };
      return messages[key] || key;
    }
  })
}));

describe('AdvancedRecurrenceSettings', () => {
  const mockDetails: RecurrenceDetails = {
    specific_date: undefined,
    week_of_period: undefined,
    weekday_of_week: undefined
  };

  const defaultProps = {
    details: mockDetails,
    onchange: vi.fn(),
    ondetailschange: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('basic rendering', () => {
    it('should render without errors', () => {
      render(AdvancedRecurrenceSettings, { props: defaultProps });
      
      expect(screen.getByText('Advanced Settings')).toBeInTheDocument();
    });

    it('should render form elements', () => {
      render(AdvancedRecurrenceSettings, { props: defaultProps });
      
      expect(document.querySelector('#specific-date-input')).toBeInTheDocument();
      expect(document.querySelector('#week-of-period-select')).toBeInTheDocument();
    });
  });

  describe('specific date input', () => {
    it('should handle specific date changes', () => {
      const mockOnDetailsChange = vi.fn();
      render(AdvancedRecurrenceSettings, { 
        props: { 
          ...defaultProps, 
          ondetailschange: mockOnDetailsChange
        }
      });
      
      const input = document.querySelector('#specific-date-input') as HTMLInputElement;
      fireEvent.input(input, { target: { value: '15' } });
      
      expect(mockOnDetailsChange).toHaveBeenCalled();
    });

    it('should display current specific date value', () => {
      const detailsWithDate: RecurrenceDetails = {
        ...mockDetails,
        specific_date: 15
      };

      render(AdvancedRecurrenceSettings, { 
        props: { 
          ...defaultProps, 
          details: detailsWithDate
        }
      });
      
      const input = document.querySelector('#specific-date-input') as HTMLInputElement;
      expect(input.value).toBe('15');
    });
  });

  describe('week of month selection', () => {
    it('should render week of month options', () => {
      render(AdvancedRecurrenceSettings, { props: defaultProps });
      
      expect(screen.getByText('First Week')).toBeInTheDocument();
      expect(screen.getByText('Last Week')).toBeInTheDocument();
    });

    it('should handle week selection changes', () => {
      const mockOnDetailsChange = vi.fn();
      render(AdvancedRecurrenceSettings, { 
        props: { 
          ...defaultProps, 
          ondetailschange: mockOnDetailsChange
        }
      });
      
      const select = document.querySelector('#week-of-period-select') as HTMLSelectElement;
      fireEvent.change(select, { target: { value: 'first' } });
      
      expect(mockOnDetailsChange).toHaveBeenCalled();
    });
  });

  describe('conditional weekday selector', () => {
    it('should show weekday selector when week is selected', () => {
      const detailsWithWeek: RecurrenceDetails = {
        ...mockDetails,
        week_of_period: 'first'
      };

      render(AdvancedRecurrenceSettings, { 
        props: { 
          ...defaultProps, 
          details: detailsWithWeek
        }
      });
      
      expect(document.querySelector('#weekday-of-week-select')).toBeInTheDocument();
    });

    it('should hide weekday selector when no week is selected', () => {
      render(AdvancedRecurrenceSettings, { props: defaultProps });
      
      expect(document.querySelector('#weekday-of-week-select')).not.toBeInTheDocument();
    });

    it('should render weekday options', () => {
      const detailsWithWeek: RecurrenceDetails = {
        ...mockDetails,
        week_of_period: 'first'
      };

      render(AdvancedRecurrenceSettings, { 
        props: { 
          ...defaultProps, 
          details: detailsWithWeek
        }
      });
      
      expect(screen.getByText('Sunday')).toBeInTheDocument();
      expect(screen.getByText('Saturday')).toBeInTheDocument();
    });
  });

  describe('edge cases', () => {
    it('should handle undefined details', () => {
      render(AdvancedRecurrenceSettings, { 
        props: { 
          ...defaultProps, 
          details: undefined as any
        }
      });
      
      expect(document.body).toBeInTheDocument();
    });

    it('should handle missing callbacks', () => {
      render(AdvancedRecurrenceSettings, { 
        props: { 
          details: mockDetails
        }
      });
      
      expect(document.body).toBeInTheDocument();
    });
  });

  describe('component lifecycle', () => {
    it('should mount and unmount cleanly', () => {
      const { unmount } = render(AdvancedRecurrenceSettings, { props: defaultProps });
      
      expect(() => unmount()).not.toThrow();
    });
  });
});