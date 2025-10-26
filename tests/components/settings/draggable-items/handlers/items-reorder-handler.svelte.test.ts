import { describe, it, expect, beforeEach } from 'vitest';
import { createItemsReorderHandler } from '$lib/components/settings/draggable-items/handlers/items-reorder-handler.svelte';
import type { ViewItem } from '$lib/stores/views-visibility.svelte';
import type { DragDropState } from '@thisux/sveltednd';

describe('ItemsReorderHandler', () => {
	let handler: ReturnType<typeof createItemsReorderHandler>;
	let visibleItems: ViewItem[];
	let hiddenItems: ViewItem[];

	beforeEach(() => {
		handler = createItemsReorderHandler();
		visibleItems = [
			{ id: 'all', label: 'All Tasks', icon: '📋', visible: true },
			{ id: 'today', label: 'Today', icon: '📅', visible: true }
		];
		hiddenItems = [{ id: 'upcoming', label: 'Upcoming', icon: '🔜', visible: false }];
	});

	describe('reorderItems', () => {
		it('should move item from visible to hidden at end', () => {
			const state: DragDropState<unknown> = {
				sourceContainer: 'visible',
				targetContainer: 'hidden',
				draggedItem: visibleItems[0],
				targetElement: null
			};

			const result = handler.reorderItems(state, visibleItems, hiddenItems);

			expect(result.newVisibleItems).toHaveLength(1);
			expect(result.newVisibleItems[0].id).toBe('today');
			expect(result.newHiddenItems).toHaveLength(2);
			expect(result.newHiddenItems[1].id).toBe('all');
		});

		it('should move item from hidden to visible at end', () => {
			const state: DragDropState<unknown> = {
				sourceContainer: 'hidden',
				targetContainer: 'visible',
				draggedItem: hiddenItems[0],
				targetElement: null
			};

			const result = handler.reorderItems(state, visibleItems, hiddenItems);

			expect(result.newVisibleItems).toHaveLength(3);
			expect(result.newVisibleItems[2].id).toBe('upcoming');
			expect(result.newHiddenItems).toHaveLength(0);
		});

		it('should insert item at specific position in visible list', () => {
			const targetElement = {
				dataset: { itemId: 'today' },
				parentElement: null
			} as HTMLElement;

			const state: DragDropState<unknown> = {
				sourceContainer: 'hidden',
				targetContainer: 'visible',
				draggedItem: hiddenItems[0],
				targetElement
			};

			const result = handler.reorderItems(state, visibleItems, hiddenItems);

			expect(result.newVisibleItems).toHaveLength(3);
			expect(result.newVisibleItems[1].id).toBe('upcoming');
			expect(result.newVisibleItems[2].id).toBe('today');
		});

		it('should reorder within visible list', () => {
			const targetElement = {
				dataset: { itemId: 'all' },
				parentElement: null
			} as HTMLElement;

			const state: DragDropState<unknown> = {
				sourceContainer: 'visible',
				targetContainer: 'visible',
				draggedItem: visibleItems[1],
				targetElement
			};

			const result = handler.reorderItems(state, visibleItems, hiddenItems);

			expect(result.newVisibleItems).toHaveLength(2);
			expect(result.newVisibleItems[0].id).toBe('today');
			expect(result.newVisibleItems[1].id).toBe('all');
		});

		it('should reorder within hidden list', () => {
			const moreHiddenItems = [
				...hiddenItems,
				{ id: 'someday', label: 'Someday', icon: '💭', visible: false }
			];

			const targetElement = {
				dataset: { itemId: 'upcoming' },
				parentElement: null
			} as HTMLElement;

			const state: DragDropState<unknown> = {
				sourceContainer: 'hidden',
				targetContainer: 'hidden',
				draggedItem: moreHiddenItems[1],
				targetElement
			};

			const result = handler.reorderItems(state, visibleItems, moreHiddenItems);

			expect(result.newHiddenItems).toHaveLength(2);
			expect(result.newHiddenItems[0].id).toBe('someday');
			expect(result.newHiddenItems[1].id).toBe('upcoming');
		});

		it('should handle target element without dataset', () => {
			const targetElement = {
				parentElement: null
			} as HTMLElement;

			const state: DragDropState<unknown> = {
				sourceContainer: 'hidden',
				targetContainer: 'visible',
				draggedItem: hiddenItems[0],
				targetElement
			};

			const result = handler.reorderItems(state, visibleItems, hiddenItems);

			// Should append to end when no valid target index found
			expect(result.newVisibleItems).toHaveLength(3);
			expect(result.newVisibleItems[2].id).toBe('upcoming');
		});

		it('should search parent elements for item id', () => {
			const childElement = {} as HTMLElement;
			const parentElement = {
				dataset: { itemId: 'today' },
				parentElement: null
			} as HTMLElement;
			childElement.parentElement = parentElement;

			const state: DragDropState<unknown> = {
				sourceContainer: 'hidden',
				targetContainer: 'visible',
				draggedItem: hiddenItems[0],
				targetElement: childElement
			};

			const result = handler.reorderItems(state, visibleItems, hiddenItems);

			expect(result.newVisibleItems[1].id).toBe('upcoming');
			expect(result.newVisibleItems[2].id).toBe('today');
		});

		it('should not mutate original arrays', () => {
			const originalVisibleLength = visibleItems.length;
			const originalHiddenLength = hiddenItems.length;

			const state: DragDropState<unknown> = {
				sourceContainer: 'visible',
				targetContainer: 'hidden',
				draggedItem: visibleItems[0],
				targetElement: null
			};

			handler.reorderItems(state, visibleItems, hiddenItems);

			expect(visibleItems).toHaveLength(originalVisibleLength);
			expect(hiddenItems).toHaveLength(originalHiddenLength);
		});
	});

	describe('edge cases', () => {
		it('should handle moving item to same container', () => {
			const state: DragDropState<unknown> = {
				sourceContainer: 'visible',
				targetContainer: 'visible',
				draggedItem: visibleItems[0],
				targetElement: null
			};

			const result = handler.reorderItems(state, visibleItems, hiddenItems);

			expect(result.newVisibleItems).toHaveLength(2);
			// Item should be moved to end
			expect(result.newVisibleItems[1].id).toBe('all');
		});

		it('should handle deeply nested parent elements', () => {
			const deepElement = {} as HTMLElement;
			const middleElement = { parentElement: null } as HTMLElement;
			const topElement = {
				dataset: { itemId: 'all' },
				parentElement: null
			} as HTMLElement;

			deepElement.parentElement = middleElement;
			middleElement.parentElement = topElement;

			const state: DragDropState<unknown> = {
				sourceContainer: 'hidden',
				targetContainer: 'visible',
				draggedItem: hiddenItems[0],
				targetElement: deepElement
			};

			const result = handler.reorderItems(state, visibleItems, hiddenItems);

			expect(result.newVisibleItems[0].id).toBe('upcoming');
			expect(result.newVisibleItems[1].id).toBe('all');
		});
	});
});
