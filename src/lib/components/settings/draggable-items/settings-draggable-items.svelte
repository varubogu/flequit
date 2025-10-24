<script lang="ts">
  import { draggable, droppable, type DragDropState } from '@thisux/sveltednd';
  import { GripVertical } from 'lucide-svelte';
  import { useTranslation } from '$lib/hooks/use-translation.svelte';
  import { viewsVisibilityStore, type ViewItem } from '$lib/stores/views-visibility.svelte';

  interface DragState {
    isDragging: boolean;
    draggedItem: ViewItem | null;
    dropZone: string | null; // 'visible' | 'hidden' | null
    insertIndex: number;
  }

  // State
  let localVisibleItems = $state([...viewsVisibilityStore.visibleViews]);
  let localHiddenItems = $state([...viewsVisibilityStore.hiddenViews]);

  let dragState = $state<DragState>({
    isDragging: false,
    draggedItem: null,
    dropZone: null,
    insertIndex: -1
  });

  // Translation service
  const translationService = useTranslation();
  const visibleInSidebar = translationService.getMessage('visible_in_sidebar');
  const hiddenFromSidebar = translationService.getMessage('hidden_from_sidebar');

  // Sync with store
  $effect(() => {
    localVisibleItems = [...viewsVisibilityStore.visibleViews];
    localHiddenItems = [...viewsVisibilityStore.hiddenViews];
  });

  // Event handlers
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
        dragState.insertIndex = items.findIndex((i) => i.id === targetItemId);
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

  function handleDrop(state: DragDropState<unknown>) {
    const { sourceContainer, targetContainer, targetElement } = state;
    const draggedItem = state.draggedItem as ViewItem;

    // Create new arrays to avoid mutations
    let newVisibleItems = [...localVisibleItems];
    let newHiddenItems = [...localHiddenItems];

    // Remove from source
    if (sourceContainer === 'visible') {
      newVisibleItems = newVisibleItems.filter((i) => i.id !== draggedItem.id);
    } else {
      newHiddenItems = newHiddenItems.filter((i) => i.id !== draggedItem.id);
    }

    // Find target index from targetElement
    let targetIndex = -1;

    if (targetElement) {
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
          targetIndex = newVisibleItems.findIndex((i) => i.id === targetItemId);
        } else {
          targetIndex = newHiddenItems.findIndex((i) => i.id === targetItemId);
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
    } else {
      // targetContainer === 'hidden'
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

<div class="grid grid-cols-1 gap-6 md:grid-cols-2">
  <!-- Visible Views -->
  <div>
    <h4 class="mb-3 text-base font-medium">{visibleInSidebar()}</h4>
    <div
      class="bg-background relative min-h-[200px] space-y-1 rounded-lg border p-2 {dragState.isDragging &&
      dragState.dropZone === 'visible'
        ? 'border-primary bg-primary/5'
        : ''}"
      use:droppable={{
        container: 'visible',
        callbacks: {
          onDrop: handleDrop,
          onDragOver: (state) => handleDragOver('visible', state.targetElement)
        }
      }}
    >
      {#each localVisibleItems as item, index (item.id)}
        <!-- Drop indicator -->
        {#if dragState.isDragging && dragState.dropZone === 'visible' && dragState.insertIndex === index}
          <div class="bg-primary mx-2 my-1 h-0.5 rounded-full"></div>
        {/if}

        <div
          use:draggable={{
            container: 'visible',
            dragData: item,
            callbacks: {
              onDragStart: () => handleDragStart('visible', item),
              onDragEnd: handleDragEnd
            }
          }}
          data-item-id={item.id}
          class="bg-card hover:bg-muted flex cursor-grab items-center rounded-md border p-2 {dragState.draggedItem
            ?.id === item.id
            ? 'opacity-50'
            : ''}"
        >
          <GripVertical class="text-muted-foreground mr-2 h-5 w-5" />
          <span class="flex-1 text-sm">{item.icon} {item.label}</span>
        </div>
      {/each}

      <!-- Drop indicator at end -->
      {#if dragState.isDragging && dragState.dropZone === 'visible' && (dragState.insertIndex === -1 || dragState.insertIndex >= localVisibleItems.length)}
        <div class="bg-primary mx-2 my-1 h-0.5 rounded-full"></div>
      {/if}
    </div>
  </div>

  <!-- Hidden Views -->
  <div>
    <h4 class="mb-3 text-base font-medium">{hiddenFromSidebar()}</h4>
    <div
      class="bg-muted/50 relative min-h-[200px] space-y-1 rounded-lg border p-2 {dragState.isDragging &&
      dragState.dropZone === 'hidden'
        ? 'border-primary bg-primary/5'
        : ''}"
      use:droppable={{
        container: 'hidden',
        callbacks: {
          onDrop: handleDrop,
          onDragOver: (state) => handleDragOver('hidden', state.targetElement)
        }
      }}
    >
      {#each localHiddenItems as item, index (item.id)}
        <!-- Drop indicator -->
        {#if dragState.isDragging && dragState.dropZone === 'hidden' && dragState.insertIndex === index}
          <div class="bg-primary mx-2 my-1 h-0.5 rounded-full"></div>
        {/if}

        <div
          use:draggable={{
            container: 'hidden',
            dragData: item,
            callbacks: {
              onDragStart: () => handleDragStart('hidden', item),
              onDragEnd: handleDragEnd
            }
          }}
          data-item-id={item.id}
          class="bg-card hover:bg-muted flex cursor-grab items-center rounded-md border p-2 {dragState.draggedItem
            ?.id === item.id
            ? 'opacity-50'
            : ''}"
        >
          <GripVertical class="text-muted-foreground mr-2 h-5 w-5" />
          <span class="flex-1 text-sm">{item.icon} {item.label}</span>
        </div>
      {/each}

      <!-- Drop indicator at end -->
      {#if dragState.isDragging && dragState.dropZone === 'hidden' && (dragState.insertIndex === -1 || dragState.insertIndex >= localHiddenItems.length)}
        <div class="bg-primary mx-2 my-1 h-0.5 rounded-full"></div>
      {/if}
    </div>
  </div>
</div>
