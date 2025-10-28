import { tagStore } from '$lib/stores/tags.svelte';
import type { Tag } from '$lib/types/tag';
import { TagCompletionPosition } from '$lib/components/tag/completion/tag-completion-position.svelte';
import { TagNameUtils } from '$lib/components/tag/utils/tag-name-utils.svelte';
import { TagParser } from '$lib/components/tag/utils/tag-parser.svelte';
import { TagElementUpdater } from '$lib/components/tag/utils/tag-element-updater.svelte';
import type { TagDetectionData } from '$lib/components/tag/utils/tag-element-updater.svelte';

/**
 * Tag completion state and logic
 *
 * Responsibilities:
 * - Manage completion state (suggestions, position, active element)
 * - Detect tag input and update suggestions
 * - Handle tag selection and creation
 */
export class TagCompletionState {
  showSuggestions = $state(false);
  suggestions = $state<Tag[]>([]);
  tagInputStart = $state(-1);
  tagInputEnd = $state(-1);
  currentTagInput = $state('');
  suggestionsPosition = $state({ top: 0, left: 0 });
  activeElement = $state<HTMLInputElement | HTMLTextAreaElement | null>(null);

  private projectId?: string;
  private ontagDetected?: (event: CustomEvent<TagDetectionData>) => void;

  constructor(projectId?: string, ontagDetected?: (event: CustomEvent<TagDetectionData>) => void) {
    this.projectId = projectId;
    this.ontagDetected = ontagDetected;
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

    TagElementUpdater.notifyTagDetection(this.ontagDetected, tag.name, this.tagInputStart);

    this.hideSuggestions();
  }

  async createNewTag() {
    if (this.tagInputStart === -1 || !this.currentTagInput.trim() || !this.activeElement) return;

    const rawTagName = this.currentTagInput.trim();
    const displayTagName = TagNameUtils.cleanTagNameForDisplay('#' + rawTagName);
    const storeTagName = TagNameUtils.extractTagName(rawTagName);

    if (!storeTagName) {
      this.hideSuggestions();
      return;
    }

    if (!this.projectId) {
      console.warn('プロジェクトIDが不明のためタグを作成できません');
      return;
    }

    const createdTag = await tagStore.getOrCreateTagWithProject(storeTagName, this.projectId);
    if (!createdTag) return;

    TagElementUpdater.updateElementWithTag(
      this.activeElement,
      this.tagInputStart,
      this.tagInputEnd,
      displayTagName
    );

    TagElementUpdater.notifyTagDetection(this.ontagDetected, storeTagName, this.tagInputStart);

    this.hideSuggestions();
  }

  // Getter methods for key handler
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
}

/**
 * Create tag completion state
 */
export function useTagCompletion(
  projectId?: string,
  ontagDetected?: (event: CustomEvent<TagDetectionData>) => void
) {
  return new TagCompletionState(projectId, ontagDetected);
}
