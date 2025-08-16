import { tagStore } from '$lib/stores/tags.svelte';
import type { Tag } from "$lib/types/tag";
import { TagCompletionPosition } from './tag-completion-position.svelte';
import {
  TagCompletionKeyHandler,
  type KeyHandlerCallbacks
} from './tag-completion-keyhandler.svelte';
import { TagNameUtils } from '../utils/tag-name-utils.svelte';
import { TagParser } from '../utils/tag-parser.svelte';
import { TagElementUpdater, type TagDetectionData } from '../utils/tag-element-updater.svelte';

export { type TagDetectionData } from '../utils/tag-element-updater.svelte';

/**
 * Main logic class for tag completion functionality
 * Coordinates between different specialized components
 */
export class TagCompletionLogic implements KeyHandlerCallbacks {
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

  /**
   * Main tag input detection logic
   */
  checkForTagInput(
    element: HTMLInputElement | HTMLTextAreaElement,
    text: string,
    cursorPos: number
  ) {
    const tagRanges = TagParser.findTagRanges(text);
    const currentTagRange = TagParser.findCurrentTagRange(tagRanges, cursorPos);

    if (!currentTagRange) {
      this.hideSuggestions();
      return;
    }

    this.updateTagInputState(element, currentTagRange);
    this.updateSuggestions(element, currentTagRange);
  }

  private updateTagInputState(
    element: HTMLInputElement | HTMLTextAreaElement,
    tagRange: { start: number; end: number; content: string }
  ) {
    this.tagInputStart = tagRange.start;
    this.tagInputEnd = tagRange.end;
    this.currentTagInput = tagRange.content;
    this.activeElement = element;
  }

  private updateSuggestions(
    element: HTMLInputElement | HTMLTextAreaElement,
    tagRange: { start: number; end: number; content: string }
  ) {
    // Show suggestions for any tag input (even empty)
    if (this.currentTagInput.length >= 0) {
      this.suggestions = tagStore.searchTags(this.currentTagInput);
      this.showSuggestions = true;

      // Calculate position for suggestions
      this.suggestionsPosition = TagCompletionPosition.calculateSuggestionsPosition(
        element,
        tagRange.start
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

    TagElementUpdater.updateElementWithTag(
      this.activeElement,
      this.tagInputStart,
      this.tagInputEnd,
      displayTagName
    );

    TagElementUpdater.notifyTagDetection(this.onTagDetected, tag.name, this.tagInputStart);

    this.hideSuggestions();
  }

  createNewTag() {
    if (this.tagInputStart === -1 || !this.currentTagInput.trim() || !this.activeElement) return;

    const rawTagName = this.currentTagInput.trim();
    const displayTagName = TagNameUtils.cleanTagNameForDisplay('#' + rawTagName);
    const storeTagName = TagNameUtils.extractTagName(rawTagName);

    if (!storeTagName) {
      this.hideSuggestions();
      return;
    }

    // Create the tag in the store
    const createdTag = tagStore.getOrCreateTag(storeTagName);
    if (!createdTag) return;

    TagElementUpdater.updateElementWithTag(
      this.activeElement,
      this.tagInputStart,
      this.tagInputEnd,
      displayTagName
    );

    TagElementUpdater.notifyTagDetection(this.onTagDetected, storeTagName, this.tagInputStart);

    this.hideSuggestions();
  }

  // Event handlers
  handleElementInput(event: Event) {
    const target = event.target as HTMLInputElement | HTMLTextAreaElement;
    if (!target) return;

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
