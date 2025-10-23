import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { TaskListMutations } from '$lib/stores/task-list/task-list-mutations.svelte';
import { TaskListQueries } from '$lib/stores/task-list/task-list-queries.svelte';
import type { IProjectStore } from '$lib/stores/types/project-store.interface';
import type { ISelectionStore } from '$lib/stores/types/selection-store.interface';
import type { ProjectWithLists, TaskListWithTasks } from '$lib/types';

// TaskListService のモック
vi.mock('$lib/services/domain/task-list', () => ({
	TaskListService: {
		createTaskListWithTasks: vi.fn(),
		updateTaskList: vi.fn(),
		deleteTaskList: vi.fn()
	}
}));

const createMockProjectStore = (): IProjectStore => {
	const mockProjects: ProjectWithLists[] = [
		{
			id: 'project-1',
			name: 'Project 1',
			description: 'Description 1',
			color: '#FF0000',
			icon: 'icon-1',
			order: 0,
			createdAt: new Date('2024-01-01'),
			updatedAt: new Date('2024-01-01'),
			taskLists: [
				{
					id: 'list-1',
					projectId: 'project-1',
					name: 'List 1',
					description: 'Description 1',
					order: 0,
					createdAt: new Date('2024-01-01'),
					updatedAt: new Date('2024-01-01'),
					tasks: []
				},
				{
					id: 'list-2',
					projectId: 'project-1',
					name: 'List 2',
					description: 'Description 2',
					order: 1,
					createdAt: new Date('2024-01-02'),
					updatedAt: new Date('2024-01-02'),
					tasks: []
				}
			]
		}
	];

	return {
		projects: mockProjects,
		addProject: vi.fn(),
		updateProject: vi.fn(),
		deleteProject: vi.fn(),
		reorderProjects: vi.fn()
	};
};

const createMockSelectionStore = (): ISelectionStore => {
	return {
		selectedProjectId: null,
		selectedTaskListId: null,
		selectedTaskId: null,
		selectedListId: null,
		selectList: vi.fn(),
		selectTask: vi.fn(),
		selectSubTask: vi.fn(),
		setSelectedProjectId: vi.fn(),
		setSelectedTaskListId: vi.fn(),
		setSelectedTaskId: vi.fn(),
		clearSelection: vi.fn()
	};
};

describe('TaskListMutations', () => {
	let projectStore: IProjectStore;
	let selectionStore: ISelectionStore;
	let queries: TaskListQueries;
	let mutations: TaskListMutations;
	let mockCreateTaskList: ReturnType<typeof vi.fn>;
	let mockUpdateTaskList: ReturnType<typeof vi.fn>;
	let mockDeleteTaskList: ReturnType<typeof vi.fn>;
	let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

	beforeEach(async () => {
		vi.clearAllMocks();
		consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

		projectStore = createMockProjectStore();
		selectionStore = createMockSelectionStore();
		queries = new TaskListQueries(projectStore, selectionStore);
		mutations = new TaskListMutations(projectStore, selectionStore, queries);

		const { TaskListService } = await import('$lib/services/domain/task-list');
		mockCreateTaskList = vi.mocked(TaskListService.createTaskListWithTasks);
		mockUpdateTaskList = vi.mocked(TaskListService.updateTaskList);
		mockDeleteTaskList = vi.mocked(TaskListService.deleteTaskList);
	});

	afterEach(() => {
		consoleErrorSpy.mockRestore();
	});

	describe('addTaskList', () => {
		it('新しいタスクリストを追加する', async () => {
			const newTaskList: TaskListWithTasks = {
				id: 'list-3',
				projectId: 'project-1',
				name: 'New List',
				description: 'New Description',
				order: 2,
				createdAt: new Date(),
				updatedAt: new Date(),
				tasks: []
			};

			mockCreateTaskList.mockResolvedValue(newTaskList);

			const result = await mutations.addTaskList('project-1', {
				name: 'New List',
				description: 'New Description'
			});

			expect(mockCreateTaskList).toHaveBeenCalledWith('project-1', {
				name: 'New List',
				description: 'New Description',
				order_index: 2
			});
			expect(result).toEqual(newTaskList);
			expect(projectStore.projects[0].taskLists).toHaveLength(3);
			expect(projectStore.projects[0].taskLists[2]).toEqual(newTaskList);
		});

		it('プロジェクトが存在しない場合でもエラーにならない', async () => {
			const newTaskList: TaskListWithTasks = {
				id: 'list-3',
				projectId: 'non-existent',
				name: 'New List',
				description: '',
				order: 0,
				createdAt: new Date(),
				updatedAt: new Date(),
				tasks: []
			};

			mockCreateTaskList.mockResolvedValue(newTaskList);

			const result = await mutations.addTaskList('non-existent', {
				name: 'New List'
			});

			expect(result).toEqual(newTaskList);
		});

		it('taskListsが未定義のプロジェクトに追加できる', async () => {
			const newProject: ProjectWithLists = {
				id: 'project-2',
				name: 'Project 2',
				description: '',
				color: '#000000',
				icon: 'icon',
				order: 1,
				createdAt: new Date(),
				updatedAt: new Date(),
				taskLists: undefined as any
			};
			projectStore.projects.push(newProject);

			const newTaskList: TaskListWithTasks = {
				id: 'list-3',
				projectId: 'project-2',
				name: 'New List',
				description: '',
				order: 0,
				createdAt: new Date(),
				updatedAt: new Date(),
				tasks: []
			};

			mockCreateTaskList.mockResolvedValue(newTaskList);

			const result = await mutations.addTaskList('project-2', {
				name: 'New List'
			});

			expect(result).toEqual(newTaskList);
			expect(projectStore.projects[1].taskLists).toEqual([newTaskList]);
		});

		it('サービスエラー時にnullを返す', async () => {
			const error = new Error('Create failed');
			mockCreateTaskList.mockRejectedValue(error);

			const result = await mutations.addTaskList('project-1', {
				name: 'New List'
			});

			expect(result).toBeNull();
			expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to create task list:', error);
		});

		it('order_indexが正しく設定される', async () => {
			const newTaskList: TaskListWithTasks = {
				id: 'list-3',
				projectId: 'project-1',
				name: 'New List',
				description: '',
				order: 2,
				createdAt: new Date(),
				updatedAt: new Date(),
				tasks: []
			};

			mockCreateTaskList.mockResolvedValue(newTaskList);

			await mutations.addTaskList('project-1', { name: 'New List' });

			expect(mockCreateTaskList).toHaveBeenCalledWith('project-1', {
				name: 'New List',
				order_index: 2 // 既存のリストが2つあるので order_index は 2
			});
		});
	});

	describe('updateTaskList', () => {
		it('タスクリストを更新する', async () => {
			const updatedTaskList: TaskListWithTasks = {
				id: 'list-1',
				projectId: 'project-1',
				name: 'Updated List',
				description: 'Updated Description',
				order: 0,
				createdAt: new Date('2024-01-01'),
				updatedAt: new Date(),
				tasks: []
			};

			mockUpdateTaskList.mockResolvedValue(updatedTaskList);

			const result = await mutations.updateTaskList('list-1', {
				name: 'Updated List',
				description: 'Updated Description'
			});

			expect(mockUpdateTaskList).toHaveBeenCalledWith('project-1', 'list-1', {
				name: 'Updated List',
				description: 'Updated Description'
			});
			expect(result).not.toBeNull();
			expect(result?.name).toBe('Updated List');
			expect(projectStore.projects[0].taskLists[0].name).toBe('Updated List');
		});

		it('存在しないタスクリストの更新はエラーになる', async () => {
			const result = await mutations.updateTaskList('non-existent', {
				name: 'Updated List'
			});

			expect(mockUpdateTaskList).not.toHaveBeenCalled();
			expect(result).toBeNull();
			expect(consoleErrorSpy).toHaveBeenCalledWith(
				'Failed to update task list:',
				expect.objectContaining({
					message: expect.stringContaining('に対応するプロジェクトが見つかりません')
				})
			);
		});

		it('サービスエラー時にnullを返す', async () => {
			const error = new Error('Update failed');
			mockUpdateTaskList.mockRejectedValue(error);

			const result = await mutations.updateTaskList('list-1', {
				name: 'Updated List'
			});

			expect(result).toBeNull();
			expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to update task list:', error);
		});

		it('サービスがnullを返した場合にnullを返す', async () => {
			mockUpdateTaskList.mockResolvedValue(null);

			const result = await mutations.updateTaskList('list-1', {
				name: 'Updated List'
			});

			expect(result).toBeNull();
		});

		it('部分的な更新が可能', async () => {
			const updatedTaskList: TaskListWithTasks = {
				id: 'list-1',
				projectId: 'project-1',
				name: 'Updated List',
				description: 'Description 1',
				order: 0,
				createdAt: new Date('2024-01-01'),
				updatedAt: new Date(),
				tasks: []
			};

			mockUpdateTaskList.mockResolvedValue(updatedTaskList);

			const result = await mutations.updateTaskList('list-1', {
				name: 'Updated List'
			});

			expect(mockUpdateTaskList).toHaveBeenCalledWith('project-1', 'list-1', {
				name: 'Updated List'
			});
			expect(result?.name).toBe('Updated List');
		});
	});

	describe('deleteTaskList', () => {
		it('タスクリストを削除する', async () => {
			mockDeleteTaskList.mockResolvedValue(true);

			const result = await mutations.deleteTaskList('list-1');

			expect(mockDeleteTaskList).toHaveBeenCalledWith('project-1', 'list-1');
			expect(result).toBe(true);
			expect(projectStore.projects[0].taskLists).toHaveLength(1);
			expect(projectStore.projects[0].taskLists[0].id).toBe('list-2');
		});

		it('削除されたタスクリストが選択されていた場合は選択をクリア', async () => {
			selectionStore.selectedListId = 'list-1';
			mockDeleteTaskList.mockResolvedValue(true);

			await mutations.deleteTaskList('list-1');

			expect(selectionStore.selectList).toHaveBeenCalledWith(null);
			expect(selectionStore.selectTask).toHaveBeenCalledWith(null);
			expect(selectionStore.selectSubTask).toHaveBeenCalledWith(null);
		});

		it('削除されたタスクリストが選択されていない場合は選択をクリアしない', async () => {
			selectionStore.selectedListId = 'list-2';
			mockDeleteTaskList.mockResolvedValue(true);

			await mutations.deleteTaskList('list-1');

			expect(selectionStore.selectList).not.toHaveBeenCalled();
		});

		it('存在しないタスクリストの削除はエラーになる', async () => {
			const result = await mutations.deleteTaskList('non-existent');

			expect(mockDeleteTaskList).not.toHaveBeenCalled();
			expect(result).toBe(false);
			expect(consoleErrorSpy).toHaveBeenCalledWith(
				'Failed to delete task list:',
				expect.objectContaining({
					message: expect.stringContaining('に対応するプロジェクトが見つかりません')
				})
			);
		});

		it('サービスエラー時にfalseを返す', async () => {
			const error = new Error('Delete failed');
			mockDeleteTaskList.mockRejectedValue(error);

			const result = await mutations.deleteTaskList('list-1');

			expect(result).toBe(false);
			expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to delete task list:', error);
		});

		it('サービスがfalseを返した場合に削除されない', async () => {
			mockDeleteTaskList.mockResolvedValue(false);

			const result = await mutations.deleteTaskList('list-1');

			expect(result).toBe(false);
			expect(projectStore.projects[0].taskLists).toHaveLength(2);
		});
	});
});
