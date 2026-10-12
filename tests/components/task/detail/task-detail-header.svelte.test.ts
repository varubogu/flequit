import { cleanup, fireEvent, render, screen } from '@testing-library/svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';
import TaskDetailHeader from '$lib/components/task/detail/task-detail-header.svelte';
import type { SubTask } from '$lib/types/sub-task';
import type { TaskWithSubTasks } from '$lib/types/task';
import type { Tag } from '$lib/types/tag';
import { tagStore } from '$lib/stores/tags.svelte';
import { TaskOperations } from '$lib/services/domain/task';
import { TaskInteractionsService } from '$lib/services/ui/task/task-interactions';
import { subTaskOperations } from '$lib/services/domain/subtask';

const task = { id: 'task-1', listId: 'list-1', title: 'Buy' } as TaskWithSubTasks;
const subTask = { id: 'sub-1', taskId: 'task-1', title: 'Child' } as SubTask;
const milkTag = {
  id: 'tag-milk',
  name: 'milk',
  createdAt: new Date('2026-01-01T00:00:00Z'),
  updatedAt: new Date('2026-01-01T00:00:00Z'),
  deleted: false,
  updatedBy: 'tester'
} as Tag;

async function typeTag(value: string) {
  const input = screen.getByRole('textbox') as HTMLInputElement;
  input.value = value;
  input.selectionStart = value.length;
  input.selectionEnd = value.length;
  await fireEvent.input(input);
  await fireEvent.keyDown(input, { key: 'Enter' });
}

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

  it('routes a selected tag to a new task, a subtask, or a task, and ignores items that cannot own a tag', async () => {
    (tagStore as { searchTags: (query: string) => Tag[] }).searchTags = vi.fn((query: string) =>
      query === 'mi' ? [milkTag] : []
    );
    const addToTask = vi
      .spyOn(TaskOperations.prototype, 'addTagToTaskByName')
      .mockResolvedValue(undefined);
    const addToNewTask = vi
      .spyOn(TaskInteractionsService.prototype, 'addTagToNewTask')
      .mockResolvedValue(undefined);
    const addToSubTask = vi.mocked(subTaskOperations.addTagToSubTaskByName);
    const onTitleChange = vi.fn();
    const onDelete = vi.fn();

    const { rerender } = render(TaskDetailHeader, {
      props: { currentItem: task, isSubTask: false, title: 'Buy', onTitleChange, onDelete }
    });
    await typeTag('Buy #mi');
    expect(addToTask).toHaveBeenCalledWith('task-1', 'milk');

    await rerender({
      currentItem: subTask,
      isSubTask: true,
      title: 'Child',
      onTitleChange,
      onDelete
    });
    await typeTag('Child #mi');
    expect(addToSubTask).toHaveBeenCalledWith('sub-1', 'task-1', 'milk');

    await rerender({
      currentItem: task,
      isSubTask: false,
      isNewTaskMode: true,
      title: 'New',
      onTitleChange,
      onDelete
    });
    await typeTag('New #mi');
    expect(addToNewTask).toHaveBeenCalledWith('milk');

    addToTask.mockClear();
    addToSubTask.mockClear();
    addToNewTask.mockClear();
    const orphan = { id: 'orphan', title: 'Orphan' } as TaskWithSubTasks;
    await rerender({
      currentItem: orphan,
      isSubTask: false,
      isNewTaskMode: false,
      title: 'Orphan',
      onTitleChange,
      onDelete
    });
    await typeTag('Orphan #mi');
    await rerender({
      currentItem: null as unknown as TaskWithSubTasks,
      isSubTask: true,
      title: 'Gone',
      onTitleChange,
      onDelete
    });
    await typeTag('Gone #mi');

    expect(addToTask).not.toHaveBeenCalled();
    expect(addToSubTask).not.toHaveBeenCalled();
    expect(addToNewTask).not.toHaveBeenCalled();
  });
});
