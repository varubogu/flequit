import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import AdvancedRecurrenceSettings from '$lib/components/recurrence/settings/advanced-recurrence-settings.svelte';
import type { RecurrencePattern } from '$lib/types/recurrence';

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
  const mockDetails: RecurrencePattern = {
    monthly: undefined,
    yearly: undefined
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
      const detailsWithDate: RecurrencePattern = {
        monthly: {
          dayOfMonth: 15
        }
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
      const detailsWithWeek: RecurrencePattern = {
        monthly: {
          weekOfMonth: 1
        }
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
      const detailsWithWeek: RecurrencePattern = {
        monthly: {
          weekOfMonth: 1
        }
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
          details: undefined as RecurrencePattern | undefined
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

  describe('empty and selected monthly values', () => {
    it('clears the day of the month when the number input is emptied', () => {
      const ondetailschange = vi.fn();
      render(AdvancedRecurrenceSettings, {
        props: { details: { monthly: { dayOfMonth: 15 } }, ondetailschange }
      });

      const input = document.querySelector('#specific-date-input') as HTMLInputElement;
      fireEvent.input(input, { target: { value: '' } });

      expect(ondetailschange).toHaveBeenCalledWith(
        expect.objectContaining({ monthly: expect.objectContaining({ dayOfMonth: undefined }) })
      );
    });

    it('clears the week and reports the last week', () => {
      const ondetailschange = vi.fn();
      render(AdvancedRecurrenceSettings, {
        props: { details: { monthly: { weekOfMonth: 2 } }, ondetailschange }
      });

      const select = document.querySelector('#week-of-period-select') as HTMLSelectElement;
      expect(select.value).toBe('second');
      fireEvent.change(select, { target: { value: '' } });
      expect(ondetailschange).toHaveBeenCalledWith(
        expect.objectContaining({ monthly: expect.objectContaining({ weekOfMonth: undefined }) })
      );

      fireEvent.change(select, { target: { value: 'last' } });
      expect(ondetailschange).toHaveBeenLastCalledWith(
        expect.objectContaining({ monthly: expect.objectContaining({ weekOfMonth: 5 }) })
      );
    });

    it('shows the selected weekday and clears it', () => {
      const ondetailschange = vi.fn();
      render(AdvancedRecurrenceSettings, {
        props: {
          details: { monthly: { weekOfMonth: 1, dayOfWeek: 'tuesday' } },
          ondetailschange
        }
      });

      const select = document.querySelector('#weekday-of-week-select') as HTMLSelectElement;
      expect(select).toBeInTheDocument();
      expect(select.value).toBe('tuesday');
      expect(screen.getByRole('option', { name: 'Tuesday' })).toBeInTheDocument();

      fireEvent.change(select, { target: { value: 'monday' } });
      expect(ondetailschange).toHaveBeenCalledWith(
        expect.objectContaining({
          monthly: expect.objectContaining({ weekOfMonth: 1, dayOfWeek: 'monday' })
        })
      );

      fireEvent.change(select, { target: { value: '' } });
      expect(ondetailschange).toHaveBeenLastCalledWith(
        expect.objectContaining({
          monthly: expect.objectContaining({ dayOfWeek: undefined })
        })
      );
    });

    it('does not throw when the details callback is absent', () => {
      render(AdvancedRecurrenceSettings, { props: { details: undefined } });
      const input = document.querySelector('#specific-date-input') as HTMLInputElement;
      expect(() => fireEvent.input(input, { target: { value: '8' } })).not.toThrow();
    });
  });
});
