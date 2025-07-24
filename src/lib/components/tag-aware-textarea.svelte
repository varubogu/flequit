<script lang="ts">
  import { tagStore } from '$lib/stores/tags.svelte';
  import type { Tag } from '$lib/types/task';

  interface Props {
    value: string;
    placeholder?: string;
    class?: string;
    id?: string;
    oninput?: (event: CustomEvent<{ value: string }>) => void;
    ontagDetected?: (event: CustomEvent<{ tagName: string; position: number }>) => void;
  }

  let { 
    value = '', 
    placeholder = '', 
    class: className = '',
    id,
    oninput,
    ontagDetected
  }: Props = $props();

  let textareaElement: HTMLTextAreaElement;
  let showSuggestions = $state(false);
  let suggestions = $state<Tag[]>([]);
  let tagInputStart = $state(-1);
  let tagInputEnd = $state(-1);
  let currentTagInput = $state('');

  function cleanTagName(name: string): string {
    // Remove all # characters and spaces
    return name.replace(/[#\s]/g, '');
  }
  let suggestionsPosition = $state({ top: 0, left: 0 });

  function handleInput(event: Event) {
    const target = event.target as HTMLTextAreaElement;
    const newValue = target.value;
    const cursorPos = target.selectionStart || 0;
    
    oninput?.(new CustomEvent('input', { detail: { value: newValue } }));
    
    // Check for tag input (#)
    checkForTagInput(newValue, cursorPos);
  }

  function checkForTagInput(text: string, cursorPos: number) {
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

    if (hashPos === -1) {
      showSuggestions = false;
      tagInputStart = -1;
      tagInputEnd = -1;
      currentTagInput = '';
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

    // Calculate suggestion position
    if (textareaElement) {
      const rect = textareaElement.getBoundingClientRect();
      // Rough approximation - in a real implementation, you'd calculate precise cursor position
      suggestionsPosition = {
        top: rect.bottom + 4,
        left: rect.left
      };
    }

    // Show suggestions if we have at least 1 character after #
    if (currentTagInput.length >= 1) {
      suggestions = tagStore.searchTags(currentTagInput);
      showSuggestions = suggestions.length > 0;
    } else {
      showSuggestions = false;
    }
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter' && showSuggestions && tagInputStart !== -1) {
      event.preventDefault();
      if (suggestions.length > 0) {
        selectSuggestion(suggestions[0]);
      } else if (currentTagInput.trim()) {
        createNewTag();
      }
    } else if (event.key === 'Escape') {
      showSuggestions = false;
    } else if (event.key === 'Tab' && showSuggestions && suggestions.length > 0) {
      event.preventDefault();
      selectSuggestion(suggestions[0]);
    }
  }

  function selectSuggestion(tag: Tag) {
    if (tagInputStart === -1) return;
    
    const cleanedTagName = cleanTagName(tag.name);
    const beforeTag = value.slice(0, tagInputStart);
    const afterTag = value.slice(tagInputEnd);
    const newValue = beforeTag + cleanedTagName + ' ' + afterTag;
    
    oninput?.(new CustomEvent('input', { detail: { value: newValue } }));
    ontagDetected?.(new CustomEvent('tagDetected', { detail: { tagName: cleanedTagName, position: tagInputStart } }));
    
    showSuggestions = false;
    tagInputStart = -1;
    tagInputEnd = -1;
  }

  function createNewTag() {
    if (tagInputStart === -1 || !currentTagInput.trim()) return;
    
    const rawTagName = currentTagInput.trim();
    const cleanedTagName = cleanTagName(rawTagName);
    
    if (!cleanedTagName) {
      showSuggestions = false;
      tagInputStart = -1;
      tagInputEnd = -1;
      return;
    }
    
    const beforeTag = value.slice(0, tagInputStart);
    const afterTag = value.slice(tagInputEnd);
    const newValue = beforeTag + cleanedTagName + ' ' + afterTag;
    
    // Create the tag in the store
    const createdTag = tagStore.getOrCreateTag(cleanedTagName);
    if (!createdTag) return;
    
    oninput?.(new CustomEvent('input', { detail: { value: newValue } }));
    ontagDetected?.(new CustomEvent('tagDetected', { detail: { tagName: cleanedTagName, position: tagInputStart } }));
    
    showSuggestions = false;
    tagInputStart = -1;
    tagInputEnd = -1;
  }

  function handleFocus() {
    if (currentTagInput.length >= 1) {
      showSuggestions = suggestions.length > 0;
    }
  }

  function handleBlur() {
    // Delay hiding suggestions to allow clicking on them
    setTimeout(() => {
      showSuggestions = false;
    }, 200);
  }
</script>

<div class="relative">
  <textarea
    bind:this={textareaElement}
    {id}
    {value}
    {placeholder}
    class={`flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
    oninput={handleInput}
    onkeydown={handleKeydown}
    onfocus={handleFocus}
    onblur={handleBlur}
  ></textarea>

  <!-- Suggestions dropdown -->
  {#if showSuggestions && (suggestions.length > 0 || currentTagInput.trim())}
    <div 
      class="fixed z-50 bg-popover border border-border rounded-md shadow-lg max-h-40 overflow-y-auto min-w-48"
      style="top: {suggestionsPosition.top}px; left: {suggestionsPosition.left}px;"
    >
      {#each suggestions as suggestion (suggestion.id)}
        <button
          type="button"
          class="w-full px-3 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground flex items-center gap-2"
          onclick={() => selectSuggestion(suggestion)}
        >
          #{suggestion.name}
        </button>
      {/each}
      
      <!-- Show "Create new tag" option if input doesn't match any existing tag -->
      {#if currentTagInput.trim() && !suggestions.some(s => s.name.toLowerCase() === currentTagInput.toLowerCase())}
        <button
          type="button"
          class="w-full px-3 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground flex items-center gap-2 border-t border-border"
          onclick={createNewTag}
        >
          Create "#{currentTagInput}"
        </button>
      {/if}
    </div>
  {/if}
</div>