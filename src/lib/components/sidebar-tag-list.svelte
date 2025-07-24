<script lang="ts">
  import type { ViewType } from '$lib/services/view-service';
  import { tagStore } from '$lib/stores/tags.svelte';
  import { taskStore } from '$lib/stores/tasks.svelte';
  import Button from '$lib/components/button.svelte';
  import * as m from '$paraglide/messages.js';
  import { reactiveMessage } from '$lib/stores/locale.svelte';
  import { Hash, Bookmark } from 'lucide-svelte';

  interface Props {
    currentView?: ViewType;
    onViewChange?: (view: ViewType) => void;
  }

  let { onViewChange }: Props = $props();

  let bookmarkedTags = $derived(tagStore.bookmarkedTagList);
  
  // Reactive messages
  const tagsTitle = reactiveMessage(m.tags);

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
</script>

<!-- タグカテゴリ -->
{#if bookmarkedTags.length > 0}
  <div class="space-y-1 mb-6">
    <h3 class="px-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
      {tagsTitle()}
    </h3>
    
    {#each bookmarkedTags as tag (tag.id)}
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
    {/each}
  </div>
{/if}