import type { ViewItem } from '$lib/stores/views-visibility.svelte';

export interface DragState {
	isDragging: boolean;
	draggedItem: ViewItem | null;
	dropZone: string | null; // 'visible' | 'hidden' | null
	insertIndex: number;
}

/**
 * ドラッグ&ドロップ状態を管理するハンドラー
 */
export function createDragDropStateManager() {
	let dragState = $state<DragState>({
		isDragging: false,
		draggedItem: null,
		dropZone: null,
		insertIndex: -1
	});

	/**
	 * ドラッグ開始時の処理
	 */
	function handleDragStart(container: string, item: ViewItem) {
		dragState.isDragging = true;
		dragState.draggedItem = item;
	}

	/**
	 * ドラッグオーバー時の処理 - ドロップ位置を計算
	 */
	function handleDragOver(
		container: string,
		targetElement: HTMLElement | null,
		items: ViewItem[]
	) {
		if (!dragState.isDragging) return;

		dragState.dropZone = container;

		// Calculate insert index
		if (targetElement) {
			const targetItemId = findTargetItemId(targetElement);

			if (targetItemId) {
				dragState.insertIndex = items.findIndex((i) => i.id === targetItemId);
			} else {
				dragState.insertIndex = -1;
			}
		} else {
			dragState.insertIndex = -1;
		}
	}

	/**
	 * ドラッグ終了時の処理
	 */
	function handleDragEnd() {
		dragState.isDragging = false;
		dragState.draggedItem = null;
		dragState.dropZone = null;
		dragState.insertIndex = -1;
	}

	/**
	 * 対象要素のitem-idを検索（親要素も遡って探す）
	 */
	function findTargetItemId(targetElement: HTMLElement): string | null {
		let targetItemId = targetElement.dataset?.itemId;

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
		get dragState() {
			return dragState;
		},
		handleDragStart,
		handleDragOver,
		handleDragEnd
	};
}
