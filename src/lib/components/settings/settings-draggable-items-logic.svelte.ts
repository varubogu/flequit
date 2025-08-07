import { getTranslationService } from '$lib/stores/locale.svelte';
import type { DragDropState } from '@thisux/sveltednd';
import { viewsVisibilityStore, type ViewItem } from '$lib/stores/views-visibility.svelte';

interface DragState {
  isDragging: boolean;
  draggedItem: ViewItem | null;
  dropZone: string | null; // 'visible' | 'hidden' | null
  insertIndex: number;
}

export class SettingsDraggableItemsLogic {
  // State
  localVisibleItems = $state([...viewsVisibilityStore.visibleViews]);
  localHiddenItems = $state([...viewsVisibilityStore.hiddenViews]);

  dragState = $state<DragState>({
    isDragging: false,
    draggedItem: null,
    dropZone: null,
    insertIndex: -1
  });

  // Translation service
  private translationService = getTranslationService();

  constructor() {
    this.setupEffect();
  }

  // Reactive messages
  visibleInSidebar = this.translationService.getMessage('visible_in_sidebar');
  hiddenFromSidebar = this.translationService.getMessage('hidden_from_sidebar');

  setupEffect() {
    $effect(() => {
      this.localVisibleItems = [...viewsVisibilityStore.visibleViews];
      this.localHiddenItems = [...viewsVisibilityStore.hiddenViews];
    });
  }

  handleDragStart(container: string, item: ViewItem) {
    this.dragState.isDragging = true;
    this.dragState.draggedItem = item;
  }

  handleDragOver(container: string, targetElement: HTMLElement | null) {
    if (!this.dragState.isDragging) return;

    this.dragState.dropZone = container;

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
        const items = container === 'visible' ? this.localVisibleItems : this.localHiddenItems;
        this.dragState.insertIndex = items.findIndex((i) => i.id === targetItemId);
      } else {
        this.dragState.insertIndex = -1;
      }
    } else {
      this.dragState.insertIndex = -1;
    }
  }

  handleDragEnd() {
    this.dragState.isDragging = false;
    this.dragState.draggedItem = null;
    this.dragState.dropZone = null;
    this.dragState.insertIndex = -1;
  }

  handleDrop(state: DragDropState<unknown>) {
    const { sourceContainer, targetContainer, targetElement } = state;
    const draggedItem = state.draggedItem as ViewItem;

    // Create new arrays to avoid mutations
    let newVisibleItems = [...this.localVisibleItems];
    let newHiddenItems = [...this.localHiddenItems];

    // Remove from source
    if (sourceContainer === 'visible') {
      newVisibleItems = newVisibleItems.filter((i) => i.id !== draggedItem.id);
    } else {
      newHiddenItems = newHiddenItems.filter((i) => i.id !== draggedItem.id);
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
    this.localVisibleItems = newVisibleItems;
    this.localHiddenItems = newHiddenItems;

    // Persist changes
    viewsVisibilityStore.setLists(newVisibleItems, newHiddenItems);

    // Reset drag state
    this.handleDragEnd();
  }
}
