<script lang="ts">
  import { getTranslationService } from '$lib/stores/locale.svelte';
  import { taskStore } from '$lib/stores/tasks.svelte';
  import Button from '$lib/components/shared/button.svelte';
  import * as m from '$paraglide/messages.js';
  import { reactiveMessage } from '$lib/stores/locale.svelte';
  import { Hash, Edit, Trash2, Bookmark, BookmarkX } from 'lucide-svelte';
  import ContextMenuWrapper from '$lib/components/shared/context-menu-wrapper.svelte';
  import { useSidebar } from '$lib/components/ui/sidebar/context.svelte.js';
  import type { Tag } from '$lib/types/task';
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
  const contextMenuItems: ContextMenuList = $derived(createContextMenu([
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
      action: () => {
        console.log('Add to sidebar action called for:', tag.name);
        // TODO: サイドバーに追加する処理（既にある場合の処理）
      },
      icon: Bookmark,
      visible: () => {
        // 既にサイドバーにある場合は非表示
        // 実際の実装では、tagがbookmarkedかどうかをチェック
        return false; // 仮実装
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
        // サイドバーにある場合のみ表示
        // 実際の実装では、tagがbookmarkedかどうかをチェック
        return true; // 仮実装
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
  ]));


  function handleTagClick() {
    onTagClick?.();
  }
</script>

<ContextMenuWrapper items={contextMenuItems}>
  <Button
    variant="ghost"
    class={sidebar.state === 'collapsed'
      ? "w-full justify-center p-2 h-auto group hover:bg-accent"
      : "w-full justify-between p-3 h-auto group hover:bg-accent"}
    onclick={handleTagClick}
    draggable="true"
    ondragstart={onDragStart}
    ondragover={onDragOver}
    ondrop={onDrop}
    ondragend={onDragEnd}
    ondragenter={(event) => onDragEnter && event.currentTarget && onDragEnter(event, event.currentTarget as HTMLElement)}
    ondragleave={(event) => onDragLeave && event.currentTarget && onDragLeave(event, event.currentTarget as HTMLElement)}
    data-testid="tag-{tag.id}"
  >
    {#if sidebar.state === 'collapsed'}
      <Hash
        class="h-4 w-4"
        style="color: {tag.color || 'currentColor'}"
      />
    {:else}
      <div class="flex items-center gap-3 flex-1 min-w-0">
        <div class="flex items-center gap-2 flex-1 min-w-0">
          <Hash
            class="h-4 w-4 flex-shrink-0"
            style="color: {tag.color || 'currentColor'}"
          />
          <span class="truncate text-sm font-medium">{tag.name}</span>
        </div>

        <div class="flex items-center gap-1 flex-shrink-0">
          <span class="text-xs text-muted-foreground">
            {getTaskCountForTag(tag.name)}
          </span>
        </div>
      </div>
    {/if}
  </Button>
</ContextMenuWrapper>
