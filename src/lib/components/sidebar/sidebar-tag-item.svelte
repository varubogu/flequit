<script lang="ts">
  import { taskStore } from '$lib/stores/tasks.svelte';
  import Button from '$lib/components/shared/button.svelte';
  import * as m from '$paraglide/messages.js';
  import { reactiveMessage } from '$lib/stores/locale.svelte';
  import { Hash } from 'lucide-svelte';
  import * as ContextMenu from '$lib/components/ui/context-menu/index.js';
  import { useSidebar } from '$lib/components/ui/sidebar/context.svelte.js';
  import type { Tag } from '$lib/types/task';

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

  // Get sidebar state
  const sidebar = useSidebar();

  // Reactive messages
  const removeTagFromSidebar = reactiveMessage(m.remove_tag_from_sidebar);
  const editTag = reactiveMessage(m.edit_tag);
  const deleteTag = reactiveMessage(m.delete_tag);

  function getTaskCountForTag(tagName: string): number {
    return taskStore.getTaskCountByTag(tagName);
  }

  function handleRemoveFromBookmarks(event: Event) {
    event.stopPropagation();
    onRemoveFromBookmarks?.(tag);
  }

  function handleEditTag(event: Event) {
    event.stopPropagation();
    onEditTag?.(tag);
  }

  function handleDeleteTag(event: Event) {
    event.stopPropagation();
    onDeleteTag?.(tag);
  }

  function handleTagClick() {
    onTagClick?.();
  }
</script>

<ContextMenu.Root>
  <ContextMenu.Trigger>
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
  </ContextMenu.Trigger>

  <ContextMenu.Content>
    <ContextMenu.Item onclick={handleRemoveFromBookmarks}>
      {removeTagFromSidebar()}
    </ContextMenu.Item>
    <ContextMenu.Item onclick={handleEditTag}>
      {editTag()}
    </ContextMenu.Item>
    <ContextMenu.Item onclick={handleDeleteTag}>
      {deleteTag()}
    </ContextMenu.Item>
  </ContextMenu.Content>
</ContextMenu.Root>