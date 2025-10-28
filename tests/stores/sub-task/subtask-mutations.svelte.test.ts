import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SubTaskMutations } from '$lib/stores/sub-task/subtask-mutations.svelte';
import type { IProjectStore, ISelectionStore } from '$lib/types/store-interfaces';
import type { Tag } from '$lib/types/tag';
import {
	createMockProjectTree,
	createMockTaskListWithTasks,
	createMockTaskWithSubTasks
} from '../../utils/mock-factories';

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
				assignedUserIds: [],
				tagIds: [],
				tags: [] as Tag[],
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
		name: 'Project 1',
		color: '#FF0000',
		taskLists: [
			createMockTaskListWithTasks({
				id: 'list-1',
				projectId: 'project-1',
				tasks: [
					createMockTaskWithSubTasks({
						id: 'task-1',
						title: 'Task 1',
						subTasks: [
							{
								id: 'subtask-1',
								taskId: 'task-1',
								title: 'SubTask 1',
								description: 'Existing subtask',
								status: 'not_started',
								priority: 0,
								orderIndex: 0,
								completed: false,
								assignedUserIds: [],
								tagIds: [],
								tags: [],
								createdAt: new Date('2024-01-01'),
								updatedAt: new Date('2024-01-01')
							}
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
		setProjects: vi.fn((projects) => {
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

describe('SubTaskMutations', () => {
	let mockProjects: IProjectStore;
	let mutations: SubTaskMutations;

	beforeEach(() => {
		mockProjects = createMockProjects();
		mockSelection = createMockSelection();
		mutations = new SubTaskMutations(mockProjects, mockSelection);
	});

	describe('addSubTask', () => {
		it('サブタスクを追加できる', async () => {
			const result = await mutations.addSubTask('task-1', {
				title: 'New SubTask',
				description: 'Description'
			});

			expect(result).not.toBeNull();
			expect(result?.id).toBe('new-subtask-id');

			const task = mockProjects.projects[0].taskLists[0].tasks[0];
			expect(task.subTasks).toHaveLength(2);
			expect(task.subTasks[1].title).toBe('New SubTask');
		});

		it('存在しないタスクへの追加はnullを返す', async () => {
			const result = await mutations.addSubTask('non-existent', {
				title: 'New SubTask'
			});

			expect(result).toBeNull();
		});
	});

	describe('updateSubTask', () => {
		it('サブタスクを更新できる', async () => {
			await mutations.updateSubTask('subtask-1', { title: 'Updated Title' });

			const subTask = mockProjects.projects[0].taskLists[0].tasks[0].subTasks[0];
			expect(subTask.title).toBe('Updated Title');
		});

		it('存在しないサブタスクの更新は何もしない', async () => {
			await mutations.updateSubTask('non-existent', { title: 'Updated' });

			// エラーが発生しないことを確認
			expect(true).toBe(true);
		});
	});

	describe('deleteSubTask', () => {
		it('サブタスクを削除できる', async () => {
			await mutations.deleteSubTask('subtask-1');

			const task = mockProjects.projects[0].taskLists[0].tasks[0];
			expect(task.subTasks).toHaveLength(0);
		});

		it('選択中のサブタスクを削除すると選択がクリアされる', async () => {
			mockSelection.selectedSubTaskId = 'subtask-1';

			await mutations.deleteSubTask('subtask-1');

			expect(mockSelection.selectSubTask).toHaveBeenCalledWith(null);
		});

		it('存在しないサブタスクの削除は何もしない', async () => {
			await mutations.deleteSubTask('non-existent');

			// エラーが発生しないことを確認
			expect(true).toBe(true);
		});
	});
});
