import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SubTaskMutations } from '$lib/stores/sub-task/subtask-mutations.svelte';
import type { IProjectStore, ISelectionStore } from '$lib/types/store-interfaces';
import type { ProjectTree } from '$lib/types/project';

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

const createMockProjects = (): any => {
	return {
		projects: [
			{
				id: 'project-1',
				taskLists: [
					{
						id: 'list-1',
						tasks: [
							{
								id: 'task-1',
								subTasks: [{ id: 'subtask-1', title: 'SubTask 1', tags: [] }]
							}
						]
					}
				]
			}
		] as ProjectTree[]
	};
};

const createMockSelection = (): any => {
	return {
		selectedSubTaskId: null,
		selectSubTask: vi.fn((id: string | null) => {
			mockSelection.selectedSubTaskId = id;
		})
	};
};

let mockSelection: any;

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
