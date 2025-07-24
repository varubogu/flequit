<script lang="ts">
  import { tagStore } from '$lib/stores/tags.svelte';
  import type { Tag } from '$lib/types/task';
  import { Hash } from 'lucide-svelte';
  import type { Snippet } from 'svelte';

  interface Props {
    children: Snippet;
    ontagDetected?: (event: CustomEvent<{ tagName: string; position: number }>) => void;
    class?: string;
  }

  let { children, ontagDetected, class: className = '' }: Props = $props();

  // State for managing tag completion
  let showSuggestions = $state(false);
  let suggestions = $state<Tag[]>([]);
  let tagInputStart = $state(-1);
  let tagInputEnd = $state(-1);
  let currentTagInput = $state('');
  let suggestionsPosition = $state({ top: 0, left: 0 });
  let activeElement: HTMLInputElement | HTMLTextAreaElement | null = null;

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
    
    console.log('calculateInputCharPosition result:', { left, top, inputRect, textWidth, startPos });
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
    div.style.wordWrap = 'break-word';
    div.style.overflowWrap = style.overflowWrap;
    
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
    
    console.log('calculateTextareaCharPosition result:', { 
      left, top, relativeLeft, relativeTop, 
      spanRect, textareaRect, startPos 
    });
    return { top, left };
  }

  function checkForTagInput(element: HTMLInputElement | HTMLTextAreaElement, text: string, cursorPos: number) {
    console.log('TagCompletionProvider: checkForTagInput called', { text, cursorPos });
    
    // Find the last # before cursor position
    let hashPos = -1;
    for (let i = cursorPos - 1; i >= 0; i--) {
      if (text[i] === '#') {
        hashPos = i;
        break;
      }
      // Stop if we hit a space or newline
      if (text[i] === ' ' || text[i] === '\n') {
        break;
      }
    }

    console.log('TagCompletionProvider: hashPos =', hashPos);

    if (hashPos === -1) {
      hideSuggestions();
      return;
    }

    // Extract the tag input after #
    let tagEnd = cursorPos;
    for (let i = hashPos + 1; i < text.length; i++) {
      if (text[i] === ' ' || text[i] === '\n' || text[i] === '#') {
        tagEnd = i;
        break;
      }
    }

    tagInputStart = hashPos;
    tagInputEnd = tagEnd;
    currentTagInput = text.slice(hashPos + 1, tagEnd);
    activeElement = element;

    console.log('TagCompletionProvider: tag input detected', { tagInputStart, tagInputEnd, currentTagInput });

    // Show suggestions if we have at least 1 character after #
    if (currentTagInput.length >= 1) {
      suggestions = tagStore.searchTags(currentTagInput);
      showSuggestions = suggestions.length > 0;
      
      console.log('TagCompletionProvider: suggestions', { suggestions, showSuggestions });
      
      // Calculate position for suggestions
      if (showSuggestions) {
        suggestionsPosition = calculateSuggestionsPosition(element, hashPos);
        console.log('TagCompletionProvider: suggestionsPosition', suggestionsPosition);
      }
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
    
    hideSuggestions();
    
    // Set cursor position after the tag
    const newCursorPos = beforeTag.length + displayTagName.length + 1;
    activeElement.setSelectionRange(newCursorPos, newCursorPos);
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
    
    hideSuggestions();
    
    // Set cursor position after the tag
    const newCursorPos = beforeTag.length + displayTagName.length + 1;
    activeElement.setSelectionRange(newCursorPos, newCursorPos);
  }

  function handleElementInput(event: Event) {
    const target = event.target as HTMLInputElement | HTMLTextAreaElement;
    if (!target) {
      console.log('TagCompletionProvider: no target in handleElementInput');
      return;
    }
    
    console.log('TagCompletionProvider: handleElementInput called', target.value);
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
      console.log('TagCompletionProvider: no containerElement');
      return;
    }

    const textInputs = containerElement.querySelectorAll('input[type="text"], textarea, input[type="search"]');
    console.log('TagCompletionProvider: found text inputs:', textInputs.length);
    
    textInputs.forEach((element) => {
      const inputElement = element as HTMLInputElement | HTMLTextAreaElement;
      console.log('TagCompletionProvider: setting up listeners for', element.tagName, element.type);
      
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
  
  <!-- Suggestions dropdown -->
  {#if showSuggestions && (suggestions.length > 0 || currentTagInput.trim())}
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
          <Hash class="h-3 w-3" />
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