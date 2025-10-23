import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { TaskListOrdering } from '$lib/stores/task-list/task-list-ordering.svelte';
import type { IProjectStore } from '$lib/stores/types/project-store.interface';
import type { ProjectWithLists, TaskListWithTasks } from '$lib/types';

// TaskListService のモック
vi.mock('$lib/services/domain/task-list', () => ({
	TaskListService: {
		updateTaskList: vi.fn()
	}
}));

// errorHandler のモック
vi.mock('$lib/stores/error-handler.svelte', () => ({
	errorHandler: {
		addSyncError: vi.fn()
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
					orderIndex: 0,
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
					orderIndex: 1,
					createdAt: new Date('2024-01-02'),
					updatedAt: new Date('2024-01-02'),
					tasks: []
				},
				{
					id: 'list-3',
					projectId: 'project-1',
					name: 'List 3',
					description: 'Description 3',
					order: 2,
					orderIndex: 2,
					createdAt: new Date('2024-01-03'),
					updatedAt: new Date('2024-01-03'),
					tasks: []
				}
			]
		},
		{
			id: 'project-2',
			name: 'Project 2',
			description: 'Description 2',
			color: '#00FF00',
			icon: 'icon-2',
			order: 1,
			createdAt: new Date('2024-01-04'),
			updatedAt: new Date('2024-01-04'),
			taskLists: [
				{
					id: 'list-4',
					projectId: 'project-2',
					name: 'List 4',
					description: 'Description 4',
					order: 0,
					orderIndex: 0,
					createdAt: new Date('2024-01-04'),
					updatedAt: new Date('2024-01-04'),
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

describe('TaskListOrdering', () => {
	let projectStore: IProjectStore;
	let ordering: TaskListOrdering;
	let mockUpdateTaskList: ReturnType<typeof vi.fn>;
	let mockAddSyncError: ReturnType<typeof vi.fn>;
	let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

	beforeEach(async () => {
		vi.clearAllMocks();
		consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

		projectStore = createMockProjectStore();
		ordering = new TaskListOrdering(projectStore);

		const { TaskListService } = await import('$lib/services/domain/task-list');
		const { errorHandler } = await import('$lib/stores/error-handler.svelte');
		mockUpdateTaskList = vi.mocked(TaskListService.updateTaskList);
		mockAddSyncError = vi.mocked(errorHandler.addSyncError);

		mockUpdateTaskList.mockResolvedValue({} as any);
	});

	afterEach(() => {
		consoleErrorSpy.mockRestore();
	});

	describe('reorderTaskLists', () => {
		it('プロジェクト内でタスクリストを並び替える', async () => {
			await ordering.reorderTaskLists('project-1', 0, 2);

			const project = projectStore.projects.find((p) => p.id === 'project-1');
			expect(project?.taskLists.map((tl) => tl.id)).toEqual(['list-2', 'list-3', 'list-1']);
			expect(project?.taskLists[0].orderIndex).toBe(0);
			expect(project?.taskLists[1].orderIndex).toBe(1);
			expect(project?.taskLists[2].orderIndex).toBe(2);
		});

		it('逆方向への並び替えも可能', async () => {
			await ordering.reorderTaskLists('project-1', 2, 0);

			const project = projectStore.projects.find((p) => p.id === 'project-1');
			expect(project?.taskLists.map((tl) => tl.id)).toEqual(['list-3', 'list-1', 'list-2']);
		});

		it('同じインデックスへの移動は何もしない', async () => {
			await ordering.reorderTaskLists('project-1', 1, 1);

			const project = projectStore.projects.find((p) => p.id === 'project-1');
			expect(project?.taskLists.map((tl) => tl.id)).toEqual(['list-1', 'list-2', 'list-3']);
			expect(mockUpdateTaskList).not.toHaveBeenCalled();
		});

		it('存在しないプロジェクトは何もしない', async () => {
			await ordering.reorderTaskLists('non-existent', 0, 1);

			expect(mockUpdateTaskList).not.toHaveBeenCalled();
		});

		it('負のインデックスは何もしない', async () => {
			await ordering.reorderTaskLists('project-1', -1, 1);

			const project = projectStore.projects.find((p) => p.id === 'project-1');
			expect(project?.taskLists.map((tl) => tl.id)).toEqual(['list-1', 'list-2', 'list-3']);
			expect(mockUpdateTaskList).not.toHaveBeenCalled();
		});

		it('範囲外のインデックスは何もしない', async () => {
			await ordering.reorderTaskLists('project-1', 0, 10);

			const project = projectStore.projects.find((p) => p.id === 'project-1');
			expect(project?.taskLists.map((tl) => tl.id)).toEqual(['list-1', 'list-2', 'list-3']);
			expect(mockUpdateTaskList).not.toHaveBeenCalled();
		});

		it('すべてのタスクリストの順序を更新する', async () => {
			await ordering.reorderTaskLists('project-1', 0, 2);

			expect(mockUpdateTaskList).toHaveBeenCalledTimes(3);
			expect(mockUpdateTaskList).toHaveBeenCalledWith('project-1', 'list-2', { orderIndex: 0 });
			expect(mockUpdateTaskList).toHaveBeenCalledWith('project-1', 'list-3', { orderIndex: 1 });
			expect(mockUpdateTaskList).toHaveBeenCalledWith('project-1', 'list-1', { orderIndex: 2 });
		});

		it('更新エラー時にエラーハンドラを呼ぶ', async () => {
			const error = new Error('Update failed');
			mockUpdateTaskList.mockRejectedValueOnce(error);

			await ordering.reorderTaskLists('project-1', 0, 2);

			expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to sync task list order to backends:', error);
			expect(mockAddSyncError).toHaveBeenCalledWith(
				'タスクリスト順序更新',
				'tasklist',
				expect.any(String),
				error
			);
		});

		it('一部のタスクリストの更新に失敗しても他は更新される', async () => {
			mockUpdateTaskList
				.mockResolvedValueOnce({} as any)
				.mockRejectedValueOnce(new Error('Failed'))
				.mockResolvedValueOnce({} as any);

			await ordering.reorderTaskLists('project-1', 0, 2);

			expect(mockUpdateTaskList).toHaveBeenCalledTimes(3);
			expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
		});
	});

	describe('moveTaskListToProject', () => {
		it('タスクリストを別のプロジェクトに移動する', async () => {
			await ordering.moveTaskListToProject('list-1', 'project-2');

			const sourceProject = projectStore.projects.find((p) => p.id === 'project-1');
			const targetProject = projectStore.projects.find((p) => p.id === 'project-2');

			expect(sourceProject?.taskLists.map((tl) => tl.id)).toEqual(['list-2', 'list-3']);
			expect(targetProject?.taskLists.map((tl) => tl.id)).toEqual(['list-4', 'list-1']);
			expect(targetProject?.taskLists.find((tl) => tl.id === 'list-1')?.projectId).toBe('project-2');
		});

		it('指定位置にタスクリストを挿入できる', async () => {
			await ordering.moveTaskListToProject('list-1', 'project-2', 0);

			const targetProject = projectStore.projects.find((p) => p.id === 'project-2');
			expect(targetProject?.taskLists.map((tl) => tl.id)).toEqual(['list-1', 'list-4']);
		});

		it('移動元と移動先の順序を更新する', async () => {
			await ordering.moveTaskListToProject('list-1', 'project-2');

			// 移動元プロジェクトの順序更新
			expect(mockUpdateTaskList).toHaveBeenCalledWith('project-1', 'list-2', { orderIndex: 0 });
			expect(mockUpdateTaskList).toHaveBeenCalledWith('project-1', 'list-3', { orderIndex: 1 });

			// 移動先プロジェクトの順序更新
			expect(mockUpdateTaskList).toHaveBeenCalledWith('project-2', 'list-4', { orderIndex: 0 });
			expect(mockUpdateTaskList).toHaveBeenCalledWith('project-2', 'list-1', { orderIndex: 1 });
		});

		it('存在しないタスクリストは何もしない', async () => {
			await ordering.moveTaskListToProject('non-existent', 'project-2');

			expect(mockUpdateTaskList).not.toHaveBeenCalled();
		});

		it('存在しないターゲットプロジェクトは元に戻す（末尾に追加される）', async () => {
			await ordering.moveTaskListToProject('list-1', 'non-existent');

			const sourceProject = projectStore.projects.find((p) => p.id === 'project-1');
			// 一度削除されて末尾に追加されるため、順序が変わる
			expect(sourceProject?.taskLists.map((tl) => tl.id)).toEqual(['list-2', 'list-3', 'list-1']);
		});

		it('taskListsが未定義のプロジェクトから移動できる', async () => {
			const project = projectStore.projects.find((p) => p.id === 'project-1');
			if (project) {
				project.taskLists = undefined as any;
				project.taskLists = [
					{
						id: 'list-1',
						projectId: 'project-1',
						name: 'List 1',
						description: '',
						order: 0,
						orderIndex: 0,
						createdAt: new Date(),
						updatedAt: new Date(),
						tasks: []
					}
				];
			}

			await ordering.moveTaskListToProject('list-1', 'project-2');

			const targetProject = projectStore.projects.find((p) => p.id === 'project-2');
			expect(targetProject?.taskLists.find((tl) => tl.id === 'list-1')).toBeDefined();
		});

		it('taskListsが未定義のプロジェクトに移動できる', async () => {
			const targetProject = projectStore.projects.find((p) => p.id === 'project-2');
			if (targetProject) {
				targetProject.taskLists = undefined as any;
			}

			await ordering.moveTaskListToProject('list-1', 'project-2');

			expect(targetProject?.taskLists).toBeDefined();
			expect(targetProject?.taskLists.map((tl) => tl.id)).toEqual(['list-1']);
		});

		it('負のインデックスは末尾に追加', async () => {
			await ordering.moveTaskListToProject('list-1', 'project-2', -1);

			const targetProject = projectStore.projects.find((p) => p.id === 'project-2');
			expect(targetProject?.taskLists.map((tl) => tl.id)).toEqual(['list-4', 'list-1']);
		});

		it('範囲外のインデックスは末尾に追加', async () => {
			await ordering.moveTaskListToProject('list-1', 'project-2', 100);

			const targetProject = projectStore.projects.find((p) => p.id === 'project-2');
			expect(targetProject?.taskLists.map((tl) => tl.id)).toEqual(['list-4', 'list-1']);
		});

		it('移動元の更新エラー時にエラーハンドラを呼ぶ', async () => {
			const error = new Error('Source update failed');
			mockUpdateTaskList.mockRejectedValueOnce(error);

			await ordering.moveTaskListToProject('list-1', 'project-2');

			expect(consoleErrorSpy).toHaveBeenCalledWith(
				'Failed to sync source project task list order to backends:',
				error
			);
			expect(mockAddSyncError).toHaveBeenCalledWith(
				'タスクリスト順序更新（移動元）',
				'tasklist',
				expect.any(String),
				error
			);
		});

		it('移動先の更新エラー時にエラーハンドラを呼ぶ', async () => {
			const error = new Error('Target update failed');
			mockUpdateTaskList
				.mockResolvedValueOnce({} as any)
				.mockResolvedValueOnce({} as any)
				.mockRejectedValueOnce(error);

			await ordering.moveTaskListToProject('list-1', 'project-2');

			expect(consoleErrorSpy).toHaveBeenCalledWith(
				'Failed to sync target project task list order to backends:',
				error
			);
			expect(mockAddSyncError).toHaveBeenCalledWith(
				'タスクリスト順序更新（移動先）',
				'tasklist',
				expect.any(String),
				error
			);
		});
	});

	describe('moveTaskListToPosition', () => {
		it('同じプロジェクト内で位置を移動する', async () => {
			await ordering.moveTaskListToPosition('list-1', 'project-1', 2);

			const project = projectStore.projects.find((p) => p.id === 'project-1');
			expect(project?.taskLists.map((tl) => tl.id)).toEqual(['list-2', 'list-3', 'list-1']);
		});

		it('別のプロジェクトに位置指定で移動する', async () => {
			await ordering.moveTaskListToPosition('list-1', 'project-2', 0);

			const sourceProject = projectStore.projects.find((p) => p.id === 'project-1');
			const targetProject = projectStore.projects.find((p) => p.id === 'project-2');

			expect(sourceProject?.taskLists.map((tl) => tl.id)).toEqual(['list-2', 'list-3']);
			expect(targetProject?.taskLists.map((tl) => tl.id)).toEqual(['list-1', 'list-4']);
		});

		it('存在しないタスクリストは何もしない', async () => {
			await ordering.moveTaskListToPosition('non-existent', 'project-1', 0);

			const project = projectStore.projects.find((p) => p.id === 'project-1');
			expect(project?.taskLists.map((tl) => tl.id)).toEqual(['list-1', 'list-2', 'list-3']);
			expect(mockUpdateTaskList).not.toHaveBeenCalled();
		});

		it('同じプロジェクトの同じ位置への移動も処理する', async () => {
			await ordering.moveTaskListToPosition('list-1', 'project-1', 0);

			// reorderTaskLists が呼ばれるが、fromIndex === toIndex なので何もしない
			const project = projectStore.projects.find((p) => p.id === 'project-1');
			expect(project?.taskLists.map((tl) => tl.id)).toEqual(['list-1', 'list-2', 'list-3']);
		});
	});

	describe('統合テスト', () => {
		it('複数の移動操作が正しく動作する', async () => {
			// 1. list-1 を project-2 に移動
			await ordering.moveTaskListToProject('list-1', 'project-2');

			let project1 = projectStore.projects.find((p) => p.id === 'project-1');
			let project2 = projectStore.projects.find((p) => p.id === 'project-2');

			expect(project1?.taskLists.map((tl) => tl.id)).toEqual(['list-2', 'list-3']);
			expect(project2?.taskLists.map((tl) => tl.id)).toEqual(['list-4', 'list-1']);

			// 2. project-2 内で並び替え
			await ordering.reorderTaskLists('project-2', 1, 0);

			project2 = projectStore.projects.find((p) => p.id === 'project-2');
			expect(project2?.taskLists.map((tl) => tl.id)).toEqual(['list-1', 'list-4']);

			// 3. list-1 を project-1 に戻す
			await ordering.moveTaskListToProject('list-1', 'project-1', 0);

			project1 = projectStore.projects.find((p) => p.id === 'project-1');
			project2 = projectStore.projects.find((p) => p.id === 'project-2');

			expect(project1?.taskLists.map((tl) => tl.id)).toEqual(['list-1', 'list-2', 'list-3']);
			expect(project2?.taskLists.map((tl) => tl.id)).toEqual(['list-4']);
		});
	});
});
