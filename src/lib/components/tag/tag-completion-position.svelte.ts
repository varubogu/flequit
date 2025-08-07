export class TagCompletionPosition {
  // Position calculation functions
  static calculateSuggestionsPosition(
    element: HTMLInputElement | HTMLTextAreaElement,
    startPos: number
  ): { top: number; left: number } {
    if (element.tagName === 'TEXTAREA') {
      return this.calculateTextareaCharPosition(element as HTMLTextAreaElement, startPos);
    } else {
      return this.calculateInputCharPosition(element as HTMLInputElement, startPos);
    }
  }

  private static calculateInputCharPosition(
    input: HTMLInputElement,
    startPos: number
  ): { top: number; left: number } {
    // Create a temporary span to measure text width up to the # character
    const span = document.createElement('span');
    const inputStyle = window.getComputedStyle(input);

    // Copy font properties exactly
    span.style.font = inputStyle.font;
    span.style.fontSize = inputStyle.fontSize;
    span.style.fontFamily = inputStyle.fontFamily;
    span.style.fontWeight = inputStyle.fontWeight;
    span.style.letterSpacing = inputStyle.letterSpacing;
    span.style.whiteSpace = 'pre';
    span.style.visibility = 'hidden';
    span.style.position = 'absolute';
    span.style.top = '-9999px';
    span.style.left = '-9999px';

    // Get text up to the # position
    span.textContent = input.value.slice(0, startPos);
    document.body.appendChild(span);
    const textWidth = span.getBoundingClientRect().width;
    document.body.removeChild(span);

    const inputRect = input.getBoundingClientRect();
    const paddingLeft = parseInt(inputStyle.paddingLeft, 10);
    const borderLeft = parseInt(inputStyle.borderLeftWidth, 10);

    // Calculate exact position of the # character
    let left = inputRect.left + paddingLeft + borderLeft + textWidth;
    let top = inputRect.bottom + 2; // Small gap below the input

    // Adjust if going beyond viewport
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const suggestionsWidth = 200;
    const suggestionsHeight = 160;

    // Check if suggestions would go beyond right edge
    if (left + suggestionsWidth > viewportWidth) {
      left = inputRect.right - suggestionsWidth;
    }

    // Check if suggestions would go beyond bottom edge
    if (top + suggestionsHeight > viewportHeight) {
      // Show above the input
      top = inputRect.top - suggestionsHeight - 2;
    }

    return { top, left };
  }

  private static calculateTextareaCharPosition(
    textarea: HTMLTextAreaElement,
    startPos: number
  ): { top: number; left: number } {
    // Create a temporary div that exactly mimics the textarea
    const div = document.createElement('div');
    const style = window.getComputedStyle(textarea);

    // Copy all relevant styles exactly
    div.style.position = 'absolute';
    div.style.visibility = 'hidden';
    div.style.top = '0px';
    div.style.left = '0px';
    div.style.font = style.font;
    div.style.fontSize = style.fontSize;
    div.style.fontFamily = style.fontFamily;
    div.style.fontWeight = style.fontWeight;
    div.style.lineHeight = style.lineHeight;
    div.style.letterSpacing = style.letterSpacing;
    div.style.width = style.width;
    div.style.padding = style.padding;
    div.style.border = style.border;
    div.style.whiteSpace = 'pre-wrap';
    div.style.overflowWrap = 'break-word';

    // Add text up to # position
    const textBeforeCursor = textarea.value.slice(0, startPos);
    div.textContent = textBeforeCursor;

    document.body.appendChild(div);

    // Get the dimensions of the text content
    const divRect = div.getBoundingClientRect();

    // Add a span at the end to measure the exact cursor position
    const span = document.createElement('span');
    span.textContent = '|'; // Use a cursor character
    div.appendChild(span);

    const spanRect = span.getBoundingClientRect();
    const textareaRect = textarea.getBoundingClientRect();

    document.body.removeChild(div);

    // Calculate the relative position within the textarea
    const relativeLeft = spanRect.left - divRect.left;
    const relativeTop = spanRect.top - divRect.top;

    // Calculate final position in viewport
    let left = textareaRect.left + relativeLeft;
    let top = textareaRect.top + relativeTop + spanRect.height + 2; // Below the character

    // Adjust if going beyond viewport
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const suggestionsWidth = 200;
    const suggestionsHeight = 160;

    // Check if suggestions would go beyond right edge
    if (left + suggestionsWidth > viewportWidth) {
      left = textareaRect.right - suggestionsWidth;
    }

    // Check if suggestions would go beyond bottom edge
    if (top + suggestionsHeight > viewportHeight) {
      // Show above the character
      top = textareaRect.top + relativeTop - suggestionsHeight - 2;
    }

    return { top, left };
  }
}
