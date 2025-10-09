<script lang="ts">
  import type { Snippet } from 'svelte';
  import { TagCompletionKeyHandler, type KeyHandlerCallbacks } from './tag-completion-keyhandler.svelte';
  import { useTagCompletion } from './use-tag-completion.svelte';
  import type { TagDetectionData } from '../utils/tag-element-updater.svelte';
  import TagCompletionUI from './tag-completion-ui.svelte';

  interface Props {
    children: Snippet;
    ontagDetected?: (event: CustomEvent<TagDetectionData>) => void;
    projectId?: string;
    class?: string;
  }

  let { children, ontagDetected, projectId, class: className = '' }: Props = $props();

  // Create tag completion state
  const completion = useTagCompletion(projectId, ontagDetected);

  // Helper classes
  const keyHandlerCallbacks: KeyHandlerCallbacks = {
    getCurrentSuggestions: () => completion.getCurrentSuggestions(),
    getCurrentTagInput: () => completion.getCurrentTagInput(),
    isShowingSuggestions: () => completion.isShowingSuggestions(),
    isInTagInput: () => completion.isInTagInput(),
    selectSuggestion: (tag) => completion.selectSuggestion(tag),
    createNewTag: () => completion.createNewTag(),
    hideSuggestions: () => completion.hideSuggestions()
  };
  const keyHandler = new TagCompletionKeyHandler(keyHandlerCallbacks);

  // Set up event listeners on child elements
  let containerElement: HTMLDivElement;

  // Event handlers
  function handleElementInput(event: Event) {
    const target = event.target as HTMLInputElement | HTMLTextAreaElement;
    if (!target) return;

    const cursorPos = target.selectionStart || 0;
    completion.checkForTagInput(target, target.value, cursorPos);
  }

  function handleElementKeydown(event: Event) {
    const keyEvent = event as KeyboardEvent;
    keyHandler.handleKeydown(keyEvent);
  }

  function handleElementBlur() {
    // Delay hiding suggestions to allow clicking on them
    setTimeout(() => {
      completion.hideSuggestions();
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
    showSuggestions={completion.showSuggestions}
    suggestions={completion.suggestions}
    currentTagInput={completion.currentTagInput}
    suggestionsPosition={completion.suggestionsPosition}
    onSelectSuggestion={(tag) => completion.selectSuggestion(tag)}
    onCreateNewTag={() => completion.createNewTag()}
  />
</div>
