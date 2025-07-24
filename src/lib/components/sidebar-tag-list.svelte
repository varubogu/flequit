<script lang="ts">
  import type { ViewType } from '$lib/services/view-service';
  import { tagStore } from '$lib/stores/tags.svelte';
  import { taskStore } from '$lib/stores/tasks.svelte';
  import Button from '$lib/components/button.svelte';
  import * as m from '$paraglide/messages.js';
  import { reactiveMessage } from '$lib/stores/locale.svelte';
  import { Hash, Bookmark } from 'lucide-svelte';
  import TagEditDialog from '$lib/components/tag-edit-dialog.svelte';
  import * as AlertDialog from '$lib/components/ui/alert-dialog/index.js';
  import * as ContextMenu from '$lib/components/ui/context-menu/index.js';

  interface Props {
    currentView?: ViewType;
    onViewChange?: (view: ViewType) => void;
  }

  let { onViewChange }: Props = $props();

  let bookmarkedTags = $derived(tagStore.bookmarkedTagList);
  
  // Reactive messages
  const tagsTitle = reactiveMessage(m.tags);
  const removeTagFromSidebar = reactiveMessage(m.remove_tag_from_sidebar);
  const editTag = reactiveMessage(m.edit_tag);
  const deleteTag = reactiveMessage(m.delete_tag);

  // State for dialogs
  let selectedTag: any = $state(null);
  let showEditDialog = $state(false);
  let showDeleteConfirm = $state(false);

  function getTaskCountForTag(tagName: string): number {
    return taskStore.getTaskCountByTag(tagName);
  }

  function handleTagClick() {
    // TODO: Implement tag view filtering
    onViewChange?.('all'); // For now, just switch to all view
  }

  function toggleTagBookmark(tagId: string, event: Event) {
    event.stopPropagation();
    tagStore.toggleBookmark(tagId);
  }

  function handleRemoveFromBookmarks(tag: any, event: Event) {
    event.stopPropagation();
    tagStore.removeBookmark(tag.id);
  }

  function handleEditTag(tag: any, event: Event) {
    event.stopPropagation();
    selectedTag = tag;
    showEditDialog = true;
  }

  function handleDeleteTag(tag: any, event: Event) {
    event.stopPropagation();
    selectedTag = tag;
    showDeleteConfirm = true;
  }

  function onEditComplete() {
    showEditDialog = false;
    selectedTag = null;
  }

  function onDeleteConfirm() {
    if (selectedTag) {
      tagStore.deleteTag(selectedTag.id);
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
    <h3 class="px-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
      {tagsTitle()}
    </h3>
    
    {#each bookmarkedTags as tag (tag.id)}
      <ContextMenu.Root>
        <ContextMenu.Trigger>
          <Button
            variant="ghost"
            class="w-full justify-between p-3 h-auto group hover:bg-accent"
            onclick={handleTagClick}
          >
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
                
                <button
                  type="button"
                  class="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-accent rounded"
                  onclick={(e) => toggleTagBookmark(tag.id, e)}
                  title="Remove from bookmarks"
                >
                  <Bookmark class="h-3 w-3" />
                </button>
              </div>
            </div>
          </Button>
        </ContextMenu.Trigger>
        
        <ContextMenu.Content>
          <ContextMenu.Item onclick={(e) => handleRemoveFromBookmarks(tag, e)}>
            {removeTagFromSidebar()}
          </ContextMenu.Item>
          <ContextMenu.Item onclick={(e) => handleEditTag(tag, e)}>
            {editTag()}
          </ContextMenu.Item>
          <ContextMenu.Item onclick={(e) => handleDeleteTag(tag, e)}>
            {deleteTag()}
          </ContextMenu.Item>
        </ContextMenu.Content>
      </ContextMenu.Root>
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
<AlertDialog.Root bind:open={showDeleteConfirm}>
  <AlertDialog.Content>
    <AlertDialog.Header>
      <AlertDialog.Title>タグを削除</AlertDialog.Title>
      <AlertDialog.Description>
        「{selectedTag?.name || ''}」タグを削除しますか？
        このタグが設定されているタスクからもタグが削除されます。
        この操作は取り消せません。
      </AlertDialog.Description>
    </AlertDialog.Header>
    <AlertDialog.Footer>
      <AlertDialog.Cancel onclick={onDeleteCancel}>キャンセル</AlertDialog.Cancel>
      <AlertDialog.Action onclick={onDeleteConfirm}>削除</AlertDialog.Action>
    </AlertDialog.Footer>
  </AlertDialog.Content>
</AlertDialog.Root>