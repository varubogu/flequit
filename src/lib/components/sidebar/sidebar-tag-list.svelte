<script lang="ts">
  import type { ViewType } from '$lib/services/view-service';
  import { tagStore } from '$lib/stores/tags.svelte';
  import { taskStore } from '$lib/stores/tasks.svelte';
  import * as m from '$paraglide/messages.js';
  import { reactiveMessage } from '$lib/stores/locale.svelte';
  import TagEditDialog from '$lib/components/tag/tag-edit-dialog.svelte';
  import TagDeleteDialog from '$lib/components/tag/tag-delete-dialog.svelte';
  import { useSidebar } from '$lib/components/ui/sidebar/context.svelte.js';
  import SidebarTagItem from './sidebar-tag-item.svelte';
  import type { Tag } from '$lib/types/task';

  interface Props {
    currentView?: ViewType;
    onViewChange?: (view: ViewType) => void;
  }

  let { onViewChange }: Props = $props();

  // Get sidebar state
  const sidebar = useSidebar();

  let bookmarkedTags = $derived(
    tagStore.tags.filter(tag => tagStore.bookmarkedTags.has(tag.id))
  );

  // Reactive messages
  const tagsTitle = reactiveMessage(m.tags);

  // State for dialogs
  let selectedTag: Tag | null = $state(null);
  let showEditDialog = $state(false);
  let showDeleteConfirm = $state(false);

  function handleTagClick() {
    // TODO: Implement tag view filtering
    onViewChange?.('all'); // For now, just switch to all view
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
</script>

<!-- タグカテゴリ -->
{#if bookmarkedTags.length > 0}
  <div class="space-y-1 mb-6">
    {#if sidebar.state !== 'collapsed'}
      <h3 class="px-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
        {tagsTitle()}
      </h3>
    {/if}

    {#each bookmarkedTags as tag (tag.id)}
      <SidebarTagItem
        {tag}
        onRemoveFromBookmarks={handleRemoveFromBookmarks}
        onEditTag={handleEditTag}
        onDeleteTag={handleDeleteTag}
        onTagClick={handleTagClick}
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
