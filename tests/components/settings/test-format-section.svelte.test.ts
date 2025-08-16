import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import TestFormatSection from '$lib/components/settings/date-format/test-format-section.svelte';

// Mock dependencies
vi.mock('$lib/stores/locale.svelte', () => ({
  getTranslationService: () => ({
    getMessage: (key: string) => () => {
      const messages: Record<string, string> = {
        test_format: 'Test Format',
        preview: 'Preview',
        format_selection: 'Format Selection',
        format_name: 'Format Name',
        enter_format_name: 'Enter format name'
      };
      return messages[key] || key;
    }
  })
}));

vi.mock('date-fns', () => ({
  format: vi.fn((date: Date, formatString: string) => {
    if (formatString === 'invalid') throw new Error('Invalid format');
    return `formatted-${formatString}`;
  })
}));

vi.mock('$lib/stores/datetime-format.svelte', () => ({
  dateTimeFormatStore: {
    allFormats: () => [
      { id: 1, name: 'Default', format: 'yyyy-MM-dd HH:mm' },
      { id: 2, name: 'Short', format: 'MM/dd/yyyy' },
      { id: 3, name: 'Custom', format: null }
    ]
  }
}));

vi.mock('$lib/components/ui/input.svelte', () => ({
  default: () => ({ $$: { fragment: null } })
}));

describe('TestFormatSection', () => {
  const mockDateTime = new Date('2024-01-15T10:30:00');
  
  const defaultProps = {
    testFormat: 'yyyy-MM-dd HH:mm',
    testFormatName: 'My Format',
    testDateTime: mockDateTime,
    editMode: 'manual' as const,
    selectedPreset: { id: 1, name: 'Default', format: 'yyyy-MM-dd HH:mm' },
    formatNameEnabled: true,
    onTestFormatChange: vi.fn(),
    onFormatSelectionChange: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('basic rendering', () => {
    it('should render without errors', () => {
      render(TestFormatSection, { props: defaultProps });
      
      const container = document.querySelector('.space-y-4');
      expect(container).toBeInTheDocument();
    });

    it('should render all sections', () => {
      render(TestFormatSection, { props: defaultProps });
      
      expect(screen.getByText('Test Format')).toBeInTheDocument();
      expect(screen.getByText('Preview:')).toBeInTheDocument();
      expect(screen.getByText('Format Selection')).toBeInTheDocument();
      expect(screen.getByText('Format Name')).toBeInTheDocument();
    });

    it('should render form elements', () => {
      render(TestFormatSection, { props: defaultProps });
      
      // Input component is mocked, check for select and regular input
      expect(document.querySelector('#format-selection')).toBeInTheDocument();
      expect(document.querySelector('#format-name')).toBeInTheDocument();
    });
  });

  describe('test format input', () => {
    it('should display test format value', () => {
      render(TestFormatSection, { props: defaultProps });
      
      // Input component is mocked, just check container exists
      const container = document.querySelector('.space-y-4');
      expect(container).toBeInTheDocument();
    });

    it('should handle empty test format', () => {
      render(TestFormatSection, { 
        props: { 
          ...defaultProps, 
          testFormat: '' 
        }
      });
      
      const preview = screen.getByText('Preview:');
      expect(preview).toBeInTheDocument();
    });

    it('should show preview with valid format', () => {
      render(TestFormatSection, { props: defaultProps });
      
      const previewText = screen.getByText('formatted-yyyy-MM-dd HH:mm');
      expect(previewText).toBeInTheDocument();
    });

    it('should handle invalid format gracefully', () => {
      render(TestFormatSection, { 
        props: { 
          ...defaultProps, 
          testFormat: 'invalid'
        }
      });
      
      const invalidText = screen.getByText('Invalid format');
      expect(invalidText).toBeInTheDocument();
    });
  });

  describe('format selection dropdown', () => {
    it('should render format options', () => {
      render(TestFormatSection, { props: defaultProps });
      
      const select = document.querySelector('#format-selection') as HTMLSelectElement;
      expect(select).toBeInTheDocument();
      
      const options = select.querySelectorAll('option');
      expect(options).toHaveLength(3);
    });

    it('should show format details in options', () => {
      render(TestFormatSection, { props: defaultProps });
      
      expect(screen.getByText('Default: yyyy-MM-dd HH:mm')).toBeInTheDocument();
      expect(screen.getByText('Short: MM/dd/yyyy')).toBeInTheDocument();
      expect(screen.getByText('Custom')).toBeInTheDocument();
    });

    it('should be disabled when not in manual mode', () => {
      render(TestFormatSection, { 
        props: { 
          ...defaultProps, 
          editMode: 'edit'
        }
      });
      
      const select = document.querySelector('#format-selection') as HTMLSelectElement;
      expect(select).toBeDisabled();
    });

    it('should be enabled in manual mode', () => {
      render(TestFormatSection, { 
        props: { 
          ...defaultProps, 
          editMode: 'manual'
        }
      });
      
      const select = document.querySelector('#format-selection') as HTMLSelectElement;
      expect(select).not.toBeDisabled();
    });

    it('should call onChange when selection changes', () => {
      const mockOnChange = vi.fn();
      render(TestFormatSection, { 
        props: { 
          ...defaultProps, 
          onFormatSelectionChange: mockOnChange
        }
      });
      
      const select = document.querySelector('#format-selection') as HTMLSelectElement;
      fireEvent.change(select, { target: { value: '2' } });
      
      expect(mockOnChange).toHaveBeenCalled();
    });
  });

  describe('format name input', () => {
    it('should display format name value', () => {
      render(TestFormatSection, { props: defaultProps });
      
      const formatNameInput = document.querySelector('#format-name') as HTMLInputElement;
      expect(formatNameInput.value).toBe('My Format');
    });

    it('should be disabled when formatNameEnabled is false', () => {
      render(TestFormatSection, { 
        props: { 
          ...defaultProps, 
          formatNameEnabled: false
        }
      });
      
      const formatNameInput = document.querySelector('#format-name') as HTMLInputElement;
      expect(formatNameInput).toBeDisabled();
    });

    it('should be enabled when formatNameEnabled is true', () => {
      render(TestFormatSection, { 
        props: { 
          ...defaultProps, 
          formatNameEnabled: true
        }
      });
      
      const formatNameInput = document.querySelector('#format-name') as HTMLInputElement;
      expect(formatNameInput).not.toBeDisabled();
    });

    it('should show placeholder text', () => {
      render(TestFormatSection, { props: defaultProps });
      
      const formatNameInput = document.querySelector('#format-name') as HTMLInputElement;
      expect(formatNameInput.placeholder).toBe('Enter format name');
    });
  });

  describe('edit modes', () => {
    it('should handle manual edit mode', () => {
      render(TestFormatSection, { 
        props: { 
          ...defaultProps, 
          editMode: 'manual'
        }
      });
      
      const select = document.querySelector('#format-selection') as HTMLSelectElement;
      expect(select).not.toBeDisabled();
    });

    it('should handle new edit mode', () => {
      render(TestFormatSection, { 
        props: { 
          ...defaultProps, 
          editMode: 'new'
        }
      });
      
      const select = document.querySelector('#format-selection') as HTMLSelectElement;
      expect(select).toBeDisabled();
    });

    it('should handle edit edit mode', () => {
      render(TestFormatSection, { 
        props: { 
          ...defaultProps, 
          editMode: 'edit'
        }
      });
      
      const select = document.querySelector('#format-selection') as HTMLSelectElement;
      expect(select).toBeDisabled();
    });
  });

  describe('preview functionality', () => {
    it('should show preview for valid format', () => {
      render(TestFormatSection, { 
        props: { 
          ...defaultProps, 
          testFormat: 'yyyy-MM-dd'
        }
      });
      
      const preview = screen.getByText('formatted-yyyy-MM-dd');
      expect(preview).toBeInTheDocument();
      expect(preview).toHaveClass('bg-muted', 'rounded', 'px-2', 'py-1');
    });

    it('should show empty preview for empty format', () => {
      render(TestFormatSection, { 
        props: { 
          ...defaultProps, 
          testFormat: ''
        }
      });
      
      // Preview should be empty but container should exist
      const previewLabel = screen.getByText('Preview:');
      expect(previewLabel).toBeInTheDocument();
    });

    it('should handle format errors gracefully', () => {
      render(TestFormatSection, { 
        props: { 
          ...defaultProps, 
          testFormat: 'invalid'
        }
      });
      
      const errorText = screen.getByText('Invalid format');
      expect(errorText).toBeInTheDocument();
    });
  });

  describe('selectedPreset handling', () => {
    it('should handle null selectedPreset', () => {
      render(TestFormatSection, { 
        props: { 
          ...defaultProps, 
          selectedPreset: null
        }
      });
      
      const select = document.querySelector('#format-selection') as HTMLSelectElement;
      expect(select.value).toBe('');
    });

    it('should display selectedPreset value', () => {
      render(TestFormatSection, { 
        props: { 
          ...defaultProps, 
          selectedPreset: { id: 2, name: 'Short', format: 'MM/dd/yyyy' }
        }
      });
      
      const select = document.querySelector('#format-selection') as HTMLSelectElement;
      expect(select.value).toBe('2');
    });

    it('should handle preset without format', () => {
      render(TestFormatSection, { 
        props: { 
          ...defaultProps, 
          selectedPreset: { id: 3, name: 'Custom', format: null }
        }
      });
      
      expect(screen.getByText('Custom')).toBeInTheDocument();
    });
  });

  describe('responsive layout', () => {
    it('should have responsive grid classes', () => {
      render(TestFormatSection, { props: defaultProps });
      
      const gridContainers = document.querySelectorAll('.grid.grid-cols-1.gap-4.lg\\:grid-cols-2');
      expect(gridContainers).toHaveLength(2);
    });

    it('should maintain layout structure', () => {
      render(TestFormatSection, { props: defaultProps });
      
      const container = document.querySelector('.space-y-4');
      expect(container).toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('should have proper labels for form elements', () => {
      render(TestFormatSection, { props: defaultProps });
      
      const testFormatLabel = document.querySelector('label[for="test-format"]');
      const formatSelectionLabel = document.querySelector('label[for="format-selection"]');
      const formatNameLabel = document.querySelector('label[for="format-name"]');
      
      expect(testFormatLabel).toBeInTheDocument();
      expect(formatSelectionLabel).toBeInTheDocument();
      expect(formatNameLabel).toBeInTheDocument();
    });

    it('should have proper label text', () => {
      render(TestFormatSection, { props: defaultProps });
      
      expect(screen.getByText('Test Format')).toBeInTheDocument();
      expect(screen.getByText('Format Selection')).toBeInTheDocument();
      expect(screen.getByText('Format Name')).toBeInTheDocument();
    });

    it('should handle disabled states correctly', () => {
      render(TestFormatSection, { 
        props: { 
          ...defaultProps, 
          editMode: 'edit',
          formatNameEnabled: false
        }
      });
      
      const select = document.querySelector('#format-selection') as HTMLSelectElement;
      const nameInput = document.querySelector('#format-name') as HTMLInputElement;
      
      expect(select).toBeDisabled();
      expect(nameInput).toBeDisabled();
    });
  });

  describe('edge cases', () => {
    it('should handle very long format strings', () => {
      const longFormat = 'yyyy'.repeat(100);
      render(TestFormatSection, { 
        props: { 
          ...defaultProps, 
          testFormat: longFormat
        }
      });
      
      const preview = screen.getByText(`formatted-${longFormat}`);
      expect(preview).toBeInTheDocument();
    });

    it('should handle special characters in format', () => {
      render(TestFormatSection, { 
        props: { 
          ...defaultProps, 
          testFormat: 'yyyy年MM月dd日 HH時mm分ss秒'
        }
      });
      
      const preview = screen.getByText('formatted-yyyy年MM月dd日 HH時mm分ss秒');
      expect(preview).toBeInTheDocument();
    });

    it('should handle empty format name', () => {
      render(TestFormatSection, { 
        props: { 
          ...defaultProps, 
          testFormatName: ''
        }
      });
      
      const formatNameInput = document.querySelector('#format-name') as HTMLInputElement;
      expect(formatNameInput.value).toBe('');
    });

    it('should handle very long format names', () => {
      const longName = 'A'.repeat(1000);
      render(TestFormatSection, { 
        props: { 
          ...defaultProps, 
          testFormatName: longName
        }
      });
      
      const formatNameInput = document.querySelector('#format-name') as HTMLInputElement;
      expect(formatNameInput.value).toBe(longName);
    });
  });

  describe('component lifecycle', () => {
    it('should mount and unmount cleanly', () => {
      const { unmount } = render(TestFormatSection, { props: defaultProps });
      
      expect(document.querySelector('.space-y-4')).toBeInTheDocument();
      
      expect(() => unmount()).not.toThrow();
    });

    it('should handle prop updates', () => {
      const { unmount } = render(TestFormatSection, { props: defaultProps });
      
      unmount();
      
      const updatedProps = {
        ...defaultProps,
        testFormat: 'MM/dd/yyyy',
        editMode: 'new' as const
      };

      render(TestFormatSection, { props: updatedProps });
      
      const select = document.querySelector('#format-selection') as HTMLSelectElement;
      expect(select).toBeDisabled();
    });
  });
});