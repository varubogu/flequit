<script lang="ts">
  import { useTranslation } from '$lib/hooks/use-translation.svelte';
  import type { ViewType } from '$lib/stores/view-store.svelte';
  import TagEditDialog from '$lib/components/tag/dialogs/tag-edit-dialog.svelte';
  import TagDeleteDialog from '$lib/components/tag/dialogs/tag-delete-dialog.svelte';
  import { useSidebar } from '$lib/components/ui/sidebar/context.svelte.js';
  import SidebarTagItem from './sidebar-tag-item.svelte';
  import { useSidebarTagListController } from './sidebar-tag-list-controller.svelte';

  interface Props {
    currentView?: ViewType;
    onViewChange?: (view: ViewType) => void;
  }

  // Props currently not used but kept for future implementations
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let { currentView, onViewChange }: Props = $props();

  const translationService = useTranslation();
  const sidebar = useSidebar();
  const controller = useSidebarTagListController();

  // Reactive messages
  const tagsTitle = translationService.getMessage('tags');
</script>

<!-- タグカテゴリ -->
{#if controller.bookmarkedTags.length > 0}
  <div class="mb-6 space-y-1">
    {#if sidebar.state !== 'collapsed'}
      <h3 class="text-muted-foreground px-3 text-xs font-medium tracking-wider uppercase">
        {tagsTitle()}
      </h3>
    {/if}

    {#each controller.bookmarkedTags as tag (tag.id)}
      <SidebarTagItem
        {tag}
        onRemoveFromBookmarks={controller.handleRemoveFromBookmarks}
        onEditTag={controller.handleEditTag}
        onDeleteTag={controller.handleDeleteTag}
        onTagClick={() => controller.handleTagClick(tag)}
        onDragStart={(event) => controller.handleTagDragStart(event, tag)}
        onDragOver={(event) => controller.handleTagDragOver(event, tag)}
        onDrop={(event) => controller.handleTagDrop(event, tag)}
        onDragEnd={controller.handleTagDragEnd}
        onDragEnter={controller.handleTagDragEnter}
        onDragLeave={controller.handleTagDragLeave}
      />
    {/each}
  </div>
{/if}

<!-- Tag Edit Dialog -->
<TagEditDialog
  open={controller.showEditDialog}
  tag={controller.selectedTag}
  onclose={controller.onEditComplete}
  onsave={controller.onEditSave}
/>

<!-- Delete Confirmation Dialog -->
<TagDeleteDialog
  open={controller.showDeleteConfirm}
  tag={controller.selectedTag}
  onConfirm={controller.onDeleteConfirm}
  onCancel={controller.onDeleteCancel}
/>
