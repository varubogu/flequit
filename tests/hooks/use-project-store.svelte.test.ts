import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useProjectStore } from '$lib/hooks/use-project-store.svelte';
import type { ProjectStore } from '$lib/stores/project-store.svelte';

const { mockProjectStore } = vi.hoisted(() => ({
	mockProjectStore: {
		projects: [],
		selectedProject: null,
		addProjectToStore: vi.fn(),
		updateProjectInStore: vi.fn(),
		removeProjectFromStore: vi.fn(),
		reorderProjectsInStore: vi.fn(),
		moveProjectToPositionInStore: vi.fn(),
		getProjectById: vi.fn(),
		loadProjects: vi.fn(),
		setProjects: vi.fn(),
		reset: vi.fn()
	}
}));

vi.mock('$lib/stores/project-store.svelte', () => ({
	projectStore: mockProjectStore,
	ProjectStore: vi.fn()
}));

describe('useProjectStore', () => {
	let store: ProjectStore;

	beforeEach(() => {
		vi.clearAllMocks();
		store = useProjectStore();
	});

	it('プロジェクトストアを取得できる', () => {
		expect(store).toBeDefined();
	});

	it('同じインスタンスを返す', () => {
		const storeA = useProjectStore();
		const storeB = useProjectStore();
		expect(storeA).toBe(storeB);
	});

	it('プロジェクトのCRUD操作が利用できる', () => {
		store.addProjectToStore({} as never);
		store.updateProjectInStore('project-1', {});
		store.removeProjectFromStore('project-1');

		expect(store.addProjectToStore).toHaveBeenCalled();
		expect(store.updateProjectInStore).toHaveBeenCalledWith('project-1', {});
		expect(store.removeProjectFromStore).toHaveBeenCalledWith('project-1');
	});

	it('並び替えAPIが利用できる', () => {
		store.reorderProjectsInStore(0, 1);
		store.moveProjectToPositionInStore('project-1', 2);

		expect(store.reorderProjectsInStore).toHaveBeenCalledWith(0, 1);
		expect(store.moveProjectToPositionInStore).toHaveBeenCalledWith('project-1', 2);
	});

	it('ヘルパーAPIが利用できる', () => {
		store.getProjectById('project-1');
		expect(store.getProjectById).toHaveBeenCalledWith('project-1');
	});
});
