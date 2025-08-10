<script lang="ts">
  import type { Snippet } from 'svelte';
  import { TagCompletionLogic, type TagDetectionData } from './tag-completion-logic.svelte';
  import TagCompletionUI from './tag-completion-ui.svelte';

  interface Props {
    children: Snippet;
    ontagDetected?: (event: CustomEvent<TagDetectionData>) => void;
    class?: string;
  }

  let { children, ontagDetected, class: className = '' }: Props = $props();

  // Initialize logic with tag detection callback
  const logic = new TagCompletionLogic(ontagDetected);

  // Set up event listeners on child elements
  let containerElement: HTMLDivElement;

  function setupEventListeners() {
    if (!containerElement) {
      return;
    }

    const textInputs = containerElement.querySelectorAll(
      'input[type="text"], textarea, input[type="search"]'
    );

    textInputs.forEach((element) => {
      const inputElement = element as HTMLInputElement | HTMLTextAreaElement;

      inputElement.addEventListener('input', logic.handleElementInput.bind(logic));
      inputElement.addEventListener('keydown', logic.handleElementKeydown.bind(logic));
      inputElement.addEventListener('blur', logic.handleElementBlur.bind(logic));
    });
  }

  function cleanupEventListeners() {
    if (!containerElement) return;

    const textInputs = containerElement.querySelectorAll(
      'input[type="text"], textarea, input[type="search"]'
    );

    textInputs.forEach((element) => {
      const inputElement = element as HTMLInputElement | HTMLTextAreaElement;

      inputElement.removeEventListener('input', logic.handleElementInput.bind(logic));
      inputElement.removeEventListener('keydown', logic.handleElementKeydown.bind(logic));
      inputElement.removeEventListener('blur', logic.handleElementBlur.bind(logic));
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
    showSuggestions={logic.showSuggestions}
    suggestions={logic.suggestions}
    currentTagInput={logic.currentTagInput}
    suggestionsPosition={logic.suggestionsPosition}
    onSelectSuggestion={logic.selectSuggestion.bind(logic)}
    onCreateNewTag={logic.createNewTag.bind(logic)}
  />
</div>
