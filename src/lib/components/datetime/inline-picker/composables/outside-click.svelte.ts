import type { InlineDatePickerState, UseInlineDatePickerOptions } from './types';

export function setupOutsideClickHandler(
  state: InlineDatePickerState,
  options: UseInlineDatePickerOptions,
  pickerElement: HTMLElement | undefined
): (() => void) | undefined {
  if (!pickerElement) return;

  const handleClickOutside = (event: MouseEvent) => {
    if (state.recurrenceDialogOpen) return;
    if (pickerElement && !pickerElement.contains(event.target as Node)) {
      options.onClose?.();
    }
  };

  const handleKeydown = (event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      if (state.recurrenceDialogOpen) {
        state.recurrenceDialogOpen = false;
        return;
      }
      options.onClose?.();
    }
  };

  setTimeout(() => {
    document.addEventListener('click', handleClickOutside, true);
    document.addEventListener('keydown', handleKeydown, true);
  }, 50);

  return () => {
    document.removeEventListener('click', handleClickOutside, true);
    document.removeEventListener('keydown', handleKeydown, true);
  };
}
