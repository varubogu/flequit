import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { TaskCoreMutations } from '$lib/stores/task-core/task-core-mutations.svelte';
import type { ProjectTree } from '$lib/types/project';
import type { TaskWithSubTasks } from '$lib/types/task';

const createMockProjects = (): ProjectTree[] => {
	return [
		{
			id: 'project-1',
			name: 'Project 1',
			description: '',
			color: '#FF0000',
			orderIndex: 0,
			isArchived: false,
			createdAt: new Date(),
			updatedAt: new Date(),
			taskLists: [
				{
					id: 'list-1',
					projectId: 'project-1',
					name: 'List 1',
					description: '',
					orderIndex: 0,
					isArchived: false,
					createdAt: new Date(),
					updatedAt: new Date(),
					tasks: [
						{
							id: 'task-1',
							projectId: 'project-1',
							listId: 'list-1',
							title: 'Task 1',
							description: 'Description 1',
							status: 'not_started',
							priority: 0,
							orderIndex: 0,
							isArchived: false,
							assignedUserIds: [],
							tagIds: [],
							createdAt: new Date('2024-01-01'),
							updatedAt: new Date('2024-01-01'),
							subTasks: [],
							tags: []
						}
					]
				}
			],
			allTags: []
		}
	];
};

describe('TaskCoreMutations', () => {
	let projects: ProjectTree[];
	let mutations: TaskCoreMutations;
	let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

	beforeEach(() => {
		projects = createMockProjects();
		mutations = new TaskCoreMutations(() => projects);
		consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
	});

	afterEach(() => {
		consoleErrorSpy.mockRestore();
	});

	describe('updateTask', () => {
		it('タスクのタイトルを更新できる', () => {
			const result = mutations.updateTask('task-1', { title: 'Updated Title' });

			expect(result).toBe(true);
			expect(projects[0].taskLists[0].tasks[0].title).toBe('Updated Title');
		});

		it('タスクの説明を更新できる', () => {
			const result = mutations.updateTask('task-1', { description: 'Updated Description' });

			expect(result).toBe(true);
			expect(projects[0].taskLists[0].tasks[0].description).toBe('Updated Description');
		});

		it('タスクの優先度を更新できる', () => {
			const result = mutations.updateTask('task-1', { priority: 5 });

			expect(result).toBe(true);
			expect(projects[0].taskLists[0].tasks[0].priority).toBe(5);
		});

		it('複数のフィールドを同時に更新できる', () => {
			const result = mutations.updateTask('task-1', {
				title: 'New Title',
				description: 'New Description',
				priority: 3
			});

			expect(result).toBe(true);
			expect(projects[0].taskLists[0].tasks[0].title).toBe('New Title');
			expect(projects[0].taskLists[0].tasks[0].description).toBe('New Description');
			expect(projects[0].taskLists[0].tasks[0].priority).toBe(3);
		});

		it('存在しないタスクの更新はfalseを返す', () => {
			const result = mutations.updateTask('non-existent', { title: 'New Title' });

			expect(result).toBe(false);
		});

		it('更新時にupdatedAtが更新される', () => {
			const originalUpdatedAt = projects[0].taskLists[0].tasks[0].updatedAt;

			// 少し待ってから更新
			mutations.updateTask('task-1', { title: 'New Title' });

			const newUpdatedAt = projects[0].taskLists[0].tasks[0].updatedAt;
			expect(newUpdatedAt).not.toEqual(originalUpdatedAt);
		});
	});

	describe('applyTaskUpdate', () => {
		it('カスタム更新関数を適用できる', () => {
			const result = mutations.applyTaskUpdate('task-1', (task) => {
				task.title = 'Custom Updated';
				task.priority = 10;
			});

			expect(result).toBe(true);
			expect(projects[0].taskLists[0].tasks[0].title).toBe('Custom Updated');
			expect(projects[0].taskLists[0].tasks[0].priority).toBe(10);
		});

		it('存在しないタスクの場合はfalseを返す', () => {
			const result = mutations.applyTaskUpdate('non-existent', (task) => {
				task.title = 'Updated';
			});

			expect(result).toBe(false);
		});
	});

	describe('toggleTaskStatus', () => {
		it('not_startedからcompletedに切り替わる', () => {
			mutations.toggleTaskStatus('task-1');

			expect(projects[0].taskLists[0].tasks[0].status).toBe('completed');
		});

		it('completedからnot_startedに切り替わる', () => {
			projects[0].taskLists[0].tasks[0].status = 'completed';

			mutations.toggleTaskStatus('task-1');

			expect(projects[0].taskLists[0].tasks[0].status).toBe('not_started');
		});

		it('存在しないタスクの場合は何もしない', () => {
			mutations.toggleTaskStatus('non-existent');

			// エラーにならずに終了することを確認
			expect(projects[0].taskLists[0].tasks[0].status).toBe('not_started');
		});
	});

	describe('addTask', () => {
		it('新しいタスクを追加できる', () => {
			const newTask = mutations.addTask('list-1', {
				projectId: 'project-1',
				title: 'New Task',
				description: 'New Description',
				status: 'not_started',
				priority: 2
			});

			expect(newTask).not.toBeNull();
			expect(newTask?.title).toBe('New Task');
			expect(newTask?.description).toBe('New Description');
			expect(newTask?.priority).toBe(2);
			expect(projects[0].taskLists[0].tasks).toHaveLength(2);
		});

		it('タスクにIDが自動生成される', () => {
			const newTask = mutations.addTask('list-1', {
				projectId: 'project-1',
				title: 'New Task'
			});

			expect(newTask?.id).toBeDefined();
			expect(newTask?.id).not.toBe('');
		});

		it('デフォルト値が設定される', () => {
			const newTask = mutations.addTask('list-1', {
				projectId: 'project-1',
				title: 'New Task'
			});

			expect(newTask?.status).toBe('not_started');
			expect(newTask?.priority).toBe(0);
			expect(newTask?.isRangeDate).toBe(false);
			expect(newTask?.orderIndex).toBe(0);
			expect(newTask?.isArchived).toBe(false);
			expect(newTask?.assignedUserIds).toEqual([]);
			expect(newTask?.tagIds).toEqual([]);
			expect(newTask?.subTasks).toEqual([]);
			expect(newTask?.tags).toEqual([]);
		});

		it('存在しないリストへの追加はnullを返す', () => {
			const newTask = mutations.addTask('non-existent-list', {
				projectId: 'project-1',
				title: 'New Task'
			});

			expect(newTask).toBeNull();
			expect(consoleErrorSpy).toHaveBeenCalledWith('Task list not found: non-existent-list');
		});
	});

	describe('createRecurringTask', () => {
		it('繰り返しタスクを作成できる', () => {
			mutations.createRecurringTask({
				projectId: 'project-1',
				listId: 'list-1',
				title: 'Recurring Task',
				recurrenceRule: {
					unit: 'day',
					interval: 1
				}
			});

			expect(projects[0].taskLists[0].tasks).toHaveLength(2);
			const recurringTask = projects[0].taskLists[0].tasks[1];
			expect(recurringTask.title).toBe('Recurring Task');
			expect(recurringTask.recurrenceRule).toEqual({
				unit: 'day',
				interval: 1
			});
		});

		it('listIdが未指定の場合はエラー', () => {
			mutations.createRecurringTask({
				projectId: 'project-1',
				title: 'Recurring Task'
			});

			expect(consoleErrorSpy).toHaveBeenCalledWith('listId is required for recurring task');
			expect(projects[0].taskLists[0].tasks).toHaveLength(1);
		});

		it('存在しないリストの場合はエラー', () => {
			mutations.createRecurringTask({
				projectId: 'project-1',
				listId: 'non-existent',
				title: 'Recurring Task'
			});

			expect(consoleErrorSpy).toHaveBeenCalledWith('Task list not found: non-existent');
		});
	});

	describe('insertTask', () => {
		it('タスクを挿入できる', () => {
			const taskToInsert: TaskWithSubTasks = {
				id: 'new-task',
				projectId: 'project-1',
				listId: 'list-1',
				title: 'Inserted Task',
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
				tags: []
			};

			const result = mutations.insertTask('list-1', taskToInsert);

			expect(result).not.toBeNull();
			expect(projects[0].taskLists[0].tasks).toHaveLength(2);
		});

		it('指定位置にタスクを挿入できる', () => {
			const task2: TaskWithSubTasks = {
				id: 'task-2',
				projectId: 'project-1',
				listId: 'list-1',
				title: 'Task 2',
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
				tags: []
			};

			mutations.insertTask('list-1', task2);

			const taskToInsert: TaskWithSubTasks = {
				id: 'new-task',
				projectId: 'project-1',
				listId: 'list-1',
				title: 'Inserted at index 1',
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
				tags: []
			};

			mutations.insertTask('list-1', taskToInsert, { index: 1 });

			expect(projects[0].taskLists[0].tasks[1].id).toBe('new-task');
		});

		it('存在しないリストへの挿入はnullを返す', () => {
			const taskToInsert: TaskWithSubTasks = {
				id: 'new-task',
				projectId: 'project-1',
				listId: 'list-1',
				title: 'Task',
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
				tags: []
			};

			const result = mutations.insertTask('non-existent', taskToInsert);

			expect(result).toBeNull();
			expect(consoleErrorSpy).toHaveBeenCalledWith('Task list not found: non-existent');
		});
	});
});
