import { projectStore, type ProjectStore } from '$lib/stores/project-store.svelte';

let projectStoreOverride: ProjectStore | null = null;

export function resolveProjectStore(): ProjectStore {
	return projectStoreOverride ?? projectStore;
}

export function provideProjectStore(store: ProjectStore | null) {
	projectStoreOverride = store;
}

export function resetProjectStoreOverride() {
	projectStoreOverride = null;
}
