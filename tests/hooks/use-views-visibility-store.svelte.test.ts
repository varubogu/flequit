import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
	useViewsVisibilityStore,
	provideViewsVisibilityStore,
	resetViewsVisibilityStoreOverride
} from '$lib/hooks/use-views-visibility-store.svelte';

const { mockViewsVisibilityStore } = vi.hoisted(() => ({
	mockViewsVisibilityStore: {
		configuration: { viewItems: [] },
		visibleViews: [{ id: 'all', label: 'All', icon: '📝', visible: true, order: 0 }],
		hiddenViews: [{ id: 'archived', label: 'Archived', icon: '📦', visible: false, order: 1 }],
		setLists: vi.fn(),
		resetToDefaults: vi.fn(),
		init: vi.fn()
	}
}));

describe('useViewsVisibilityStore', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		provideViewsVisibilityStore(mockViewsVisibilityStore);
	});

	afterEach(() => {
		resetViewsVisibilityStoreOverride();
	});

	it('ビュー可視ストアを取得できる', () => {
		const store = useViewsVisibilityStore();
		expect(store).toBeDefined();
		expect(store.visibleViews).toHaveLength(1);
	});

	it('同じインスタンスを返す', () => {
		const storeA = useViewsVisibilityStore();
		const storeB = useViewsVisibilityStore();
		expect(storeA).toBe(storeB);
	});

	it('setListsを呼び出せる', () => {
		const store = useViewsVisibilityStore();
		store.setLists(store.visibleViews, store.hiddenViews);
		expect(store.setLists).toHaveBeenCalledWith(store.visibleViews, store.hiddenViews);
	});

	it('resetToDefaultsを呼び出せる', () => {
		const store = useViewsVisibilityStore();
		store.resetToDefaults();
		expect(store.resetToDefaults).toHaveBeenCalled();
	});
});
