import { describe, test, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import TaskDetailHeader from '$lib/components/task/detail/task-detail-header.svelte';
import type { TaskWithSubTasks } from '$lib/types/task';
import type { SubTask } from "$lib/types/sub-task";

describe('TaskDetailHeader Component', () => {
  const mockTask: TaskWithSubTasks = {
    id: 'task-1',
    title: 'Test Task',
    description: '',
    status: 'not_started',
    priority: 2,
    created_at: new Date(),
    updated_at: new Date(),
    list_id: 'list-1',
    order_index: 0,
    end_date: undefined,
    start_date: undefined,
    is_range_date: false,
    sub_tasks: [],
    tags: [],
    is_archived: false
  };

  const mockSubTask: SubTask = {
    id: 'subtask-1',
    title: 'Test SubTask',
    status: 'not_started',
    task_id: 'task-1',
    order_index: 0,
    created_at: new Date(),
    updated_at: new Date(),
    end_date: undefined,
    start_date: undefined,
    is_range_date: false,
    tags: []
  };

  let onTitleChange: ReturnType<typeof vi.fn>;
  let onDelete: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    onTitleChange = vi.fn();
    onDelete = vi.fn();
    vi.clearAllMocks();
  });

  test('should render task header correctly', () => {
    render(TaskDetailHeader, {
      currentItem: mockTask,
      isSubTask: false,
      title: 'Test Title',
      onTitleChange,
      onDelete
    });

    const titleInput = screen.getByDisplayValue('Test Title');
    expect(titleInput).toBeInTheDocument();
    expect(titleInput).toHaveAttribute('placeholder', 'Task title');
  });

  test('should render subtask header with subtask label', () => {
    render(TaskDetailHeader, {
      currentItem: mockSubTask,
      isSubTask: true,
      title: 'Test SubTask Title',
      onTitleChange,
      onDelete
    });

    // 「サブタスク」ラベルは削除されたため、このテストは不要
    const titleInput = screen.getByDisplayValue('Test SubTask Title');
    expect(titleInput).toHaveAttribute('placeholder', 'Sub-task title');
  });

  test('should render title input correctly', () => {
    render(TaskDetailHeader, {
      currentItem: mockTask,
      isSubTask: false,
      title: 'Original Title',
      onTitleChange,
      onDelete
    });

    const titleInput = screen.getByDisplayValue('Original Title');
    expect(titleInput).toBeInTheDocument();
    expect(titleInput).toHaveValue('Original Title');
  });

  test('should call onDelete when delete button is clicked', async () => {
    render(TaskDetailHeader, {
      currentItem: mockTask,
      isSubTask: false,
      title: 'Test Title',
      onTitleChange,
      onDelete
    });

    const deleteButton = screen.getByTitle('Delete Task');
    await fireEvent.click(deleteButton);

    expect(onDelete).toHaveBeenCalledTimes(1);
  });

  test('should have correct styling classes', () => {
    const { container } = render(TaskDetailHeader, {
      currentItem: mockTask,
      isSubTask: false,
      title: 'Test Title',
      onTitleChange,
      onDelete
    });

    expect(container.querySelector('.p-6.border-b')).toBeInTheDocument();
    expect(container.querySelector('.text-xl.font-semibold')).toBeInTheDocument();
    expect(container.querySelector('.text-destructive')).toBeInTheDocument();
  });

  test('should render delete button with trash icon', () => {
    render(TaskDetailHeader, {
      currentItem: mockTask,
      isSubTask: false,
      title: 'Test Title',
      onTitleChange,
      onDelete
    });

    const deleteButton = screen.getByTitle('Delete Task');
    expect(deleteButton).toBeInTheDocument();
    expect(deleteButton.querySelector('.lucide-trash-2')).toBeInTheDocument();
  });
});
