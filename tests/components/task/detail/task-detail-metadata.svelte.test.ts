import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/svelte';
import TaskDetailMetadata from '$lib/components/task/detail/task-detail-metadata.svelte';
import type { SubTask } from '$lib/types/sub-task';
import type { TaskWithSubTasks } from '$lib/types/task';

const task = {
  id: 'task-1',
  createdAt: new Date('2024-01-01T00:00:00Z'),
  updatedAt: new Date('2024-01-02T00:00:00Z')
} as TaskWithSubTasks;

const subTask = {
  id: 'sub-1',
  taskId: 'task-1',
  createdAt: new Date('2024-02-01T00:00:00Z'),
  updatedAt: new Date('2024-02-02T00:00:00Z')
} as SubTask;

describe('TaskDetailMetadata', () => {
  it('hides metadata while creating a new task', () => {
    const { container } = render(TaskDetailMetadata, {
      props: { currentItem: task, isSubTask: false, isNewTaskMode: true }
    });

    expect(container.textContent?.trim()).toBe('');
  });

  it('shows task timestamps and id', () => {
    render(TaskDetailMetadata, { props: { currentItem: task, isSubTask: false } });

    expect(screen.getByText(/task-1/)).toBeInTheDocument();
    expect(screen.queryByText(/parent_task_id/)).not.toBeInTheDocument();
  });

  it('links a subtask back to its parent', async () => {
    const onGoToParentTask = vi.fn();
    render(TaskDetailMetadata, {
      props: { currentItem: subTask, isSubTask: true, onGoToParentTask }
    });

    expect(screen.getByText(/task-1/)).toBeInTheDocument();
    await fireEvent.click(screen.getByRole('button'));
    expect(onGoToParentTask).toHaveBeenCalled();
  });

  it('shows a subtask without a parent link when no callback is provided', () => {
    render(TaskDetailMetadata, { props: { currentItem: subTask, isSubTask: true } });
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});
