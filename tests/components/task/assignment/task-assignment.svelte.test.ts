import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/svelte';
import TaskAssignment from '$lib/components/task/assignment/task-assignment.svelte';
import { AssignmentService } from '$lib/services/domain/assignment';
import { errorHandler } from '$lib/stores/error-handler.svelte';
import { selectionStore } from '$lib/stores/selection-store.svelte';
import type { SubTask } from '$lib/types/sub-task';
import type { TaskWithSubTasks } from '$lib/types/task';
import type { User } from '$lib/types/user';

vi.mock('$lib/services/domain/assignment', () => ({
  AssignmentService: {
    createTaskAssignment: vi.fn(),
    createSubtaskAssignment: vi.fn(),
    deleteTaskAssignment: vi.fn(),
    deleteSubtaskAssignment: vi.fn()
  }
}));

function buildUser(id: string, displayName: string): User {
  return {
    id,
    handleId: id,
    displayName,
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    deleted: false,
    updatedBy: 'user-1'
  };
}

const task = {
  id: 'task-1',
  assignedUserIds: ['ada']
} as TaskWithSubTasks;

const subTask = {
  id: 'sub-1',
  taskId: 'task-1',
  assignedUserIds: ['ada']
} as SubTask;

const users = [buildUser('ada', 'Ada Lovelace'), buildUser('grace', 'Grace Hopper')];

describe('TaskAssignment', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    errorHandler.clearAllErrors();
    selectionStore.selectedProjectId = 'project-1';
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('renders nothing without a task or subtask', () => {
    const { container } = render(TaskAssignment, { props: { availableUsers: users } });
    expect(container.textContent?.trim()).toBe('');
  });

  it('assigns and unassigns a task user', async () => {
    const onAssignmentUpdated = vi.fn();
    vi.mocked(AssignmentService.createTaskAssignment).mockResolvedValue(true);
    vi.mocked(AssignmentService.deleteTaskAssignment).mockResolvedValue(true);

    render(TaskAssignment, { props: { task, availableUsers: users, onAssignmentUpdated } });

    await fireEvent.click(screen.getByRole('button', { name: /Grace Hopper/ }));
    expect(AssignmentService.createTaskAssignment).toHaveBeenCalledWith('project-1', 'task-1', 'grace');
    expect(onAssignmentUpdated).toHaveBeenCalledWith('task-1', ['ada', 'grace']);

    const unassign = screen.getAllByRole('button').find((button) => button.textContent?.trim() === '');
    await fireEvent.click(unassign!);
    expect(AssignmentService.deleteTaskAssignment).toHaveBeenCalledWith('project-1', 'task-1', 'ada');
    expect(onAssignmentUpdated).toHaveBeenCalledWith('task-1', []);
  });

  it('reports task assignment and removal failures', async () => {
    vi.mocked(AssignmentService.createTaskAssignment).mockResolvedValue(false);
    vi.mocked(AssignmentService.deleteTaskAssignment).mockResolvedValue(false);
    render(TaskAssignment, { props: { task, availableUsers: users } });

    await fireEvent.click(screen.getByRole('button', { name: /Grace Hopper/ }));
    expect(errorHandler.errors.at(-1)?.message).toBe('タスクへのユーザー割り当てに失敗しました');

    const unassign = screen.getAllByRole('button').find((button) => button.textContent?.trim() === '');
    await fireEvent.click(unassign!);
    expect(errorHandler.errors.at(-1)?.message).toBe('タスクからのユーザー割り当て解除に失敗しました');
  });

  it('assigns and unassigns a subtask user', async () => {
    const onAssignmentUpdated = vi.fn();
    vi.mocked(AssignmentService.createSubtaskAssignment).mockResolvedValue(true);
    vi.mocked(AssignmentService.deleteSubtaskAssignment).mockResolvedValueOnce(false).mockResolvedValueOnce(true);

    render(TaskAssignment, { props: { subTask, availableUsers: users, onAssignmentUpdated } });

    await fireEvent.click(screen.getByRole('button', { name: /Grace Hopper/ }));
    expect(AssignmentService.createSubtaskAssignment).toHaveBeenCalledWith(
      'project-1',
      'sub-1',
      'grace'
    );
    expect(onAssignmentUpdated).toHaveBeenCalledWith('sub-1', ['ada', 'grace']);

    const unassign = screen.getAllByRole('button').find((button) => button.textContent?.trim() === '');
    await fireEvent.click(unassign!);
    expect(errorHandler.errors.at(-1)?.message).toBe('サブタスクからのユーザー割り当て解除に失敗しました');

    await fireEvent.click(unassign!);
    expect(onAssignmentUpdated).toHaveBeenCalledWith('sub-1', []);
  });

  it('reports a subtask assignment failure', async () => {
    vi.mocked(AssignmentService.createSubtaskAssignment).mockResolvedValue(false);
    render(TaskAssignment, { props: { subTask, availableUsers: users } });

    await fireEvent.click(screen.getByRole('button', { name: /Grace Hopper/ }));
    expect(errorHandler.errors.at(-1)?.message).toBe('サブタスクへのユーザー割り当てに失敗しました');
  });

  it('requires a selected project', async () => {
    selectionStore.selectedProjectId = null;
    render(TaskAssignment, { props: { task, availableUsers: users } });

    await fireEvent.click(screen.getByRole('button', { name: /Grace Hopper/ }));
    expect(errorHandler.errors.at(-1)?.message).toBe('プロジェクトが選択されていません');
    expect(AssignmentService.createTaskAssignment).not.toHaveBeenCalled();

    errorHandler.clearAllErrors();
    const unassign = screen.getAllByRole('button').find((button) => button.textContent?.trim() === '');
    await fireEvent.click(unassign!);
    expect(errorHandler.errors.at(-1)?.message).toBe('プロジェクトが選択されていません');
  });

  it('reports unexpected assignment errors', async () => {
    vi.mocked(AssignmentService.createTaskAssignment).mockRejectedValue(new Error('offline'));
    vi.mocked(AssignmentService.deleteTaskAssignment).mockRejectedValue(new Error('offline'));
    render(TaskAssignment, { props: { task, availableUsers: users } });

    await fireEvent.click(screen.getByRole('button', { name: /Grace Hopper/ }));
    expect(errorHandler.errors.at(-1)?.message).toBe('ユーザー割り当て中にエラーが発生しました');

    const unassign = screen.getAllByRole('button').find((button) => button.textContent?.trim() === '');
    await fireEvent.click(unassign!);
    expect(errorHandler.errors.at(-1)?.message).toBe('ユーザー割り当て解除中にエラーが発生しました');
  });

  it('ignores a second click while the first assignment is in flight', async () => {
    let resolveAssignment: (value: boolean) => void = () => {};
    vi.mocked(AssignmentService.createTaskAssignment).mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveAssignment = resolve;
        })
    );
    render(TaskAssignment, { props: { task, availableUsers: users } });

    const button = screen.getByRole('button', { name: /Grace Hopper/ });
    const firstClick = fireEvent.click(button);
    await fireEvent.click(button);
    resolveAssignment(true);
    await firstClick;

    expect(AssignmentService.createTaskAssignment).toHaveBeenCalledTimes(1);
  });
});
