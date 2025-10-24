import { describe, it, expect, beforeEach } from 'vitest';
import { TaskCoreQueries } from '$lib/stores/task-core/task-core-queries.svelte';
import type { ProjectTree } from '$lib/types/project';
import type { TaskWithSubTasks } from '$lib/types/task';

const createMockProjects = (): ProjectTree[] => {
	return [
		{
			id: 'project-1',
			name: 'Project 1',
			description: '',
			color: '#FF0000',
			icon: 'icon-1',
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
						},
						{
							id: 'task-2',
							projectId: 'project-1',
							listId: 'list-1',
							title: 'Task 2',
							description: '',
							status: 'completed',
							priority: 1,
							orderIndex: 1,
							isArchived: false,
							assignedUserIds: [],
							tagIds: [],
							createdAt: new Date(),
							updatedAt: new Date(),
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

describe('TaskCoreQueries', () => {
	let projects: ProjectTree[];
	let queries: TaskCoreQueries;

	beforeEach(() => {
		projects = createMockProjects();
		queries = new TaskCoreQueries(() => projects);
	});

	describe('getTaskById', () => {
		it('タスクIDでタスクを取得できる', () => {
			const task = queries.getTaskById('task-1');

			expect(task).not.toBeNull();
			expect(task?.id).toBe('task-1');
			expect(task?.title).toBe('Task 1');
			expect(task?.status).toBe('not_started');
		});

		it('異なるタスクIDで異なるタスクを取得できる', () => {
			const task = queries.getTaskById('task-2');

			expect(task).not.toBeNull();
			expect(task?.id).toBe('task-2');
			expect(task?.title).toBe('Task 2');
			expect(task?.status).toBe('completed');
		});

		it('存在しないタスクIDの場合はnullを返す', () => {
			const task = queries.getTaskById('non-existent');

			expect(task).toBeNull();
		});

		it('nullを渡した場合はnullを返す', () => {
			const task = queries.getTaskById(null as any);

			expect(task).toBeNull();
		});

		it('undefinedを渡した場合はnullを返す', () => {
			const task = queries.getTaskById(undefined as any);

			expect(task).toBeNull();
		});

		it('空文字列を渡した場合はnullを返す', () => {
			const task = queries.getTaskById('');

			expect(task).toBeNull();
		});

		it('プロジェクトが空の場合はnullを返す', () => {
			projects = [];
			queries = new TaskCoreQueries(() => projects);

			const task = queries.getTaskById('task-1');

			expect(task).toBeNull();
		});

		it('タスクリストが空の場合はnullを返す', () => {
			projects[0].taskLists[0].tasks = [];
			queries = new TaskCoreQueries(() => projects);

			const task = queries.getTaskById('task-1');

			expect(task).toBeNull();
		});
	});
});
