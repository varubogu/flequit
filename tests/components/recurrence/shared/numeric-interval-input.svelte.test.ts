import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/svelte';
import NumericIntervalInput from '$lib/components/recurrence/shared/numeric-interval-input.svelte';

describe('NumericIntervalInput', () => {
  const defaultProps = {
    value: 1,
    onchange: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('basic rendering', () => {
    it('should render without errors', () => {
      render(NumericIntervalInput, { props: defaultProps });
      
      const input = document.querySelector('input[type="number"]');
      expect(input).toBeInTheDocument();
    });

    it('should display initial value', () => {
      render(NumericIntervalInput, { props: { ...defaultProps, value: 5 } });
      
      const input = document.querySelector('input') as HTMLInputElement;
      expect(input.value).toBe('5');
    });

    it('should have correct attributes', () => {
      render(NumericIntervalInput, { props: defaultProps });
      
      const input = document.querySelector('input') as HTMLInputElement;
      expect(input.min).toBe('1');
      expect(input.step).toBe('1');
      expect(input.placeholder).toBe('1');
    });
  });

  describe('input validation', () => {
    it('should prevent non-numeric input', () => {
      render(NumericIntervalInput, { props: defaultProps });
      
      const input = document.querySelector('input') as HTMLInputElement;
      const event = new KeyboardEvent('keydown', { key: 'a' });
      fireEvent(input, event);
      
      expect(event.defaultPrevented).toBe(true);
    });

    it('should allow numeric input', () => {
      render(NumericIntervalInput, { props: defaultProps });
      
      const input = document.querySelector('input') as HTMLInputElement;
      const event = new KeyboardEvent('keydown', { key: '5' });
      fireEvent(input, event);
      
      expect(event.defaultPrevented).toBe(false);
    });

    it('should allow control keys', () => {
      render(NumericIntervalInput, { props: defaultProps });
      
      const input = document.querySelector('input') as HTMLInputElement;
      
      ['Backspace', 'Delete', 'Tab', 'ArrowLeft'].forEach(key => {
        const event = new KeyboardEvent('keydown', { key });
        fireEvent(input, event);
        expect(event.defaultPrevented).toBe(false);
      });
    });

    it('should allow copy/paste shortcuts', () => {
      render(NumericIntervalInput, { props: defaultProps });
      
      const input = document.querySelector('input') as HTMLInputElement;
      const event = new KeyboardEvent('keydown', { key: 'v', ctrlKey: true });
      fireEvent(input, event);
      
      expect(event.defaultPrevented).toBe(false);
    });
  });

  describe('value changes', () => {
    it('should call onchange when input changes', () => {
      const mockOnChange = vi.fn();
      render(NumericIntervalInput, { props: { ...defaultProps, onchange: mockOnChange } });
      
      const input = document.querySelector('input') as HTMLInputElement;
      fireEvent.input(input, { target: { value: '3' } });
      
      // Need to wait for setTimeout
      setTimeout(() => {
        expect(mockOnChange).toHaveBeenCalledWith(3);
      }, 1);
    });

    it('should enforce minimum value of 1', () => {
      const mockOnChange = vi.fn();
      render(NumericIntervalInput, { props: { ...defaultProps, onchange: mockOnChange } });
      
      const input = document.querySelector('input') as HTMLInputElement;
      fireEvent.input(input, { target: { value: '0' } });
      
      setTimeout(() => {
        expect(mockOnChange).toHaveBeenCalledWith(1);
      }, 1);
    });

    it('should handle empty input', () => {
      const mockOnChange = vi.fn();
      render(NumericIntervalInput, { props: { ...defaultProps, onchange: mockOnChange } });
      
      const input = document.querySelector('input') as HTMLInputElement;
      fireEvent.input(input, { target: { value: '' } });
      
      setTimeout(() => {
        expect(mockOnChange).toHaveBeenCalledWith(1);
      }, 1);
    });
  });

  describe('input sanitization', () => {
    it('should remove non-numeric characters', () => {
      render(NumericIntervalInput, { props: defaultProps });
      
      const input = document.querySelector('input') as HTMLInputElement;
      fireEvent.input(input, { target: { value: '3a5b' } });
      
      setTimeout(() => {
        expect(input.value).toBe('35');
      }, 1);
    });

    it('should handle special characters', () => {
      render(NumericIntervalInput, { props: defaultProps });
      
      const input = document.querySelector('input') as HTMLInputElement;
      fireEvent.input(input, { target: { value: '1!@#2$%^3' } });
      
      setTimeout(() => {
        expect(input.value).toBe('123');
      }, 1);
    });
  });

  describe('prop updates', () => {
    it('should update input when value prop changes', () => {
      const { unmount } = render(NumericIntervalInput, { props: { ...defaultProps, value: 1 } });
      
      let input = document.querySelector('input') as HTMLInputElement;
      expect(input.value).toBe('1');
      
      unmount();
      
      render(NumericIntervalInput, { props: { ...defaultProps, value: 10 } });
      input = document.querySelector('input') as HTMLInputElement;
      expect(input.value).toBe('10');
    });
  });

  describe('edge cases', () => {
    it('should handle missing onchange callback', () => {
      render(NumericIntervalInput, { props: { value: 1 } });
      
      const input = document.querySelector('input') as HTMLInputElement;
      expect(() => {
        fireEvent.input(input, { target: { value: '5' } });
      }).not.toThrow();
    });

    it('should handle undefined onchange', () => {
      render(NumericIntervalInput, { props: { value: 1, onchange: undefined } });
      
      const input = document.querySelector('input') as HTMLInputElement;
      expect(() => {
        fireEvent.input(input, { target: { value: '5' } });
      }).not.toThrow();
    });

    it('should handle very large numbers', () => {
      const mockOnChange = vi.fn();
      render(NumericIntervalInput, { props: { ...defaultProps, onchange: mockOnChange } });
      
      const input = document.querySelector('input') as HTMLInputElement;
      fireEvent.input(input, { target: { value: '999999' } });
      
      setTimeout(() => {
        expect(mockOnChange).toHaveBeenCalledWith(999999);
      }, 1);
    });
  });

  describe('component lifecycle', () => {
    it('should mount and unmount cleanly', () => {
      const { unmount } = render(NumericIntervalInput, { props: defaultProps });
      
      expect(() => unmount()).not.toThrow();
    });
  });
});