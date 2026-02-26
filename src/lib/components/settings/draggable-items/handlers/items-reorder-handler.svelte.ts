import type { DragDropState } from '@thisux/sveltednd';
import type { ViewItem } from '$lib/stores/views-visibility.svelte';

export interface ReorderResult {
  newVisibleItems: ViewItem[];
  newHiddenItems: ViewItem[];
}

/**
 * アイテムの並び替え処理を行うハンドラー
 */
export function createItemsReorderHandler() {
  /**
   * ドロップ時のアイテム並び替え処理
   */
  function reorderItems(
    state: DragDropState<unknown>,
    visibleItems: ViewItem[],
    hiddenItems: ViewItem[]
  ): ReorderResult {
    const { sourceContainer, targetContainer, targetElement } = state;
    const draggedItem = state.draggedItem as ViewItem;

    // Create new arrays to avoid mutations
    let newVisibleItems = [...visibleItems];
    let newHiddenItems = [...hiddenItems];

    // Remove from source
    if (sourceContainer === 'visible') {
      newVisibleItems = newVisibleItems.filter((i) => i.id !== draggedItem.id);
    } else {
      newHiddenItems = newHiddenItems.filter((i) => i.id !== draggedItem.id);
    }

    // Find target index from targetElement
    const targetIndex = findTargetIndex(
      targetElement,
      targetContainer as string,
      newVisibleItems,
      newHiddenItems
    );

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

    return { newVisibleItems, newHiddenItems };
  }

  /**
   * ドロップ位置のインデックスを検索
   */
  function findTargetIndex(
    targetElement: HTMLElement | null,
    targetContainer: string,
    visibleItems: ViewItem[],
    hiddenItems: ViewItem[]
  ): number {
    if (!targetElement) return -1;

    const targetItemId = findTargetItemId(targetElement);
    if (!targetItemId) return -1;

    if (targetContainer === 'visible') {
      return visibleItems.findIndex((i) => i.id === targetItemId);
    } else {
      return hiddenItems.findIndex((i) => i.id === targetItemId);
    }
  }

  /**
   * 対象要素のitem-idを検索（親要素も遡って探す）
   */
  function findTargetItemId(targetElement: HTMLElement): string | null {
    let targetItemId = targetElement.dataset?.itemId;

    // If not found directly, try parent elements
    if (!targetItemId) {
      let parent = targetElement.parentElement;
      while (parent && !targetItemId) {
        targetItemId = parent.dataset?.itemId;
        parent = parent.parentElement;
      }
    }

    return targetItemId || null;
  }

  return {
    reorderItems
  };
}
