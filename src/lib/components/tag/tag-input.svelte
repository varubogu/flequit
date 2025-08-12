<script lang="ts">
    import type { Tag } from "$lib/types/tag";
  import TagDisplay from './tag-display.svelte';
  import TagCompletionProvider from '$lib/components/tag/tag-completion-provider.svelte';
  import * as m from '$paraglide/messages';
  import { reactiveMessage } from '$lib/stores/locale.svelte';

  interface Props {
    tags: Tag[];
    placeholder?: string;
    class?: string;
    ontagAdded?: (tagName: string) => void;
    ontagRemoved?: (tagId: string) => void;
  }

  let {
    tags = [],
    placeholder = reactiveMessage(m.add_tags_placeholder as (...args: unknown[]) => string)(),
    class: className = '',
    ontagAdded,
    ontagRemoved
  }: Props = $props();

  let inputValue = $state('');
  let inputElement: HTMLInputElement;

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
      if (inputElement) {
        inputElement.blur();
      }
    }
  }

  function addTag(tagName?: string) {
    const rawName = (tagName || inputValue).trim();
    const cleanedName = cleanTagName(rawName);

    if (!cleanedName) {
      inputValue = '';
      return;
    }

    // Check if tag already exists on this task
    if (tags.some((tag) => tag.name.toLowerCase() === cleanedName.toLowerCase())) {
      inputValue = '';
      return;
    }

    ontagAdded?.(cleanedName);
    inputValue = '';
  }

  function handleTagCompletion(event: CustomEvent<{ tagName: string; position: number }>) {
    // When a tag is detected from completion, add it
    addTag(event.detail.tagName);
  }

  function removeTag(tagId: string) {
    ontagRemoved?.(tagId);
  }
</script>

<div class="relative {className}">
  <!-- Tag display -->
  {#if tags.length > 0}
    <div class="mb-2 flex flex-wrap gap-1">
      {#each tags as tag (tag.id)}
        <TagDisplay
          {tag}
          showRemoveButton={true}
          onRemove={removeTag}
          onTagRemoveFromItem={removeTag}
        />
      {/each}
    </div>
  {/if}

  <!-- Input field wrapped with TagCompletionProvider -->
  <TagCompletionProvider ontagDetected={handleTagCompletion}>
    <input
      bind:this={inputElement}
      type="text"
      value={inputValue}
      {placeholder}
      class="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
      oninput={handleInput}
      onkeydown={handleKeydown}
    />
  </TagCompletionProvider>
</div>
