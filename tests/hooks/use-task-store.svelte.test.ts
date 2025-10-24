import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useTaskStore } from '$lib/hooks/use-task-store.svelte';
import type { TaskStore } from '$lib/stores/tasks.svelte';

// TaskStoreのモック
vi.mock('$lib/stores/tasks.svelte', () => {
	const mockTaskStore = {
		// プロジェクトデータ
		projects: [],
		setProjects: vi.fn(),
		loadProjectsData: vi.fn(),

		// 新規タスクモード
		isNewTaskMode: false,
		newTaskData: null,

		// 選択状態
		selectedProjectId: null,
		selectedListId: null,
		selectedTaskId: null,
		selectedSubTaskId: null,
		pendingTaskSelection: null,
		pendingSubTaskSelection: null,
		selectedTask: null,
		selectedSubTask: null,
		clearPendingSelections: vi.fn(),

		// タスクリスト取得
		allTasks: [],
		todayTasks: [],
		overdueTasks: [],

		// タスク検索・取得
		getTaskById: vi.fn(() => null),
		getTaskProjectAndList: vi.fn(() => null),
		getProjectIdByTaskId: vi.fn(() => null),
		getProjectIdByTagId: vi.fn(() => null),
		getTaskCountByTag: vi.fn(() => 0),

		// タグ操作
		attachTagToTask: vi.fn(),
		detachTagFromTask: vi.fn(() => null),
		removeTagFromAllTasks: vi.fn(),
		updateTagInAllTasks: vi.fn(),

		// 内部ストアアクセス
		entities: {},
		selection: {},
		draft: {}
	};

	return {
		taskStore: mockTaskStore,
		TaskStore: vi.fn()
	};
});

describe('useTaskStore', () => {
	let store: TaskStore;

	beforeEach(() => {
		vi.clearAllMocks();
		store = useTaskStore();
	});

	it('タスクストアを取得できる', () => {
		expect(store).toBeDefined();
	});

	it('プロジェクトデータ管理機能が利用可能', () => {
		expect(store.projects).toBeDefined();
		expect(store.setProjects).toBeDefined();
		expect(store.loadProjectsData).toBeDefined();
	});

	it('選択状態管理機能が利用可能', () => {
		expect(store.selectedProjectId).toBeDefined();
		expect(store.selectedListId).toBeDefined();
		expect(store.selectedTaskId).toBeDefined();
		expect(store.selectedSubTaskId).toBeDefined();
		expect(store.selectedTask).toBeDefined();
		expect(store.clearPendingSelections).toBeDefined();
	});

	it('新規タスクモード機能が利用可能', () => {
		expect(store.isNewTaskMode).toBeDefined();
		expect(store.newTaskData).toBeDefined();
	});

	it('タスクリスト取得機能が利用可能', () => {
		expect(store.allTasks).toBeDefined();
		expect(store.todayTasks).toBeDefined();
		expect(store.overdueTasks).toBeDefined();
	});

	it('タスク検索機能が利用可能', () => {
		expect(store.getTaskById).toBeDefined();
		expect(store.getTaskProjectAndList).toBeDefined();
		expect(store.getProjectIdByTaskId).toBeDefined();
	});

	it('タグ操作機能が利用可能', () => {
		expect(store.attachTagToTask).toBeDefined();
		expect(store.detachTagFromTask).toBeDefined();
		expect(store.removeTagFromAllTasks).toBeDefined();
		expect(store.updateTagInAllTasks).toBeDefined();
	});

	it('内部ストアへのアクセスが可能', () => {
		expect(store.entities).toBeDefined();
		expect(store.selection).toBeDefined();
		expect(store.draft).toBeDefined();
	});

	it('同じインスタンスを返す', () => {
		const store1 = useTaskStore();
		const store2 = useTaskStore();

		// 同じオブジェクトへの参照を返すことを確認
		expect(store1).toBe(store2);
	});

	it('タスクIDでタスクを取得できる', () => {
		store.getTaskById('task-1');

		expect(store.getTaskById).toHaveBeenCalledWith('task-1');
	});

	it('タグ数を取得できる', () => {
		store.getTaskCountByTag('important');

		expect(store.getTaskCountByTag).toHaveBeenCalledWith('important');
	});

	it('ペンディング選択をクリアできる', () => {
		store.clearPendingSelections();

		expect(store.clearPendingSelections).toHaveBeenCalled();
	});
});
