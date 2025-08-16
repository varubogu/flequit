<script lang="ts">
  import { getTranslationService } from '$lib/stores/locale.svelte';
  import type { ViewType } from '$lib/services/view-service';
  import { tagStore } from '$lib/stores/tags.svelte';
  import { taskStore } from '$lib/stores/tasks.svelte';
  import { viewStore } from '$lib/stores/view-store.svelte';
  import TagEditDialog from '$lib/components/tag/dialogs/tag-edit-dialog.svelte';
  import TagDeleteDialog from '$lib/components/tag/dialogs/tag-delete-dialog.svelte';
  import { useSidebar } from '$lib/components/ui/sidebar/context.svelte.js';
  import SidebarTagItem from './sidebar-tag-item.svelte';
    import type { Tag } from "$lib/types/tag";
  import { DragDropManager, type DragData, type DropTarget } from '$lib/utils/drag-drop';
  import { TaskService } from '$lib/services/task-service';

  interface Props {
    currentView?: ViewType;
    onViewChange?: (view: ViewType) => void;
  }

  // Props currently not used but kept for future implementations
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let { currentView, onViewChange }: Props = $props();

  const translationService = getTranslationService();
  // Get sidebar state
  const sidebar = useSidebar();

  let bookmarkedTags = $derived(tagStore.bookmarkedTagList);

  // Reactive messages
  const tagsTitle = translationService.getMessage('tags');

  // State for dialogs
  let selectedTag: Tag | null = $state(null);
  let showEditDialog = $state(false);
  let showDeleteConfirm = $state(false);

  function handleTagClick(tag: Tag) {
    // タグ検索を実行する（#tagName形式）
    const searchQuery = `#${tag.name}`;
    viewStore.performSearch(searchQuery);
  }

  function handleRemoveFromBookmarks(tag: Tag) {
    tagStore.removeBookmark(tag.id);
  }

  function handleEditTag(tag: Tag) {
    selectedTag = tag;
    showEditDialog = true;
  }

  function handleDeleteTag(tag: Tag) {
    selectedTag = tag;
    showDeleteConfirm = true;
  }

  function onEditComplete() {
    showEditDialog = false;
    selectedTag = null;
  }

  function onDeleteConfirm() {
    if (selectedTag) {
      tagStore.deleteTag(selectedTag.id, (tagId) => {
        // Remove tag from all tasks and subtasks
        taskStore.removeTagFromAllTasks(tagId);
      });
      showDeleteConfirm = false;
      selectedTag = null;
    }
  }

  function onDeleteCancel() {
    showDeleteConfirm = false;
    selectedTag = null;
  }

  // Drag & Drop handlers
  function handleTagDragStart(event: DragEvent, tag: Tag) {
    const dragData: DragData = {
      type: 'tag',
      id: tag.id
    };
    DragDropManager.startDrag(event, dragData);
  }

  function handleTagDragOver(event: DragEvent, tag: Tag) {
    const target: DropTarget = {
      type: 'tag',
      id: tag.id
    };
    DragDropManager.handleDragOver(event, target);
  }

  function handleTagDrop(event: DragEvent, targetTag: Tag) {
    const target: DropTarget = {
      type: 'tag',
      id: targetTag.id
    };

    const dragData = DragDropManager.handleDrop(event, target);
    if (!dragData) return;

    if (dragData.type === 'tag') {
      // タグ同士の並び替え
      const targetIndex = bookmarkedTags.findIndex((t) => t.id === targetTag.id);
      tagStore.moveBookmarkedTagToPosition(dragData.id, targetIndex);
    } else if (dragData.type === 'task') {
      // タスクをタグにドロップした場合、タスクにタグを付与
      TaskService.addTagToTask(dragData.id, targetTag.id);
    } else if (dragData.type === 'subtask' && dragData.taskId) {
      // サブタスクをタグにドロップした場合、サブタスクにタグを付与
      TaskService.addTagToSubTask(dragData.id, dragData.taskId, targetTag.id);
    }
  }

  function handleTagDragEnd(event: DragEvent) {
    DragDropManager.handleDragEnd(event);
  }

  function handleTagDragEnter(event: DragEvent, element: HTMLElement) {
    DragDropManager.handleDragEnter(event, element);
  }

  function handleTagDragLeave(event: DragEvent, element: HTMLElement) {
    DragDropManager.handleDragLeave(event, element);
  }
</script>

<!-- タグカテゴリ -->
{#if bookmarkedTags.length > 0}
  <div class="mb-6 space-y-1">
    {#if sidebar.state !== 'collapsed'}
      <h3 class="text-muted-foreground px-3 text-xs font-medium tracking-wider uppercase">
        {tagsTitle()}
      </h3>
    {/if}

    {#each bookmarkedTags as tag (tag.id)}
      <SidebarTagItem
        {tag}
        onRemoveFromBookmarks={handleRemoveFromBookmarks}
        onEditTag={handleEditTag}
        onDeleteTag={handleDeleteTag}
        onTagClick={() => handleTagClick(tag)}
        onDragStart={(event) => handleTagDragStart(event, tag)}
        onDragOver={(event) => handleTagDragOver(event, tag)}
        onDrop={(event) => handleTagDrop(event, tag)}
        onDragEnd={handleTagDragEnd}
        onDragEnter={handleTagDragEnter}
        onDragLeave={handleTagDragLeave}
      />
    {/each}
  </div>
{/if}

<!-- Tag Edit Dialog -->
<TagEditDialog
  open={showEditDialog}
  tag={selectedTag}
  onclose={onEditComplete}
  onsave={(data) => {
    if (selectedTag) {
      tagStore.updateTag(selectedTag.id, { name: data.name, color: data.color });
    }
    onEditComplete();
  }}
/>

<!-- Delete Confirmation Dialog -->
<TagDeleteDialog
  open={showDeleteConfirm}
  tag={selectedTag}
  onConfirm={onDeleteConfirm}
  onCancel={onDeleteCancel}
/>
