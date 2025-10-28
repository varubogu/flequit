import { describe, test, expect, beforeEach } from 'vitest';
import { TaskCoreStore } from '$lib/stores/task-core-store.svelte';
import type { ProjectTree } from '$lib/types/project';

/**
 * TaskCoreStore 統合テスト
 *
 * このテストは TaskCoreStore のファサードとしての統合動作を検証します。
 * 個別のクラス（TaskCoreQueries, TaskCoreMutations, TaskCoreOperations）の
 * 単体テストは別ファイルで実施しています。
 */
describe('TaskCoreStore (Integration)', () => {
	let store: TaskCoreStore;

	const createMockProject = (): ProjectTree => ({
		id: 'project-1',
		name: 'Test Project',
		description: 'Test Description',
		color: '#FF0000',
		orderIndex: 0,
		isArchived: false,
		createdAt: new Date(),
		updatedAt: new Date(),
		taskLists: [
			{
				id: 'list-1',
				projectId: 'project-1',
				name: 'Test List',
				description: '',
				orderIndex: 0,
				isArchived: false,
				createdAt: new Date(),
				updatedAt: new Date(),
				tasks: []
			}
		],
		allTags: []
	});

	beforeEach(() => {
		store = new TaskCoreStore();
		store.loadProjectsData([createMockProject()]);
	});

	describe('初期化', () => {
		test('プロジェクトデータをロードできる', () => {
			expect(store.projects).toHaveLength(1);
			expect(store.projects[0].id).toBe('project-1');
		});

		test('空のプロジェクトデータをロードできる', () => {
			store.loadProjectsData([]);
			expect(store.projects).toHaveLength(0);
		});
	});

	describe('タスクのCRUD操作', () => {
		test('タスクを追加して取得できる', () => {
			const newTask = store.addTask('list-1', {
				projectId: 'project-1',
				title: 'Test Task',
				description: 'Test Description'
			});

			expect(newTask).not.toBeNull();
			expect(newTask?.title).toBe('Test Task');

			const retrieved = store.getTaskById(newTask!.id);
			expect(retrieved).not.toBeNull();
			expect(retrieved?.id).toBe(newTask?.id);
		});

		test('タスクを更新できる', () => {
			const newTask = store.addTask('list-1', {
				projectId: 'project-1',
				title: 'Original Title'
			});

			const success = store.updateTask(newTask!.id, { title: 'Updated Title' });
			expect(success).toBe(true);

			const updated = store.getTaskById(newTask!.id);
			expect(updated?.title).toBe('Updated Title');
		});

		test('タスクを削除できる', () => {
			const newTask = store.addTask('list-1', {
				projectId: 'project-1',
				title: 'Task to Delete'
			});

			const context = store.removeTask(newTask!.id);
			expect(context).not.toBeNull();

			const retrieved = store.getTaskById(newTask!.id);
			expect(retrieved).toBeNull();
		});
	});

	describe('タスクのステータス操作', () => {
		test('タスクのステータスを切り替えられる', () => {
			const newTask = store.addTask('list-1', {
				projectId: 'project-1',
				title: 'Test Task',
				status: 'not_started'
			});

			store.toggleTaskStatus(newTask!.id);
			const updated = store.getTaskById(newTask!.id);
			expect(updated?.status).toBe('completed');

			store.toggleTaskStatus(newTask!.id);
			const toggledBack = store.getTaskById(newTask!.id);
			expect(toggledBack?.status).toBe('not_started');
		});
	});

	describe('タスクの移動操作', () => {
		beforeEach(() => {
			const project = store.projects[0];
			project.taskLists.push({
				id: 'list-2',
				projectId: 'project-1',
				name: 'Second List',
				description: '',
				orderIndex: 1,
				isArchived: false,
				createdAt: new Date(),
				updatedAt: new Date(),
				tasks: []
			});
		});

		test('タスクを別のリストに移動できる', () => {
			const newTask = store.addTask('list-1', {
				projectId: 'project-1',
				title: 'Task to Move'
			});

			const context = store.moveTaskBetweenLists(newTask!.id, 'list-2');
			expect(context).not.toBeNull();

			const movedTask = store.getTaskById(newTask!.id);
			expect(movedTask?.listId).toBe('list-2');
		});

		test('移動したタスクを元に戻せる', () => {
			const newTask = store.addTask('list-1', {
				projectId: 'project-1',
				title: 'Task to Move'
			});

			const context = store.moveTaskBetweenLists(newTask!.id, 'list-2')!;
			store.restoreTaskMove(context);

			const restored = store.getTaskById(newTask!.id);
			expect(restored?.listId).toBe('list-1');
		});
	});

	describe('タスクの削除と復元', () => {
		test('削除したタスクを復元できる', () => {
			const newTask = store.addTask('list-1', {
				projectId: 'project-1',
				title: 'Task to Delete and Restore'
			});

			const context = store.removeTask(newTask!.id)!;
			expect(store.getTaskById(newTask!.id)).toBeNull();

			store.restoreTask(context);
			expect(store.getTaskById(newTask!.id)).not.toBeNull();
		});
	});

	describe('繰り返しタスク', () => {
		test('繰り返しタスクを作成できる', () => {
			store.createRecurringTask({
				projectId: 'project-1',
				listId: 'list-1',
				title: 'Recurring Task',
				recurrenceRule: {
					unit: 'day',
					interval: 1
				}
			});

			expect(store.projects[0].taskLists[0].tasks).toHaveLength(1);
			expect(store.projects[0].taskLists[0].tasks[0].recurrenceRule).toEqual({
				unit: 'day',
				interval: 1
			});
		});
	});

	describe('複雑な操作フロー', () => {
		test('タスクの追加→更新→移動→削除→復元のフロー', () => {
			// list-2を追加
			const project = store.projects[0];
			project.taskLists.push({
				id: 'list-2',
				projectId: 'project-1',
				name: 'Second List',
				description: '',
				orderIndex: 1,
				isArchived: false,
				createdAt: new Date(),
				updatedAt: new Date(),
				tasks: []
			});

			// 1. タスクを追加
			const task = store.addTask('list-1', {
				projectId: 'project-1',
				title: 'Complex Flow Task'
			});
			expect(task).not.toBeNull();

			// 2. タスクを更新
			store.updateTask(task!.id, { title: 'Updated Title' });
			let current = store.getTaskById(task!.id);
			expect(current?.title).toBe('Updated Title');

			// 3. タスクを移動
			const moveContext = store.moveTaskBetweenLists(task!.id, 'list-2')!;
			expect(moveContext.targetTaskList.id).toBe('list-2');
			current = store.getTaskById(task!.id);
			expect(current?.listId).toBe('list-2');

			// 4. タスクを削除
			const removeContext = store.removeTask(task!.id)!;
			expect(store.getTaskById(task!.id)).toBeNull();

			// 5. タスクを復元
			store.restoreTask(removeContext);
			current = store.getTaskById(task!.id);
			expect(current).not.toBeNull();
			expect(current?.title).toBe('Updated Title');
		});
	});
});
