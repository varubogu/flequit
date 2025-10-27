import type { ProjectStore } from '$lib/stores/project-store.svelte';
import {
	provideProjectStore,
	resetProjectStoreOverride
} from '$lib/hooks/use-project-store.svelte';
import type { ViewsVisibilityStore } from '$lib/hooks/use-views-visibility-store.svelte';
import {
	provideViewsVisibilityStore,
	resetViewsVisibilityStoreOverride
} from '$lib/hooks/use-views-visibility-store.svelte';

/**
 * 一時的に ProjectStore を差し替え、完了後に自動でリセットするヘルパー。
 */
export function withProjectStoreOverride(store: ProjectStore, run: () => void) {
	provideProjectStore(store);
	try {
		run();
	} finally {
		resetProjectStoreOverride();
	}
}

/**
 * ProjectStore の上書きをテストライフサイクルで管理したい場合に使用。
 */
export function setupProjectStoreOverride(store: ProjectStore) {
	provideProjectStore(store);
	return () => {
		resetProjectStoreOverride();
	};
}

/**
 * ViewsVisibilityStore の一時差し替えヘルパー。
 */
export function withViewsVisibilityStoreOverride(store: ViewsVisibilityStore, run: () => void) {
	provideViewsVisibilityStore(store);
	try {
		run();
	} finally {
		resetViewsVisibilityStoreOverride();
	}
}

/**
 * ViewsVisibilityStore 上書きをテストライフサイクルで制御するヘルパー。
 */
export function setupViewsVisibilityStoreOverride(store: ViewsVisibilityStore) {
	provideViewsVisibilityStore(store);
	return () => {
		resetViewsVisibilityStoreOverride();
	};
}
