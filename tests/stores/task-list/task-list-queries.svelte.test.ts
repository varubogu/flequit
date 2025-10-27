import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TaskListQueries } from '$lib/stores/task-list/task-list-queries.svelte';
import type { IProjectStore, ISelectionStore } from '$lib/types/store-interfaces';
import type { ProjectTree } from '$lib/types/project';
import type { TaskWithSubTasks } from '$lib/types/task';

// ProjectStore のモック
const createMockProjectStore = (): IProjectStore => {
	const mockProjects: ProjectTree[] = [
		{
			id: 'project-1',
			name: 'Project 1',
			description: 'Description 1',
			color: '#FF0000',
			orderIndex: 0,
			createdAt: new Date('2024-01-01'),
			updatedAt: new Date('2024-01-01'),
			taskLists: [
				{
					id: 'list-1',
					projectId: 'project-1',
					name: 'List 1',
					description: 'Description 1',
					orderIndex: 0,
					createdAt: new Date('2024-01-01'),
					updatedAt: new Date('2024-01-01'),
					isArchived: false,
					tasks: [] as TaskWithSubTasks[]
				},
				{
					id: 'list-2',
					projectId: 'project-1',
					name: 'List 2',
					description: 'Description 2',
					orderIndex: 1,
					createdAt: new Date('2024-01-02'),
					updatedAt: new Date('2024-01-02'),
					isArchived: false,
					tasks: [] as TaskWithSubTasks[]
				}
			],
			isArchived: false,
			allTags: []
		},
		{
			id: 'project-2',
			name: 'Project 2',
			description: 'Description 2',
			color: '#00FF00',
			orderIndex: 1,
			createdAt: new Date('2024-01-03'),
			updatedAt: new Date('2024-01-03'),
			taskLists: [
				{
					id: 'list-3',
					projectId: 'project-2',
					name: 'List 3',
					description: 'Description 3',
					orderIndex: 0,
					createdAt: new Date('2024-01-03'),
					updatedAt: new Date('2024-01-03'),
					isArchived: false,
					tasks: [] as TaskWithSubTasks[]
				}
			],
			isArchived: false,
			allTags: []
		}
	];
	const store: IProjectStore = {
		projects: mockProjects,
		get selectedProject() {
			return null;
		},
		addProjectToStore: vi.fn(),
		updateProjectInStore: vi.fn(),
		removeProjectFromStore: vi.fn(),
		reorderProjectsInStore: vi.fn(),
		moveProjectToPositionInStore: vi.fn(),
		getProjectById: vi.fn((id: string) => mockProjects.find((p) => p.id === id) ?? null),
		loadProjects: vi.fn(),
		setProjects: vi.fn((projects: ProjectTree[]) => {
			store.projects = projects;
		}),
		reset: vi.fn()
	};
	return store;
};

// SelectionStore のモック
const createMockSelectionStore = (selectedListId: string | null = null): ISelectionStore => {
	const selection: ISelectionStore = {
		selectedProjectId: null,
		selectedListId: selectedListId,
		selectedTaskId: null,
		selectedSubTaskId: null,
		pendingTaskSelection: null,
		pendingSubTaskSelection: null,
		selectProject: vi.fn((projectId: string | null) => {
			selection.selectedProjectId = projectId;
			selection.selectedListId = null;
		}),
		selectList: vi.fn((listId: string | null) => {
			selection.selectedListId = listId;
			selection.selectedProjectId = null;
		}),
		selectTask: vi.fn((taskId: string | null) => {
			selection.selectedTaskId = taskId;
			selection.selectedSubTaskId = null;
		}),
		selectSubTask: vi.fn((subTaskId: string | null) => {
			selection.selectedSubTaskId = subTaskId;
			selection.selectedTaskId = null;
		}),
		clearPendingSelections: vi.fn(() => {
			selection.pendingTaskSelection = null;
			selection.pendingSubTaskSelection = null;
		}),
		reset: vi.fn(() => {
			selection.selectedProjectId = null;
			selection.selectedListId = null;
			selection.selectedTaskId = null;
			selection.selectedSubTaskId = null;
			selection.pendingTaskSelection = null;
			selection.pendingSubTaskSelection = null;
		})
	};
	return selection;
};

describe('TaskListQueries', () => {
	let projectStore: IProjectStore;
	let selectionStore: ISelectionStore;
	let queries: TaskListQueries;

	beforeEach(() => {
		projectStore = createMockProjectStore();
		selectionStore = createMockSelectionStore('list-1');
		queries = new TaskListQueries(projectStore, selectionStore);
	});

	describe('selectedTaskList', () => {
		it('選択されたタスクリストを返す', () => {
			const selected = queries.selectedTaskList;

			expect(selected).not.toBeNull();
			expect(selected?.id).toBe('list-1');
			expect(selected?.name).toBe('List 1');
			expect(selected?.projectId).toBe('project-1');
		});

		it('タスクリストが選択されていない場合はnullを返す', () => {
			selectionStore.selectedListId = null;
			queries = new TaskListQueries(projectStore, selectionStore);

			const selected = queries.selectedTaskList;

			expect(selected).toBeNull();
		});

		it('存在しないタスクリストが選択されている場合はnullを返す', () => {
			selectionStore.selectedListId = 'non-existent';
			queries = new TaskListQueries(projectStore, selectionStore);

			const selected = queries.selectedTaskList;

			expect(selected).toBeNull();
		});

		it('複数プロジェクトをまたいで正しいタスクリストを返す', () => {
			selectionStore.selectedListId = 'list-3';
			queries = new TaskListQueries(projectStore, selectionStore);

			const selected = queries.selectedTaskList;

			expect(selected).not.toBeNull();
			expect(selected?.id).toBe('list-3');
			expect(selected?.name).toBe('List 3');
			expect(selected?.projectId).toBe('project-2');
		});
	});

	describe('getProjectIdByListId', () => {
		it('タスクリストIDからプロジェクトIDを取得する', () => {
			const projectId = queries.getProjectIdByListId('list-1');

			expect(projectId).toBe('project-1');
		});

		it('別のプロジェクトのタスクリストIDでも正しく取得する', () => {
			const projectId = queries.getProjectIdByListId('list-3');

			expect(projectId).toBe('project-2');
		});

		it('存在しないタスクリストIDの場合はnullを返す', () => {
			const projectId = queries.getProjectIdByListId('non-existent');

			expect(projectId).toBeNull();
		});

		it('nullを渡した場合はnullを返す', () => {
			const projectId = queries.getProjectIdByListId(null as any);

			expect(projectId).toBeNull();
		});

		it('undefinedを渡した場合はnullを返す', () => {
			const projectId = queries.getProjectIdByListId(undefined as any);

			expect(projectId).toBeNull();
		});

		it('空文字列を渡した場合はnullを返す', () => {
			const projectId = queries.getProjectIdByListId('');

			expect(projectId).toBeNull();
		});
	});

	describe('エッジケース', () => {
		it('プロジェクトが空の場合はnullを返す', () => {
			projectStore.projects = [];
			queries = new TaskListQueries(projectStore, selectionStore);

			const selected = queries.selectedTaskList;
			const projectId = queries.getProjectIdByListId('list-1');

			expect(selected).toBeNull();
			expect(projectId).toBeNull();
		});

		it('タスクリストが空のプロジェクトでもエラーにならない', () => {
			projectStore.projects = [
				{
					id: 'empty-project',
					name: 'Empty Project',
					description: '',
					color: '#000000',
					orderIndex: 0,
					createdAt: new Date(),
					updatedAt: new Date(),
					taskLists: [],
					isArchived: false,
					allTags: []
				}
			];
			queries = new TaskListQueries(projectStore, selectionStore);

			const selected = queries.selectedTaskList;
			const projectId = queries.getProjectIdByListId('any-id');

			expect(selected).toBeNull();
			expect(projectId).toBeNull();
		});
	});
});
