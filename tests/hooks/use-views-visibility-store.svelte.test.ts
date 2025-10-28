import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { useViewsVisibilityStore } from '$lib/hooks/use-views-visibility-store.svelte';
import { setupViewsVisibilityStoreOverride } from '../utils/store-overrides';
import { MockViewsVisibilityStore } from '../utils/mock-factories';

const { mockViewsVisibilityStore, onSetLists, onReset } = vi.hoisted(() => {
	const onSetLists = vi.fn();
	const onReset = vi.fn();
	return {
		mockViewsVisibilityStore: new MockViewsVisibilityStore({
			visible: [{ id: 'all', label: 'All', icon: '📝', visible: true, order: 0 }],
			hidden: [{ id: 'archived', label: 'Archived', icon: '📦', visible: false, order: 1 }],
			onSetLists,
			onReset
		}),
		onSetLists,
		onReset
	};
});

let cleanup: (() => void) | null = null;

describe('useViewsVisibilityStore', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	cleanup = setupViewsVisibilityStoreOverride(mockViewsVisibilityStore);
	});

	afterEach(() => {
		cleanup?.();
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
	const visible = [...store.visibleViews];
	const hidden = [...store.hiddenViews];
	store.setLists(visible, hidden);
	expect(mockViewsVisibilityStore.visibleViews).toBe(visible);
	expect(mockViewsVisibilityStore.hiddenViews).toBe(hidden);
	expect(onSetLists).toHaveBeenCalledWith(visible, hidden);
	});

	it('resetToDefaultsを呼び出せる', () => {
	const store = useViewsVisibilityStore();
	store.resetToDefaults();
	expect(onReset).toHaveBeenCalled();
	});
});
