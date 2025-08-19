<script lang="ts">
  import type { Tag } from '$lib/types/tag';
  import { Hash } from 'lucide-svelte';

  interface Props {
    showSuggestions: boolean;
    suggestions: Tag[];
    currentTagInput: string;
    suggestionsPosition: { top: number; left: number };
    onSelectSuggestion: (tag: Tag) => void;
    onCreateNewTag: () => void;
  }

  let {
    showSuggestions,
    suggestions,
    currentTagInput,
    suggestionsPosition,
    onSelectSuggestion,
    onCreateNewTag
  }: Props = $props();

  // Check if current input matches any existing tag (case-insensitive)
  let hasExactMatch = $derived(
    suggestions &&
      currentTagInput &&
      suggestions.some((s) => s.name.toLowerCase() === currentTagInput.toLowerCase())
  );
</script>

{#if showSuggestions}
  <div
    class="bg-background border-border fixed z-[9999] max-h-40 min-w-48 overflow-y-auto rounded-md border shadow-lg"
    style="top: {Math.max(0, suggestionsPosition.top)}px; left: {Math.max(
      0,
      suggestionsPosition.left
    )}px;"
  >
    <div class="text-muted-foreground px-2 py-1 text-xs">
      Debug: showing {suggestions ? suggestions.length : 0} suggestions
    </div>
    {#each suggestions || [] as suggestion (suggestion.id)}
      <button
        type="button"
        class="hover:bg-accent hover:text-accent-foreground flex w-full items-center gap-2 px-3 py-2 text-left text-sm"
        onclick={() => onSelectSuggestion(suggestion)}
      >
        {#if suggestion.color}
          <div class="h-3 w-3 rounded-sm border" style="background-color: {suggestion.color}"></div>
        {:else}
          <Hash class="h-3 w-3" />
        {/if}
        {suggestion.name}
      </button>
    {/each}

    <!-- Show "Create new tag" option if input doesn't match any existing tag -->
    {#if currentTagInput && currentTagInput.trim() && !hasExactMatch}
      <button
        type="button"
        class="hover:bg-accent hover:text-accent-foreground border-border flex w-full items-center gap-2 border-t px-3 py-2 text-left text-sm"
        onclick={onCreateNewTag}
      >
        <Hash class="h-3 w-3" />
        Create "#{currentTagInput}"
      </button>
    {/if}
  </div>
{/if}
