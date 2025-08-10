export interface TagDetectionData {
  tagName: string;
  position: number;
}

/**
 * Handles DOM element updates and cursor management for tag completion
 */
export class TagElementUpdater {
  /**
   * Update element value by replacing tag range with new tag
   */
  static updateElementWithTag(
    element: HTMLInputElement | HTMLTextAreaElement,
    tagStart: number,
    tagEnd: number,
    displayTagName: string
  ): { newValue: string; newCursorPos: number } {
    const beforeTag = element.value.slice(0, tagStart);
    const afterTag = element.value.slice(tagEnd);
    const newValue = beforeTag + displayTagName + ' ' + afterTag;
    const newCursorPos = beforeTag.length + displayTagName.length + 1;

    // Update the element value
    element.value = newValue;

    // Dispatch input event to notify parent component
    const inputEvent = new Event('input', { bubbles: true });
    element.dispatchEvent(inputEvent);

    // Set cursor position after the tag
    element.setSelectionRange(newCursorPos, newCursorPos);

    return { newValue, newCursorPos };
  }

  /**
   * Notify about tag detection via custom event
   */
  static notifyTagDetection(
    onTagDetected: ((event: CustomEvent<TagDetectionData>) => void) | undefined,
    tagName: string,
    position: number
  ): void {
    onTagDetected?.(
      new CustomEvent('tagDetected', {
        detail: { tagName, position }
      })
    );
  }
}
