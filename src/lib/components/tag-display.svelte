<script lang="ts">
  import type { Tag } from '$lib/types/task';
  import Button from '$lib/components/button.svelte';
  import Badge from '$lib/components/ui/badge.svelte';
  import * as ContextMenu from "$lib/components/ui/context-menu/index.js";
  import { tagStore } from '$lib/stores/tags.svelte';
  import TagEditDialog from './tag-edit-dialog.svelte';
  import DeleteConfirmationDialog from './delete-confirmation-dialog.svelte';
  import { X, Bookmark, BookmarkPlus, Edit, Trash2, Minus } from 'lucide-svelte';
  import * as m from '$paraglide/messages.js';
  import { reactiveMessage } from '$lib/stores/locale.svelte';

  // Reactive messages
  const removeTagFromItem = reactiveMessage(m.remove_tag_from_item);
  const removeTagFromSidebar = reactiveMessage(m.remove_tag_from_sidebar);
  const addTagToSidebar = reactiveMessage(m.add_tag_to_sidebar);
  const editTag = reactiveMessage(m.edit_tag);
  const deleteTag = reactiveMessage(m.delete_tag);

  interface Props {
    tag: Tag;
    showRemoveButton?: boolean;
    onRemove?: (tagId: string) => void;
    onTagRemoveFromItem?: (tagId: string) => void;
    enableTagRemoveFromContext?: boolean;
    class?: string;
  }

  let { 
    tag, 
    showRemoveButton = false, 
    onRemove, 
    onTagRemoveFromItem,
    enableTagRemoveFromContext = true,
    class: className = '' 
  }: Props = $props();

  // State for modals
  let showEditDialog = $state(false);
  let showDeleteDialog = $state(false);

  function handleRemove() {
    onRemove?.(tag.id);
  }

  function handleTagRemoveFromItem() {
    onTagRemoveFromItem?.(tag.id);
  }

  function handleToggleBookmark() {
    tagStore.toggleBookmark(tag.id);
  }

  function handleTagEdit() {
    showEditDialog = true;
  }
  
  function handleTagDelete() {
    showDeleteDialog = true;
  }

  function handleEditSave(data: { name: string; color: string }) {
    tagStore.updateTag(tag.id, {
      name: data.name,
      color: data.color,
      updated_at: new Date()
    });
  }

  function handleDeleteConfirm() {
    tagStore.deleteTag(tag.id);
    showDeleteDialog = false;
  }

  let isBookmarked = $derived(tagStore.bookmarkedTags.has(tag.id));
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
    {#if enableTagRemoveFromContext && onTagRemoveFromItem}
      <ContextMenu.Item onclick={handleTagRemoveFromItem}>
        <Minus class="mr-2 h-4 w-4" />
        {removeTagFromItem()}
      </ContextMenu.Item>
      
      <ContextMenu.Separator />
    {/if}
    
    <ContextMenu.Item onclick={handleToggleBookmark}>
      {#if isBookmarked}
        <Bookmark class="mr-2 h-4 w-4" />
        {removeTagFromSidebar()}
      {:else}
        <BookmarkPlus class="mr-2 h-4 w-4" />
        {addTagToSidebar()}
      {/if}
    </ContextMenu.Item>
    
    <ContextMenu.Separator />
    
    <ContextMenu.Item onclick={handleTagEdit}>
      <Edit class="mr-2 h-4 w-4" />
      {editTag()}
    </ContextMenu.Item>
    
    <ContextMenu.Separator />
    
    <ContextMenu.Item onclick={handleTagDelete} class="text-destructive">
      <Trash2 class="mr-2 h-4 w-4" />
      {deleteTag()}
    </ContextMenu.Item>
  </ContextMenu.Content>
</ContextMenu.Root>

<!-- Edit Dialog -->
<TagEditDialog 
  open={showEditDialog} 
  {tag}
  onsave={handleEditSave}
  onclose={() => showEditDialog = false}
/>

<!-- Delete Confirmation Dialog -->
<DeleteConfirmationDialog
  open={showDeleteDialog}
  title="タグの削除"
  message="「{tag.name}」タグを削除しますか？この操作は元に戻せません。"
  onConfirm={handleDeleteConfirm}
  onCancel={() => showDeleteDialog = false}
/>