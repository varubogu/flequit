import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SubTaskStore } from '$lib/stores/sub-task-store.svelte';
import type { IProjectStore, ISelectionStore } from '$lib/types/store-interfaces';
import type { ProjectTree } from '$lib/types/project';
import type { Tag } from '$lib/types/tag';
import {
	createMockProjectTree,
	createMockTaskListWithTasks,
	createMockTaskWithSubTasks
} from '../utils/mock-factories';

// SubTaskServiceのモック
vi.mock('$lib/services/domain/subtask', () => ({
	SubTaskService: {
		createSubTask: vi.fn((projectId, taskId, subTask) =>
			Promise.resolve({
				id: 'new-subtask-id',
				taskId,
				...subTask,
				status: 'not_started',
				priority: 0,
				orderIndex: 0,
				isArchived: false,
				createdAt: new Date(),
				updatedAt: new Date()
			})
		),
		updateSubTask: vi.fn(() => Promise.resolve()),
		deleteSubTask: vi.fn(() => Promise.resolve())
	}
}));

// エラーハンドラのモック
vi.mock('$lib/stores/error-handler.svelte', () => ({
	errorHandler: {
		addSyncError: vi.fn()
	}
}));

const createMockProjects = (): IProjectStore => {
	const project = createMockProjectTree({
		id: 'project-1',
		taskLists: [
			createMockTaskListWithTasks({
				id: 'list-1',
				projectId: 'project-1',
				tasks: [
					createMockTaskWithSubTasks({
						id: 'task-1',
						projectId: 'project-1',
						listId: 'list-1',
						subTasks: [
							{
								id: 'subtask-1',
								taskId: 'task-1',
								title: 'SubTask 1',
								description: 'Mock subtask',
								status: 'not_started',
								priority: 0,
								orderIndex: 0,
								completed: false,
								assignedUserIds: [],
								tagIds: ['tag-1'],
								tags: [
									{
										id: 'tag-1',
										name: 'Tag 1',
										color: '#FF0000',
										createdAt: new Date('2024-01-01'),
										updatedAt: new Date('2024-01-01')
									}
								]
							]
					})
				]
			})
		]
	});

	const store: IProjectStore = {
		projects: [project],
		get selectedProject() {
			return null;
		},
		addProjectToStore: vi.fn(),
		updateProjectInStore: vi.fn(),
		removeProjectFromStore: vi.fn(),
		reorderProjectsInStore: vi.fn(),
		moveProjectToPositionInStore: vi.fn(),
		getProjectById: vi.fn((id: string) => store.projects.find((p) => p.id === id) ?? null),
		loadProjects: vi.fn(),
		setProjects: vi.fn((projects: ProjectTree[]) => {
			store.projects = projects;
		}),
		reset: vi.fn()
	};

	return store;
};

const createMockSelection = (): ISelectionStore => {
	const selection: ISelectionStore = {
		selectedProjectId: null,
		selectedListId: null,
		selectedTaskId: null,
		selectedSubTaskId: null,
		pendingTaskSelection: null,
		pendingSubTaskSelection: null,
		selectProject: vi.fn(),
		selectList: vi.fn(),
		selectTask: vi.fn(),
		selectSubTask: vi.fn((id: string | null) => {
			selection.selectedSubTaskId = id;
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

let mockSelection: ISelectionStore;

/**
 * SubTaskStore 統合テスト
 *
 * このテストは SubTaskStore のファサードとしての統合動作を検証します。
 * 個別のクラス（SubTaskQueries等）の単体テストは別ファイルで実施しています。
 */
describe('SubTaskStore (Integration)', () => {
	let mockProjects: IProjectStore;
	let store: SubTaskStore;

	beforeEach(() => {
		mockProjects = createMockProjects();
		mockSelection = createMockSelection();
		store = new SubTaskStore(mockProjects, mockSelection);
	});

	describe('初期化', () => {
		it('ストアを初期化できる', () => {
			expect(store).toBeDefined();
		});
	});

	describe('検索・取得', () => {
		it('選択中のサブタスクを取得できる', () => {
			mockSelection.selectedSubTaskId = 'subtask-1';

			const subTask = store.selectedSubTask;

			expect(subTask).not.toBeNull();
			expect(subTask?.id).toBe('subtask-1');
		});

		it('サブタスクIDから親タスクIDを取得できる', () => {
			const taskId = store.getTaskIdBySubTaskId('subtask-1');

			expect(taskId).toBe('task-1');
		});

		it('サブタスクIDからプロジェクトIDを取得できる', () => {
			const projectId = store.getProjectIdBySubTaskId('subtask-1');

			expect(projectId).toBe('project-1');
		});
	});

	describe('CRUD操作', () => {
		it('サブタスクを追加できる', async () => {
			const result = await store.addSubTask('task-1', {
				title: 'New SubTask',
				description: 'Description'
			});

			expect(result).not.toBeNull();
			expect(result?.id).toBe('new-subtask-id');

			const task = mockProjects.projects[0].taskLists[0].tasks[0];
			expect(task.subTasks).toHaveLength(2);
		});

		it('サブタスクを更新できる', async () => {
			await store.updateSubTask('subtask-1', { title: 'Updated Title' });

			const subTask = mockProjects.projects[0].taskLists[0].tasks[0].subTasks[0];
			expect(subTask.title).toBe('Updated Title');
		});

		it('サブタスクを削除できる', async () => {
			await store.deleteSubTask('subtask-1');

			const task = mockProjects.projects[0].taskLists[0].tasks[0];
			expect(task.subTasks).toHaveLength(0);
		});
	});

	describe('タグ操作', () => {
		it('サブタスクにタグを付与できる', () => {
			const newTag: Tag = {
				id: 'tag-2',
				name: 'Tag 2',
				color: '#00FF00',
				createdAt: new Date(),
				updatedAt: new Date()
			};

			store.attachTagToSubTask('subtask-1', newTag);

			const subTask = mockProjects.projects[0].taskLists[0].tasks[0].subTasks[0];
			expect(subTask.tags).toHaveLength(2);
			expect(subTask.tags[1].id).toBe('tag-2');
		});

		it('サブタスクからタグを削除できる', () => {
			const removed = store.detachTagFromSubTask('subtask-1', 'tag-1');

			expect(removed).not.toBeNull();
			expect(removed?.id).toBe('tag-1');

			const subTask = mockProjects.projects[0].taskLists[0].tasks[0].subTasks[0];
			expect(subTask.tags).toHaveLength(0);
		});
	});

	describe('複雑な操作フロー', () => {
		it('追加→更新→タグ付与→削除のフロー', async () => {
			// 1. サブタスクを追加
			const result = await store.addSubTask('task-1', { title: 'New SubTask' });
			expect(result).not.toBeNull();

			// 2. 追加したサブタスクを更新
			await store.updateSubTask('new-subtask-id', { title: 'Updated SubTask' });
			const task = mockProjects.projects[0].taskLists[0].tasks[0];
			expect(task.subTasks[1].title).toBe('Updated SubTask');

			// 3. タグを付与
			const newTag: Tag = {
				id: 'tag-2',
				name: 'Tag 2',
				color: '#00FF00',
				createdAt: new Date(),
				updatedAt: new Date()
			};
			store.attachTagToSubTask('new-subtask-id', newTag);
			expect(task.subTasks[1].tags).toHaveLength(1);

			// 4. サブタスクを削除
			await store.deleteSubTask('new-subtask-id');
			expect(task.subTasks).toHaveLength(1);
		});
	});
});
