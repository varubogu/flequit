<script lang="ts">
  import type { Snippet } from 'svelte';
  import { tagStore } from '$lib/stores/tags.svelte';
  import type { Tag } from '$lib/types/tag';
  import { TagCompletionPosition } from './tag-completion-position.svelte';
  import {
    TagCompletionKeyHandler,
    type KeyHandlerCallbacks
  } from './tag-completion-keyhandler.svelte';
  import { TagNameUtils } from '../utils/tag-name-utils.svelte';
  import { TagParser } from '../utils/tag-parser.svelte';
  import { TagElementUpdater } from '../utils/tag-element-updater.svelte';
  import type { TagDetectionData } from '../utils/tag-element-updater.svelte';
  import TagCompletionUI from './tag-completion-ui.svelte';

  interface Props {
    children: Snippet;
    ontagDetected?: (event: CustomEvent<TagDetectionData>) => void;
    projectId?: string;
    class?: string;
  }

  let { children, ontagDetected, projectId, class: className = '' }: Props = $props();

  // State for managing tag completion
  let showSuggestions = $state(false);
  let suggestions = $state<Tag[]>([]);
  let tagInputStart = $state(-1);
  let tagInputEnd = $state(-1);
  let currentTagInput = $state('');
  let suggestionsPosition = $state({ top: 0, left: 0 });
  let activeElement = $state<HTMLInputElement | HTMLTextAreaElement | null>(null);

  // Helper classes
  const keyHandlerCallbacks: KeyHandlerCallbacks = {
    getCurrentSuggestions: () => suggestions,
    getCurrentTagInput: () => currentTagInput,
    isShowingSuggestions: () => showSuggestions,
    isInTagInput: () => tagInputStart !== -1,
    selectSuggestion,
    createNewTag,
    hideSuggestions
  };
  const keyHandler = new TagCompletionKeyHandler(keyHandlerCallbacks);

  // Set up event listeners on child elements
  let containerElement: HTMLDivElement;

  /**
   * Main tag input detection logic
   */
  function checkForTagInput(
    element: HTMLInputElement | HTMLTextAreaElement,
    text: string,
    cursorPos: number
  ) {
    const tagRanges = TagParser.findTagRanges(text);
    const currentTagRange = TagParser.findCurrentTagRange(tagRanges, cursorPos);

    if (!currentTagRange) {
      hideSuggestions();
      return;
    }

    updateTagInputState(element, currentTagRange);
    updateSuggestions(element, currentTagRange);
  }

  function updateTagInputState(
    element: HTMLInputElement | HTMLTextAreaElement,
    tagRange: { start: number; end: number; content: string }
  ) {
    tagInputStart = tagRange.start;
    tagInputEnd = tagRange.end;
    currentTagInput = tagRange.content;
    activeElement = element;
  }

  function updateSuggestions(
    element: HTMLInputElement | HTMLTextAreaElement,
    tagRange: { start: number; end: number; content: string }
  ) {
    // Show suggestions for any tag input (even empty)
    if (currentTagInput.length >= 0) {
      suggestions = tagStore.searchTags(currentTagInput);
      showSuggestions = true;

      // Calculate position for suggestions
      suggestionsPosition = TagCompletionPosition.calculateSuggestionsPosition(
        element,
        tagRange.start
      );
    } else {
      hideSuggestions();
    }
  }

  function hideSuggestions() {
    showSuggestions = false;
    tagInputStart = -1;
    tagInputEnd = -1;
    currentTagInput = '';
    activeElement = null;
  }

  function selectSuggestion(tag: Tag) {
    if (tagInputStart === -1 || !activeElement) return;

    const displayTagName = '#' + tag.name;

    TagElementUpdater.updateElementWithTag(
      activeElement,
      tagInputStart,
      tagInputEnd,
      displayTagName
    );

    TagElementUpdater.notifyTagDetection(ontagDetected, tag.name, tagInputStart);

    hideSuggestions();
  }

  function createNewTag() {
    if (tagInputStart === -1 || !currentTagInput.trim() || !activeElement) return;

    const rawTagName = currentTagInput.trim();
    const displayTagName = TagNameUtils.cleanTagNameForDisplay('#' + rawTagName);
    const storeTagName = TagNameUtils.extractTagName(rawTagName);

    if (!storeTagName) {
      hideSuggestions();
      return;
    }

    // Create the tag in the store with project ID if available
    const createdTag = projectId
      ? tagStore.getOrCreateTagWithProject(storeTagName, projectId)
      : tagStore.getOrCreateTag(storeTagName);
    if (!createdTag) return;

    TagElementUpdater.updateElementWithTag(
      activeElement,
      tagInputStart,
      tagInputEnd,
      displayTagName
    );

    TagElementUpdater.notifyTagDetection(ontagDetected, storeTagName, tagInputStart);

    hideSuggestions();
  }

  // Event handlers
  function handleElementInput(event: Event) {
    const target = event.target as HTMLInputElement | HTMLTextAreaElement;
    if (!target) return;

    const cursorPos = target.selectionStart || 0;
    checkForTagInput(target, target.value, cursorPos);
  }

  function handleElementKeydown(event: Event) {
    const keyEvent = event as KeyboardEvent;
    keyHandler.handleKeydown(keyEvent);
  }

  function handleElementBlur() {
    // Delay hiding suggestions to allow clicking on them
    setTimeout(() => {
      hideSuggestions();
    }, 200);
  }

  function setupEventListeners() {
    if (!containerElement) {
      return;
    }

    const textInputs = containerElement.querySelectorAll(
      'input[type="text"], textarea, input[type="search"]'
    );

    textInputs.forEach((element) => {
      const inputElement = element as HTMLInputElement | HTMLTextAreaElement;

      inputElement.addEventListener('input', handleElementInput);
      inputElement.addEventListener('keydown', handleElementKeydown);
      inputElement.addEventListener('blur', handleElementBlur);
    });
  }

  function cleanupEventListeners() {
    if (!containerElement) return;

    const textInputs = containerElement.querySelectorAll(
      'input[type="text"], textarea, input[type="search"]'
    );

    textInputs.forEach((element) => {
      const inputElement = element as HTMLInputElement | HTMLTextAreaElement;

      inputElement.removeEventListener('input', handleElementInput);
      inputElement.removeEventListener('keydown', handleElementKeydown);
      inputElement.removeEventListener('blur', handleElementBlur);
    });
  }

  $effect(() => {
    setupEventListeners();

    return () => {
      cleanupEventListeners();
    };
  });
</script>

<div bind:this={containerElement} class="relative {className}">
  {@render children()}

  <!-- Suggestions dropdown -->
  <TagCompletionUI
    {showSuggestions}
    {suggestions}
    {currentTagInput}
    {suggestionsPosition}
    onSelectSuggestion={selectSuggestion}
    onCreateNewTag={createNewTag}
  />
</div>
