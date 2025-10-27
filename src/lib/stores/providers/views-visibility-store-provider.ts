import {
	viewsVisibilityStore,
	type ViewsVisibilityStore
} from '$lib/stores/views-visibility.svelte';

let viewsStoreOverride: ViewsVisibilityStore | null = null;

export function resolveViewsVisibilityStore(): ViewsVisibilityStore {
	return viewsStoreOverride ?? viewsVisibilityStore;
}

export function provideViewsVisibilityStore(store: ViewsVisibilityStore | null) {
	viewsStoreOverride = store;
}

export function resetViewsVisibilityStoreOverride() {
	viewsStoreOverride = null;
}
