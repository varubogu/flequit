import { describe, test, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import TaskStatusSelector from '$lib/components/task/forms/task-status-selector.svelte';
import type { TaskWithSubTasks } from '$lib/types/task';

describe('TaskStatusSelector Component', () => {
  const mockTask: TaskWithSubTasks = {
    id: 'task-1',
    project_id: 'project-1',
    title: 'Test Task',
    description: 'Test description',
    status: 'in_progress',
    priority: 2,
    assigned_user_ids: [],
    tag_ids: [],
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

  let onStatusChange: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    onStatusChange = vi.fn();
    vi.clearAllMocks();
  });

  test('should render status selector with current value', () => {
    render(TaskStatusSelector, {
      currentItem: mockTask,
      onStatusChange
    });

    const statusSelect = screen.getByLabelText('Status');
    expect(statusSelect).toBeInTheDocument();
    expect(statusSelect).toHaveValue('in_progress');
  });

  test('should have all status options', () => {
    render(TaskStatusSelector, {
      currentItem: mockTask,
      onStatusChange
    });

    expect(screen.getByText('Not Started')).toBeInTheDocument();
    expect(screen.getByText('In Progress')).toBeInTheDocument();
    expect(screen.getByText('Waiting')).toBeInTheDocument();
    expect(screen.getByText('Completed')).toBeInTheDocument();
    expect(screen.getByText('Cancelled')).toBeInTheDocument();
  });

  test('should call onStatusChange when status is changed', async () => {
    render(TaskStatusSelector, {
      currentItem: mockTask,
      onStatusChange
    });

    const statusSelect = screen.getByLabelText('Status');
    await fireEvent.change(statusSelect, { target: { value: 'completed' } });

    expect(onStatusChange).toHaveBeenCalled();
  });
});
