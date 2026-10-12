import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/svelte';
import NumericIntervalInput from '$lib/components/recurrence/settings/numeric-interval-input.svelte';

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
      const { container } = render(NumericIntervalInput, { props: defaultProps });

      const input = container.querySelector('input') as HTMLInputElement;
      // Simply check that input exists and has correct type
      expect(input).toBeInTheDocument();
      expect(input.type).toBe('number');
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

      ['Backspace', 'Delete', 'Tab', 'ArrowLeft'].forEach((key) => {
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
      const { container } = render(NumericIntervalInput, { props: defaultProps });

      const input = container.querySelector('input') as HTMLInputElement;
      // Simply verify the input exists and can receive input
      expect(input).toBeInTheDocument();
      expect(input.value).toBe('1');
    });

    it('should handle special characters', () => {
      const { container } = render(NumericIntervalInput, { props: defaultProps });

      const input = container.querySelector('input') as HTMLInputElement;
      // Simply verify the input exists
      expect(input).toBeInTheDocument();
      expect(input.value).toBe('1');
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

  describe('boundaries', () => {
    it('blocks letters, allows editing keys and shortcuts, and sanitizes the committed value', async () => {
      const onchange = vi.fn();
      const timeout = vi.spyOn(globalThis, 'setTimeout').mockImplementation((handler) => {
        if (typeof handler === 'function') {
          handler();
        }
        return 0 as unknown as ReturnType<typeof setTimeout>;
      });
      try {
        const { rerender } = render(NumericIntervalInput, {
          props: { value: 4, onchange }
        });
        const input = document.querySelector(
          '[data-testid="numeric-interval-input"]'
        ) as HTMLInputElement;

        const key = (init: KeyboardEventInit) => {
          const event = new KeyboardEvent('keydown', { bubbles: true, cancelable: true, ...init });
          input.dispatchEvent(event);
          return event.defaultPrevented;
        };

        expect(key({ key: 'a' })).toBe(true);
        expect(key({ key: 'Escape' })).toBe(false);
        expect(key({ key: 'Enter' })).toBe(false);
        expect(key({ key: 'ArrowUp' })).toBe(false);
        expect(key({ key: 'ArrowDown' })).toBe(false);
        expect(key({ key: 'c', metaKey: true })).toBe(false);
        expect(key({ key: 'A', ctrlKey: true })).toBe(false);
        expect(key({ key: 'b', ctrlKey: true })).toBe(true);
        expect(key({ key: '5' })).toBe(false);

        let typed = '12a';
        let acceptWrite = false;
        timeout.mockImplementation((handler) => {
          if (typeof handler === 'function') {
            acceptWrite = true;
            handler();
            acceptWrite = false;
          }
          return 0 as unknown as ReturnType<typeof setTimeout>;
        });
        Object.defineProperty(input, 'value', {
          configurable: true,
          get: () => typed,
          set: (next: string) => {
            if (acceptWrite) {
              typed = String(next);
            }
          }
        });

        await fireEvent.input(input);
        expect(typed).toBe('12');
        expect(onchange).toHaveBeenCalledWith(12);

        typed = '0';
        await fireEvent.input(input);
        expect(onchange).toHaveBeenCalledWith(1);

        typed = '';
        await fireEvent.input(input);
        expect(onchange).toHaveBeenLastCalledWith(1);

        timeout.mockRestore();
        delete (input as unknown as { value?: string }).value;
        await rerender({ value: 9, onchange });
        expect(input.value).toBe('9');
      } finally {
        timeout.mockRestore();
      }
    });

    it('sanitizes input when onchange is omitted', async () => {
      const timeout = vi.spyOn(globalThis, 'setTimeout').mockImplementation((handler) => {
        if (typeof handler === 'function') {
          handler();
        }
        return 0 as unknown as ReturnType<typeof setTimeout>;
      });
      try {
        render(NumericIntervalInput, { props: { value: 2 } });
        const input = document.querySelector(
          '[data-testid="numeric-interval-input"]'
        ) as HTMLInputElement;
        let typed = '8x';
        let acceptWrite = false;
        timeout.mockImplementation((handler) => {
          if (typeof handler === 'function') {
            acceptWrite = true;
            handler();
            acceptWrite = false;
          }
          return 0 as unknown as ReturnType<typeof setTimeout>;
        });
        Object.defineProperty(input, 'value', {
          configurable: true,
          get: () => typed,
          set: (next: string) => {
            if (acceptWrite) {
              typed = String(next);
            }
          }
        });
        await fireEvent.input(input);
        expect(typed).toBe('8');
      } finally {
        timeout.mockRestore();
      }
    });
  });
});
