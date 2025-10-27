import type { ViewItem, ViewsConfiguration } from '$lib/stores/views-visibility.svelte';
import {
	resolveViewsVisibilityStore,
	provideViewsVisibilityStore,
	resetViewsVisibilityStoreOverride
} from '$lib/stores/providers/views-visibility-store-provider';

export type ViewsVisibilityStore = ReturnType<typeof resolveViewsVisibilityStore>;

/**
 * useViewsVisibilityStore - ビュー可視状態ストアを取得するComposable
 *
 * 責務: サイドバー表示ビューの並び替え・永続化 API をコンポーネントへ提供する。
 * 利点:
 * - コンポーネントがストア実装に直接依存せず、テストモックも容易
 * - hooks 層で型を再エクスポートすることで API ドキュメント化を補助
 */
export {
	provideViewsVisibilityStore,
	resetViewsVisibilityStoreOverride
};

export function useViewsVisibilityStore(): ViewsVisibilityStore {
	return resolveViewsVisibilityStore();
}
export type { ViewItem, ViewsConfiguration };
