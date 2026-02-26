<script lang="ts">
  import type { Tag } from '$lib/types/tag';
  import Button from '$lib/components/shared/button.svelte';
  import Badge from '$lib/components/ui/badge.svelte';
  import ContextMenuWrapper from '$lib/components/shared/context-menu-wrapper.svelte';
  import { tagStore } from '$lib/stores/tags.svelte';
  import { taskStore } from '$lib/stores/tasks.svelte';
  import TagEditDialog from '$lib/components/tag/dialogs/tag-edit-dialog.svelte';
  import TagDeleteDialog from '$lib/components/tag/dialogs/tag-delete-dialog.svelte';
  import { X, Bookmark, BookmarkPlus, Edit, Trash2, Minus } from 'lucide-svelte';
  import { useTranslation } from '$lib/hooks/use-translation.svelte';
  import type { ContextMenuList } from '$lib/types/context-menu';
  import { createContextMenu, createSeparator } from '$lib/types/context-menu';
  import { TagService } from '$lib/services/domain/tag';

  // Translation service
  const translationService = useTranslation();
  const removeTagFromItem = translationService.getMessage('remove_tag_from_item');
  const removeTagFromSidebar = translationService.getMessage('remove_tag_from_sidebar');
  const addTagToSidebar = translationService.getMessage('add_tag_to_sidebar');
  const editTag = translationService.getMessage('edit_tag');
  const deleteTag = translationService.getMessage('delete_tag');

  interface Props {
    tag: Tag;
    projectId?: string;
    showRemoveButton?: boolean;
    onRemove?: (tagId: string) => void;
    onTagRemoveFromItem?: (tagId: string) => void;
    enableTagRemoveFromContext?: boolean;
    class?: string;
  }

  let {
    tag,
    projectId,
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

  async function handleToggleBookmark() {
    console.log('[TagDisplay] handleToggleBookmark called - tag:', tag.id, 'projectId:', projectId);
    try {
      // projectIdが渡されていればそれを使用、なければ取得
      console.log('[TagDisplay] Resolving projectId...');
      const resolvedProjectId = projectId || (await tagStore.getProjectIdByTagId(tag.id));
      console.log('[TagDisplay] Resolved projectId:', resolvedProjectId);

      if (!resolvedProjectId) {
        console.error('[TagDisplay] Project ID not found for tag:', tag.id);
        return;
      }

      // TagBookmarkServiceを直接呼び出す
      console.log('[TagDisplay] Importing TagBookmarkService...');
      const { TagBookmarkService } = await import('$lib/services/domain/tag-bookmark');
      console.log('[TagDisplay] Calling toggleBookmark...');
      await TagBookmarkService.toggleBookmark(resolvedProjectId, tag.id);
      console.log('[TagDisplay] toggleBookmark completed successfully');
    } catch (error) {
      console.error('[TagDisplay] Failed to toggle bookmark:', error);
    }
  }

  function handleTagEdit() {
    showEditDialog = true;
  }

  function handleTagDelete() {
    showDeleteDialog = true;
  }

  async function handleEditSave(data: { name: string; color: string }) {
    // Get project ID for this tag
    const projectId = await tagStore.getProjectIdByTagId(tag.id);
    if (!projectId) {
      console.error('Project ID not found for tag:', tag.id);
      return;
    }
    TagService.updateTag(projectId, tag.id, {
      name: data.name,
      color: data.color,
      updatedAt: new Date()
    });
  }

  async function handleDeleteConfirm() {
    const projectId = await tagStore.getProjectIdByTagId(tag.id);
    if (!projectId) {
      console.error('Project ID not found for tag:', tag.id);
      return;
    }
    TagService.deleteTag(projectId, tag.id, (tagId: string) => {
      // Remove tag from all tasks and subtasks
      taskStore.removeTagFromAllTasks(tagId);
    });
    showDeleteDialog = false;
  }

  let isBookmarked = $derived(tagStore.bookmarkedTags.includes(tag.id));

  // Default color for tags without a color
  const DEFAULT_TAG_COLOR = '#6b7280'; // gray-500
  let tagColor = $derived(tag.color || DEFAULT_TAG_COLOR);

  // タグ用のコンテキストメニューリストを作成
  const contextMenuItems: ContextMenuList = $derived(
    createContextMenu([
      ...(enableTagRemoveFromContext && onTagRemoveFromItem
        ? [
            {
              id: 'remove-tag-from-item',
              label: removeTagFromItem,
              action: handleTagRemoveFromItem,
              icon: Minus
            },
            createSeparator()
          ]
        : []),
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
    ])
  );
</script>

<ContextMenuWrapper items={contextMenuItems}>
  {#if showRemoveButton}
    <div class="inline-flex items-center gap-1 {className}">
      <Badge
        variant="outline"
        class="pr-1 text-xs"
        style="border-color: {tagColor}; color: {tagColor};"
      >
        {tag.name}
        <Button
          variant="ghost"
          size="icon"
          class="hover:bg-secondary-foreground/20 ml-1 h-3 w-3 p-0"
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
  onclose={() => (showEditDialog = false)}
/>

<!-- Delete Confirmation Dialog -->
<TagDeleteDialog
  open={showDeleteDialog}
  {tag}
  onConfirm={handleDeleteConfirm}
  onCancel={() => (showDeleteDialog = false)}
/>
