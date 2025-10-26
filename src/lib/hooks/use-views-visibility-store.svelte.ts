import {
	viewsVisibilityStore,
	type ViewItem,
	type ViewsConfiguration
} from '$lib/stores/views-visibility.svelte';

export type ViewsVisibilityStore = typeof viewsVisibilityStore;

/**
 * useViewsVisibilityStore - ビュー可視状態ストアを取得するComposable
 *
 * 責務: サイドバー表示ビューの並び替え・永続化 API をコンポーネントへ提供する。
 * 利点:
 * - コンポーネントがストア実装に直接依存せず、テストモックも容易
 * - hooks 層で型を再エクスポートすることで API ドキュメント化を補助
 */
export function useViewsVisibilityStore(): ViewsVisibilityStore {
	return viewsVisibilityStore;
}

export type { ViewItem, ViewsConfiguration };
