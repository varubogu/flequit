import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { setupOutsideClickHandler } from '$lib/components/datetime/inline-picker/composables/outside-click.svelte';
import type { InlineDatePickerState, UseInlineDatePickerOptions } from '$lib/components/datetime/inline-picker/composables/types';

describe('outside-click.svelte', () => {
  let state: InlineDatePickerState;
  let options: UseInlineDatePickerOptions;
  let pickerElement: HTMLElement;
  let outsideElement: HTMLElement;
  let cleanup: (() => void) | undefined;

  beforeEach(() => {
    // Create mock state
    state = {
      endDate: '',
      endTime: '00:00:00',
      startDate: '',
      startTime: '00:00:00',
      useRangeMode: false,
      recurrenceDialogOpen: false,
      currentRecurrenceRule: null,
      lastSyncedRangeMode: false,
      lastSyncedRecurrenceRule: null
    };

    // Create mock options with vi.fn() callbacks
    options = {
      currentDate: undefined,
      currentStartDate: undefined,
      isRangeDate: false,
      recurrenceRule: null,
      onChange: vi.fn(),
      onClose: vi.fn()
    };

    // Create DOM elements
    pickerElement = document.createElement('div');
    pickerElement.className = 'picker';
    document.body.appendChild(pickerElement);

    outsideElement = document.createElement('div');
    outsideElement.className = 'outside';
    document.body.appendChild(outsideElement);
  });

  afterEach(() => {
    // Clean up event listeners
    if (cleanup) {
      cleanup();
      cleanup = undefined;
    }

    // Clean up DOM
    document.body.innerHTML = '';
  });

  describe('setupOutsideClickHandler', () => {
    it('should return cleanup function when pickerElement is provided', () => {
      cleanup = setupOutsideClickHandler(state, options, pickerElement);
      expect(cleanup).toBeTypeOf('function');
    });

    it('should return undefined when pickerElement is undefined', () => {
      cleanup = setupOutsideClickHandler(state, options, undefined);
      expect(cleanup).toBeUndefined();
    });

    it('should call onClose when clicking outside picker', async () => {
      cleanup = setupOutsideClickHandler(state, options, pickerElement);

      // Wait for setTimeout to attach listeners
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Click outside
      const event = new MouseEvent('click', { bubbles: true });
      Object.defineProperty(event, 'target', { value: outsideElement, enumerable: true });
      document.dispatchEvent(event);

      expect(options.onClose).toHaveBeenCalledOnce();
    });

    it('should not call onClose when clicking inside picker', async () => {
      cleanup = setupOutsideClickHandler(state, options, pickerElement);

      // Wait for setTimeout to attach listeners
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Click inside
      const event = new MouseEvent('click', { bubbles: true });
      Object.defineProperty(event, 'target', { value: pickerElement, enumerable: true });
      document.dispatchEvent(event);

      expect(options.onClose).not.toHaveBeenCalled();
    });

    it('should not call onClose when recurrence dialog is open', async () => {
      state.recurrenceDialogOpen = true;
      cleanup = setupOutsideClickHandler(state, options, pickerElement);

      // Wait for setTimeout to attach listeners
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Click outside
      const event = new MouseEvent('click', { bubbles: true });
      Object.defineProperty(event, 'target', { value: outsideElement, enumerable: true });
      document.dispatchEvent(event);

      expect(options.onClose).not.toHaveBeenCalled();
    });

    it('should call onClose when Escape key is pressed', async () => {
      cleanup = setupOutsideClickHandler(state, options, pickerElement);

      // Wait for setTimeout to attach listeners
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Press Escape
      const event = new KeyboardEvent('keydown', { key: 'Escape' });
      document.dispatchEvent(event);

      expect(options.onClose).toHaveBeenCalledOnce();
    });

    it('should close recurrence dialog when Escape pressed and dialog is open', async () => {
      state.recurrenceDialogOpen = true;
      cleanup = setupOutsideClickHandler(state, options, pickerElement);

      // Wait for setTimeout to attach listeners
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Press Escape
      const event = new KeyboardEvent('keydown', { key: 'Escape' });
      document.dispatchEvent(event);

      expect(state.recurrenceDialogOpen).toBe(false);
      expect(options.onClose).not.toHaveBeenCalled();
    });

    it('should not respond to other keys', async () => {
      cleanup = setupOutsideClickHandler(state, options, pickerElement);

      // Wait for setTimeout to attach listeners
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Press other keys
      const event = new KeyboardEvent('keydown', { key: 'Enter' });
      document.dispatchEvent(event);

      expect(options.onClose).not.toHaveBeenCalled();
    });

    it('should properly remove event listeners on cleanup', async () => {
      cleanup = setupOutsideClickHandler(state, options, pickerElement);

      // Wait for setTimeout to attach listeners
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Call cleanup
      cleanup();

      // Click outside after cleanup
      const event = new MouseEvent('click', { bubbles: true });
      Object.defineProperty(event, 'target', { value: outsideElement, enumerable: true });
      document.dispatchEvent(event);

      expect(options.onClose).not.toHaveBeenCalled();
    });
  });
});
