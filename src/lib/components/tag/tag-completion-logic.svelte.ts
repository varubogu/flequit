import { tagStore } from '$lib/stores/tags.svelte';
import type { Tag } from '$lib/types/task';

export interface TagDetectionData {
  tagName: string;
  position: number;
}

export class TagCompletionLogic {
  // State for managing tag completion
  showSuggestions = $state(false);
  suggestions = $state<Tag[]>([]);
  tagInputStart = $state(-1);
  tagInputEnd = $state(-1);
  currentTagInput = $state('');
  suggestionsPosition = $state({ top: 0, left: 0 });
  activeElement = $state<HTMLInputElement | HTMLTextAreaElement | null>(null);

  private onTagDetected?: (event: CustomEvent<TagDetectionData>) => void;

  constructor(onTagDetected?: (event: CustomEvent<TagDetectionData>) => void) {
    this.onTagDetected = onTagDetected;
  }

  // Utility functions for tag name processing
  cleanTagNameForDisplay(name: string): string {
    // For title/description: keep first #, remove other # and spaces
    const withoutSpaces = name.replace(/\s/g, '');
    if (withoutSpaces.startsWith('#')) {
      return '#' + withoutSpaces.slice(1).replace(/#/g, '');
    }
    return withoutSpaces.replace(/#/g, '');
  }

  extractTagName(name: string): string {
    // Extract clean tag name for storage (remove all # and spaces)
    return name.replace(/[#\s]/g, '');
  }

  // Position calculation functions
  calculateSuggestionsPosition(element: HTMLInputElement | HTMLTextAreaElement, startPos: number) {
    if (element.tagName === 'TEXTAREA') {
      return this.calculateTextareaCharPosition(element as HTMLTextAreaElement, startPos);
    } else {
      return this.calculateInputCharPosition(element as HTMLInputElement, startPos);
    }
  }

  private calculateInputCharPosition(input: HTMLInputElement, startPos: number) {
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

  private calculateTextareaCharPosition(textarea: HTMLTextAreaElement, startPos: number) {
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

  // Tag detection logic
  checkForTagInput(
    element: HTMLInputElement | HTMLTextAreaElement,
    text: string,
    cursorPos: number
  ) {
    // Find tag ranges: # followed by non-whitespace characters
    const tagRanges: { start: number; end: number; content: string }[] = [];

    for (let i = 0; i < text.length; i++) {
      if (text[i] === '#') {
        // Check if this # is at the start or preceded by whitespace
        const isValidTagStart = i === 0 || /[\s\n\t]/.test(text[i - 1]);

        if (isValidTagStart) {
          // Find the end of this tag (until whitespace, newline, tab, or end of string)
          let tagEnd = i + 1;
          while (tagEnd < text.length && !/[\s\n\t]/.test(text[tagEnd])) {
            tagEnd++;
          }

          // Only consider it a tag if there's content after #
          if (tagEnd > i + 1) {
            tagRanges.push({
              start: i,
              end: tagEnd,
              content: text.slice(i + 1, tagEnd)
            });
          }
        }
      }
    }

    // Check if cursor is within any tag range
    let currentTagRange = null;
    for (const range of tagRanges) {
      if (cursorPos >= range.start && cursorPos <= range.end) {
        currentTagRange = range;
        break;
      }
    }

    if (!currentTagRange) {
      this.hideSuggestions();
      return;
    }

    this.tagInputStart = currentTagRange.start;
    this.tagInputEnd = currentTagRange.end;
    this.currentTagInput = currentTagRange.content;
    this.activeElement = element;

    // Show suggestions if we have at least 1 character after # OR cursor is in tag range
    if (this.currentTagInput.length >= 1) {
      this.suggestions = tagStore.searchTags(this.currentTagInput);
      // Always show suggestions when cursor is in tag range (for new tag creation)
      this.showSuggestions = true;

      // Calculate position for suggestions
      this.suggestionsPosition = this.calculateSuggestionsPosition(element, currentTagRange.start);
    } else if (this.currentTagInput.length === 0) {
      // Show suggestions even for empty tag input (just after #)
      this.suggestions = tagStore.searchTags('');
      this.showSuggestions = true;

      // Calculate position for suggestions
      this.suggestionsPosition = this.calculateSuggestionsPosition(element, currentTagRange.start);
    } else {
      this.hideSuggestions();
    }
  }

  hideSuggestions() {
    this.showSuggestions = false;
    this.tagInputStart = -1;
    this.tagInputEnd = -1;
    this.currentTagInput = '';
    this.activeElement = null;
  }

  selectSuggestion(tag: Tag) {
    if (this.tagInputStart === -1 || !this.activeElement) return;

    const displayTagName = '#' + tag.name;
    const beforeTag = this.activeElement.value.slice(0, this.tagInputStart);
    const afterTag = this.activeElement.value.slice(this.tagInputEnd);
    const newValue = beforeTag + displayTagName + ' ' + afterTag;

    // Update the element value
    this.activeElement.value = newValue;

    // Dispatch input event to notify parent component
    const inputEvent = new Event('input', { bubbles: true });
    this.activeElement.dispatchEvent(inputEvent);

    // Notify about tag detection
    this.onTagDetected?.(
      new CustomEvent('tagDetected', {
        detail: { tagName: tag.name, position: this.tagInputStart }
      })
    );

    // Set cursor position after the tag before hiding suggestions
    const newCursorPos = beforeTag.length + displayTagName.length + 1;
    if (this.activeElement) {
      this.activeElement.setSelectionRange(newCursorPos, newCursorPos);
    }

    this.hideSuggestions();
  }

  createNewTag() {
    if (this.tagInputStart === -1 || !this.currentTagInput.trim() || !this.activeElement) return;

    const rawTagName = this.currentTagInput.trim();
    const displayTagName = this.cleanTagNameForDisplay('#' + rawTagName);
    const storeTagName = this.extractTagName(rawTagName);

    if (!storeTagName) {
      this.hideSuggestions();
      return;
    }

    const beforeTag = this.activeElement.value.slice(0, this.tagInputStart);
    const afterTag = this.activeElement.value.slice(this.tagInputEnd);
    const newValue = beforeTag + displayTagName + ' ' + afterTag;

    // Create the tag in the store
    const createdTag = tagStore.getOrCreateTag(storeTagName);
    if (!createdTag) return;

    // Update the element value
    this.activeElement.value = newValue;

    // Dispatch input event to notify parent component
    const inputEvent = new Event('input', { bubbles: true });
    this.activeElement.dispatchEvent(inputEvent);

    // Notify about tag detection
    this.onTagDetected?.(
      new CustomEvent('tagDetected', {
        detail: { tagName: storeTagName, position: this.tagInputStart }
      })
    );

    // Set cursor position after the tag before hiding suggestions
    const newCursorPos = beforeTag.length + displayTagName.length + 1;
    if (this.activeElement) {
      this.activeElement.setSelectionRange(newCursorPos, newCursorPos);
    }

    this.hideSuggestions();
  }

  // Event handlers
  handleElementInput(event: Event) {
    const target = event.target as HTMLInputElement | HTMLTextAreaElement;
    if (!target) {
      return;
    }

    const cursorPos = target.selectionStart || 0;
    this.checkForTagInput(target, target.value, cursorPos);
  }

  handleElementKeydown(event: Event) {
    const keyEvent = event as KeyboardEvent;
    if (keyEvent.key === 'Enter' && this.showSuggestions && this.tagInputStart !== -1) {
      keyEvent.preventDefault();
      if (this.suggestions.length > 0) {
        this.selectSuggestion(this.suggestions[0]);
      } else if (this.currentTagInput.trim()) {
        this.createNewTag();
      }
    } else if (keyEvent.key === 'Escape') {
      this.hideSuggestions();
    } else if (keyEvent.key === 'Tab' && this.showSuggestions && this.suggestions.length > 0) {
      keyEvent.preventDefault();
      this.selectSuggestion(this.suggestions[0]);
    }
  }

  handleElementBlur() {
    // Delay hiding suggestions to allow clicking on them
    setTimeout(() => {
      this.hideSuggestions();
    }, 200);
  }
}
