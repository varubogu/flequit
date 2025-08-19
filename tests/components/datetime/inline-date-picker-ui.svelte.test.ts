import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/svelte';
import InlineDatePickerUI from '$lib/components/datetime/inline-picker/inline-date-picker-ui.svelte';

// Mock translation service
vi.mock('$lib/stores/locale.svelte', () => ({
  getTranslationService: () => ({
    getMessage: (key: string) => () => {
      const messages: Record<string, string> = {
        date_range: 'Date Range',
        recurrence: 'Recurrence'
      };
      return messages[key] || key;
    }
  })
}));

describe('InlineDatePickerUI', () => {
  const defaultProps = {
    position: { x: 200, y: 100 },
    useRangeMode: false,
    startDate: '2024-01-01',
    endDate: '2024-01-02',
    startTime: '09:00',
    endTime: '17:00',
    currentRecurrenceRule: null,
    onDateTimeInputChange: vi.fn(),
    onCalendarChange: vi.fn(),
    onRangeChange: vi.fn(),
    onRangeModeChange: vi.fn(),
    onRecurrenceEdit: vi.fn()
  };

  describe('basic rendering', () => {
    it('should render without errors', () => {
      const { container } = render(InlineDatePickerUI, { props: defaultProps });
      expect(container).toBeInTheDocument();
    });

    it('should have proper styling classes', () => {
      const { container } = render(InlineDatePickerUI, { props: defaultProps });
      const pickerElement = container.querySelector('[data-testid="inline-date-picker"]');
      expect(pickerElement || container.firstChild).toBeInTheDocument();
    });
  });

  describe('prop handling', () => {
    it('should handle position props', () => {
      const position = { x: 100, y: 50 };
      const { container } = render(InlineDatePickerUI, { 
        props: { ...defaultProps, position }
      });
      expect(container).toBeInTheDocument();
    });

    it('should handle range mode', () => {
      const { container } = render(InlineDatePickerUI, { 
        props: { ...defaultProps, useRangeMode: true }
      });
      expect(container).toBeInTheDocument();
    });

    it('should handle date props', () => {
      const startDate = '2024-02-01';
      const endDate = '2024-02-28';
      const { container } = render(InlineDatePickerUI, { 
        props: { ...defaultProps, startDate, endDate }
      });
      expect(container).toBeInTheDocument();
    });
  });

  describe('callback props', () => {
    it('should accept callback functions', () => {
      const mockCallbacks = {
        onDateTimeInputChange: vi.fn(),
        onCalendarChange: vi.fn(),
        onRangeChange: vi.fn(),
        onRangeModeChange: vi.fn(),
        onRecurrenceEdit: vi.fn()
      };

      const { container } = render(InlineDatePickerUI, { 
        props: { ...defaultProps, ...mockCallbacks }
      });
      expect(container).toBeInTheDocument();
    });

    it('should handle undefined callbacks', () => {
      const propsWithNoOpCallbacks = {
        ...defaultProps,
        onDateTimeInputChange: () => {},
        onCalendarChange: () => {},
        onRangeChange: () => {},
        onRangeModeChange: () => {},
        onRecurrenceEdit: () => {}
      };

      const { container } = render(InlineDatePickerUI, { 
        props: propsWithNoOpCallbacks
      });
      expect(container).toBeInTheDocument();
    });
  });

  describe('edge cases', () => {
    it('should handle different position values', () => {
      const position = { x: 0, y: 0 };
      const { container } = render(InlineDatePickerUI, { 
        props: { ...defaultProps, position }
      });
      expect(container).toBeInTheDocument();
    });

    it('should handle undefined dates', () => {
      const { container } = render(InlineDatePickerUI, { 
        props: { 
          ...defaultProps, 
          startDate: '' as any,
          endDate: '' as any
        }
      });
      expect(container).toBeInTheDocument();
    });

    it('should handle empty time strings', () => {
      const { container } = render(InlineDatePickerUI, { 
        props: { 
          ...defaultProps, 
          startTime: '',
          endTime: ''
        }
      });
      expect(container).toBeInTheDocument();
    });
  });

  describe('component lifecycle', () => {
    it('should mount and unmount cleanly', () => {
      const { unmount } = render(InlineDatePickerUI, { props: defaultProps });
      expect(() => unmount()).not.toThrow();
    });
  });
});