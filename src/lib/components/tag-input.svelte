<script lang="ts">
  import type { Tag } from '$lib/types/task';
  import Button from '$lib/components/button.svelte';
  import Badge from '$lib/components/ui/badge.svelte';
  import { X } from 'lucide-svelte';
  import TagCompletionProvider from '$lib/components/tag-completion-provider.svelte';

  interface Props {
    tags: Tag[];
    placeholder?: string;
    class?: string;
    ontagAdded?: (tagName: string) => void;
    ontagRemoved?: (tagId: string) => void;
  }

  let { tags = [], placeholder = "Add tags...", class: className = "", ontagAdded, ontagRemoved }: Props = $props();

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
    if (tags.some(tag => tag.name.toLowerCase() === cleanedName.toLowerCase())) {
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
    <div class="flex flex-wrap gap-1 mb-2">
      {#each tags as tag (tag.id)}
        <div class="inline-flex items-center gap-1">
          <Badge
            variant="outline"
            class="text-xs pr-1"
            style="border-color: {tag.color}; color: {tag.color};"
          >
            {tag.name}
            <Button
              variant="ghost"
              size="icon"
              class="h-3 w-3 p-0 ml-1 hover:bg-secondary-foreground/20"
              onclick={() => removeTag(tag.id)}
            >
              <X class="h-2 w-2" />
            </Button>
          </Badge>
        </div>
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
      class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
      oninput={handleInput}
      onkeydown={handleKeydown}
    />
  </TagCompletionProvider>
</div>