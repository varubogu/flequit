import { describe, test, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import TaskDueDateSelector from '$lib/components/task/task-due-date-selector.svelte';
import type { TaskWithSubTasks, SubTask } from '$lib/types/task';

describe('TaskDueDateSelector Component', () => {
  const mockTask: TaskWithSubTasks = {
    id: 'task-1',
    title: 'Test Task',
    description: 'Test description',
    status: 'in_progress',
    priority: 2,
    created_at: new Date(),
    updated_at: new Date(),
    list_id: 'list-1',
    order_index: 0,
    end_date: new Date('2024-01-15'),
    start_date: undefined,
    is_range_date: false,
    sub_tasks: [],
    tags: [],
    is_archived: false
  };

  const mockFormData = {
    title: 'Test Task',
    description: 'Test description',
    start_date: undefined,
    end_date: new Date('2024-01-15'),
    is_range_date: false,
    priority: 2
  };

  let onDueDateClick: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    onDueDateClick = vi.fn();
    vi.clearAllMocks();
  });

  test('should render due date selector correctly', () => {
    render(TaskDueDateSelector, {
      currentItem: mockTask,
      isSubTask: false,
      formData: mockFormData,
      onDueDateClick
    });

    expect(screen.getByText('Due Date')).toBeInTheDocument();
  });

  test('should show optional label for subtask', () => {
    render(TaskDueDateSelector, {
      currentItem: mockTask,
      isSubTask: true,
      formData: mockFormData,
      onDueDateClick
    });

    expect(screen.getByText('(Optional)')).toBeInTheDocument();
  });

  test('should call onDueDateClick when date button is clicked', async () => {
    render(TaskDueDateSelector, {
      currentItem: mockTask,
      isSubTask: false,
      formData: mockFormData,
      onDueDateClick
    });

    const dateButton = screen.getByRole('button');
    await fireEvent.click(dateButton);

    expect(onDueDateClick).toHaveBeenCalled();
  });

  test('should not show optional label for main task', () => {
    render(TaskDueDateSelector, {
      currentItem: mockTask,
      isSubTask: false,
      formData: mockFormData,
      onDueDateClick
    });

    expect(screen.queryByText('(Optional)')).not.toBeInTheDocument();
  });
});
