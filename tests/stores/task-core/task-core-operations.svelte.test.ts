import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { TaskCoreOperations } from '$lib/stores/task-core/task-core-operations.svelte';
import type { ProjectTree } from '$lib/types/project';
import {
	createMockProjectTree,
	createMockTaskListWithTasks,
	createMockTaskWithSubTasks
} from '../../utils/mock-factories';

const createMockProjects = (): ProjectTree[] => {
	return [
		createMockProjectTree({
			id: 'project-1',
			name: 'Project 1',
			color: '#FF0000',
			orderIndex: 0,
			taskLists: [
				createMockTaskListWithTasks({
					id: 'list-1',
					name: 'List 1',
					orderIndex: 0,
					tasks: [
						createMockTaskWithSubTasks({
							id: 'task-1',
							listId: 'list-1',
							title: 'Task 1',
							orderIndex: 0,
							createdAt: new Date('2024-01-01'),
							updatedAt: new Date('2024-01-01')
						}),
						createMockTaskWithSubTasks({
							id: 'task-2',
							listId: 'list-1',
							title: 'Task 2',
							orderIndex: 1,
							createdAt: new Date('2024-01-02'),
							updatedAt: new Date('2024-01-02')
						})
					]
				}),
				createMockTaskListWithTasks({
					id: 'list-2',
					name: 'List 2',
					orderIndex: 1,
					tasks: []
				})
			]
		})
	];
};

describe('TaskCoreOperations', () => {
	let projects: ProjectTree[];
	let operations: TaskCoreOperations;
	let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

	beforeEach(() => {
		projects = createMockProjects();
		operations = new TaskCoreOperations(() => projects);
		consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
	});

	afterEach(() => {
		consoleErrorSpy.mockRestore();
	});

	describe('removeTask', () => {
		it('タスクを削除できる', () => {
			const context = operations.removeTask('task-1');

			expect(context).not.toBeNull();
			expect(context?.task.id).toBe('task-1');
			expect(context?.index).toBe(0);
			expect(projects[0].taskLists[0].tasks).toHaveLength(1);
			expect(projects[0].taskLists[0].tasks[0].id).toBe('task-2');
		});

		it('削除コンテキストに正しい情報が含まれる', () => {
			const context = operations.removeTask('task-1');

			expect(context?.project.id).toBe('project-1');
			expect(context?.taskList.id).toBe('list-1');
			expect(context?.task.id).toBe('task-1');
			expect(context?.index).toBe(0);
		});

		it('存在しないタスクの削除はnullを返す', () => {
			const context = operations.removeTask('non-existent');

			expect(context).toBeNull();
			expect(consoleErrorSpy).toHaveBeenCalledWith('Task not found: non-existent');
		});

		it('2番目のタスクを削除できる', () => {
			const context = operations.removeTask('task-2');

			expect(context).not.toBeNull();
			expect(context?.index).toBe(1);
			expect(projects[0].taskLists[0].tasks).toHaveLength(1);
			expect(projects[0].taskLists[0].tasks[0].id).toBe('task-1');
		});
	});

	describe('restoreTask', () => {
		it('削除したタスクを復元できる', () => {
			const context = operations.removeTask('task-1')!;
			operations.restoreTask(context);

			expect(projects[0].taskLists[0].tasks).toHaveLength(2);
			expect(projects[0].taskLists[0].tasks[0].id).toBe('task-1');
		});

		it('元の位置にタスクが復元される', () => {
			const context = operations.removeTask('task-2')!;
			operations.restoreTask(context);

			expect(projects[0].taskLists[0].tasks[1].id).toBe('task-2');
		});

		it('listIdが正しく設定される', () => {
			const context = operations.removeTask('task-1')!;
			operations.restoreTask(context);

			expect(projects[0].taskLists[0].tasks[0].listId).toBe('list-1');
		});
	});

	describe('moveTaskBetweenLists', () => {
		it('タスクを別のリストに移動できる', () => {
			const context = operations.moveTaskBetweenLists('task-1', 'list-2');

			expect(context).not.toBeNull();
			expect(projects[0].taskLists[0].tasks).toHaveLength(1);
			expect(projects[0].taskLists[1].tasks).toHaveLength(1);
			expect(projects[0].taskLists[1].tasks[0].id).toBe('task-1');
		});

		it('移動したタスクのlistIdが更新される', () => {
			operations.moveTaskBetweenLists('task-1', 'list-2');

			expect(projects[0].taskLists[1].tasks[0].listId).toBe('list-2');
		});

		it('指定位置にタスクを移動できる', () => {
			// まずlist-2にtask-2を移動
			operations.moveTaskBetweenLists('task-2', 'list-2');
			// 次にtask-1を先頭に移動
			const context = operations.moveTaskBetweenLists('task-1', 'list-2', { targetIndex: 0 });

			expect(context).not.toBeNull();
			expect(projects[0].taskLists[1].tasks[0].id).toBe('task-1');
			expect(projects[0].taskLists[1].tasks[1].id).toBe('task-2');
		});

		it('存在しないタスクの移動はnullを返す', () => {
			const context = operations.moveTaskBetweenLists('non-existent', 'list-2');

			expect(context).toBeNull();
			expect(consoleErrorSpy).toHaveBeenCalledWith('Task not found for move: non-existent');
		});

		it('存在しないリストへの移動はnullを返す', () => {
			const context = operations.moveTaskBetweenLists('task-1', 'non-existent');

			expect(context).toBeNull();
			expect(consoleErrorSpy).toHaveBeenCalledWith('Target task list not found: non-existent');
		});

		it('移動コンテキストに正しい情報が含まれる', () => {
			const context = operations.moveTaskBetweenLists('task-1', 'list-2');

			expect(context?.task.id).toBe('task-1');
			expect(context?.sourceProject.id).toBe('project-1');
			expect(context?.sourceTaskList.id).toBe('list-1');
			expect(context?.sourceIndex).toBe(0);
			expect(context?.targetProject.id).toBe('project-1');
			expect(context?.targetTaskList.id).toBe('list-2');
			expect(context?.targetIndex).toBe(0);
		});
	});

	describe('restoreTaskMove', () => {
		it('移動したタスクを元に戻せる', () => {
			const context = operations.moveTaskBetweenLists('task-1', 'list-2')!;
			operations.restoreTaskMove(context);

			expect(projects[0].taskLists[0].tasks).toHaveLength(2);
			expect(projects[0].taskLists[1].tasks).toHaveLength(0);
			expect(projects[0].taskLists[0].tasks[0].id).toBe('task-1');
		});

		it('listIdが元に戻る', () => {
			const context = operations.moveTaskBetweenLists('task-1', 'list-2')!;
			operations.restoreTaskMove(context);

			expect(projects[0].taskLists[0].tasks[0].listId).toBe('list-1');
		});

		it('元の位置にタスクが戻る', () => {
			const context = operations.moveTaskBetweenLists('task-2', 'list-2')!;
			operations.restoreTaskMove(context);

			expect(projects[0].taskLists[0].tasks[1].id).toBe('task-2');
		});
	});

	describe('統合テスト', () => {
		it('削除と復元を繰り返せる', () => {
			const context1 = operations.removeTask('task-1')!;
			expect(projects[0].taskLists[0].tasks).toHaveLength(1);

			operations.restoreTask(context1);
			expect(projects[0].taskLists[0].tasks).toHaveLength(2);

			const context2 = operations.removeTask('task-1')!;
			expect(projects[0].taskLists[0].tasks).toHaveLength(1);

			operations.restoreTask(context2);
			expect(projects[0].taskLists[0].tasks).toHaveLength(2);
		});

		it('移動と復元を繰り返せる', () => {
			const context1 = operations.moveTaskBetweenLists('task-1', 'list-2')!;
			expect(projects[0].taskLists[0].tasks).toHaveLength(1);
			expect(projects[0].taskLists[1].tasks).toHaveLength(1);

			operations.restoreTaskMove(context1);
			expect(projects[0].taskLists[0].tasks).toHaveLength(2);
			expect(projects[0].taskLists[1].tasks).toHaveLength(0);

			const context2 = operations.moveTaskBetweenLists('task-1', 'list-2')!;
			expect(context2.targetTaskList.id).toBe('list-2');
			expect(projects[0].taskLists[0].tasks).toHaveLength(1);
			expect(projects[0].taskLists[1].tasks).toHaveLength(1);
		});
	});
});
