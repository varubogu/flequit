import { tagStore } from '$lib/stores/tags.svelte';
import type { Tag } from '$lib/types/task';
import { TagCompletionPosition } from './tag-completion-position.svelte';
import {
  TagCompletionKeyHandler,
  type KeyHandlerCallbacks
} from './tag-completion-keyhandler.svelte';

export interface TagDetectionData {
  tagName: string;
  position: number;
}

export class TagCompletionCoreLogic implements KeyHandlerCallbacks {
  // State for managing tag completion
  showSuggestions = $state(false);
  suggestions = $state<Tag[]>([]);
  tagInputStart = $state(-1);
  tagInputEnd = $state(-1);
  currentTagInput = $state('');
  suggestionsPosition = $state({ top: 0, left: 0 });
  activeElement = $state<HTMLInputElement | HTMLTextAreaElement | null>(null);

  private onTagDetected?: (event: CustomEvent<TagDetectionData>) => void;
  private keyHandler: TagCompletionKeyHandler;

  constructor(onTagDetected?: (event: CustomEvent<TagDetectionData>) => void) {
    this.onTagDetected = onTagDetected;
    this.keyHandler = new TagCompletionKeyHandler(this);
  }

  // KeyHandlerCallbacks implementation
  getCurrentSuggestions(): Tag[] {
    return this.suggestions;
  }

  getCurrentTagInput(): string {
    return this.currentTagInput;
  }

  isShowingSuggestions(): boolean {
    return this.showSuggestions;
  }

  isInTagInput(): boolean {
    return this.tagInputStart !== -1;
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
      this.suggestionsPosition = TagCompletionPosition.calculateSuggestionsPosition(
        element,
        currentTagRange.start
      );
    } else if (this.currentTagInput.length === 0) {
      // Show suggestions even for empty tag input (just after #)
      this.suggestions = tagStore.searchTags('');
      this.showSuggestions = true;

      // Calculate position for suggestions
      this.suggestionsPosition = TagCompletionPosition.calculateSuggestionsPosition(
        element,
        currentTagRange.start
      );
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
    this.keyHandler.handleKeydown(keyEvent);
  }

  handleElementBlur() {
    // Delay hiding suggestions to allow clicking on them
    setTimeout(() => {
      this.hideSuggestions();
    }, 200);
  }
}
