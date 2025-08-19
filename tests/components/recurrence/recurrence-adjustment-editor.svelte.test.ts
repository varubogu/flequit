import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import RecurrenceAdjustmentEditor from '$lib/components/recurrence/recurrence-adjustment-editor.svelte';
import type { DateCondition, WeekdayCondition, DateRelation } from '$lib/types/datetime-calendar';

// Mock dependencies
vi.mock('$lib/stores/locale.svelte', () => ({
  getTranslationService: vi.fn(() => ({
    getMessage: vi.fn((key: string) => () => {
      const messages: Record<string, string> = {
        adjustment_conditions: '調整条件',
        date_conditions: '日付条件',
        weekday_conditions: '曜日条件',
        add: '追加',
        before: '以前',
        on_or_before: '以前または同日',
        on_or_after: '以降または同日',
        after: '以降'
      };
      return messages[key] || key;
    })
  }))
}));

vi.mock('$lib/components/ui/button/index.js', () => ({
  Button: {
    render: () => '<button data-testid="mock-button"><slot /></button>'
  }
}));

vi.mock('lucide-svelte', () => ({
  Plus: { render: () => '<svg data-testid="plus-icon" />' },
  X: { render: () => '<svg data-testid="x-icon" />' }
}));

vi.mock('../datetime/conditions/weekday-condition-editor.svelte', () => ({
  default: {
    render: () => '<div data-testid="weekday-condition-editor">WeekdayConditionEditor</div>'
  }
}));

describe('RecurrenceAdjustmentEditor', () => {
  const mockDateCondition: DateCondition = {
    id: 'date-1',
    relation: 'before' as DateRelation,
    reference_date: new Date('2024-01-15')
  };

  const mockWeekdayCondition: WeekdayCondition = {
    id: 'weekday-1',
    if_weekday: 'monday',
    then_direction: 'next',
    then_target: 'weekday'
  };

  const defaultProps = {
    dateConditions: [mockDateCondition],
    weekdayConditions: [mockWeekdayCondition],
    onDateConditionAdd: vi.fn(),
    onDateConditionRemove: vi.fn(),
    onDateConditionUpdate: vi.fn(),
    onWeekdayConditionAdd: vi.fn(),
    onWeekdayConditionRemove: vi.fn(),
    onWeekdayConditionUpdate: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('basic rendering', () => {
    it('should render without errors', () => {
      const { container } = render(RecurrenceAdjustmentEditor, { props: defaultProps });
      
      expect(container.innerHTML).toBeTruthy();
    });

    it('should render section title', () => {
      const { getByText } = render(RecurrenceAdjustmentEditor, { props: defaultProps });
      
      expect(getByText('調整条件')).toBeInTheDocument();
    });

    it('should render date conditions section', () => {
      const { getByText } = render(RecurrenceAdjustmentEditor, { props: defaultProps });
      
      expect(getByText('日付条件')).toBeInTheDocument();
    });

    it('should render weekday conditions section', () => {
      const { getByText } = render(RecurrenceAdjustmentEditor, { props: defaultProps });
      
      expect(getByText('曜日条件')).toBeInTheDocument();
    });

    it('should render add buttons', () => {
      const { getAllByText } = render(RecurrenceAdjustmentEditor, { props: defaultProps });
      
      const addButtons = getAllByText('追加');
      expect(addButtons).toHaveLength(2);
    });
  });

  describe('date conditions', () => {
    it('should render date condition items', () => {
      const { container } = render(RecurrenceAdjustmentEditor, { props: defaultProps });
      
      const relationSelect = container.querySelector('select');
      expect(relationSelect).toBeInTheDocument();
      
      const dateInput = container.querySelector('input[type="date"]');
      expect(dateInput).toBeInTheDocument();
    });

    it('should display correct relation value', () => {
      const { container } = render(RecurrenceAdjustmentEditor, { props: defaultProps });
      
      const relationSelect = container.querySelector('select') as HTMLSelectElement;
      expect(relationSelect.value).toBe('before');
    });

    it('should display correct date value', () => {
      const { container } = render(RecurrenceAdjustmentEditor, { props: defaultProps });
      
      const dateInput = container.querySelector('input[type="date"]') as HTMLInputElement;
      expect(dateInput.value).toBe('2024-01-15');
    });

    it('should render relation options', () => {
      const { container } = render(RecurrenceAdjustmentEditor, { props: defaultProps });
      
      const options = container.querySelectorAll('option');
      expect(options).toHaveLength(4);
      expect(options[0]).toHaveTextContent('以前');
      expect(options[1]).toHaveTextContent('以前または同日');
      expect(options[2]).toHaveTextContent('以降または同日');
      expect(options[3]).toHaveTextContent('以降');
    });

    it('should call onDateConditionAdd when add button clicked', async () => {
      const user = userEvent.setup();
      const { getAllByTestId } = render(RecurrenceAdjustmentEditor, { props: defaultProps });
      
      const addButtons = getAllByTestId('mock-button');
      await user.click(addButtons[0]);
      
      expect(defaultProps.onDateConditionAdd).toHaveBeenCalledOnce();
    });

    it('should handle relation change', async () => {
      const user = userEvent.setup();
      const { container } = render(RecurrenceAdjustmentEditor, { props: defaultProps });
      
      const relationSelect = container.querySelector('select') as HTMLSelectElement;
      await user.selectOptions(relationSelect, 'after');
      
      expect(defaultProps.onDateConditionUpdate).toHaveBeenCalledWith(
        'date-1',
        { relation: 'after' }
      );
    });

    it('should handle date change', async () => {
      const user = userEvent.setup();
      const { container } = render(RecurrenceAdjustmentEditor, { props: defaultProps });
      
      const dateInput = container.querySelector('input[type="date"]') as HTMLInputElement;
      await user.clear(dateInput);
      await user.type(dateInput, '2024-02-20');
      
      expect(defaultProps.onDateConditionUpdate).toHaveBeenCalledWith(
        'date-1',
        { reference_date: new Date('2024-02-20') }
      );
    });

    it('should call onDateConditionRemove when remove button clicked', async () => {
      const user = userEvent.setup();
      const { container } = render(RecurrenceAdjustmentEditor, { props: defaultProps });
      
      const removeButton = container.querySelector('button[type="button"]') as HTMLButtonElement;
      await user.click(removeButton);
      
      expect(defaultProps.onDateConditionRemove).toHaveBeenCalledWith('date-1');
    });

    it('should render remove button with X icon', () => {
      const { getByTestId } = render(RecurrenceAdjustmentEditor, { props: defaultProps });
      
      expect(getByTestId('x-icon')).toBeInTheDocument();
    });
  });

  describe('weekday conditions', () => {
    it('should render weekday condition editor', () => {
      const { getByTestId } = render(RecurrenceAdjustmentEditor, { props: defaultProps });
      
      expect(getByTestId('weekday-condition-editor')).toBeInTheDocument();
    });

    it('should call onWeekdayConditionAdd when add button clicked', async () => {
      const user = userEvent.setup();
      const { getAllByTestId } = render(RecurrenceAdjustmentEditor, { props: defaultProps });
      
      const addButtons = getAllByTestId('mock-button');
      await user.click(addButtons[1]);
      
      expect(defaultProps.onWeekdayConditionAdd).toHaveBeenCalledOnce();
    });

    it('should pass correct props to WeekdayConditionEditor', () => {
      const { getByTestId } = render(RecurrenceAdjustmentEditor, { props: defaultProps });
      
      expect(getByTestId('weekday-condition-editor')).toBeInTheDocument();
    });

    it('should handle weekday condition updates', () => {
      const { container } = render(RecurrenceAdjustmentEditor, { props: defaultProps });
      
      expect(container.innerHTML).toContain('weekday-condition-editor');
    });
  });

  describe('multiple conditions', () => {
    it('should render multiple date conditions', () => {
      const multipleProps = {
        ...defaultProps,
        dateConditions: [
          mockDateCondition,
          { id: 'date-2', relation: 'after' as DateRelation, reference_date: new Date('2024-02-01') }
        ]
      };
      
      const { container } = render(RecurrenceAdjustmentEditor, { props: multipleProps });
      
      const selects = container.querySelectorAll('select');
      expect(selects).toHaveLength(2);
      
      const dateInputs = container.querySelectorAll('input[type="date"]');
      expect(dateInputs).toHaveLength(2);
    });

    it('should render multiple weekday conditions', () => {
      const multipleProps = {
        ...defaultProps,
        weekdayConditions: [
          mockWeekdayCondition,
          { 
            id: 'weekday-2', 
            if_weekday: 'tuesday' as const,
            then_direction: 'previous' as const,
            then_target: 'holiday' as const
          }
        ]
      };
      
      const { getAllByTestId } = render(RecurrenceAdjustmentEditor, { props: multipleProps });
      
      const weekdayEditors = getAllByTestId('weekday-condition-editor');
      expect(weekdayEditors).toHaveLength(2);
    });

    it('should handle unique keys for date conditions', () => {
      const multipleProps = {
        ...defaultProps,
        dateConditions: [
          { id: 'date-1', relation: 'before' as DateRelation, reference_date: new Date('2024-01-01') },
          { id: 'date-2', relation: 'after' as DateRelation, reference_date: new Date('2024-02-01') },
          { id: 'date-3', relation: 'on_or_before' as DateRelation, reference_date: new Date('2024-03-01') }
        ]
      };
      
      const { container } = render(RecurrenceAdjustmentEditor, { props: multipleProps });
      
      const dateInputs = container.querySelectorAll('input[type="date"]');
      expect(dateInputs).toHaveLength(3);
      expect((dateInputs[0] as HTMLInputElement).value).toBe('2024-01-01');
      expect((dateInputs[1] as HTMLInputElement).value).toBe('2024-02-01');
      expect((dateInputs[2] as HTMLInputElement).value).toBe('2024-03-01');
    });
  });

  describe('empty states', () => {
    it('should handle empty date conditions', () => {
      const emptyProps = {
        ...defaultProps,
        dateConditions: []
      };
      
      const { container } = render(RecurrenceAdjustmentEditor, { props: emptyProps });
      
      const selects = container.querySelectorAll('select');
      expect(selects).toHaveLength(0);
      
      const dateInputs = container.querySelectorAll('input[type="date"]');
      expect(dateInputs).toHaveLength(0);
    });

    it('should handle empty weekday conditions', () => {
      const emptyProps = {
        ...defaultProps,
        weekdayConditions: []
      };
      
      const { queryByTestId } = render(RecurrenceAdjustmentEditor, { props: emptyProps });
      
      expect(queryByTestId('weekday-condition-editor')).not.toBeInTheDocument();
    });

    it('should still show add buttons when conditions are empty', () => {
      const emptyProps = {
        ...defaultProps,
        dateConditions: [],
        weekdayConditions: []
      };
      
      const { getAllByText } = render(RecurrenceAdjustmentEditor, { props: emptyProps });
      
      const addButtons = getAllByText('追加');
      expect(addButtons).toHaveLength(2);
    });
  });

  describe('styling', () => {
    it('should apply correct CSS classes to section', () => {
      const { container } = render(RecurrenceAdjustmentEditor, { props: defaultProps });
      
      const section = container.querySelector('section');
      expect(section).toHaveClass('space-y-3');
    });

    it('should apply correct CSS classes to title', () => {
      const { container } = render(RecurrenceAdjustmentEditor, { props: defaultProps });
      
      const title = container.querySelector('h3');
      expect(title).toHaveClass('text-lg', 'font-semibold');
    });

    it('should apply correct CSS classes to subsection titles', () => {
      const { container } = render(RecurrenceAdjustmentEditor, { props: defaultProps });
      
      const subtitles = container.querySelectorAll('h4');
      subtitles.forEach(subtitle => {
        expect(subtitle).toHaveClass('font-medium');
      });
    });

    it('should apply correct CSS classes to condition containers', () => {
      const { container } = render(RecurrenceAdjustmentEditor, { props: defaultProps });
      
      const conditionDiv = container.querySelector('.border-border.bg-card');
      expect(conditionDiv).toHaveClass('flex', 'items-center', 'gap-2', 'rounded', 'border', 'p-3');
    });

    it('should apply correct CSS classes to form elements', () => {
      const { container } = render(RecurrenceAdjustmentEditor, { props: defaultProps });
      
      const select = container.querySelector('select');
      expect(select).toHaveClass('border-border', 'bg-background', 'text-foreground', 'rounded', 'border', 'p-1');
      
      const input = container.querySelector('input[type="date"]');
      expect(input).toHaveClass('border-border', 'bg-background', 'text-foreground', 'rounded', 'border', 'p-1');
    });

    it('should apply correct CSS classes to remove button', () => {
      const { container } = render(RecurrenceAdjustmentEditor, { props: defaultProps });
      
      const removeButton = container.querySelector('button[type="button"]');
      expect(removeButton).toHaveClass('text-destructive', 'hover:bg-destructive/10', 'rounded', 'p-1');
    });
  });

  describe('accessibility', () => {
    it('should provide proper semantic structure', () => {
      const { container } = render(RecurrenceAdjustmentEditor, { props: defaultProps });
      
      expect(container.querySelector('section')).toBeInTheDocument();
      expect(container.querySelector('h3')).toBeInTheDocument();
      expect(container.querySelectorAll('h4')).toHaveLength(2);
    });

    it('should have accessible form elements', () => {
      const { container } = render(RecurrenceAdjustmentEditor, { props: defaultProps });
      
      const select = container.querySelector('select');
      expect(select).toBeInTheDocument();
      
      const input = container.querySelector('input[type="date"]');
      expect(input).toBeInTheDocument();
    });

    it('should have accessible buttons', () => {
      const { container } = render(RecurrenceAdjustmentEditor, { props: defaultProps });
      
      const removeButton = container.querySelector('button[type="button"]');
      expect(removeButton).toBeInTheDocument();
    });
  });

  describe('internationalization', () => {
    it('should use translation service for all text', () => {
      const { getByText } = render(RecurrenceAdjustmentEditor, { props: defaultProps });
      
      expect(getByText('調整条件')).toBeInTheDocument();
      expect(getByText('日付条件')).toBeInTheDocument();
      expect(getByText('曜日条件')).toBeInTheDocument();
      expect(getByText('追加')).toBeInTheDocument();
    });

    it('should use translation service for relation options', () => {
      const { container } = render(RecurrenceAdjustmentEditor, { props: defaultProps });
      
      const options = container.querySelectorAll('option');
      expect(options[0]).toHaveTextContent('以前');
      expect(options[1]).toHaveTextContent('以前または同日');
      expect(options[2]).toHaveTextContent('以降または同日');
      expect(options[3]).toHaveTextContent('以降');
    });
  });

  describe('edge cases', () => {
    it('should handle invalid date values', () => {
      const invalidProps = {
        ...defaultProps,
        dateConditions: [{
          id: 'date-1',
          relation: 'before' as DateRelation,
          reference_date: new Date('invalid-date')
        }]
      };
      
      const { container } = render(RecurrenceAdjustmentEditor, { props: invalidProps });
      
      expect(container.innerHTML).toBeTruthy();
    });

    it('should handle missing condition properties', () => {
      const incompleteProps = {
        ...defaultProps,
        dateConditions: [{ id: 'date-1' } as any]
      };
      
      const { container } = render(RecurrenceAdjustmentEditor, { props: incompleteProps });
      
      expect(container.innerHTML).toBeTruthy();
    });

    it('should handle null callbacks', () => {
      const nullProps = {
        ...defaultProps,
        onDateConditionAdd: null as any,
        onDateConditionRemove: null as any,
        onDateConditionUpdate: null as any
      };
      
      const { container } = render(RecurrenceAdjustmentEditor, { props: nullProps });
      
      expect(container.innerHTML).toBeTruthy();
    });
  });

  describe('component lifecycle', () => {
    it('should mount and unmount cleanly', () => {
      const { unmount } = render(RecurrenceAdjustmentEditor, { props: defaultProps });
      
      expect(() => unmount()).not.toThrow();
    });

    it('should handle prop updates', () => {
      const { rerender } = render(RecurrenceAdjustmentEditor, { props: defaultProps });
      
      const updatedProps = {
        ...defaultProps,
        dateConditions: []
      };
      
      expect(() => rerender(updatedProps)).not.toThrow();
    });

    it('should maintain state consistency across rerenders', () => {
      const { rerender, container } = render(RecurrenceAdjustmentEditor, { props: defaultProps });
      
      const updatedProps = {
        ...defaultProps,
        dateConditions: [
          ...defaultProps.dateConditions,
          { id: 'date-2', relation: 'after' as DateRelation, reference_date: new Date('2024-02-01') }
        ]
      };
      
      rerender(updatedProps);
      
      const selects = container.querySelectorAll('select');
      expect(selects).toHaveLength(2);
    });
  });
});
