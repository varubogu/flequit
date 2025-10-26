import type { DragDropState } from '@thisux/sveltednd';
import { viewsVisibilityStore, type ViewItem } from '$lib/stores/views-visibility.svelte';
import { createDragDropStateManager } from './handlers/drag-drop-state-manager.svelte';
import { createItemsReorderHandler } from './handlers/items-reorder-handler.svelte';

/**
 * ドラッグ可能なアイテムリストのコントローラー
 * 表示/非表示アイテムの並び替え処理を管理
 */
export function useSettingsDraggableItemsController() {
	// Local state synchronized with store
	let localVisibleItems = $state([...viewsVisibilityStore.visibleViews]);
	let localHiddenItems = $state([...viewsVisibilityStore.hiddenViews]);

	// Handlers
	const dragDropManager = createDragDropStateManager();
	const reorderHandler = createItemsReorderHandler();

	// Sync with store
	$effect(() => {
		localVisibleItems = [...viewsVisibilityStore.visibleViews];
		localHiddenItems = [...viewsVisibilityStore.hiddenViews];
	});

	/**
	 * ドラッグオーバー時の処理（visible用）
	 */
	function handleVisibleDragOver(targetElement: HTMLElement | null) {
		dragDropManager.handleDragOver('visible', targetElement, localVisibleItems);
	}

	/**
	 * ドラッグオーバー時の処理（hidden用）
	 */
	function handleHiddenDragOver(targetElement: HTMLElement | null) {
		dragDropManager.handleDragOver('hidden', targetElement, localHiddenItems);
	}

	/**
	 * ドロップ時の処理 - アイテムを並び替えてストアに保存
	 */
	function handleDrop(state: DragDropState<unknown>) {
		const { newVisibleItems, newHiddenItems } = reorderHandler.reorderItems(
			state,
			localVisibleItems,
			localHiddenItems
		);

		// Update local state
		localVisibleItems = newVisibleItems;
		localHiddenItems = newHiddenItems;

		// Persist changes
		viewsVisibilityStore.setLists(newVisibleItems, newHiddenItems);

		// Reset drag state
		dragDropManager.handleDragEnd();
	}

	const logic = $derived.by(() => ({
		localVisibleItems,
		localHiddenItems,
		dragState: dragDropManager.dragState,
		handleDragStart: dragDropManager.handleDragStart,
		handleVisibleDragOver,
		handleHiddenDragOver,
		handleDragEnd: dragDropManager.handleDragEnd,
		handleDrop
	}));

	return { logic };
}
