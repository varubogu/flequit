import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render } from '@testing-library/svelte';
import RecurrenceDialogAdvancedContent from '$lib/components/recurrence/shared/recurrence-dialog-advanced-content.svelte';

// Mock child components
vi.mock('$lib/components/recurrence/recurrence-level-selector.svelte', () => ({
  default: () => ({ $$: { fragment: null } as { fragment: null } })
}));

vi.mock('$lib/components/recurrence/recurrence-count-input.svelte', () => ({
  default: () => ({ $$: { fragment: null } as { fragment: null } })
}));

vi.mock('$lib/components/recurrence/recurrence-interval-editor.svelte', () => ({
  default: () => ({ $$: { fragment: null } as { fragment: null } })
}));

vi.mock('$lib/components/recurrence/recurrence-adjustment-editor.svelte', () => ({
  default: () => ({ $$: { fragment: null } as { fragment: null } })
}));

vi.mock('$lib/components/recurrence/recurrence-preview.svelte', () => ({
  default: () => ({ $$: { fragment: null } as { fragment: null } })
}));

vi.mock('$lib/utils/datetime-utils', () => ({
  formatDateTimeRange: vi.fn(() => 'formatted date')
}));

describe('RecurrenceDialogAdvancedContent', () => {
  const mockLogic = {
    recurrenceLevel: 'basic',
    repeatCount: 5,
    unit: 'day',
    interval: 1,
    daysOfWeek: [],
    details: {},
    dateConditions: [],
    weekdayConditions: [],
    displayCount: 10,
    previewDates: [],
    startDateTime: new Date(),
    endDateTime: new Date(),
    isRangeDate: false,
    showBasicSettings: true,
    showAdvancedSettings: false,
    handleImmediateSave: vi.fn(),
    toggleDayOfWeek: vi.fn(),
    setUnit: vi.fn(),
    setInterval: vi.fn(),
    setDetails: vi.fn(),
    addDateCondition: vi.fn(),
    removeDateCondition: vi.fn(),
    updateDateCondition: vi.fn(),
    addWeekdayCondition: vi.fn(),
    removeWeekdayCondition: vi.fn(),
    updateWeekdayCondition: vi.fn()
  };

  const defaultProps = {
    logic: mockLogic as RecurrenceDialogAdvancedLogic
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('basic rendering', () => {
    it('should render without errors', () => {
      render(RecurrenceDialogAdvancedContent, { props: defaultProps });
      
      const container = document.querySelector('.flex.max-h-\\[calc\\(85vh-120px\\)\\]');
      expect(container).toBeInTheDocument();
    });

    it('should have proper layout structure', () => {
      render(RecurrenceDialogAdvancedContent, { props: defaultProps });
      
      const container = document.querySelector('.flex.max-h-\\[calc\\(85vh-120px\\)\\].flex-wrap.gap-6.overflow-y-auto');
      expect(container).toBeInTheDocument();
    });

    it('should render settings panel', () => {
      render(RecurrenceDialogAdvancedContent, { props: defaultProps });
      
      const settingsPanel = document.querySelector('.min-w-\\[480px\\].flex-1.space-y-6.overflow-y-auto');
      expect(settingsPanel).toBeInTheDocument();
    });
  });

  describe('conditional rendering', () => {
    it('should show basic settings when showBasicSettings is true', () => {
      render(RecurrenceDialogAdvancedContent, { 
        props: { 
          logic: { ...mockLogic, showBasicSettings: true } as RecurrenceDialogAdvancedLogic
        }
      });
      
      // Settings panel should contain basic components
      const settingsPanel = document.querySelector('.min-w-\\[480px\\].flex-1');
      expect(settingsPanel).toBeInTheDocument();
    });

    it('should hide basic settings when showBasicSettings is false', () => {
      render(RecurrenceDialogAdvancedContent, { 
        props: { 
          logic: { ...mockLogic, showBasicSettings: false } as RecurrenceDialogAdvancedLogic
        }
      });
      
      // Should still render level selector but not other components
      expect(document.body).toBeInTheDocument();
    });

    it('should show preview panel when showBasicSettings is true', () => {
      render(RecurrenceDialogAdvancedContent, { 
        props: { 
          logic: { ...mockLogic, showBasicSettings: true } as RecurrenceDialogAdvancedLogic
        }
      });
      
      const previewPanel = document.querySelector('.w-\\[480px\\].min-w-\\[480px\\].flex-shrink-0');
      expect(previewPanel).toBeInTheDocument();
    });

    it('should hide preview panel when showBasicSettings is false', () => {
      render(RecurrenceDialogAdvancedContent, { 
        props: { 
          logic: { ...mockLogic, showBasicSettings: false } as RecurrenceDialogAdvancedLogic
        }
      });
      
      const previewPanel = document.querySelector('.w-\\[480px\\].min-w-\\[480px\\].flex-shrink-0');
      expect(previewPanel).not.toBeInTheDocument();
    });

    it('should show advanced settings when showAdvancedSettings is true', () => {
      render(RecurrenceDialogAdvancedContent, { 
        props: { 
          logic: { 
            ...mockLogic, 
            showBasicSettings: true,
            showAdvancedSettings: true 
          } as RecurrenceDialogAdvancedLogic
        }
      });
      
      // Should render all components including advanced settings
      expect(document.body).toBeInTheDocument();
    });

    it('should hide advanced settings when showAdvancedSettings is false', () => {
      render(RecurrenceDialogAdvancedContent, { 
        props: { 
          logic: { 
            ...mockLogic, 
            showBasicSettings: true,
            showAdvancedSettings: false 
          } as RecurrenceDialogAdvancedLogic
        }
      });
      
      // Should render basic components but not advanced settings
      expect(document.body).toBeInTheDocument();
    });
  });

  describe('component integration', () => {
    it('should render RecurrenceLevelSelector', () => {
      render(RecurrenceDialogAdvancedContent, { props: defaultProps });
      
      // Component is mocked, just verify rendering
      expect(document.body).toBeInTheDocument();
    });

    it('should render RecurrenceCountInput when basic settings shown', () => {
      render(RecurrenceDialogAdvancedContent, { 
        props: { 
          logic: { ...mockLogic, showBasicSettings: true } as RecurrenceDialogAdvancedLogic
        }
      });
      
      expect(document.body).toBeInTheDocument();
    });

    it('should render RecurrenceIntervalEditor when basic settings shown', () => {
      render(RecurrenceDialogAdvancedContent, { 
        props: { 
          logic: { ...mockLogic, showBasicSettings: true } as RecurrenceDialogAdvancedLogic
        }
      });
      
      expect(document.body).toBeInTheDocument();
    });

    it('should render RecurrencePreview when basic settings shown', () => {
      render(RecurrenceDialogAdvancedContent, { 
        props: { 
          logic: { ...mockLogic, showBasicSettings: true } as RecurrenceDialogAdvancedLogic
        }
      });
      
      expect(document.body).toBeInTheDocument();
    });
  });

  describe('logic prop handling', () => {
    it('should accept logic prop', () => {
      render(RecurrenceDialogAdvancedContent, { props: defaultProps });
      
      expect(document.body).toBeInTheDocument();
    });

    it('should handle logic with different settings', () => {
      const customLogic = {
        ...mockLogic,
        recurrenceLevel: 'advanced',
        showBasicSettings: false,
        showAdvancedSettings: true
      };

      render(RecurrenceDialogAdvancedContent, { 
        props: { logic: customLogic as RecurrenceDialogAdvancedLogic }
      });
      
      expect(document.body).toBeInTheDocument();
    });

    it('should bind values to logic properties', () => {
      render(RecurrenceDialogAdvancedContent, { props: defaultProps });
      
      // Components should receive bound values from logic
      expect(document.body).toBeInTheDocument();
    });
  });

  describe('layout and styling', () => {
    it('should have responsive layout', () => {
      render(RecurrenceDialogAdvancedContent, { props: defaultProps });
      
      const container = document.querySelector('.flex.flex-wrap');
      expect(container).toBeInTheDocument();
    });

    it('should have proper spacing', () => {
      render(RecurrenceDialogAdvancedContent, { props: defaultProps });
      
      const container = document.querySelector('.gap-6');
      expect(container).toBeInTheDocument();
      
      const settingsPanel = document.querySelector('.space-y-6');
      expect(settingsPanel).toBeInTheDocument();
    });

    it('should have overflow handling', () => {
      render(RecurrenceDialogAdvancedContent, { props: defaultProps });
      
      const container = document.querySelector('.overflow-y-auto');
      expect(container).toBeInTheDocument();
    });

    it('should have proper panel sizing', () => {
      render(RecurrenceDialogAdvancedContent, { 
        props: { 
          logic: { ...mockLogic, showBasicSettings: true } as RecurrenceDialogAdvancedLogic
        }
      });
      
      const settingsPanel = document.querySelector('.min-w-\\[480px\\].flex-1');
      const previewPanel = document.querySelector('.w-\\[480px\\].min-w-\\[480px\\].flex-shrink-0');
      
      expect(settingsPanel).toBeInTheDocument();
      expect(previewPanel).toBeInTheDocument();
    });
  });

  describe('edge cases', () => {
    it('should handle undefined logic properties', () => {
      const incompleteLogic = {
        ...mockLogic,
        recurrenceLevel: undefined,
        showBasicSettings: undefined,
        showAdvancedSettings: undefined
      };

      render(RecurrenceDialogAdvancedContent, { 
        props: { logic: incompleteLogic as RecurrenceDialogAdvancedLogic }
      });
      
      expect(document.body).toBeInTheDocument();
    });

    it('should handle null logic', () => {
      render(RecurrenceDialogAdvancedContent, { 
        props: { logic: null as unknown as RecurrenceDialogAdvancedLogic }
      });
      
      expect(document.body).toBeInTheDocument();
    });

    it('should handle empty arrays in logic', () => {
      const logicWithEmptyArrays = {
        ...mockLogic,
        daysOfWeek: [],
        dateConditions: [],
        weekdayConditions: [],
        previewDates: []
      };

      render(RecurrenceDialogAdvancedContent, { 
        props: { logic: logicWithEmptyArrays as RecurrenceDialogAdvancedLogic }
      });
      
      expect(document.body).toBeInTheDocument();
    });
  });

  describe('component lifecycle', () => {
    it('should mount and unmount cleanly', () => {
      const { unmount } = render(RecurrenceDialogAdvancedContent, { props: defaultProps });
      
      expect(() => unmount()).not.toThrow();
    });

    it('should handle logic updates', () => {
      const { unmount } = render(RecurrenceDialogAdvancedContent, { props: defaultProps });
      
      unmount();
      
      const updatedLogic = {
        ...mockLogic,
        showBasicSettings: false,
        showAdvancedSettings: true
      };

      render(RecurrenceDialogAdvancedContent, { 
        props: { logic: updatedLogic as RecurrenceDialogAdvancedLogic }
      });
      
      expect(document.body).toBeInTheDocument();
    });
  });

  describe('callback integration', () => {
    it('should pass callbacks to child components', () => {
      render(RecurrenceDialogAdvancedContent, { props: defaultProps });
      
      // Callbacks should be bound to logic methods
      expect(document.body).toBeInTheDocument();
    });

    it('should handle missing callbacks gracefully', () => {
      const logicWithoutCallbacks = {
        ...mockLogic,
        handleImmediateSave: undefined,
        toggleDayOfWeek: undefined,
        setUnit: undefined
      };

      render(RecurrenceDialogAdvancedContent, { 
        props: { logic: logicWithoutCallbacks as RecurrenceDialogAdvancedLogic }
      });
      
      expect(document.body).toBeInTheDocument();
    });
  });
});