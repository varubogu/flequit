import { afterAll, beforeEach, describe, expect, test, vi } from 'vitest';
import type { Task } from '$lib/types/task';

const backendStub = {
	task: {
		create: vi.fn(async (_projectId: string, _task: Task, _userId: string) => {}),
		update: vi.fn(async (_projectId: string, _taskId: string, _patch: Record<string, unknown>, _userId: string) => true),
		delete: vi.fn(async (_projectId: string, _taskId: string, _userId: string) => true),
		get: vi.fn(async (_projectId: string, _taskId: string, _userId: string) => null as Task | null)
	}
};

const resolveBackendMock = vi.fn(async () => backendStub);

vi.mock('$lib/infrastructure/backend-client', () => ({
	resolveBackend: resolveBackendMock,
	resetBackendCache: vi.fn()
}));

const errorHandlerMock = {
	addSyncError: vi.fn()
};

vi.mock('$lib/stores/error-handler.svelte', () => ({
	errorHandler: errorHandlerMock
}));

vi.mock('$lib/services/domain/current-user-id', () => ({
	getCurrentUserId: vi.fn(() => 'system')
}));

const fixedUuid = '00000000-0000-0000-0000-000000000123';
const uuidSpy = vi.spyOn(globalThis.crypto, 'randomUUID').mockReturnValue(fixedUuid);

vi.unmock('$lib/services/domain/task');
vi.unmock('$lib/services/domain/task/task-backend');
vi.unmock('../../src/lib/services/domain/task');
vi.unmock('../../src/lib/services/domain/task/task-backend');

const { TaskBackend } = await vi.importActual<
	typeof import('../../src/lib/services/domain/task/task-backend')
>('../../src/lib/services/domain/task/task-backend');

describe('TaskBackend', () => {
	beforeEach(() => {
		resolveBackendMock.mockClear().mockResolvedValue(backendStub);
		errorHandlerMock.addSyncError.mockClear();
		uuidSpy.mockReturnValue(fixedUuid);
		backendStub.task.create.mockReset();
		backendStub.task.update.mockReset();
		backendStub.task.delete.mockReset();
		backendStub.task.get.mockReset();
	});

	test('createTask: プロジェクトID付きでタスクを生成しバックエンドへ登録する', async () => {
		backendStub.task.create.mockResolvedValueOnce();

	const result = await TaskBackend.createTask('list-123', {
		projectId: 'project-123',
		title: 'New Task',
		description: 'Detail',
		status: 'not_started',
		priority: 1,
		orderIndex: 0,
		isArchived: false,
		assignedUserIds: [],
		tagIds: [],
		listId: 'list-123',
		createdAt: new Date('2024-01-01T00:00:00Z'),
		updatedAt: new Date('2024-01-01T00:00:00Z')
	});

		expect(resolveBackendMock).toHaveBeenCalledTimes(1);
		expect(backendStub.task.create).toHaveBeenCalledWith(
			'project-123',
			expect.objectContaining({
				id: fixedUuid,
				listId: 'list-123',
				projectId: 'project-123',
				title: 'New Task'
			}),
			'system'
		);
		expect(result.id).toBe(fixedUuid);
		expect(result.listId).toBe('list-123');
		expect(result.projectId).toBe('project-123');
		expect(result.createdAt).toBeInstanceOf(Date);
		expect(result.updatedAt).toBeInstanceOf(Date);
	});

	test('createTask: プロジェクトIDが無い場合はエラーを投げる', async () => {
	await expect(
		TaskBackend.createTask('list-123', {
			projectId: undefined as unknown as string,
			title: 'Invalid Task',
			status: 'not_started',
			priority: 0,
			orderIndex: 0,
			isArchived: false,
			assignedUserIds: [],
			tagIds: [],
			listId: 'list-123',
			createdAt: new Date('2024-01-01T00:00:00Z'),
			updatedAt: new Date('2024-01-01T00:00:00Z')
		})
	).rejects.toThrow('タスクにproject_idが設定されていません。');
		expect(resolveBackendMock).not.toHaveBeenCalled();
	});

	test('createTask: バックエンドエラー時はerrorHandlerに通知して再throwする', async () => {
		const backendError = new Error('backend down');
		backendStub.task.create.mockRejectedValueOnce(backendError);

	await expect(
		TaskBackend.createTask('list-123', {
			projectId: 'project-123',
			title: 'Fail Task',
			status: 'not_started',
			priority: 0,
			orderIndex: 0,
			isArchived: false,
			assignedUserIds: [],
			tagIds: [],
			listId: 'list-123',
			createdAt: new Date('2024-01-01T00:00:00Z'),
			updatedAt: new Date('2024-01-01T00:00:00Z')
		})
	).rejects.toThrow(backendError);

		expect(errorHandlerMock.addSyncError).toHaveBeenCalledWith(
			'タスク作成',
			'task',
			fixedUuid,
			backendError
		);
	});

	test('updateTask: 日付フィールドをISOへ変換して同期し、結果を取得する', async () => {
		const planStartDate = new Date('2024-01-10T00:00:00Z');
		const planEndDate = new Date('2024-01-12T00:00:00Z');
		const doStartDate = new Date('2024-01-08T00:00:00Z');
		const doEndDate = new Date('2024-01-09T00:00:00Z');

	const updatedTask: Task = {
		id: 'task-123',
		projectId: 'project-123',
		listId: 'list-123',
		title: 'Updated',
		description: 'Updated detail',
		status: 'in_progress',
		priority: 2,
		planStartDate,
		planEndDate,
		doStartDate,
		doEndDate,
		isRangeDate: true,
		recurrenceRule: { unit: 'day', interval: 1 },
		orderIndex: 0,
		isArchived: false,
		assignedUserIds: [],
		tagIds: [],
		createdAt: new Date('2024-01-01T00:00:00Z'),
		updatedAt: new Date('2024-01-10T00:00:00Z')
	};

		backendStub.task.update.mockResolvedValueOnce(true);
		backendStub.task.get.mockResolvedValueOnce(updatedTask);

		const result = await TaskBackend.updateTask('project-123', 'task-123', {
			title: 'Updated',
			planStartDate,
			planEndDate,
			doStartDate,
			doEndDate,
			recurrenceRule: updatedTask.recurrenceRule
		});

		expect(backendStub.task.update).toHaveBeenCalledWith(
			'project-123',
			'task-123',
			expect.objectContaining({
				id: 'task-123',
				title: 'Updated',
				plan_start_date: planStartDate.toISOString(),
				plan_end_date: planEndDate.toISOString(),
				do_start_date: doStartDate.toISOString(),
				do_end_date: doEndDate.toISOString()
			}),
			'system'
		);
		expect(backendStub.task.get).toHaveBeenCalledWith('project-123', 'task-123', 'system');
		expect(result).toEqual(updatedTask);
	});

	test('updateTask: バックエンドがfalseを返した場合はnullを返す', async () => {
		backendStub.task.update.mockResolvedValueOnce(false);

		const result = await TaskBackend.updateTask('project-123', 'task-123', { title: 'No change' });

		expect(result).toBeNull();
		expect(backendStub.task.get).not.toHaveBeenCalled();
	});

	test('updateTask: エラー時はerrorHandlerに通知して再throwする', async () => {
		const backendError = new Error('update failed');
		backendStub.task.update.mockRejectedValueOnce(backendError);

		await expect(
			TaskBackend.updateTask('project-123', 'task-123', { title: 'Broken' })
		).rejects.toThrow(backendError);

		expect(errorHandlerMock.addSyncError).toHaveBeenCalledWith(
			'タスク更新',
			'task',
			'task-123',
			backendError
		);
	});

	test('deleteTask: 削除成功時はtrue、失敗時はfalseを返す', async () => {
		backendStub.task.delete.mockResolvedValueOnce(true);

		const success = await TaskBackend.deleteTask('project-123', 'task-123');
		expect(success).toBe(true);

		backendStub.task.delete.mockResolvedValueOnce(false);
		const failure = await TaskBackend.deleteTask('project-123', 'task-123');
		expect(failure).toBe(false);
	});

	test('deleteTask: エラー時はerrorHandlerに通知して再throwする', async () => {
		const backendError = new Error('delete failed');
		backendStub.task.delete.mockRejectedValueOnce(backendError);

		await expect(TaskBackend.deleteTask('project-123', 'task-123')).rejects.toThrow(backendError);

		expect(errorHandlerMock.addSyncError).toHaveBeenCalledWith(
			'タスク削除',
			'task',
			'task-123',
			backendError
		);
	});

	test('createTaskWithSubTasks: createTaskを委譲する', async () => {
		const createSpy = vi.spyOn(TaskBackend, 'createTask').mockResolvedValueOnce({
			id: fixedUuid,
			projectId: 'project-123',
			listId: 'list-123',
			title: 'Delegated',
			description: '',
			status: 'not_started',
			priority: 0,
			orderIndex: 0,
			isArchived: false,
			assignedUserIds: [],
			tagIds: [],
			createdAt: new Date(),
			updatedAt: new Date(),
		});

		await TaskBackend.createTaskWithSubTasks('list-123', {} as Task);
		expect(createSpy).toHaveBeenCalled();
		createSpy.mockRestore();
	});

	test('updateTaskWithSubTasks: updateTaskへ委譲する', async () => {
		const updateSpy = vi.spyOn(TaskBackend, 'updateTask').mockResolvedValueOnce(null);
		await TaskBackend.updateTaskWithSubTasks('project-123', 'task-123', {});
		expect(updateSpy).toHaveBeenCalledWith('project-123', 'task-123', {});
		updateSpy.mockRestore();
	});

	test('deleteTaskWithSubTasks: deleteTaskへ委譲し結果を返す', async () => {
		const deleteSpy = vi.spyOn(TaskBackend, 'deleteTask').mockResolvedValueOnce(true);
		const result = await TaskBackend.deleteTaskWithSubTasks('project-123', 'task-123');
		expect(deleteSpy).toHaveBeenCalledWith('project-123', 'task-123');
		expect(result).toBe(true);
		deleteSpy.mockRestore();
	});
});

afterAll(() => {
	uuidSpy.mockRestore();
});
