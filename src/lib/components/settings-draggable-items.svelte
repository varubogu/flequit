<script lang="ts">
  import { draggable, droppable, type DragDropState } from "@thisux/sveltednd";
  import { viewsVisibilityStore, type ViewItem } from '$lib/stores/views-visibility.svelte';
  import { GripVertical } from 'lucide-svelte';

  let localVisibleItems = $state([...viewsVisibilityStore.visibleViews]);
  let localHiddenItems = $state([...viewsVisibilityStore.hiddenViews]);
  
  // Drag preview state
  let dragState = $state({
    isDragging: false,
    draggedItem: null as ViewItem | null,
    dropZone: null as string | null, // 'visible' | 'hidden' | null
    insertIndex: -1
  });

  $effect(() => {
    localVisibleItems = [...viewsVisibilityStore.visibleViews];
    localHiddenItems = [...viewsVisibilityStore.hiddenViews];
  });

  function handleDragStart(container: string, item: ViewItem) {
    dragState.isDragging = true;
    dragState.draggedItem = item;
  }

  function handleDragOver(container: string, targetElement: HTMLElement | null) {
    if (!dragState.isDragging) return;
    
    dragState.dropZone = container;
    
    // Calculate insert index
    if (targetElement) {
      let targetItemId = targetElement.dataset?.itemId;
      
      if (!targetItemId) {
        let parent = targetElement.parentElement;
        while (parent && !targetItemId) {
          targetItemId = parent.dataset?.itemId;
          parent = parent.parentElement;
        }
      }
      
      if (targetItemId) {
        const items = container === 'visible' ? localVisibleItems : localHiddenItems;
        dragState.insertIndex = items.findIndex(i => i.id === targetItemId);
      } else {
        dragState.insertIndex = -1;
      }
    } else {
      dragState.insertIndex = -1;
    }
  }

  function handleDragEnd() {
    dragState.isDragging = false;
    dragState.draggedItem = null;
    dragState.dropZone = null;
    dragState.insertIndex = -1;
  }

  function handleDrop(state: DragDropState<ViewItem>) {
    const { sourceContainer, targetContainer, draggedItem, targetElement } = state;

    // Create new arrays to avoid mutations
    let newVisibleItems = [...localVisibleItems];
    let newHiddenItems = [...localHiddenItems];

    // Remove from source
    if (sourceContainer === 'visible') {
      newVisibleItems = newVisibleItems.filter(i => i.id !== draggedItem.id);
    } else {
      newHiddenItems = newHiddenItems.filter(i => i.id !== draggedItem.id);
    }

    // Find target index from targetElement
    let targetIndex = -1;
    
    if (targetElement) {
      // Try multiple approaches to find the target item
      let targetItemId = targetElement.dataset?.itemId;
      
      // If not found directly, try parent elements
      if (!targetItemId) {
        let parent = targetElement.parentElement;
        while (parent && !targetItemId) {
          targetItemId = parent.dataset?.itemId;
          parent = parent.parentElement;
        }
      }
      
      if (targetItemId) {
        if (targetContainer === 'visible') {
          targetIndex = newVisibleItems.findIndex(i => i.id === targetItemId);
        } else {
          targetIndex = newHiddenItems.findIndex(i => i.id === targetItemId);
        }
      }
    }

    // Add to target
    if (targetContainer === 'visible') {
      if (targetIndex >= 0) {
        newVisibleItems.splice(targetIndex, 0, draggedItem);
      } else {
        newVisibleItems.push(draggedItem);
      }
    } else { // targetContainer === 'hidden'
      if (targetIndex >= 0) {
        newHiddenItems.splice(targetIndex, 0, draggedItem);
      } else {
        newHiddenItems.push(draggedItem);
      }
    }

    // Update local state
    localVisibleItems = newVisibleItems;
    localHiddenItems = newHiddenItems;
    
    // Persist changes
    viewsVisibilityStore.setLists(newVisibleItems, newHiddenItems);
    
    // Reset drag state
    handleDragEnd();
  }
</script>

<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
  <!-- Visible Views -->
  <div>
    <h4 class="text-base font-medium mb-3">Visible in Sidebar</h4>
    <div
      class="border rounded-lg p-2 min-h-[200px] bg-background space-y-1 relative {dragState.isDragging && dragState.dropZone === 'visible' ? 'border-primary bg-primary/5' : ''}"
      use:droppable={{
        container: "visible",
        callbacks: { 
          onDrop: handleDrop,
          onDragOver: (state) => handleDragOver("visible", state.targetElement)
        },
      }}
    >
      {#each localVisibleItems as item, index (item.id)}
        <!-- Drop indicator -->
        {#if dragState.isDragging && dragState.dropZone === 'visible' && dragState.insertIndex === index}
          <div class="h-0.5 bg-primary rounded-full mx-2 my-1"></div>
        {/if}
        
        <div 
          use:draggable={{ 
            container: "visible", 
            dragData: item,
            callbacks: {
              onDragStart: () => handleDragStart("visible", item),
              onDragEnd: handleDragEnd
            }
          }} 
          data-item-id={item.id}
          class="flex items-center p-2 rounded-md bg-card hover:bg-muted cursor-grab border {dragState.draggedItem?.id === item.id ? 'opacity-50' : ''}"
        >
          <GripVertical class="h-5 w-5 mr-2 text-muted-foreground" />
          <span class="flex-1 text-sm">{item.icon} {item.label}</span>
        </div>
      {/each}
      
      <!-- Drop indicator at end -->
      {#if dragState.isDragging && dragState.dropZone === 'visible' && (dragState.insertIndex === -1 || dragState.insertIndex >= localVisibleItems.length)}
        <div class="h-0.5 bg-primary rounded-full mx-2 my-1"></div>
      {/if}
    </div>
  </div>

  <!-- Hidden Views -->
  <div>
    <h4 class="text-base font-medium mb-3">Hidden from Sidebar</h4>
    <div
      class="border rounded-lg p-2 min-h-[200px] bg-muted/50 space-y-1 relative {dragState.isDragging && dragState.dropZone === 'hidden' ? 'border-primary bg-primary/5' : ''}"
      use:droppable={{
        container: "hidden",
        callbacks: { 
          onDrop: handleDrop,
          onDragOver: (state) => handleDragOver("hidden", state.targetElement)
        },
      }}
    >
      {#each localHiddenItems as item, index (item.id)}
        <!-- Drop indicator -->
        {#if dragState.isDragging && dragState.dropZone === 'hidden' && dragState.insertIndex === index}
          <div class="h-0.5 bg-primary rounded-full mx-2 my-1"></div>
        {/if}
        
        <div 
          use:draggable={{ 
            container: "hidden", 
            dragData: item,
            callbacks: {
              onDragStart: () => handleDragStart("hidden", item),
              onDragEnd: handleDragEnd
            }
          }} 
          data-item-id={item.id}
          class="flex items-center p-2 rounded-md bg-card hover:bg-muted cursor-grab border {dragState.draggedItem?.id === item.id ? 'opacity-50' : ''}"
        >
          <GripVertical class="h-5 w-5 mr-2 text-muted-foreground" />
          <span class="flex-1 text-sm">{item.icon} {item.label}</span>
        </div>
      {/each}
      
      <!-- Drop indicator at end -->
      {#if dragState.isDragging && dragState.dropZone === 'hidden' && (dragState.insertIndex === -1 || dragState.insertIndex >= localHiddenItems.length)}
        <div class="h-0.5 bg-primary rounded-full mx-2 my-1"></div>
      {/if}
    </div>
  </div>
</div>
