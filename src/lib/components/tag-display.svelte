<script lang="ts">
  import type { Tag } from '$lib/types/task';
  import Button from '$lib/components/button.svelte';
  import Badge from '$lib/components/ui/badge.svelte';
  import * as ContextMenu from "$lib/components/ui/context-menu/index.js";
  import { tagStore } from '$lib/stores/tags.svelte';
  import { X, Bookmark, BookmarkPlus, Edit, Palette, Trash2 } from 'lucide-svelte';
  import * as m from '$paraglide/messages.js';
  import { reactiveMessage } from '$lib/stores/locale.svelte';

  interface Props {
    tag: Tag;
    showRemoveButton?: boolean;
    onRemove?: (tagId: string) => void;
    onTagEdit?: (tagId: string) => void;
    onTagColorChange?: (tagId: string) => void;
    onTagDelete?: (tagId: string) => void;
    class?: string;
  }

  let { 
    tag, 
    showRemoveButton = false, 
    onRemove, 
    onTagEdit,
    onTagColorChange,
    onTagDelete,
    class: className = '' 
  }: Props = $props();

  // Reactive messages
  const tags = reactiveMessage(m.tags);

  function handleRemove() {
    onRemove?.(tag.id);
  }

  function handleToggleBookmark() {
    tagStore.toggleBookmark(tag.id);
  }

  function handleTagEdit() {
    onTagEdit?.(tag.id);
  }

  function handleTagColorChange() {
    onTagColorChange?.(tag.id);
  }
  
  function handleTagDelete() {
    onTagDelete?.(tag.id);
  }

  let isBookmarked = $derived(tagStore.isBookmarked(tag.id));
</script>

<ContextMenu.Root>
  <ContextMenu.Trigger>
    {#if showRemoveButton}
      <div class="inline-flex items-center gap-1 {className}">
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
            onclick={handleRemove}
          >
            <X class="h-2 w-2" />
          </Button>
        </Badge>
      </div>
    {:else}
      <Badge
        variant="outline"
        class="text-xs {className}"
        style="border-color: {tag.color}; color: {tag.color};"
      >
        {tag.name}
      </Badge>
    {/if}
  </ContextMenu.Trigger>
  
  <ContextMenu.Content class="w-56">
    <ContextMenu.Item onclick={handleToggleBookmark}>
      {#if isBookmarked}
        <Bookmark class="mr-2 h-4 w-4" />
        タグをサイドバーから削除
      {:else}
        <BookmarkPlus class="mr-2 h-4 w-4" />
        タグをサイドバーに表示
      {/if}
    </ContextMenu.Item>
    
    <ContextMenu.Separator />
    
    <ContextMenu.Item onclick={handleTagEdit}>
      <Edit class="mr-2 h-4 w-4" />
      タグ名の変更
    </ContextMenu.Item>
    
    <ContextMenu.Item onclick={handleTagColorChange}>
      <Palette class="mr-2 h-4 w-4" />
      タグ色の変更
    </ContextMenu.Item>
    
    <ContextMenu.Separator />
    
    <ContextMenu.Item onclick={handleTagDelete} class="text-destructive">
      <Trash2 class="mr-2 h-4 w-4" />
      タグ削除
    </ContextMenu.Item>
  </ContextMenu.Content>
</ContextMenu.Root>