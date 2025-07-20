<script lang="ts">
  import { draggable, droppable, type DragDropState } from "@thisux/sveltednd";
  import { viewsVisibilityStore, type ViewItem } from '$lib/stores/views-visibility.svelte';
  import { GripVertical } from 'lucide-svelte';

  let localVisibleItems = $state([...viewsVisibilityStore.visibleViews]);
  let localHiddenItems = $state([...viewsVisibilityStore.hiddenViews]);

  $effect(() => {
    localVisibleItems = [...viewsVisibilityStore.visibleViews];
    localHiddenItems = [...viewsVisibilityStore.hiddenViews];
  });

  function handleDrop(state: DragDropState<ViewItem>) {
    const { sourceContainer, targetContainer, draggedItem, overItem } = state;

    // Remove from source
    if (sourceContainer === 'visible') {
      localVisibleItems = localVisibleItems.filter(i => i.id !== draggedItem.id);
    } else {
      localHiddenItems = localHiddenItems.filter(i => i.id !== draggedItem.id);
    }

    // Add to target
    if (targetContainer === 'visible') {
      if (overItem) {
        const overIndex = localVisibleItems.findIndex(i => i.id === overItem.id);
        localVisibleItems.splice(overIndex, 0, draggedItem);
      } else {
        localVisibleItems.push(draggedItem);
      }
    } else { // targetContainer === 'hidden'
      if (overItem) {
        const overIndex = localHiddenItems.findIndex(i => i.id === overItem.id);
        localHiddenItems.splice(overIndex, 0, draggedItem);
      } else {
        localHiddenItems.push(draggedItem);
      }
    }
    
    // Persist changes
    viewsVisibilityStore.setLists(localVisibleItems, localHiddenItems);
  }
</script>

<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
  <!-- Visible Views -->
  <div>
    <h4 class="text-base font-medium mb-3">Visible in Sidebar</h4>
    <div
      class="border rounded-lg p-2 min-h-[200px] bg-background space-y-1"
      use:droppable={{
        container: "visible",
        callbacks: { onDrop: handleDrop },
      }}
    >
      {#each localVisibleItems as item (item.id)}
        <div use:draggable={{ container: "visible", dragData: item }} class="flex items-center p-2 rounded-md bg-card hover:bg-muted cursor-grab border">
          <GripVertical class="h-5 w-5 mr-2 text-muted-foreground" />
          <span class="flex-1 text-sm">{item.icon} {item.label}</span>
        </div>
      {/each}
    </div>
  </div>

  <!-- Hidden Views -->
  <div>
    <h4 class="text-base font-medium mb-3">Hidden from Sidebar</h4>
    <div
      class="border rounded-lg p-2 min-h-[200px] bg-muted/50 space-y-1"
      use:droppable={{
        container: "hidden",
        callbacks: { onDrop: handleDrop },
      }}
    >
      {#each localHiddenItems as item (item.id)}
        <div use:draggable={{ container: "hidden", dragData: item }} class="flex items-center p-2 rounded-md bg-card hover:bg-muted cursor-grab border">
          <GripVertical class="h-5 w-5 mr-2 text-muted-foreground" />
          <span class="flex-1 text-sm">{item.icon} {item.label}</span>
        </div>
      {/each}
    </div>
  </div>
</div>
