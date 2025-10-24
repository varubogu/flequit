import { describe, it, expect, beforeEach } from 'vitest';
import { SubTaskTagOperations } from '$lib/stores/sub-task/subtask-tag-operations.svelte';
import type { IProjectStore } from '$lib/types/store-interfaces';
import type { ProjectTree } from '$lib/types/project';
import type { Tag } from '$lib/types/tag';

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
									{
										id: 'subtask-1',
										title: 'SubTask 1',
										tags: [
											{ id: 'tag-1', name: 'Tag 1', color: '#FF0000', createdAt: new Date(), updatedAt: new Date() }
										]
									}
								]
							}
						]
					}
				]
			}
		] as ProjectTree[]
	};
};

describe('SubTaskTagOperations', () => {
	let mockProjects: IProjectStore;
	let tagOps: SubTaskTagOperations;

	beforeEach(() => {
		mockProjects = createMockProjects();
		tagOps = new SubTaskTagOperations(mockProjects);
	});

	describe('attachTagToSubTask', () => {
		it('サブタスクにタグを付与できる', () => {
			const newTag: Tag = {
				id: 'tag-2',
				name: 'Tag 2',
				color: '#00FF00',
				createdAt: new Date(),
				updatedAt: new Date()
			};

			tagOps.attachTagToSubTask('subtask-1', newTag);

			const subTask = mockProjects.projects[0].taskLists[0].tasks[0].subTasks[0];
			expect(subTask.tags).toHaveLength(2);
			expect(subTask.tags[1].id).toBe('tag-2');
		});

		it('同じIDのタグは重複して付与されない', () => {
			const duplicateTag: Tag = {
				id: 'tag-1',
				name: 'Duplicate Tag',
				color: '#0000FF',
				createdAt: new Date(),
				updatedAt: new Date()
			};

			tagOps.attachTagToSubTask('subtask-1', duplicateTag);

			const subTask = mockProjects.projects[0].taskLists[0].tasks[0].subTasks[0];
			expect(subTask.tags).toHaveLength(1);
		});

		it('同じ名前のタグは重複して付与されない（大文字小文字無視）', () => {
			const duplicateTag: Tag = {
				id: 'tag-3',
				name: 'TAG 1',
				color: '#0000FF',
				createdAt: new Date(),
				updatedAt: new Date()
			};

			tagOps.attachTagToSubTask('subtask-1', duplicateTag);

			const subTask = mockProjects.projects[0].taskLists[0].tasks[0].subTasks[0];
			expect(subTask.tags).toHaveLength(1);
		});

		it('存在しないサブタスクへの付与は何もしない', () => {
			const newTag: Tag = {
				id: 'tag-2',
				name: 'Tag 2',
				color: '#00FF00',
				createdAt: new Date(),
				updatedAt: new Date()
			};

			tagOps.attachTagToSubTask('non-existent', newTag);

			// エラーが発生しないことを確認
			expect(true).toBe(true);
		});
	});

	describe('detachTagFromSubTask', () => {
		it('サブタスクからタグを削除できる', () => {
			const removed = tagOps.detachTagFromSubTask('subtask-1', 'tag-1');

			expect(removed).not.toBeNull();
			expect(removed?.id).toBe('tag-1');

			const subTask = mockProjects.projects[0].taskLists[0].tasks[0].subTasks[0];
			expect(subTask.tags).toHaveLength(0);
		});

		it('存在しないタグの削除はnullを返す', () => {
			const removed = tagOps.detachTagFromSubTask('subtask-1', 'non-existent');

			expect(removed).toBeNull();

			const subTask = mockProjects.projects[0].taskLists[0].tasks[0].subTasks[0];
			expect(subTask.tags).toHaveLength(1);
		});

		it('存在しないサブタスクからの削除はnullを返す', () => {
			const removed = tagOps.detachTagFromSubTask('non-existent', 'tag-1');

			expect(removed).toBeNull();
		});
	});
});
