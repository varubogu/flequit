import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TaskTagOperations } from '$lib/stores/tasks/task-tag-operations.svelte';
import type { Tag } from '$lib/types/tag';
import type { TaskWithSubTasks } from '$lib/types/task';

// 簡易的なモックストア
const createMockEntities = (): any => {
	const mockTask: TaskWithSubTasks = {
		id: 'task-1',
		projectId: 'project-1',
		listId: 'list-1',
		title: 'Test Task',
		description: '',
		status: 'not_started',
		priority: 0,
		orderIndex: 0,
		isArchived: false,
		assignedUserIds: [],
		tagIds: [],
		createdAt: new Date(),
		updatedAt: new Date(),
		subTasks: [],
		tags: [
			{ id: 'tag-1', name: 'Existing Tag', color: '#FF0000', createdAt: new Date(), updatedAt: new Date() }
		]
	};

	return {
		getTaskById: vi.fn((id: string) => (id === 'task-1' ? mockTask : null)),
		removeTagFromAllTasks: vi.fn(),
		updateTagInAllTasks: vi.fn()
	};
};

const createMockDraft = (): any => {
	const mockDraft: TaskWithSubTasks = {
		id: 'draft-1',
		projectId: 'project-1',
		listId: 'list-1',
		title: 'Draft Task',
		description: '',
		status: 'not_started',
		priority: 0,
		orderIndex: 0,
		isArchived: false,
		assignedUserIds: [],
		tagIds: [],
		createdAt: new Date(),
		updatedAt: new Date(),
		subTasks: [],
		tags: [
			{ id: 'tag-2', name: 'Draft Tag', color: '#00FF00', createdAt: new Date(), updatedAt: new Date() }
		]
	};

	return {
		newTaskDraft: mockDraft
	};
};

describe('TaskTagOperations', () => {
	let mockEntities: any;
	let mockDraft: any;
	let operations: TaskTagOperations;

	beforeEach(() => {
		mockEntities = createMockEntities();
		mockDraft = createMockDraft();
		operations = new TaskTagOperations(mockEntities, mockDraft);
	});

	describe('attachTagToTask', () => {
		it('タスクにタグを付与できる', () => {
			const newTag: Tag = {
				id: 'tag-2',
				name: 'New Tag',
				color: '#0000FF',
				createdAt: new Date(),
				updatedAt: new Date(),
			};

			operations.attachTagToTask('task-1', newTag);

			const task = mockEntities.getTaskById('task-1');
			expect(task.tags).toHaveLength(2);
			expect(task.tags[1]).toEqual(newTag);
		});

		it('同じIDのタグは重複して付与されない', () => {
			const duplicateTag: Tag = {
				id: 'tag-1',
				name: 'Duplicate Tag',
				color: '#0000FF',
				createdAt: new Date(),
				updatedAt: new Date(),
			};

			operations.attachTagToTask('task-1', duplicateTag);

			const task = mockEntities.getTaskById('task-1');
			expect(task.tags).toHaveLength(1);
		});

		it('同じ名前のタグは重複して付与されない（大文字小文字を無視）', () => {
			const duplicateTag: Tag = {
				id: 'tag-3',
				name: 'EXISTING TAG',
				color: '#0000FF',
				createdAt: new Date(),
				updatedAt: new Date(),
			};

			operations.attachTagToTask('task-1', duplicateTag);

			const task = mockEntities.getTaskById('task-1');
			expect(task.tags).toHaveLength(1);
		});

		it('存在しないタスクへの付与は何もしない', () => {
			const newTag: Tag = {
				id: 'tag-2',
				name: 'New Tag',
				color: '#0000FF',
				createdAt: new Date(),
				updatedAt: new Date(),
			};

			operations.attachTagToTask('non-existent', newTag);

			expect(mockEntities.getTaskById).toHaveBeenCalledWith('non-existent');
		});
	});

	describe('detachTagFromTask', () => {
		it('タスクからタグを削除できる', () => {
			const removed = operations.detachTagFromTask('task-1', 'tag-1');

			expect(removed).not.toBeNull();
			expect(removed?.id).toBe('tag-1');
			expect(removed?.name).toBe('Existing Tag');

			const task = mockEntities.getTaskById('task-1');
			expect(task.tags).toHaveLength(0);
		});

		it('存在しないタグの削除はnullを返す', () => {
			const removed = operations.detachTagFromTask('task-1', 'non-existent');

			expect(removed).toBeNull();

			const task = mockEntities.getTaskById('task-1');
			expect(task.tags).toHaveLength(1);
		});

		it('存在しないタスクからの削除はnullを返す', () => {
			const removed = operations.detachTagFromTask('non-existent', 'tag-1');

			expect(removed).toBeNull();
		});
	});

	describe('removeTagFromAllTasks', () => {
		it('すべてのタスクから指定タグを削除する', () => {
			operations.removeTagFromAllTasks('tag-1');

			expect(mockEntities.removeTagFromAllTasks).toHaveBeenCalledWith('tag-1');
		});

		it('ドラフトタスクからも削除する', () => {
			operations.removeTagFromAllTasks('tag-2');

			expect(mockEntities.removeTagFromAllTasks).toHaveBeenCalledWith('tag-2');
			expect(mockDraft.newTaskDraft.tags).toHaveLength(0);
		});

		it('ドラフトにないタグの削除でもエラーにならない', () => {
			operations.removeTagFromAllTasks('non-existent');

			expect(mockEntities.removeTagFromAllTasks).toHaveBeenCalledWith('non-existent');
			expect(mockDraft.newTaskDraft.tags).toHaveLength(1);
		});

		it('ドラフトがnullの場合でもエラーにならない', () => {
			mockDraft.newTaskDraft = null;

			operations.removeTagFromAllTasks('tag-1');

			expect(mockEntities.removeTagFromAllTasks).toHaveBeenCalledWith('tag-1');
		});
	});

	describe('updateTagInAllTasks', () => {
		it('すべてのタスクの指定タグを更新する', () => {
			const updatedTag: Tag = {
				id: 'tag-1',
				name: 'Updated Tag',
				color: '#FF00FF',
				createdAt: new Date(),
				updatedAt: new Date(),
			};

			operations.updateTagInAllTasks(updatedTag);

			expect(mockEntities.updateTagInAllTasks).toHaveBeenCalledWith(updatedTag);
		});

		it('ドラフトタスクのタグも更新する', () => {
			const updatedTag: Tag = {
				id: 'tag-2',
				name: 'Updated Draft Tag',
				color: '#FF00FF',
				createdAt: new Date(),
				updatedAt: new Date(),
			};

			operations.updateTagInAllTasks(updatedTag);

			expect(mockEntities.updateTagInAllTasks).toHaveBeenCalledWith(updatedTag);
			expect(mockDraft.newTaskDraft.tags[0].name).toBe('Updated Draft Tag');
		});

		it('ドラフトにないタグの更新でもエラーにならない', () => {
			const updatedTag: Tag = {
				id: 'non-existent',
				name: 'Non Existent Tag',
				color: '#FF00FF',
				createdAt: new Date(),
				updatedAt: new Date(),
			};

			operations.updateTagInAllTasks(updatedTag);

			expect(mockEntities.updateTagInAllTasks).toHaveBeenCalledWith(updatedTag);
		});

		it('ドラフトがnullの場合でもエラーにならない', () => {
			mockDraft.newTaskDraft = null;

			const updatedTag: Tag = {
				id: 'tag-1',
				name: 'Updated Tag',
				color: '#FF00FF',
				createdAt: new Date(),
				updatedAt: new Date(),
			};

			operations.updateTagInAllTasks(updatedTag);

			expect(mockEntities.updateTagInAllTasks).toHaveBeenCalledWith(updatedTag);
		});
	});
});
