<script lang="ts">
  import type { Tag } from '$lib/types/task';
  import Button from '$lib/components/shared/button.svelte';
  import Badge from '$lib/components/ui/badge.svelte';
  import ContextMenuWrapper from '$lib/components/shared/context-menu-wrapper.svelte';
  import { tagStore } from '$lib/stores/tags.svelte';
  import { taskStore } from '$lib/stores/tasks.svelte';
  import TagEditDialog from './tag-edit-dialog.svelte';
  import TagDeleteDialog from './tag-delete-dialog.svelte';
  import { X, Bookmark, BookmarkPlus, Edit, Trash2, Minus } from 'lucide-svelte';
  import * as m from '$paraglide/messages.js';
  import { reactiveMessage } from '$lib/stores/locale.svelte';
  import type { ContextMenuList } from '$lib/types/context-menu';
  import { createContextMenu, createSeparator } from '$lib/types/context-menu';

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
    tagStore.deleteTag(tag.id, (tagId) => {
      // Remove tag from all tasks and subtasks
      taskStore.removeTagFromAllTasks(tagId);
    });
    showDeleteDialog = false;
  }

  let isBookmarked = $derived(tagStore.bookmarkedTags.has(tag.id));

  // Default color for tags without a color
  const DEFAULT_TAG_COLOR = '#6b7280'; // gray-500
  let tagColor = $derived(tag.color || DEFAULT_TAG_COLOR);

  // タグ用のコンテキストメニューリストを作成
  const contextMenuItems: ContextMenuList = $derived(createContextMenu([
    ...(enableTagRemoveFromContext && onTagRemoveFromItem ? [
      {
        id: 'remove-tag-from-item',
        label: removeTagFromItem,
        action: handleTagRemoveFromItem,
        icon: Minus
      },
      createSeparator()
    ] : []),
    {
      id: 'toggle-bookmark',
      label: isBookmarked ? removeTagFromSidebar : addTagToSidebar,
      action: handleToggleBookmark,
      icon: isBookmarked ? Bookmark : BookmarkPlus
    },
    createSeparator(),
    {
      id: 'edit-tag',
      label: editTag,
      action: handleTagEdit,
      icon: Edit
    },
    createSeparator(),
    {
      id: 'delete-tag',
      label: deleteTag,
      action: handleTagDelete,
      icon: Trash2,
      destructive: true
    }
  ]));
</script>

<ContextMenuWrapper items={contextMenuItems}>
  {#if showRemoveButton}
    <div class="inline-flex items-center gap-1 {className}">
      <Badge
        variant="outline"
        class="text-xs pr-1"
        style="border-color: {tagColor}; color: {tagColor};"
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
      style="border-color: {tagColor}; color: {tagColor};"
    >
      {tag.name}
    </Badge>
  {/if}
</ContextMenuWrapper>

<!-- Edit Dialog -->
<TagEditDialog
  open={showEditDialog}
  {tag}
  onsave={handleEditSave}
  onclose={() => showEditDialog = false}
/>

<!-- Delete Confirmation Dialog -->
<TagDeleteDialog
  open={showDeleteDialog}
  tag={tag}
  onConfirm={handleDeleteConfirm}
  onCancel={() => showDeleteDialog = false}
/>
