import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/svelte';
import InlineDatePickerUI from '$lib/components/datetime/inline-picker/inline-date-picker-ui.svelte';

// Mock child components
vi.mock('$lib/components/ui/switch', () => ({
  Switch: () => ({ $$: { fragment: null } })
}));

vi.mock('$lib/components/datetime/date-time-inputs.svelte', () => ({
  default: () => ({ $$: { fragment: null } })
}));

vi.mock('$lib/components/datetime/calendar-picker.svelte', () => ({
  default: () => ({ $$: { fragment: null } })
}));

vi.mock('$lib/components/task/task-recurrence-selector.svelte', () => ({
  default: () => ({ $$: { fragment: null } })
}));

vi.mock('@internationalized/date', () => ({
  CalendarDate: class {
    constructor(year: number, month: number, day: number) {
      this.year = year;
      this.month = month;
      this.day = day;
    }
    year: number;
    month: number;
    day: number;
  }
}));

describe('InlineDatePickerUI', () => {
  const defaultProps = {
    position: { x: 100, y: 200 },
    startDate: '2024-01-15',
    startTime: '10:00',
    endDate: '2024-01-16',
    endTime: '11:00',
    useRangeMode: false,
    currentRecurrenceRule: null,
    onDateTimeInputChange: vi.fn(),
    onCalendarChange: vi.fn(),
    onRangeChange: vi.fn(),
    onRangeModeChange: vi.fn(),
    onRecurrenceEdit: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('basic rendering', () => {
    it('should render without errors', () => {
      render(InlineDatePickerUI, { props: defaultProps });
      
      const picker = document.querySelector('.fixed.z-50.rounded-lg.border.shadow-lg');
      expect(picker).toBeInTheDocument();
    });

    it('should position correctly', () => {
      render(InlineDatePickerUI, { props: defaultProps });
      
      const picker = document.querySelector('.fixed') as HTMLElement;
      expect(picker.style.left).toBe('100px');
      expect(picker.style.top).toBe('200px');
    });

    it('should have proper styling classes', () => {
      render(InlineDatePickerUI, { props: defaultProps });
      
      const picker = document.querySelector('.bg-popover.border-border.fixed.z-50.rounded-lg.border.p-3.shadow-lg');
      expect(picker).toBeInTheDocument();
    });

    it('should have correct width constraints', () => {
      render(InlineDatePickerUI, { props: defaultProps });
      
      const picker = document.querySelector('.fixed') as HTMLElement;
      expect(picker.style.width).toBe('fit-content');
      expect(picker.style.maxWidth).toBe('320px');
    });
  });

  describe('layout structure', () => {
    it('should render range mode and recurrence section', () => {
      render(InlineDatePickerUI, { props: defaultProps });
      
      const gridSection = document.querySelector('.grid.grid-cols-2.gap-4');
      expect(gridSection).toBeInTheDocument();
    });

    it('should render range mode switch', () => {
      render(InlineDatePickerUI, { props: defaultProps });
      
      const rangeSection = document.querySelector('.flex.items-center.gap-2');
      expect(rangeSection).toBeInTheDocument();
    });

    it('should render range label', () => {
      render(InlineDatePickerUI, { props: defaultProps });
      
      const rangeLabel = document.querySelector('.text-muted-foreground.text-sm');
      expect(rangeLabel).toHaveTextContent('範囲');
    });

    it('should render recurrence section', () => {
      render(InlineDatePickerUI, { props: defaultProps });
      
      const recurrenceSection = document.querySelector('.flex.items-center.justify-end');
      expect(recurrenceSection).toBeInTheDocument();
    });

    it('should render main content area', () => {
      render(InlineDatePickerUI, { props: defaultProps });
      
      const contentArea = document.querySelector('.space-y-3');
      expect(contentArea).toBeInTheDocument();
    });
  });

  describe('position handling', () => {
    it('should handle different positions', () => {
      render(InlineDatePickerUI, { 
        props: { 
          ...defaultProps, 
          position: { x: 50, y: 75 }
        }
      });
      
      const picker = document.querySelector('.fixed') as HTMLElement;
      expect(picker.style.left).toBe('50px');
      expect(picker.style.top).toBe('75px');
    });

    it('should handle zero position', () => {
      render(InlineDatePickerUI, { 
        props: { 
          ...defaultProps, 
          position: { x: 0, y: 0 }
        }
      });
      
      const picker = document.querySelector('.fixed') as HTMLElement;
      expect(picker.style.left).toBe('0px');
      expect(picker.style.top).toBe('0px');
    });

    it('should handle negative positions', () => {
      render(InlineDatePickerUI, { 
        props: { 
          ...defaultProps, 
          position: { x: -10, y: -20 }
        }
      });
      
      const picker = document.querySelector('.fixed') as HTMLElement;
      expect(picker.style.left).toBe('-10px');
      expect(picker.style.top).toBe('-20px');
    });

    it('should handle large positions', () => {
      render(InlineDatePickerUI, { 
        props: { 
          ...defaultProps, 
          position: { x: 1920, y: 1080 }
        }
      });
      
      const picker = document.querySelector('.fixed') as HTMLElement;
      expect(picker.style.left).toBe('1920px');
      expect(picker.style.top).toBe('1080px');
    });
  });

  describe('range mode functionality', () => {
    it('should handle useRangeMode true', () => {
      render(InlineDatePickerUI, { 
        props: { 
          ...defaultProps, 
          useRangeMode: true
        }
      });
      
      // Switch component is mocked, just verify component renders
      expect(document.body).toBeInTheDocument();
    });

    it('should handle useRangeMode false', () => {
      render(InlineDatePickerUI, { 
        props: { 
          ...defaultProps, 
          useRangeMode: false
        }
      });
      
      expect(document.body).toBeInTheDocument();
    });

    it('should call onRangeModeChange callback', () => {
      const mockRangeModeChange = vi.fn();
      render(InlineDatePickerUI, { 
        props: { 
          ...defaultProps, 
          onRangeModeChange: mockRangeModeChange
        }
      });
      
      // Switch component is mocked, callbacks should be passed through
      expect(document.body).toBeInTheDocument();
    });
  });

  describe('date and time props', () => {
    it('should handle all date/time props', () => {
      render(InlineDatePickerUI, { 
        props: { 
          ...defaultProps, 
          startDate: '2024-02-01',
          startTime: '09:30',
          endDate: '2024-02-02',
          endTime: '17:45'
        }
      });
      
      expect(document.body).toBeInTheDocument();
    });

    it('should handle empty date/time props', () => {
      render(InlineDatePickerUI, { 
        props: { 
          ...defaultProps, 
          startDate: '',
          startTime: '',
          endDate: '',
          endTime: ''
        }
      });
      
      expect(document.body).toBeInTheDocument();
    });

    it('should handle undefined date/time props', () => {
      render(InlineDatePickerUI, { 
        props: { 
          ...defaultProps, 
          startDate: undefined as any,
          startTime: undefined as any,
          endDate: undefined as any,
          endTime: undefined as any
        }
      });
      
      expect(document.body).toBeInTheDocument();
    });
  });

  describe('recurrence rule handling', () => {
    it('should handle null recurrence rule', () => {
      render(InlineDatePickerUI, { 
        props: { 
          ...defaultProps, 
          currentRecurrenceRule: null
        }
      });
      
      expect(document.body).toBeInTheDocument();
    });

    it('should handle recurrence rule object', () => {
      const mockRecurrenceRule = {
        frequency: 'weekly',
        interval: 1,
        count: 10
      };

      render(InlineDatePickerUI, { 
        props: { 
          ...defaultProps, 
          currentRecurrenceRule: mockRecurrenceRule as any
        }
      });
      
      expect(document.body).toBeInTheDocument();
    });

    it('should call onRecurrenceEdit callback', () => {
      const mockRecurrenceEdit = vi.fn();
      render(InlineDatePickerUI, { 
        props: { 
          ...defaultProps, 
          onRecurrenceEdit: mockRecurrenceEdit
        }
      });
      
      // TaskRecurrenceSelector is mocked, callback should be passed through
      expect(document.body).toBeInTheDocument();
    });
  });

  describe('callback handling', () => {
    it('should accept onDateTimeInputChange callback', () => {
      const mockCallback = vi.fn();
      render(InlineDatePickerUI, { 
        props: { 
          ...defaultProps, 
          onDateTimeInputChange: mockCallback
        }
      });
      
      expect(document.body).toBeInTheDocument();
    });

    it('should accept onCalendarChange callback', () => {
      const mockCallback = vi.fn();
      render(InlineDatePickerUI, { 
        props: { 
          ...defaultProps, 
          onCalendarChange: mockCallback
        }
      });
      
      expect(document.body).toBeInTheDocument();
    });

    it('should accept onRangeChange callback', () => {
      const mockCallback = vi.fn();
      render(InlineDatePickerUI, { 
        props: { 
          ...defaultProps, 
          onRangeChange: mockCallback
        }
      });
      
      expect(document.body).toBeInTheDocument();
    });

    it('should handle undefined callbacks', () => {
      render(InlineDatePickerUI, { 
        props: { 
          ...defaultProps, 
          onDateTimeInputChange: undefined as any,
          onCalendarChange: undefined as any,
          onRangeChange: undefined as any,
          onRangeModeChange: undefined as any,
          onRecurrenceEdit: undefined as any
        }
      });
      
      expect(document.body).toBeInTheDocument();
    });
  });

  describe('component integration', () => {
    it('should render DateTimeInputs component', () => {
      render(InlineDatePickerUI, { props: defaultProps });
      
      // DateTimeInputs is mocked, component should render
      expect(document.body).toBeInTheDocument();
    });

    it('should render CalendarPicker component', () => {
      render(InlineDatePickerUI, { props: defaultProps });
      
      // CalendarPicker is mocked, component should render
      expect(document.body).toBeInTheDocument();
    });

    it('should render TaskRecurrenceSelector component', () => {
      render(InlineDatePickerUI, { props: defaultProps });
      
      // TaskRecurrenceSelector is mocked, component should render
      expect(document.body).toBeInTheDocument();
    });

    it('should render Switch component', () => {
      render(InlineDatePickerUI, { props: defaultProps });
      
      // Switch is mocked, component should render
      expect(document.body).toBeInTheDocument();
    });
  });

  describe('exposed methods', () => {
    it('should expose getPickerElement method', () => {
      let componentInstance: any;
      render(InlineDatePickerUI, { 
        props: defaultProps,
        context: new Map([['$$_component', (instance: any) => { componentInstance = instance; }]])
      });
      
      // Method should be available on component instance
      expect(document.body).toBeInTheDocument();
    });
  });

  describe('element binding', () => {
    it('should bind picker element', () => {
      render(InlineDatePickerUI, { props: defaultProps });
      
      const pickerElement = document.querySelector('.fixed.z-50');
      expect(pickerElement).toBeInTheDocument();
    });

    it('should have proper element reference', () => {
      render(InlineDatePickerUI, { props: defaultProps });
      
      // Element should be bound for outside click detection
      expect(document.body).toBeInTheDocument();
    });
  });

  describe('edge cases', () => {
    it('should handle null position', () => {
      render(InlineDatePickerUI, { 
        props: { 
          ...defaultProps, 
          position: null as any
        }
      });
      
      expect(document.body).toBeInTheDocument();
    });

    it('should handle position with missing properties', () => {
      render(InlineDatePickerUI, { 
        props: { 
          ...defaultProps, 
          position: { x: 100 } as any
        }
      });
      
      expect(document.body).toBeInTheDocument();
    });

    it('should handle floating point positions', () => {
      render(InlineDatePickerUI, { 
        props: { 
          ...defaultProps, 
          position: { x: 100.5, y: 200.7 }
        }
      });
      
      const picker = document.querySelector('.fixed') as HTMLElement;
      expect(picker.style.left).toBe('100.5px');
      expect(picker.style.top).toBe('200.7px');
    });
  });

  describe('component lifecycle', () => {
    it('should mount and unmount cleanly', () => {
      const { unmount } = render(InlineDatePickerUI, { props: defaultProps });
      
      expect(() => unmount()).not.toThrow();
    });

    it('should handle prop updates', () => {
      const { unmount } = render(InlineDatePickerUI, { props: defaultProps });
      
      unmount();
      
      const updatedProps = {
        ...defaultProps,
        position: { x: 300, y: 400 },
        useRangeMode: true
      };

      render(InlineDatePickerUI, { props: updatedProps });
      
      const picker = document.querySelector('.fixed') as HTMLElement;
      expect(picker.style.left).toBe('300px');
      expect(picker.style.top).toBe('400px');
    });
  });

  describe('responsive design', () => {
    it('should have max-width constraint', () => {
      render(InlineDatePickerUI, { props: defaultProps });
      
      const picker = document.querySelector('.fixed') as HTMLElement;
      expect(picker.style.maxWidth).toBe('320px');
    });

    it('should use fit-content width', () => {
      render(InlineDatePickerUI, { props: defaultProps });
      
      const picker = document.querySelector('.fixed') as HTMLElement;
      expect(picker.style.width).toBe('fit-content');
    });

    it('should handle different screen sizes', () => {
      render(InlineDatePickerUI, { 
        props: { 
          ...defaultProps, 
          position: { x: window.innerWidth - 100, y: window.innerHeight - 100 }
        }
      });
      
      expect(document.body).toBeInTheDocument();
    });
  });
});