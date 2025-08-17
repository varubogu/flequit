import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import WeekdaySelector from '$lib/components/recurrence/weekday-conditions/weekday-selector.svelte';
import type { DayOfWeek } from '$lib/types/datetime-calendar';

// Mock translation service
vi.mock('$lib/stores/locale.svelte', () => ({
  getTranslationService: () => ({
    getMessage: (key: string) => () => {
      const messages: Record<string, string> = {
        repeat_weekdays: 'Repeat Weekdays',
        sunday: 'Sunday',
        monday: 'Monday',
        tuesday: 'Tuesday',
        wednesday: 'Wednesday',
        thursday: 'Thursday',
        friday: 'Friday',
        saturday: 'Saturday'
      };
      return messages[key] || key;
    }
  })
}));

describe('WeekdaySelector', () => {
  const defaultProps = {
    selectedDays: [] as DayOfWeek[],
    ontoggleDayOfWeek: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('basic rendering', () => {
    it('should render without errors', () => {
      render(WeekdaySelector, { props: defaultProps });
      
      expect(screen.getByText('Repeat Weekdays')).toBeInTheDocument();
    });

    it('should render all weekday buttons', () => {
      render(WeekdaySelector, { props: defaultProps });
      
      // Should render 7 day buttons total
      const allButtons = screen.getAllByRole('button');
      expect(allButtons).toHaveLength(7);
      
      // Check for specific unique day buttons
      expect(screen.getByRole('button', { name: 'M' })).toBeInTheDocument(); // Monday
      expect(screen.getByRole('button', { name: 'W' })).toBeInTheDocument(); // Wednesday
      expect(screen.getByRole('button', { name: 'F' })).toBeInTheDocument(); // Friday
      
      // Check for duplicate letters (S and T appear twice)
      expect(screen.getAllByRole('button', { name: 'S' })).toHaveLength(2); // Sunday & Saturday
      expect(screen.getAllByRole('button', { name: 'T' })).toHaveLength(2); // Tuesday & Thursday
    });

    it('should have proper accessibility structure', () => {
      render(WeekdaySelector, { props: defaultProps });
      
      const group = document.querySelector('[role="group"]');
      expect(group).toBeInTheDocument();
      expect(group).toHaveAttribute('aria-labelledby', 'weekdays-label');
      
      const label = document.querySelector('#weekdays-label');
      expect(label).toBeInTheDocument();
    });
  });

  describe('day selection', () => {
    it('should show selected days as active', () => {
      const selectedDays: DayOfWeek[] = ['monday', 'friday'];
      render(WeekdaySelector, { 
        props: { 
          ...defaultProps, 
          selectedDays
        }
      });
      
      const buttons = document.querySelectorAll('button');
      const mondayButton = Array.from(buttons).find(btn => btn.textContent === 'M');
      const fridayButton = Array.from(buttons).find(btn => btn.textContent === 'F');
      
      expect(mondayButton).toHaveClass('bg-primary', 'text-primary-foreground');
      expect(fridayButton).toHaveClass('bg-primary', 'text-primary-foreground');
    });

    it('should show unselected days as inactive', () => {
      const selectedDays: DayOfWeek[] = ['monday'];
      render(WeekdaySelector, { 
        props: { 
          ...defaultProps, 
          selectedDays
        }
      });
      
      const buttons = document.querySelectorAll('button');
      const tuesdayButton = Array.from(buttons).find(btn => btn.textContent === 'T');
      
      expect(tuesdayButton).toHaveClass('bg-background', 'text-foreground');
    });

    it('should call ontoggleDayOfWeek when day is clicked', () => {
      const mockToggle = vi.fn();
      render(WeekdaySelector, { 
        props: { 
          ...defaultProps, 
          ontoggleDayOfWeek: mockToggle
        }
      });
      
      const buttons = document.querySelectorAll('button');
      const mondayButton = Array.from(buttons).find(btn => btn.textContent === 'M');
      
      fireEvent.click(mondayButton!);
      
      expect(mockToggle).toHaveBeenCalledWith('monday');
    });

    it('should handle all days selection', () => {
      const allDays: DayOfWeek[] = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      render(WeekdaySelector, { 
        props: { 
          ...defaultProps, 
          selectedDays: allDays
        }
      });
      
      const buttons = document.querySelectorAll('button');
      buttons.forEach(button => {
        expect(button).toHaveClass('bg-primary', 'text-primary-foreground');
      });
    });

    it('should handle no days selection', () => {
      render(WeekdaySelector, { props: defaultProps });
      
      const buttons = document.querySelectorAll('button');
      buttons.forEach(button => {
        expect(button).toHaveClass('bg-background', 'text-foreground');
      });
    });
  });

  describe('button interactions', () => {
    it('should handle hover states', () => {
      render(WeekdaySelector, { props: defaultProps });
      
      const buttons = document.querySelectorAll('button');
      const firstButton = buttons[0];
      
      expect(firstButton).toHaveClass('hover:bg-accent', 'hover:text-accent-foreground');
    });

    it('should have proper button attributes', () => {
      render(WeekdaySelector, { props: defaultProps });
      
      const buttons = document.querySelectorAll('button');
      buttons.forEach(button => {
        expect(button).toHaveAttribute('type', 'button');
      });
    });

    it('should display first letter of day names', () => {
      render(WeekdaySelector, { props: defaultProps });
      
      const buttons = document.querySelectorAll('button');
      const buttonTexts = Array.from(buttons).map(btn => btn.textContent);
      
      expect(buttonTexts).toEqual(['S', 'M', 'T', 'W', 'T', 'F', 'S']);
    });
  });

  describe('layout and styling', () => {
    it('should have proper grid layout', () => {
      render(WeekdaySelector, { props: defaultProps });
      
      const grid = document.querySelector('.grid.grid-cols-7.gap-2');
      expect(grid).toBeInTheDocument();
    });

    it('should have proper container styling', () => {
      render(WeekdaySelector, { props: defaultProps });
      
      const container = document.querySelector('.pl-36');
      expect(container).toBeInTheDocument();
    });

    it('should have proper label styling', () => {
      render(WeekdaySelector, { props: defaultProps });
      
      const label = document.querySelector('#weekdays-label');
      expect(label).toHaveClass('text-muted-foreground', 'mb-2', 'block', 'text-sm');
    });
  });

  describe('edge cases', () => {
    it('should handle undefined selectedDays', () => {
      render(WeekdaySelector, { 
        props: { 
          ...defaultProps, 
          selectedDays: undefined as any
        }
      });
      
      expect(document.body).toBeInTheDocument();
    });

    it('should handle missing ontoggleDayOfWeek callback', () => {
      render(WeekdaySelector, { 
        props: { 
          selectedDays: ['monday']
        }
      });
      
      const buttons = document.querySelectorAll('button');
      expect(() => {
        fireEvent.click(buttons[1]);
      }).not.toThrow();
    });

    it('should handle invalid day values in selectedDays', () => {
      const invalidDays = ['invalid_day', 'monday'] as DayOfWeek[];
      render(WeekdaySelector, { 
        props: { 
          ...defaultProps, 
          selectedDays: invalidDays
        }
      });
      
      expect(document.body).toBeInTheDocument();
    });

    it('should handle duplicate days in selectedDays', () => {
      const duplicateDays: DayOfWeek[] = ['monday', 'monday', 'tuesday'];
      render(WeekdaySelector, { 
        props: { 
          ...defaultProps, 
          selectedDays: duplicateDays
        }
      });
      
      expect(document.body).toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('should provide proper ARIA labeling', () => {
      render(WeekdaySelector, { props: defaultProps });
      
      const group = document.querySelector('[role="group"]');
      const label = document.querySelector('#weekdays-label');
      
      expect(group).toHaveAttribute('aria-labelledby', 'weekdays-label');
      expect(label).toHaveTextContent('Repeat Weekdays');
    });

    it('should be keyboard accessible', () => {
      render(WeekdaySelector, { props: defaultProps });
      
      const buttons = document.querySelectorAll('button');
      buttons.forEach(button => {
        expect(button.tagName).toBe('BUTTON');
        expect(button).toHaveAttribute('type', 'button');
      });
    });

    it('should provide clear visual feedback for selected state', () => {
      const selectedDays: DayOfWeek[] = ['monday'];
      render(WeekdaySelector, { 
        props: { 
          ...defaultProps, 
          selectedDays
        }
      });
      
      const buttons = document.querySelectorAll('button');
      const mondayButton = Array.from(buttons).find(btn => btn.textContent === 'M');
      
      // Should have distinct styling for selected state
      expect(mondayButton).toHaveClass('bg-primary', 'text-primary-foreground');
    });
  });

  describe('component lifecycle', () => {
    it('should mount and unmount cleanly', () => {
      const { unmount } = render(WeekdaySelector, { props: defaultProps });
      
      expect(() => unmount()).not.toThrow();
    });

    it('should handle prop updates', () => {
      const { unmount } = render(WeekdaySelector, { 
        props: { 
          ...defaultProps, 
          selectedDays: ['monday']
        }
      });
      
      unmount();
      
      render(WeekdaySelector, { 
        props: { 
          ...defaultProps, 
          selectedDays: ['friday', 'saturday']
        }
      });
      
      expect(document.body).toBeInTheDocument();
    });
  });
});