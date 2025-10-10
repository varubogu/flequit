<script lang="ts">
  import { getTranslationService } from '$lib/stores/locale.svelte';
  import { taskStore } from '$lib/stores/tasks.svelte';
  import { tagStore } from '$lib/stores/tags.svelte';
  import { TagService } from '$lib/services/domain/tag';
  import Button from '$lib/components/shared/button.svelte';
  import { Hash, Edit, Trash2, Bookmark, BookmarkX } from 'lucide-svelte';
  import ContextMenuWrapper from '$lib/components/shared/context-menu-wrapper.svelte';
  import { useSidebar } from '$lib/components/ui/sidebar/context.svelte.js';
  import type { Tag } from '$lib/types/tag';
  import type { ContextMenuList } from '$lib/types/context-menu';
  import { createContextMenu, createSeparator } from '$lib/types/context-menu';

  interface Props {
    tag: Tag;
    onRemoveFromBookmarks?: (tag: Tag) => void;
    onEditTag?: (tag: Tag) => void;
    onDeleteTag?: (tag: Tag) => void;
    onTagClick?: () => void;
    onDragStart?: (event: DragEvent) => void;
    onDragOver?: (event: DragEvent) => void;
    onDrop?: (event: DragEvent) => void;
    onDragEnd?: (event: DragEvent) => void;
    onDragEnter?: (event: DragEvent, element: HTMLElement) => void;
    onDragLeave?: (event: DragEvent, element: HTMLElement) => void;
  }

  let {
    tag,
    onRemoveFromBookmarks,
    onEditTag,
    onDeleteTag,
    onTagClick,
    onDragStart,
    onDragOver,
    onDrop,
    onDragEnd,
    onDragEnter,
    onDragLeave
  }: Props = $props();

  const translationService = getTranslationService();
  // Get sidebar state
  const sidebar = useSidebar();

  // Reactive messages
  const removeTagFromSidebar = translationService.getMessage('remove_tag_from_sidebar');
  const addTagToSidebar = translationService.getMessage('add_tag_to_sidebar');
  const editTag = translationService.getMessage('edit_tag');
  const deleteTag = translationService.getMessage('delete_tag');

  function getTaskCountForTag(tagName: string): number {
    return taskStore.getTaskCountByTag(tagName);
  }

  // コンテキストメニューリストを作成
  const contextMenuItems: ContextMenuList = $derived(
    createContextMenu([
      {
        id: 'edit-tag',
        label: editTag,
        action: () => {
          onEditTag?.(tag);
        },
        icon: Edit
      },
      createSeparator(),
      {
        id: 'add-to-sidebar',
        label: addTagToSidebar,
        action: async () => {
          const projectId = await tagStore.getProjectIdByTagId(tag.id);
          if (!projectId) {
            console.error('Project ID not found for tag:', tag.id);
            return;
          }
          TagService.addBookmark(projectId, tag.id);
        },
        icon: Bookmark,
        visible: () => {
          return !tagStore.isBookmarked(tag.id);
        }
      },
      {
        id: 'remove-from-sidebar',
        label: removeTagFromSidebar,
        action: () => {
          onRemoveFromBookmarks?.(tag);
        },
        icon: BookmarkX,
        visible: () => {
          return tagStore.isBookmarked(tag.id);
        }
      },
      createSeparator(),
      {
        id: 'delete-tag',
        label: deleteTag,
        action: () => {
          onDeleteTag?.(tag);
        },
        icon: Trash2,
        destructive: true
      }
    ])
  );

  function handleTagClick() {
    onTagClick?.();
  }
</script>

<ContextMenuWrapper items={contextMenuItems}>
  <Button
    variant="ghost"
    class={sidebar.state === 'collapsed'
      ? 'group hover:bg-accent h-auto w-full justify-center p-2'
      : 'group hover:bg-accent h-auto w-full justify-between p-3'}
    onclick={handleTagClick}
    draggable="true"
    ondragstart={onDragStart}
    ondragover={onDragOver}
    ondrop={onDrop}
    ondragend={onDragEnd}
    ondragenter={(event) =>
      onDragEnter && event.currentTarget && onDragEnter(event, event.currentTarget as HTMLElement)}
    ondragleave={(event) =>
      onDragLeave && event.currentTarget && onDragLeave(event, event.currentTarget as HTMLElement)}
    data-testid="tag-{tag.id}"
  >
    {#if sidebar.state === 'collapsed'}
      <Hash class="h-4 w-4" style="color: {tag.color || 'currentColor'}" />
    {:else}
      <div class="flex min-w-0 flex-1 items-center gap-3">
        <div class="flex min-w-0 flex-1 items-center gap-2">
          <Hash class="h-4 w-4 flex-shrink-0" style="color: {tag.color || 'currentColor'}" />
          <span class="truncate text-sm font-medium">{tag.name}</span>
        </div>

        <div class="flex flex-shrink-0 items-center gap-1">
          <span class="text-muted-foreground text-xs">
            {getTaskCountForTag(tag.name)}
          </span>
        </div>
      </div>
    {/if}
  </Button>
</ContextMenuWrapper>
