import { describe, test, expect, beforeEach } from 'vitest';
import { TaskStore } from '$lib/stores/tasks.svelte';
import type { Tag } from '$lib/types/tag';

/**
 * TaskStore 統合テスト
 *
 * このテストは TaskStore のファサードとしての統合動作を検証します。
 * 個別のクラス（TaskTagOperations等）の単体テストは別ファイルで実施しています。
 */
describe('TaskStore (Integration)', () => {
	let store: TaskStore;

	beforeEach(() => {
		store = new TaskStore();
	});

	describe('初期化', () => {
		test('初期状態を確認', () => {
			expect(store.projects).toEqual([]);
			expect(store.isNewTaskMode).toBe(false);
			expect(store.newTaskData).toBeNull();
			expect(store.selectedProjectId).toBeNull();
			expect(store.selectedTaskId).toBeNull();
		});

		test('内部ストアにアクセスできる', () => {
			expect(store.entities).toBeDefined();
			expect(store.selection).toBeDefined();
			expect(store.draft).toBeDefined();
		});
	});

	describe('プロジェクトデータ', () => {
		test('プロジェクトデータをロードできる', () => {
			const mockProjects: any[] = [
				{
					id: 'project-1',
					name: 'Test Project',
					description: '',
					color: '#FF0000',
					orderIndex: 0,
					isArchived: false,
					createdAt: new Date(),
					updatedAt: new Date(),
					taskLists: [],
					allTags: []
				}
			];

			store.loadProjectsData(mockProjects);

			expect(store.projects).toHaveLength(1);
			expect(store.projects[0].id).toBe('project-1');
		});

		test('プロジェクトデータを設定できる', () => {
			const mockProjects: any[] = [
				{
					id: 'project-2',
					name: 'Another Project',
					description: '',
					color: '#00FF00',
					orderIndex: 0,
					isArchived: false,
					createdAt: new Date(),
					updatedAt: new Date(),
					taskLists: [],
					allTags: []
				}
			];

			store.setProjects(mockProjects);

			expect(store.projects).toHaveLength(1);
			expect(store.projects[0].id).toBe('project-2');
		});
	});

	describe('新規タスクモード', () => {
		test('新規タスクモードを切り替えられる', () => {
			expect(store.isNewTaskMode).toBe(false);

			store.isNewTaskMode = true;

			expect(store.isNewTaskMode).toBe(true);
		});

		test('新規タスクデータを設定できる', () => {
			const mockTask: any = {
				id: 'task-1',
				projectId: 'project-1',
				listId: 'list-1',
				title: 'New Task',
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

			store.newTaskData = mockTask;

			expect(store.newTaskData).not.toBeNull();
			expect(store.newTaskData?.title).toBe('New Task');
		});
	});

	describe('選択状態', () => {
		test('プロジェクト選択状態を変更できる', () => {
			store.selectedProjectId = 'project-1';

			expect(store.selectedProjectId).toBe('project-1');
		});

		test('タスクリスト選択状態を変更できる', () => {
			store.selectedListId = 'list-1';

			expect(store.selectedListId).toBe('list-1');
		});

		test('タスク選択状態を変更できる', () => {
			store.selectedTaskId = 'task-1';

			expect(store.selectedTaskId).toBe('task-1');
		});

		test('サブタスク選択状態を変更できる', () => {
			store.selectedSubTaskId = 'subtask-1';

			expect(store.selectedSubTaskId).toBe('subtask-1');
		});

		test('保留中の選択をクリアできる', () => {
			store.pendingTaskSelection = 'task-1';
			store.pendingSubTaskSelection = 'subtask-1';

			store.clearPendingSelections();

			expect(store.pendingTaskSelection).toBeNull();
			expect(store.pendingSubTaskSelection).toBeNull();
		});
	});

	describe('タスクリスト取得', () => {
		test('すべてのタスクを取得できる', () => {
			const tasks = store.allTasks;

			expect(Array.isArray(tasks)).toBe(true);
		});

		test('今日のタスクを取得できる', () => {
			const tasks = store.todayTasks;

			expect(Array.isArray(tasks)).toBe(true);
		});

		test('期限切れタスクを取得できる', () => {
			const tasks = store.overdueTasks;

			expect(Array.isArray(tasks)).toBe(true);
		});
	});

	describe('タグ操作', () => {
		beforeEach(() => {
			// テスト用のプロジェクトとタスクを設定
			const mockProjects: any[] = [
				{
					id: 'project-1',
					name: 'Test Project',
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
							name: 'Test List',
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
									tags: []
								}
							]
						}
					],
					allTags: []
				}
			];

			store.loadProjectsData(mockProjects);
		});

		test('タスクにタグを付与できる', () => {
			const tag: Tag = {
				id: 'tag-1',
				name: 'Test Tag',
				color: '#0000FF',
				createdAt: new Date(),
				updatedAt: new Date()
			};

			store.attachTagToTask('task-1', tag);

			const task = store.getTaskById('task-1');
			expect(task?.tags).toHaveLength(1);
			expect(task?.tags[0].id).toBe('tag-1');
		});

		test('タスクからタグを削除できる', () => {
			const tag: Tag = {
				id: 'tag-1',
				name: 'Test Tag',
				color: '#0000FF',
				createdAt: new Date(),
				updatedAt: new Date()
			};

			store.attachTagToTask('task-1', tag);
			const removed = store.detachTagFromTask('task-1', 'tag-1');

			expect(removed).not.toBeNull();
			expect(removed?.id).toBe('tag-1');

			const task = store.getTaskById('task-1');
			expect(task?.tags).toHaveLength(0);
		});
	});

	describe('複雑な操作フロー', () => {
		test('プロジェクト読み込み→新規タスクモード切り替えのフロー', () => {
			// 1. プロジェクトデータを読み込み
			const mockProjects: any[] = [
				{
					id: 'project-1',
					name: 'Test Project',
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
				}
			];

			store.loadProjectsData(mockProjects);
			expect(store.projects).toHaveLength(1);

			// 2. 新規タスクモードを有効化
			store.isNewTaskMode = true;
			expect(store.isNewTaskMode).toBe(true);

			// 3. 新規タスクモードを無効化
			store.isNewTaskMode = false;
			expect(store.isNewTaskMode).toBe(false);
		});
	});
});
