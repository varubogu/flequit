import { describe, it, expect, beforeEach } from 'vitest';
import type { DragDropState } from '@thisux/sveltednd';
import { createItemsReorderHandler } from '$lib/components/settings/draggable-items/handlers/items-reorder-handler.svelte';
import type { ViewItem } from '$lib/stores/views-visibility.svelte';

const createDragState = (
  params: Partial<DragDropState<ViewItem>> & { draggedItem: ViewItem }
): DragDropState<ViewItem> => ({
  isDragging: params.isDragging ?? true,
  sourceContainer: params.sourceContainer ?? 'visible',
  targetContainer: params.targetContainer ?? 'visible',
  targetElement: params.targetElement ?? null,
  draggedItem: params.draggedItem,
  invalidDrop: params.invalidDrop
});

describe('ItemsReorderHandler', () => {
  let handler: ReturnType<typeof createItemsReorderHandler>;
  let visibleItems: ViewItem[];
  let hiddenItems: ViewItem[];

  beforeEach(() => {
    handler = createItemsReorderHandler();
    visibleItems = [
      { id: 'all', label: 'All Tasks', icon: '📋', visible: true, order: 0 },
      { id: 'today', label: 'Today', icon: '📅', visible: true, order: 1 }
    ];
    hiddenItems = [{ id: 'upcoming', label: 'Upcoming', icon: '🔜', visible: false, order: 2 }];
  });

  describe('reorderItems', () => {
    it('visible → hidden: append when no target', () => {
      const state = createDragState({
        sourceContainer: 'visible',
        targetContainer: 'hidden',
        draggedItem: visibleItems[0]
      });

      const result = handler.reorderItems(state, visibleItems, hiddenItems);

      expect(result.newVisibleItems.map((i) => i.id)).toEqual(['today']);
      expect(result.newHiddenItems.map((i) => i.id)).toEqual(['upcoming', 'all']);
    });

    it('hidden → visible: append when no target', () => {
      const state = createDragState({
        sourceContainer: 'hidden',
        targetContainer: 'visible',
        draggedItem: hiddenItems[0]
      });

      const result = handler.reorderItems(state, visibleItems, hiddenItems);

      expect(result.newVisibleItems.map((i) => i.id)).toEqual(['all', 'today', 'upcoming']);
      expect(result.newHiddenItems).toHaveLength(0);
    });

    it('insert into visible at specific index', () => {
      const targetElement = document.createElement('div');
      targetElement.dataset.itemId = 'today';

      const state = createDragState({
        sourceContainer: 'hidden',
        targetContainer: 'visible',
        draggedItem: hiddenItems[0],
        targetElement
      });

      const result = handler.reorderItems(state, visibleItems, hiddenItems);

      expect(result.newVisibleItems.map((i) => i.id)).toEqual(['all', 'upcoming', 'today']);
    });

    it('reorder within visible container', () => {
      const targetElement = document.createElement('div');
      targetElement.dataset.itemId = 'all';

      const state = createDragState({
        draggedItem: visibleItems[1],
        targetElement
      });

      const result = handler.reorderItems(state, visibleItems, hiddenItems);

      expect(result.newVisibleItems.map((i) => i.id)).toEqual(['today', 'all']);
    });

    it('reorder within hidden container', () => {
      const extendedHidden = [
        ...hiddenItems,
        { id: 'someday', label: 'Someday', icon: '💭', visible: false, order: 3 }
      ];
      const targetElement = document.createElement('div');
      targetElement.dataset.itemId = 'upcoming';

      const state = createDragState({
        sourceContainer: 'hidden',
        targetContainer: 'hidden',
        draggedItem: extendedHidden[1],
        targetElement
      });

      const result = handler.reorderItems(state, visibleItems, extendedHidden);

      expect(result.newHiddenItems.map((i) => i.id)).toEqual(['someday', 'upcoming']);
    });

    it('falls back to append when dataset missing', () => {
      const targetElement = document.createElement('div');

      const state = createDragState({
        sourceContainer: 'hidden',
        targetContainer: 'visible',
        draggedItem: hiddenItems[0],
        targetElement
      });

      const result = handler.reorderItems(state, visibleItems, hiddenItems);
      expect(result.newVisibleItems.map((i) => i.id)).toEqual(['all', 'today', 'upcoming']);
    });

    it('searches parent elements for item id', () => {
      const parentElement = document.createElement('div');
      parentElement.dataset.itemId = 'today';
      const childElement = document.createElement('span');
      parentElement.appendChild(childElement);

      const state = createDragState({
        sourceContainer: 'hidden',
        targetContainer: 'visible',
        draggedItem: hiddenItems[0],
        targetElement: childElement
      });

      const result = handler.reorderItems(state, visibleItems, hiddenItems);
      expect(result.newVisibleItems.map((i) => i.id)).toEqual(['all', 'upcoming', 'today']);
    });

    it('does not mutate original arrays', () => {
      const state = createDragState({
        sourceContainer: 'visible',
        targetContainer: 'hidden',
        draggedItem: visibleItems[0]
      });

      handler.reorderItems(state, visibleItems, hiddenItems);
      expect(visibleItems.map((i) => i.id)).toEqual(['all', 'today']);
      expect(hiddenItems.map((i) => i.id)).toEqual(['upcoming']);
    });
  });

  describe('edge cases', () => {
    it('moving within same container without target keeps item at end', () => {
      const state = createDragState({
        sourceContainer: 'visible',
        targetContainer: 'visible',
        draggedItem: visibleItems[0]
      });

      const result = handler.reorderItems(state, visibleItems, hiddenItems);
      expect(result.newVisibleItems.map((i) => i.id)).toEqual(['today', 'all']);
    });

    it('handles deeply nested parents when finding id', () => {
      const topElement = document.createElement('div');
      topElement.dataset.itemId = 'all';
      const middleElement = document.createElement('div');
      const deepElement = document.createElement('span');
      topElement.appendChild(middleElement);
      middleElement.appendChild(deepElement);

      const state = createDragState({
        draggedItem: visibleItems[1],
        targetElement: deepElement
      });

      const result = handler.reorderItems(state, visibleItems, hiddenItems);
      expect(result.newVisibleItems.map((i) => i.id)).toEqual(['today', 'all']);
    });
  });
});
