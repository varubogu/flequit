import { cleanup, fireEvent, render, screen } from '@testing-library/svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';
import TaskDetailHeader from '$lib/components/task/detail/task-detail-header.svelte';
import type { SubTask } from '$lib/types/sub-task';
import type { TaskWithSubTasks } from '$lib/types/task';

const task = { id: 'task-1', listId: 'list-1', title: 'Buy' } as TaskWithSubTasks;
const subTask = { id: 'sub-1', taskId: 'task-1', title: 'Child' } as SubTask;

describe('TaskDetailHeader', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('edits a task title and deletes it', async () => {
    const onTitleChange = vi.fn();
    const onDelete = vi.fn();
    render(TaskDetailHeader, {
      props: {
        currentItem: task,
        isSubTask: false,
        title: 'Buy',
        onTitleChange,
        onDelete
      }
    });

    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('placeholder', 'task_title');
    await fireEvent.input(input, { target: { value: 'Buy bread' } });
    expect(onTitleChange).toHaveBeenCalledWith('Buy bread');

    expect(screen.queryByTitle('save')).not.toBeInTheDocument();
    await fireEvent.click(screen.getByTitle('delete_task'));
    expect(onDelete).toHaveBeenCalledOnce();
  });

  it('uses the subtask placeholder and saves a new task only when the title is not blank', async () => {
    const onTitleChange = vi.fn();
    const onDelete = vi.fn();
    const onSaveNewTask = vi.fn();
    const { rerender } = render(TaskDetailHeader, {
      props: {
        currentItem: subTask,
        isSubTask: true,
        isNewTaskMode: true,
        title: '   ',
        onTitleChange,
        onDelete,
        onSaveNewTask
      }
    });

    expect(screen.getByRole('textbox')).toHaveAttribute('placeholder', 'sub_task_title');
    const save = screen.getByTitle('save');
    expect(save).toBeDisabled();

    await rerender({
      currentItem: subTask,
      isSubTask: true,
      isNewTaskMode: true,
      title: 'Child',
      onTitleChange,
      onDelete,
      onSaveNewTask
    });
    await fireEvent.click(screen.getByTitle('save'));
    expect(onSaveNewTask).toHaveBeenCalledOnce();
  });
});
