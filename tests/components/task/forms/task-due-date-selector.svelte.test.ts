import { describe, test, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import TaskDueDateSelector from '$lib/components/task/forms/task-due-date-selector.svelte';
import type { TaskWithSubTasks } from '$lib/types/task';

describe('TaskDueDateSelector Component', () => {
  const mockTask: TaskWithSubTasks = {
    id: 'task-1',
    projectId: 'project-1',
    title: 'Test Task',
    description: 'Test description',
    status: 'in_progress',
    priority: 2,
    assignedUserIds: [],
    tagIds: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    listId: 'list-1',
    orderIndex: 0,
    planStartDate: undefined,
    planEndDate: new Date('2024-01-15'),
    isRangeDate: false,
    subTasks: [],
    tags: [],
    isArchived: false
  };

  const mockFormData = {
    title: 'Test Task',
    description: 'Test description',
    plan_start_date: undefined,
    plan_end_date: new Date('2024-01-15'),
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
