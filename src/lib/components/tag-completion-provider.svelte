<script lang="ts">
  import { tagStore } from '$lib/stores/tags.svelte';
  import type { Tag } from '$lib/types/task';
  import { Hash } from 'lucide-svelte';
  import type { Snippet } from 'svelte';

  interface Props {
    children: Snippet;
    ontagDetected?: (event: CustomEvent<{ tagName: string; position: number }>) => void;
    class?: string;
    enableColorDisplay?: boolean;
  }

  let { children, ontagDetected, class: className = '', enableColorDisplay = false }: Props = $props();

  // State for managing tag completion
  let showSuggestions = $state(false);
  let suggestions = $state<Tag[]>([]);
  let tagInputStart = $state(-1);
  let tagInputEnd = $state(-1);
  let currentTagInput = $state('');
  let suggestionsPosition = $state({ top: 0, left: 0 });
  let activeElement = $state<HTMLInputElement | HTMLTextAreaElement | null>(null);
  let coloredTags = $state<{ start: number; end: number; color: string; name: string }[]>([]);

  function cleanTagNameForDisplay(name: string): string {
    // For title/description: keep first #, remove other # and spaces
    const withoutSpaces = name.replace(/\s/g, '');
    if (withoutSpaces.startsWith('#')) {
      return '#' + withoutSpaces.slice(1).replace(/#/g, '');
    }
    return withoutSpaces.replace(/#/g, '');
  }

  function extractTagName(name: string): string {
    // Extract clean tag name for storage (remove all # and spaces)
    return name.replace(/[#\s]/g, '');
  }

  function updateColoredTags(element: HTMLInputElement | HTMLTextAreaElement, text: string) {
    if (!enableColorDisplay) {
      coloredTags = [];
      return;
    }

    const newColoredTags: { start: number; end: number; color: string; name: string }[] = [];

    // Find tag ranges: # followed by non-whitespace characters
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
            const tagName = text.slice(i + 1, tagEnd);
            const existingTag = tagStore.findTagByName(tagName);
            
            if (existingTag && existingTag.color) {
              newColoredTags.push({
                start: i,
                end: tagEnd,
                color: existingTag.color,
                name: tagName
              });
            }
          }
        }
      }
    }

    coloredTags = newColoredTags;
  }

  function calculateSuggestionsPosition(element: HTMLInputElement | HTMLTextAreaElement, startPos: number) {
    if (element.tagName === 'TEXTAREA') {
      return calculateTextareaCharPosition(element as HTMLTextAreaElement, startPos);
    } else {
      return calculateInputCharPosition(element as HTMLInputElement, startPos);
    }
  }

  function calculateInputCharPosition(input: HTMLInputElement, startPos: number) {
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

  function calculateTextareaCharPosition(textarea: HTMLTextAreaElement, startPos: number) {
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

  function checkForTagInput(element: HTMLInputElement | HTMLTextAreaElement, text: string, cursorPos: number) {
    // Update colored tags
    updateColoredTags(element, text);

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
      hideSuggestions();
      return;
    }


    tagInputStart = currentTagRange.start;
    tagInputEnd = currentTagRange.end;
    currentTagInput = currentTagRange.content;
    activeElement = element;

    // Show suggestions if we have at least 1 character after # OR cursor is in tag range
    if (currentTagInput.length >= 1) {
      suggestions = tagStore.searchTags(currentTagInput);
      // Always show suggestions when cursor is in tag range (for new tag creation)
      showSuggestions = true;


      // Calculate position for suggestions
      suggestionsPosition = calculateSuggestionsPosition(element, currentTagRange.start);
    } else if (currentTagInput.length === 0) {
      // Show suggestions even for empty tag input (just after #)
      suggestions = tagStore.searchTags('');
      showSuggestions = true;

      // Calculate position for suggestions
      suggestionsPosition = calculateSuggestionsPosition(element, currentTagRange.start);
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
    const beforeTag = activeElement.value.slice(0, tagInputStart);
    const afterTag = activeElement.value.slice(tagInputEnd);
    const newValue = beforeTag + displayTagName + ' ' + afterTag;

    // Update the element value
    activeElement.value = newValue;

    // Dispatch input event to notify parent component
    const inputEvent = new Event('input', { bubbles: true });
    activeElement.dispatchEvent(inputEvent);

    // Notify about tag detection
    ontagDetected?.(new CustomEvent('tagDetected', {
      detail: { tagName: tag.name, position: tagInputStart }
    }));

    // Set cursor position after the tag before hiding suggestions
    const newCursorPos = beforeTag.length + displayTagName.length + 1;
    if (activeElement) {
      activeElement.setSelectionRange(newCursorPos, newCursorPos);
    }

    hideSuggestions();
  }

  function createNewTag() {
    if (tagInputStart === -1 || !currentTagInput.trim() || !activeElement) return;

    const rawTagName = currentTagInput.trim();
    const displayTagName = cleanTagNameForDisplay('#' + rawTagName);
    const storeTagName = extractTagName(rawTagName);

    if (!storeTagName) {
      hideSuggestions();
      return;
    }

    const beforeTag = activeElement.value.slice(0, tagInputStart);
    const afterTag = activeElement.value.slice(tagInputEnd);
    const newValue = beforeTag + displayTagName + ' ' + afterTag;

    // Create the tag in the store
    const createdTag = tagStore.getOrCreateTag(storeTagName);
    if (!createdTag) return;

    // Update the element value
    activeElement.value = newValue;

    // Dispatch input event to notify parent component
    const inputEvent = new Event('input', { bubbles: true });
    activeElement.dispatchEvent(inputEvent);

    // Notify about tag detection
    ontagDetected?.(new CustomEvent('tagDetected', {
      detail: { tagName: storeTagName, position: tagInputStart }
    }));

    // Set cursor position after the tag before hiding suggestions
    const newCursorPos = beforeTag.length + displayTagName.length + 1;
    if (activeElement) {
      activeElement.setSelectionRange(newCursorPos, newCursorPos);
    }

    hideSuggestions();
  }

  function handleElementInput(event: Event) {
    const target = event.target as HTMLInputElement | HTMLTextAreaElement;
    if (!target) {
      return;
    }

    const cursorPos = target.selectionStart || 0;
    checkForTagInput(target, target.value, cursorPos);
  }

  function handleElementKeydown(event: Event) {
    const keyEvent = event as KeyboardEvent;
    if (keyEvent.key === 'Enter' && showSuggestions && tagInputStart !== -1) {
      keyEvent.preventDefault();
      if (suggestions.length > 0) {
        selectSuggestion(suggestions[0]);
      } else if (currentTagInput.trim()) {
        createNewTag();
      }
    } else if (keyEvent.key === 'Escape') {
      hideSuggestions();
    } else if (keyEvent.key === 'Tab' && showSuggestions && suggestions.length > 0) {
      keyEvent.preventDefault();
      selectSuggestion(suggestions[0]);
    }
  }

  function handleElementBlur() {
    // Delay hiding suggestions to allow clicking on them
    setTimeout(() => {
      hideSuggestions();
    }, 200);
  }

  // Set up event listeners on child elements
  let containerElement: HTMLDivElement;

  function setupEventListeners() {
    if (!containerElement) {
      return;
    }

    const textInputs = containerElement.querySelectorAll('input[type="text"], textarea, input[type="search"]');

    textInputs.forEach((element) => {
      const inputElement = element as HTMLInputElement | HTMLTextAreaElement;

      inputElement.addEventListener('input', handleElementInput);
      inputElement.addEventListener('keydown', handleElementKeydown);
      inputElement.addEventListener('blur', handleElementBlur);
    });
  }

  function cleanupEventListeners() {
    if (!containerElement) return;

    const textInputs = containerElement.querySelectorAll('input[type="text"], textarea, input[type="search"]');

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

  <!-- Tag color overlay -->
  {#if enableColorDisplay && coloredTags.length > 0 && activeElement}
    <div class="absolute inset-0 pointer-events-none z-10">
      {#each coloredTags as tag}
        <span
          class="absolute rounded px-1 text-transparent"
          style="background-color: {tag.color}; opacity: 0.3;"
        >
          #{tag.name}
        </span>
      {/each}
    </div>
  {/if}

  <!-- Suggestions dropdown -->
  {#if showSuggestions}
    <div
      class="fixed z-[9999] bg-white border border-gray-300 rounded-md shadow-lg max-h-40 overflow-y-auto min-w-48"
      style="top: {Math.max(0, suggestionsPosition.top)}px; left: {Math.max(0, suggestionsPosition.left)}px;"
    >
      <div class="px-2 py-1 text-xs text-muted-foreground">Debug: showing {suggestions.length} suggestions</div>
      {#each suggestions as suggestion (suggestion.id)}
        <button
          type="button"
          class="w-full px-3 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground flex items-center gap-2"
          onclick={() => selectSuggestion(suggestion)}
        >
          {#if suggestion.color}
            <div 
              class="w-3 h-3 rounded-sm border"
              style="background-color: {suggestion.color}"
            ></div>
          {:else}
            <Hash class="h-3 w-3" />
          {/if}
          {suggestion.name}
        </button>
      {/each}

      <!-- Show "Create new tag" option if input doesn't match any existing tag -->
      {#if currentTagInput.trim() && !suggestions.some(s => s.name.toLowerCase() === currentTagInput.toLowerCase())}
        <button
          type="button"
          class="w-full px-3 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground flex items-center gap-2 border-t border-border"
          onclick={createNewTag}
        >
          <Hash class="h-3 w-3" />
          Create "#{currentTagInput}"
        </button>
      {/if}
    </div>
  {/if}
</div>
