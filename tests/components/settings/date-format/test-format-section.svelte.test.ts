import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import TestFormatSection from '$lib/components/settings/date-format/test-format-section.svelte';
import type { DateTimeFormat } from '$lib/types/datetime-format';

// Mock dependencies
vi.mock('$lib/components/ui/input.svelte', () => ({
  default: () => ({ render: () => '<input data-testid="input-mock" />' })
}));

vi.mock('$lib/stores/locale.svelte', () => ({
  getTranslationService: vi.fn(() => ({
    getMessage: vi.fn((key: string) => {
      const translations = {
        test_format: 'Test Format',
        preview: 'Preview',
        format_selection: 'Format Selection',
        format_name: 'Format Name',
        enter_format_name: 'Enter format name'
      };
      return () => translations[key] || key;
    })
  }))
}));

vi.mock('date-fns', () => ({
  format: vi.fn((date, formatString) => {
    if (formatString === 'yyyy年MM月dd日 HH:mm:ss') {
      return '2024年01月01日 12:00:00';
    }
    if (formatString === 'invalid') {
      throw new Error('Invalid format');
    }
    return `formatted-${formatString}`;
  })
}));

vi.mock('$lib/stores/datetime-format.svelte', () => ({
  dateTimeFormatStore: {
    allFormats: () => [
      { id: 1, name: 'Standard', format: 'yyyy-MM-dd HH:mm:ss' },
      { id: 2, name: 'Japanese', format: 'yyyy年MM月dd日 HH:mm:ss' },
      { id: 3, name: 'Custom', format: null }
    ]
  }
}));

describe('TestFormatSection', () => {
  const mockDateTime = new Date('2024-01-01T12:00:00Z');
  
  const mockSelectedPreset: DateTimeFormat = {
    id: 1,
    name: 'Standard',
    format: 'yyyy-MM-dd HH:mm:ss'
  };

  const defaultProps = {
    testFormat: 'yyyy年MM月dd日 HH:mm:ss',
    testFormatName: 'Test Format Name',
    testDateTime: mockDateTime,
    editMode: 'manual' as const,
    selectedPreset: mockSelectedPreset,
    formatNameEnabled: true,
    onTestFormatChange: vi.fn(),
    onFormatSelectionChange: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('basic rendering', () => {
    it('should render without errors', () => {
      const { container } = render(TestFormatSection, { props: defaultProps });
      
      expect(container.innerHTML).toBeTruthy();
    });

    it('should render main container with proper spacing', () => {
      render(TestFormatSection, { props: defaultProps });
      
      const container = document.querySelector('.space-y-4');
      expect(container).toBeInTheDocument();
    });

    it('should render grid layout', () => {
      render(TestFormatSection, { props: defaultProps });
      
      const grids = document.querySelectorAll('.grid.grid-cols-1.gap-4.lg\\:grid-cols-2');
      expect(grids).toHaveLength(2);
    });
  });

  describe('test format input section', () => {
    it('should render test format label', () => {
      render(TestFormatSection, { props: defaultProps });
      
      const label = document.querySelector('label[for="test-format"]');
      expect(label?.textContent).toBe('Test Format');
    });

    it('should render test format input', () => {
      render(TestFormatSection, { props: defaultProps });
      
      const input = document.querySelector('#test-format');
      expect(input).toBeInTheDocument();
    });

    it('should display preview section', () => {
      render(TestFormatSection, { props: defaultProps });
      
      const previewSection = document.querySelector('.flex.items-center.gap-2.text-sm');
      expect(previewSection).toBeInTheDocument();
    });

    it('should show preview label', () => {
      render(TestFormatSection, { props: defaultProps });
      
      const previewLabel = document.querySelector('.font-medium');
      expect(previewLabel?.textContent).toBe('Preview:');
    });

    it('should show formatted preview', () => {
      render(TestFormatSection, { props: defaultProps });
      
      const preview = document.querySelector('.bg-muted.rounded.px-2.py-1');
      expect(preview?.textContent).toBe('2024年01月01日 12:00:00');
    });
  });

  describe('format selection section', () => {
    it('should render format selection label', () => {
      render(TestFormatSection, { props: defaultProps });
      
      const label = document.querySelector('label[for="format-selection"]');
      expect(label?.textContent).toBe('Format Selection');
    });

    it('should render format selection dropdown', () => {
      render(TestFormatSection, { props: defaultProps });
      
      const select = document.querySelector('#format-selection');
      expect(select).toBeInTheDocument();
    });

    it('should render all format options', () => {
      render(TestFormatSection, { props: defaultProps });
      
      const options = document.querySelectorAll('#format-selection option');
      expect(options).toHaveLength(3);
      
      expect(options[0].textContent).toBe('Standard: yyyy-MM-dd HH:mm:ss');
      expect(options[1].textContent).toBe('Japanese: yyyy年MM月dd日 HH:mm:ss');
      expect(options[2].textContent).toBe('Custom');
    });

    it('should set selected value from props', () => {
      render(TestFormatSection, { props: defaultProps });
      
      const select = document.querySelector('#format-selection') as HTMLSelectElement;
      expect(select?.value).toBe('1');
    });
  });

  describe('format name section', () => {
    it('should render format name label', () => {
      render(TestFormatSection, { props: defaultProps });
      
      const label = document.querySelector('label[for="format-name"]');
      expect(label?.textContent).toBe('Format Name');
    });

    it('should render format name input', () => {
      render(TestFormatSection, { props: defaultProps });
      
      const input = document.querySelector('#format-name');
      expect(input).toBeInTheDocument();
    });

    it('should show placeholder text', () => {
      render(TestFormatSection, { props: defaultProps });
      
      const input = document.querySelector('#format-name') as HTMLInputElement;
      expect(input?.placeholder).toBe('Enter format name');
    });
  });

  describe('edit mode handling', () => {
    it('should enable format selection in manual mode', () => {
      render(TestFormatSection, { props: { ...defaultProps, editMode: 'manual' } });
      
      const select = document.querySelector('#format-selection') as HTMLSelectElement;
      expect(select?.disabled).toBe(false);
    });

    it('should disable format selection in new mode', () => {
      render(TestFormatSection, { props: { ...defaultProps, editMode: 'new' } });
      
      const select = document.querySelector('#format-selection') as HTMLSelectElement;
      expect(select?.disabled).toBe(true);
    });

    it('should disable format selection in edit mode', () => {
      render(TestFormatSection, { props: { ...defaultProps, editMode: 'edit' } });
      
      const select = document.querySelector('#format-selection') as HTMLSelectElement;
      expect(select?.disabled).toBe(true);
    });

    it('should show disabled styling when format selection is disabled', () => {
      render(TestFormatSection, { props: { ...defaultProps, editMode: 'new' } });
      
      const select = document.querySelector('#format-selection');
      expect(select).toHaveClass('disabled:cursor-not-allowed');
      expect(select).toHaveClass('disabled:opacity-50');
    });
  });

  describe('format name enabled state', () => {
    it('should enable format name input when formatNameEnabled is true', () => {
      render(TestFormatSection, { props: { ...defaultProps, formatNameEnabled: true } });
      
      const input = document.querySelector('#format-name') as HTMLInputElement;
      expect(input?.disabled).toBe(false);
    });

    it('should disable format name input when formatNameEnabled is false', () => {
      render(TestFormatSection, { props: { ...defaultProps, formatNameEnabled: false } });
      
      const input = document.querySelector('#format-name') as HTMLInputElement;
      expect(input?.disabled).toBe(true);
    });

    it('should show disabled styling when format name is disabled', () => {
      render(TestFormatSection, { props: { ...defaultProps, formatNameEnabled: false } });
      
      const input = document.querySelector('#format-name');
      expect(input).toHaveClass('disabled:cursor-not-allowed');
      expect(input).toHaveClass('disabled:opacity-50');
    });
  });

  describe('preview functionality', () => {
    it('should show formatted preview for valid format', () => {
      render(TestFormatSection, { props: defaultProps });
      
      const preview = document.querySelector('.bg-muted.rounded.px-2.py-1');
      expect(preview?.textContent).toBe('2024年01月01日 12:00:00');
    });

    it('should show "Invalid format" for invalid format', () => {
      render(TestFormatSection, { props: { ...defaultProps, testFormat: 'invalid' } });
      
      const preview = document.querySelector('.bg-muted.rounded.px-2.py-1');
      expect(preview?.textContent).toBe('Invalid format');
    });

    it('should show empty preview for empty format', () => {
      render(TestFormatSection, { props: { ...defaultProps, testFormat: '' } });
      
      const preview = document.querySelector('.bg-muted.rounded.px-2.py-1');
      expect(preview?.textContent).toBe('');
    });

    it('should update preview when format changes', () => {
      const { rerender } = render(TestFormatSection, { props: defaultProps });
      
      rerender({ ...defaultProps, testFormat: 'yyyy-MM-dd' });
      
      const preview = document.querySelector('.bg-muted.rounded.px-2.py-1');
      expect(preview?.textContent).toBe('formatted-yyyy-MM-dd');
    });
  });

  describe('selected preset handling', () => {
    it('should handle null selected preset', () => {
      render(TestFormatSection, { props: { ...defaultProps, selectedPreset: null } });
      
      const select = document.querySelector('#format-selection') as HTMLSelectElement;
      expect(select?.value).toBe('');
    });

    it('should handle selected preset with different id', () => {
      const differentPreset: DateTimeFormat = {
        id: 2,
        name: 'Japanese',
        format: 'yyyy年MM月dd日 HH:mm:ss'
      };

      render(TestFormatSection, { props: { ...defaultProps, selectedPreset: differentPreset } });
      
      const select = document.querySelector('#format-selection') as HTMLSelectElement;
      expect(select?.value).toBe('2');
    });

    it('should handle format option without format string', () => {
      render(TestFormatSection, { props: defaultProps });
      
      const options = document.querySelectorAll('#format-selection option');
      const customOption = Array.from(options).find(option => option.textContent === 'Custom');
      expect(customOption).toBeInTheDocument();
    });
  });

  describe('responsive layout', () => {
    it('should have responsive grid classes', () => {
      render(TestFormatSection, { props: defaultProps });
      
      const grids = document.querySelectorAll('.grid.grid-cols-1.gap-4.lg\\:grid-cols-2');
      expect(grids).toHaveLength(2);
    });

    it('should have proper spacing classes', () => {
      render(TestFormatSection, { props: defaultProps });
      
      const container = document.querySelector('.space-y-4');
      expect(container).toBeInTheDocument();
      
      const formatNameSection = document.querySelector('.space-y-3');
      expect(formatNameSection).toBeInTheDocument();
    });
  });

  describe('styling and classes', () => {
    it('should apply proper input styling', () => {
      render(TestFormatSection, { props: defaultProps });
      
      const formatNameInput = document.querySelector('#format-name');
      expect(formatNameInput).toHaveClass('border-input');
      expect(formatNameInput).toHaveClass('bg-background');
      expect(formatNameInput).toHaveClass('ring-offset-background');
      expect(formatNameInput).toHaveClass('placeholder:text-muted-foreground');
    });

    it('should apply proper select styling', () => {
      render(TestFormatSection, { props: defaultProps });
      
      const select = document.querySelector('#format-selection');
      expect(select).toHaveClass('border-input');
      expect(select).toHaveClass('bg-background');
      expect(select).toHaveClass('text-foreground');
      expect(select).toHaveClass('w-full');
      expect(select).toHaveClass('rounded-md');
    });

    it('should apply proper preview styling', () => {
      render(TestFormatSection, { props: defaultProps });
      
      const preview = document.querySelector('.bg-muted.rounded.px-2.py-1');
      expect(preview).toHaveClass('bg-muted');
      expect(preview).toHaveClass('rounded');
      expect(preview).toHaveClass('px-2');
      expect(preview).toHaveClass('py-1');
    });
  });

  describe('component lifecycle', () => {
    it('should mount and unmount cleanly', () => {
      const { unmount } = render(TestFormatSection, { props: defaultProps });
      
      expect(() => unmount()).not.toThrow();
    });

    it('should handle prop updates', () => {
      const { rerender } = render(TestFormatSection, { props: defaultProps });
      
      const updatedProps = {
        ...defaultProps,
        testFormat: 'dd/MM/yyyy',
        editMode: 'new' as const,
        formatNameEnabled: false
      };

      expect(() => rerender(updatedProps)).not.toThrow();
    });
  });

  describe('edge cases', () => {
    it('should handle empty format name', () => {
      render(TestFormatSection, { props: { ...defaultProps, testFormatName: '' } });
      
      const input = document.querySelector('#format-name') as HTMLInputElement;
      expect(input?.value).toBe('');
    });

    it('should handle special characters in format', () => {
      render(TestFormatSection, { props: { ...defaultProps, testFormat: 'yyyy/MM/dd "特殊文字"' } });
      
      const preview = document.querySelector('.bg-muted.rounded.px-2.py-1');
      expect(preview?.textContent).toBe('formatted-yyyy/MM/dd "特殊文字"');
    });

    it('should handle very long format strings', () => {
      const longFormat = 'yyyy年MM月dd日 HH時mm分ss秒 EEEE'.repeat(10);
      render(TestFormatSection, { props: { ...defaultProps, testFormat: longFormat } });
      
      const preview = document.querySelector('.bg-muted.rounded.px-2.py-1');
      expect(preview?.textContent).toBe(`formatted-${longFormat}`);
    });

    it('should handle format with only spaces', () => {
      render(TestFormatSection, { props: { ...defaultProps, testFormat: '   ' } });
      
      const preview = document.querySelector('.bg-muted.rounded.px-2.py-1');
      expect(preview?.textContent).toBe('formatted-   ');
    });
  });

  describe('accessibility', () => {
    it('should have proper label associations', () => {
      render(TestFormatSection, { props: defaultProps });
      
      const testFormatLabel = document.querySelector('label[for="test-format"]');
      const formatSelectionLabel = document.querySelector('label[for="format-selection"]');
      const formatNameLabel = document.querySelector('label[for="format-name"]');
      
      expect(testFormatLabel).toBeInTheDocument();
      expect(formatSelectionLabel).toBeInTheDocument();
      expect(formatNameLabel).toBeInTheDocument();
    });

    it('should have proper input ids', () => {
      render(TestFormatSection, { props: defaultProps });
      
      expect(document.querySelector('#test-format')).toBeInTheDocument();
      expect(document.querySelector('#format-selection')).toBeInTheDocument();
      expect(document.querySelector('#format-name')).toBeInTheDocument();
    });
  });
});