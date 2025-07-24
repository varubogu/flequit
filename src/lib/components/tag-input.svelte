<script lang="ts">
  import { tagStore } from '$lib/stores/tags.svelte';
  import type { Tag } from '$lib/types/task';
  import Button from '$lib/components/button.svelte';
  import { X, Hash } from 'lucide-svelte';
  import { createEventDispatcher } from 'svelte';

  interface Props {
    tags: Tag[];
    placeholder?: string;
    class?: string;
  }

  let { tags = [], placeholder = "Add tags...", class: className = "" }: Props = $props();

  const dispatch = createEventDispatcher<{
    tagAdded: { tagName: string };
    tagRemoved: { tagId: string };
  }>();

  let inputValue = $state('');
  let inputElement: HTMLInputElement;

  // Derived state for suggestions
  let filteredSuggestions = $derived.by(() => {
    if (inputValue.length >= 1) {
      return tagStore.searchTags(inputValue);
    }
    return [];
  });

  let shouldShowSuggestions = $derived.by(() => {
    return inputValue.length >= 1 && filteredSuggestions.length > 0;
  });

  function cleanTagName(name: string): string {
    // Remove all # characters and spaces
    return name.replace(/[#\s]/g, '');
  }

  function handleInput(event: Event) {
    const target = event.target as HTMLInputElement;
    inputValue = target.value;
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      addTag();
    } else if (event.key === 'Escape') {
      inputElement.blur();
    } else if (event.key === 'ArrowDown' && showSuggestions) {
      event.preventDefault();
      // Focus first suggestion (to be implemented)
    }
  }

  function addTag(tagName?: string) {
    const rawName = (tagName || inputValue).trim();
    const cleanedName = cleanTagName(rawName);
    
    if (!cleanedName) {
      inputValue = '';
      showSuggestions = false;
      return;
    }

    // Check if tag already exists on this task
    if (tags.some(tag => tag.name.toLowerCase() === cleanedName.toLowerCase())) {
      inputValue = '';
      showSuggestions = false;
      return;
    }

    dispatch('tagAdded', { tagName: cleanedName });
    inputValue = '';
    showSuggestions = false;
  }

  function selectSuggestion(tag: Tag) {
    addTag(tag.name);
  }

  function removeTag(tagId: string) {
    dispatch('tagRemoved', { tagId });
  }

  let showSuggestions = $state(false);

  function handleFocus() {
    if (inputValue.length >= 1 && filteredSuggestions.length > 0) {
      showSuggestions = true;
    }
  }

  function handleBlur() {
    // Delay hiding suggestions to allow clicking on them
    setTimeout(() => {
      showSuggestions = false;
    }, 200);
  }
</script>

<div class="relative {className}">
  <!-- Tag display -->
  {#if tags.length > 0}
    <div class="flex flex-wrap gap-1 mb-2">
      {#each tags as tag (tag.id)}
        <span class="inline-flex items-center gap-1 px-2 py-1 text-xs bg-secondary text-secondary-foreground rounded-md">
          <Hash class="h-3 w-3" />
          {tag.name}
          <Button
            variant="ghost"
            size="icon"
            class="h-3 w-3 p-0 hover:bg-secondary-foreground/20"
            onclick={() => removeTag(tag.id)}
          >
            <X class="h-2 w-2" />
          </Button>
        </span>
      {/each}
    </div>
  {/if}

  <!-- Input field -->
  <div class="relative">
    <input
      bind:this={inputElement}
      type="text"
      value={inputValue}
      {placeholder}
      class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
      oninput={handleInput}
      onkeydown={handleKeydown}
      onfocus={handleFocus}
      onblur={handleBlur}
    />

    <!-- Suggestions dropdown -->
    {#if showSuggestions && filteredSuggestions.length > 0}
      <div class="absolute top-full left-0 right-0 z-50 mt-1 bg-popover border border-border rounded-md shadow-lg max-h-40 overflow-y-auto">
        {#each filteredSuggestions as suggestion (suggestion.id)}
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
        {#if inputValue && !filteredSuggestions.some(s => s.name.toLowerCase() === inputValue.toLowerCase())}
          <button
            type="button"
            class="w-full px-3 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground flex items-center gap-2 border-t border-border"
            onclick={() => addTag()}
          >
            <Hash class="h-3 w-3" />
            Create "{inputValue}"
          </button>
        {/if}
      </div>
    {/if}
  </div>
</div>