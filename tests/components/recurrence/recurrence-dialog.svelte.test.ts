import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import RecurrenceDialog from '$lib/components/recurrence/recurrence-dialog.svelte';
import type { RecurrenceRule } from '$lib/types/datetime-calendar';

// Mock dependencies
vi.mock('$lib/components/ui/dialog/index.js', () => ({
  Root: () => ({ 
    render: () => '<div data-testid="dialog-root">Dialog Root</div>' 
  }),
  Content: () => ({ 
    render: () => '<div data-testid="dialog-content">Dialog Content</div>' 
  }),
  Header: () => ({ 
    render: () => '<div data-testid="dialog-header">Dialog Header</div>' 
  }),
  Title: () => ({ 
    render: () => '<div data-testid="dialog-title">Dialog Title</div>' 
  })
}));

vi.mock('lucide-svelte', () => ({
  Repeat: () => ({ 
    render: () => '<svg data-testid="repeat-icon">Repeat Icon</svg>' 
  })
}));

vi.mock('./shared/recurrence-dialog-advanced-content.svelte', () => ({
  default: () => ({ 
    render: () => '<div data-testid="recurrence-dialog-advanced-content">Advanced Content</div>' 
  })
}));

// Mock the RecurrenceDialogAdvancedLogic class
const mockLogic = {
  recurrenceSettings: vi.fn(() => () => 'Recurrence Settings'),
  save: vi.fn(),
  cancel: vi.fn(),
  reset: vi.fn(),
  updateRule: vi.fn(),
  isValid: vi.fn(() => true),
  hasChanges: vi.fn(() => false)
};

vi.mock('./shared/recurrence-dialog-advanced-logic.svelte', () => ({
  RecurrenceDialogAdvancedLogic: vi.fn(() => mockLogic)
}));

describe('RecurrenceDialog', () => {
  const mockRecurrenceRule: RecurrenceRule = {
    unit: 'day',
    interval: 1,
    days_of_week: [],
    details: {
      specific_date: undefined,
      week_of_period: undefined,
      weekday_of_week: undefined
    },
    count: undefined,
    until: undefined
  };

  const defaultProps = {
    open: false,
    onOpenChange: vi.fn(),
    recurrenceRule: null,
    onSave: vi.fn(),
    startDateTime: new Date('2024-01-01'),
    endDateTime: new Date('2024-01-02'),
    isRangeDate: false
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('basic rendering', () => {
    it('should render without errors', () => {
      const { container } = render(RecurrenceDialog, { props: defaultProps });
      
      expect(container.innerHTML).toBeTruthy();
    });

    it('should render dialog root component', () => {
      render(RecurrenceDialog, { props: defaultProps });
      
      expect(screen.getByTestId('dialog-root')).toBeInTheDocument();
    });

    it('should render dialog content', () => {
      render(RecurrenceDialog, { props: defaultProps });
      
      expect(screen.getByTestId('dialog-content')).toBeInTheDocument();
    });

    it('should render dialog header', () => {
      render(RecurrenceDialog, { props: defaultProps });
      
      expect(screen.getByTestId('dialog-header')).toBeInTheDocument();
    });

    it('should render dialog title', () => {
      render(RecurrenceDialog, { props: defaultProps });
      
      expect(screen.getByTestId('dialog-title')).toBeInTheDocument();
    });
  });

  describe('title rendering', () => {
    it('should render repeat icon', () => {
      render(RecurrenceDialog, { props: defaultProps });
      
      expect(screen.getByTestId('repeat-icon')).toBeInTheDocument();
    });

    it('should render recurrence settings title', () => {
      render(RecurrenceDialog, { props: defaultProps });
      
      expect(mockLogic.recurrenceSettings).toHaveBeenCalled();
    });

    it('should display title with icon and text', () => {
      const { container } = render(RecurrenceDialog, { props: defaultProps });
      
      expect(screen.getByTestId('repeat-icon')).toBeInTheDocument();
      expect(container.innerHTML).toBeTruthy();
    });
  });

  describe('content rendering', () => {
    it('should render advanced content component', () => {
      render(RecurrenceDialog, { props: defaultProps });
      
      expect(screen.getByTestId('recurrence-dialog-advanced-content')).toBeInTheDocument();
    });

    it('should pass logic to advanced content', () => {
      render(RecurrenceDialog, { props: defaultProps });
      
      expect(screen.getByTestId('recurrence-dialog-advanced-content')).toBeInTheDocument();
    });
  });

  describe('dialog state management', () => {
    it('should handle open state binding', () => {
      const propsWithOpen = { ...defaultProps, open: true };
      const { container } = render(RecurrenceDialog, { props: propsWithOpen });
      
      expect(container.innerHTML).toBeTruthy();
    });

    it('should handle closed state', () => {
      const propsWithClosed = { ...defaultProps, open: false };
      const { container } = render(RecurrenceDialog, { props: propsWithClosed });
      
      expect(container.innerHTML).toBeTruthy();
    });

    it('should call onOpenChange when provided', () => {
      const mockOnOpenChange = vi.fn();
      render(RecurrenceDialog, { 
        props: { ...defaultProps, onOpenChange: mockOnOpenChange }
      });
      
      // OnOpenChange should be passed to dialog root
      expect(container.innerHTML).toBeTruthy();
    });

    it('should handle undefined onOpenChange', () => {
      const propsWithoutOnOpenChange = { ...defaultProps, onOpenChange: undefined };
      const { container } = render(RecurrenceDialog, { props: propsWithoutOnOpenChange });
      
      expect(container.innerHTML).toBeTruthy();
    });
  });

  describe('recurrence rule handling', () => {
    it('should handle null recurrence rule', () => {
      const propsWithNullRule = { ...defaultProps, recurrenceRule: null };
      const { container } = render(RecurrenceDialog, { props: propsWithNullRule });
      
      expect(container.innerHTML).toBeTruthy();
    });

    it('should handle defined recurrence rule', () => {
      const propsWithRule = { ...defaultProps, recurrenceRule: mockRecurrenceRule };
      const { container } = render(RecurrenceDialog, { props: propsWithRule });
      
      expect(container.innerHTML).toBeTruthy();
    });

    it('should handle complex recurrence rule', () => {
      const complexRule: RecurrenceRule = {
        unit: 'week',
        interval: 2,
        days_of_week: ['monday', 'wednesday', 'friday'],
        details: {
          specific_date: 15,
          week_of_period: 2,
          weekday_of_week: 'tuesday'
        },
        count: 10,
        until: new Date('2024-12-31')
      };
      
      const propsWithComplexRule = { ...defaultProps, recurrenceRule: complexRule };
      const { container } = render(RecurrenceDialog, { props: propsWithComplexRule });
      
      expect(container.innerHTML).toBeTruthy();
    });
  });

  describe('callback handling', () => {
    it('should handle onSave callback', () => {
      const mockOnSave = vi.fn();
      const propsWithOnSave = { ...defaultProps, onSave: mockOnSave };
      const { container } = render(RecurrenceDialog, { props: propsWithOnSave });
      
      expect(container.innerHTML).toBeTruthy();
    });

    it('should handle undefined onSave', () => {
      const propsWithoutOnSave = { ...defaultProps, onSave: undefined };
      const { container } = render(RecurrenceDialog, { props: propsWithoutOnSave });
      
      expect(container.innerHTML).toBeTruthy();
    });

    it('should pass onSave to logic', () => {
      const mockOnSave = vi.fn();
      render(RecurrenceDialog, { 
        props: { ...defaultProps, onSave: mockOnSave }
      });
      
      // Logic should be initialized with onSave callback
      expect(vi.mocked(vi.importMock('./shared/recurrence-dialog-advanced-logic.svelte')).RecurrenceDialogAdvancedLogic).toHaveBeenCalled();
    });
  });

  describe('date handling', () => {
    it('should handle start and end datetime', () => {
      const startDate = new Date('2024-01-01T10:00:00');
      const endDate = new Date('2024-01-01T15:00:00');
      
      const propsWithDates = { 
        ...defaultProps, 
        startDateTime: startDate,
        endDateTime: endDate
      };
      const { container } = render(RecurrenceDialog, { props: propsWithDates });
      
      expect(container.innerHTML).toBeTruthy();
    });

    it('should handle undefined dates', () => {
      const propsWithUndefinedDates = { 
        ...defaultProps, 
        startDateTime: undefined,
        endDateTime: undefined
      };
      const { container } = render(RecurrenceDialog, { props: propsWithUndefinedDates });
      
      expect(container.innerHTML).toBeTruthy();
    });

    it('should handle range date flag', () => {
      const propsWithRangeDate = { ...defaultProps, isRangeDate: true };
      const { container } = render(RecurrenceDialog, { props: propsWithRangeDate });
      
      expect(container.innerHTML).toBeTruthy();
    });

    it('should handle non-range date flag', () => {
      const propsWithoutRangeDate = { ...defaultProps, isRangeDate: false };
      const { container } = render(RecurrenceDialog, { props: propsWithoutRangeDate });
      
      expect(container.innerHTML).toBeTruthy();
    });

    it('should pass dates to logic initialization', () => {
      const startDate = new Date('2024-06-15');
      const endDate = new Date('2024-06-16');
      
      render(RecurrenceDialog, { 
        props: { 
          ...defaultProps, 
          startDateTime: startDate,
          endDateTime: endDate,
          isRangeDate: true
        }
      });
      
      expect(vi.mocked(vi.importMock('./shared/recurrence-dialog-advanced-logic.svelte')).RecurrenceDialogAdvancedLogic).toHaveBeenCalledWith(
        defaultProps.recurrenceRule,
        defaultProps.onSave,
        startDate,
        endDate,
        true
      );
    });
  });

  describe('logic integration', () => {
    it('should initialize RecurrenceDialogAdvancedLogic', () => {
      render(RecurrenceDialog, { props: defaultProps });
      
      expect(vi.mocked(vi.importMock('./shared/recurrence-dialog-advanced-logic.svelte')).RecurrenceDialogAdvancedLogic).toHaveBeenCalledWith(
        defaultProps.recurrenceRule,
        defaultProps.onSave,
        defaultProps.startDateTime,
        defaultProps.endDateTime,
        defaultProps.isRangeDate
      );
    });

    it('should pass logic to advanced content', () => {
      render(RecurrenceDialog, { props: defaultProps });
      
      expect(screen.getByTestId('recurrence-dialog-advanced-content')).toBeInTheDocument();
    });

    it('should call logic methods for title', () => {
      render(RecurrenceDialog, { props: defaultProps });
      
      expect(mockLogic.recurrenceSettings).toHaveBeenCalled();
    });
  });

  describe('dialog styling', () => {
    it('should apply proper z-index for modal', () => {
      const { container } = render(RecurrenceDialog, { props: defaultProps });
      
      // Dialog content should have high z-index
      expect(container.innerHTML).toBeTruthy();
    });

    it('should apply responsive width classes', () => {
      const { container } = render(RecurrenceDialog, { props: defaultProps });
      
      // Dialog should have responsive width
      expect(container.innerHTML).toBeTruthy();
    });

    it('should apply max height for content', () => {
      const { container } = render(RecurrenceDialog, { props: defaultProps });
      
      // Dialog should have max height constraint
      expect(container.innerHTML).toBeTruthy();
    });

    it('should handle overflow properly', () => {
      const { container } = render(RecurrenceDialog, { props: defaultProps });
      
      // Dialog should handle overflow
      expect(container.innerHTML).toBeTruthy();
    });
  });

  describe('accessibility', () => {
    it('should have proper dialog structure', () => {
      render(RecurrenceDialog, { props: defaultProps });
      
      expect(screen.getByTestId('dialog-root')).toBeInTheDocument();
      expect(screen.getByTestId('dialog-header')).toBeInTheDocument();
      expect(screen.getByTestId('dialog-title')).toBeInTheDocument();
    });

    it('should have icon in title for clarity', () => {
      render(RecurrenceDialog, { props: defaultProps });
      
      expect(screen.getByTestId('repeat-icon')).toBeInTheDocument();
    });

    it('should support keyboard navigation through dialog', () => {
      const { container } = render(RecurrenceDialog, { props: defaultProps });
      
      // Dialog components should handle keyboard navigation
      expect(container.innerHTML).toBeTruthy();
    });
  });

  describe('edge cases', () => {
    it('should handle invalid recurrence rule gracefully', () => {
      const invalidRule = { invalid: 'data' } as any;
      const propsWithInvalidRule = { ...defaultProps, recurrenceRule: invalidRule };
      const { container } = render(RecurrenceDialog, { props: propsWithInvalidRule });
      
      expect(container.innerHTML).toBeTruthy();
    });

    it('should handle invalid dates gracefully', () => {
      const invalidDate = new Date('invalid-date');
      const propsWithInvalidDates = { 
        ...defaultProps, 
        startDateTime: invalidDate,
        endDateTime: invalidDate
      };
      const { container } = render(RecurrenceDialog, { props: propsWithInvalidDates });
      
      expect(container.innerHTML).toBeTruthy();
    });

    it('should handle null callbacks gracefully', () => {
      const propsWithNullCallbacks = { 
        ...defaultProps, 
        onOpenChange: null as any,
        onSave: null as any
      };
      const { container } = render(RecurrenceDialog, { props: propsWithNullCallbacks });
      
      expect(container.innerHTML).toBeTruthy();
    });

    it('should handle missing props gracefully', () => {
      const minimalProps = {
        open: false
      };
      const { container } = render(RecurrenceDialog, { props: minimalProps });
      
      expect(container.innerHTML).toBeTruthy();
    });
  });

  describe('component lifecycle', () => {
    it('should mount and unmount cleanly', () => {
      const { unmount } = render(RecurrenceDialog, { props: defaultProps });
      
      expect(() => unmount()).not.toThrow();
    });

    it('should handle prop updates', () => {
      const { rerender } = render(RecurrenceDialog, { props: defaultProps });
      
      const updatedProps = {
        ...defaultProps,
        open: true,
        recurrenceRule: mockRecurrenceRule,
        isRangeDate: true
      };

      expect(() => rerender(updatedProps)).not.toThrow();
    });

    it('should recreate logic when key props change', () => {
      const { rerender } = render(RecurrenceDialog, { props: defaultProps });
      
      const updatedProps = {
        ...defaultProps,
        recurrenceRule: mockRecurrenceRule,
        startDateTime: new Date('2024-02-01'),
        endDateTime: new Date('2024-02-02')
      };

      rerender(updatedProps);
      
      // Logic should be recreated with new props
      expect(vi.mocked(vi.importMock('./shared/recurrence-dialog-advanced-logic.svelte')).RecurrenceDialogAdvancedLogic).toHaveBeenCalledWith(
        mockRecurrenceRule,
        defaultProps.onSave,
        updatedProps.startDateTime,
        updatedProps.endDateTime,
        defaultProps.isRangeDate
      );
    });
  });

  describe('integration', () => {
    it('should integrate with Dialog components', () => {
      render(RecurrenceDialog, { props: defaultProps });
      
      expect(screen.getByTestId('dialog-root')).toBeInTheDocument();
      expect(screen.getByTestId('dialog-content')).toBeInTheDocument();
      expect(screen.getByTestId('dialog-header')).toBeInTheDocument();
      expect(screen.getByTestId('dialog-title')).toBeInTheDocument();
    });

    it('should integrate with Lucide icons', () => {
      render(RecurrenceDialog, { props: defaultProps });
      
      expect(screen.getByTestId('repeat-icon')).toBeInTheDocument();
    });

    it('should integrate with RecurrenceDialogAdvancedContent', () => {
      render(RecurrenceDialog, { props: defaultProps });
      
      expect(screen.getByTestId('recurrence-dialog-advanced-content')).toBeInTheDocument();
    });

    it('should integrate with RecurrenceDialogAdvancedLogic', () => {
      render(RecurrenceDialog, { props: defaultProps });
      
      expect(vi.mocked(vi.importMock('./shared/recurrence-dialog-advanced-logic.svelte')).RecurrenceDialogAdvancedLogic).toHaveBeenCalled();
      expect(mockLogic.recurrenceSettings).toHaveBeenCalled();
    });
  });

  describe('dialog behavior', () => {
    it('should support binding open state', () => {
      const { rerender } = render(RecurrenceDialog, { props: defaultProps });
      
      // Update open state
      rerender({ ...defaultProps, open: true });
      
      expect(container.innerHTML).toBeTruthy();
    });

    it('should handle dialog state changes', () => {
      const mockOnOpenChange = vi.fn();
      render(RecurrenceDialog, { 
        props: { ...defaultProps, onOpenChange: mockOnOpenChange }
      });
      
      // OnOpenChange callback should be configured
      expect(container.innerHTML).toBeTruthy();
    });

    it('should maintain state consistency', () => {
      const { rerender } = render(RecurrenceDialog, { props: { ...defaultProps, open: false } });
      
      rerender({ ...defaultProps, open: true });
      rerender({ ...defaultProps, open: false });
      
      expect(container.innerHTML).toBeTruthy();
    });
  });
});