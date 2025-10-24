import { describe, it, expect, beforeEach } from 'vitest';
import { SubTaskQueries } from '$lib/stores/sub-task/subtask-queries.svelte';
import type { IProjectStore, ISelectionStore } from '$lib/types/store-interfaces';
import type { ProjectTree } from '$lib/types/project';

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
								subTasks: [
									{ id: 'subtask-1', title: 'SubTask 1' },
									{ id: 'subtask-2', title: 'SubTask 2' }
								]
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
		selectedSubTaskId: null
	};
};

describe('SubTaskQueries', () => {
	let mockProjects: IProjectStore;
	let mockSelection: ISelectionStore;
	let queries: SubTaskQueries;

	beforeEach(() => {
		mockProjects = createMockProjects();
		mockSelection = createMockSelection();
		queries = new SubTaskQueries(mockProjects, mockSelection);
	});

	describe('selectedSubTask', () => {
		it('選択中のサブタスクを取得できる', () => {
			mockSelection.selectedSubTaskId = 'subtask-1';

			const subTask = queries.selectedSubTask;

			expect(subTask).not.toBeNull();
			expect(subTask?.id).toBe('subtask-1');
			expect(subTask?.title).toBe('SubTask 1');
		});

		it('選択がない場合はnullを返す', () => {
			mockSelection.selectedSubTaskId = null;

			const subTask = queries.selectedSubTask;

			expect(subTask).toBeNull();
		});

		it('存在しないIDの場合はnullを返す', () => {
			mockSelection.selectedSubTaskId = 'non-existent';

			const subTask = queries.selectedSubTask;

			expect(subTask).toBeNull();
		});
	});

	describe('getTaskIdBySubTaskId', () => {
		it('サブタスクIDから親タスクIDを取得できる', () => {
			const taskId = queries.getTaskIdBySubTaskId('subtask-1');

			expect(taskId).toBe('task-1');
		});

		it('存在しないサブタスクIDの場合はnullを返す', () => {
			const taskId = queries.getTaskIdBySubTaskId('non-existent');

			expect(taskId).toBeNull();
		});
	});

	describe('getProjectIdBySubTaskId', () => {
		it('サブタスクIDからプロジェクトIDを取得できる', () => {
			const projectId = queries.getProjectIdBySubTaskId('subtask-1');

			expect(projectId).toBe('project-1');
		});

		it('存在しないサブタスクIDの場合はnullを返す', () => {
			const projectId = queries.getProjectIdBySubTaskId('non-existent');

			expect(projectId).toBeNull();
		});
	});
});
