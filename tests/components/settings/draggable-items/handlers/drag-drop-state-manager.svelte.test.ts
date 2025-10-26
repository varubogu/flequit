import { describe, it, expect, beforeEach } from 'vitest';
import { createDragDropStateManager } from '$lib/components/settings/draggable-items/handlers/drag-drop-state-manager.svelte';
import type { ViewItem } from '$lib/stores/views-visibility.svelte';

describe('DragDropStateManager', () => {
	let manager: ReturnType<typeof createDragDropStateManager>;
	let mockItems: ViewItem[];

	beforeEach(() => {
		manager = createDragDropStateManager();
		mockItems = [
			{ id: 'all', label: 'All Tasks', icon: '📋', visible: true },
			{ id: 'today', label: 'Today', icon: '📅', visible: true },
			{ id: 'upcoming', label: 'Upcoming', icon: '🔜', visible: false }
		];
	});

	describe('initial state', () => {
		it('should initialize with default drag state', () => {
			expect(manager.dragState.isDragging).toBe(false);
			expect(manager.dragState.draggedItem).toBeNull();
			expect(manager.dragState.dropZone).toBeNull();
			expect(manager.dragState.insertIndex).toBe(-1);
		});
	});

	describe('handleDragStart', () => {
		it('should set dragging state and dragged item', () => {
			const item = mockItems[0];
			manager.handleDragStart('visible', item);

			expect(manager.dragState.isDragging).toBe(true);
			expect(manager.dragState.draggedItem).toStrictEqual(item);
		});

		it('should handle drag start for hidden container', () => {
			const item = mockItems[2];
			manager.handleDragStart('hidden', item);

			expect(manager.dragState.isDragging).toBe(true);
			expect(manager.dragState.draggedItem).toStrictEqual(item);
		});
	});

	describe('handleDragOver', () => {
		beforeEach(() => {
			manager.handleDragStart('visible', mockItems[0]);
		});

		it('should set drop zone when dragging', () => {
			manager.handleDragOver('visible', null, mockItems);

			expect(manager.dragState.dropZone).toBe('visible');
		});

		it('should calculate insert index from target element', () => {
			const targetElement = {
				dataset: { itemId: 'today' }
			} as HTMLElement;

			manager.handleDragOver('visible', targetElement, mockItems);

			expect(manager.dragState.insertIndex).toBe(1);
		});

		it('should search parent elements for item id', () => {
			const childElement = {} as HTMLElement;
			const parentElement = {
				dataset: { itemId: 'today' },
				parentElement: null
			} as HTMLElement;
			childElement.parentElement = parentElement;

			manager.handleDragOver('visible', childElement, mockItems);

			expect(manager.dragState.insertIndex).toBe(1);
		});

		it('should set insert index to -1 when target element is null', () => {
			manager.handleDragOver('visible', null, mockItems);

			expect(manager.dragState.insertIndex).toBe(-1);
		});

		it('should set insert index to -1 when item id not found', () => {
			const targetElement = {
				dataset: { itemId: 'unknown' },
				parentElement: null
			} as HTMLElement;

			manager.handleDragOver('visible', targetElement, mockItems);

			expect(manager.dragState.insertIndex).toBe(-1);
		});

		it('should not update when not dragging', () => {
			manager.handleDragEnd();
			const previousDropZone = manager.dragState.dropZone;

			manager.handleDragOver('visible', null, mockItems);

			expect(manager.dragState.dropZone).toBe(previousDropZone);
		});
	});

	describe('handleDragEnd', () => {
		it('should reset all drag state', () => {
			manager.handleDragStart('visible', mockItems[0]);
			manager.handleDragOver('visible', null, mockItems);

			manager.handleDragEnd();

			expect(manager.dragState.isDragging).toBe(false);
			expect(manager.dragState.draggedItem).toBeNull();
			expect(manager.dragState.dropZone).toBeNull();
			expect(manager.dragState.insertIndex).toBe(-1);
		});
	});

	describe('edge cases', () => {
		it('should handle drag over with deeply nested parent elements', () => {
			const deepElement = {} as HTMLElement;
			const middleElement = { parentElement: null } as HTMLElement;
			const topElement = {
				dataset: { itemId: 'upcoming' },
				parentElement: null
			} as HTMLElement;

			deepElement.parentElement = middleElement;
			middleElement.parentElement = topElement;

			manager.handleDragStart('visible', mockItems[0]);
			manager.handleDragOver('hidden', deepElement, mockItems);

			expect(manager.dragState.insertIndex).toBe(2);
		});

		it('should handle drag over with element without dataset', () => {
			const elementWithoutDataset = {
				parentElement: null
			} as HTMLElement;

			manager.handleDragStart('visible', mockItems[0]);
			manager.handleDragOver('visible', elementWithoutDataset, mockItems);

			expect(manager.dragState.insertIndex).toBe(-1);
		});
	});
});
