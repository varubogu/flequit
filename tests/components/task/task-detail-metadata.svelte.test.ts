import { describe, test, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import TaskDetailMetadata from '$lib/components/task/task-detail-metadata.svelte';
import type { TaskWithSubTasks } from '$lib/types/task';
import type { SubTask } from "$lib/types/sub-task";

describe('TaskDetailMetadata Component', () => {
  const mockTask: TaskWithSubTasks = {
    id: 'task-1',
    title: 'Test Task',
    description: '',
    status: 'not_started',
    priority: 2,
    created_at: new Date('2024-01-01T10:00:00Z'),
    updated_at: new Date('2024-01-02T15:30:00Z'),
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
    created_at: new Date('2024-01-01T10:00:00Z'),
    updated_at: new Date('2024-01-02T15:30:00Z'),
    end_date: undefined,
    start_date: undefined,
    is_range_date: false,
    tags: []
  };

  let onGoToParentTask: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    onGoToParentTask = vi.fn();
    vi.clearAllMocks();
  });

  test('should render task metadata correctly', () => {
    render(TaskDetailMetadata, {
      currentItem: mockTask,
      isSubTask: false,
      onGoToParentTask
    });

    expect(screen.getByText(/Created:/)).toBeInTheDocument();
    expect(screen.getByText(/Updated:/)).toBeInTheDocument();
    expect(screen.getByText('Task ID: task-1')).toBeInTheDocument();
  });

  test('should render subtask metadata correctly', () => {
    render(TaskDetailMetadata, {
      currentItem: mockSubTask,
      isSubTask: true,
      onGoToParentTask
    });

    expect(screen.getByText(/Created:/)).toBeInTheDocument();
    expect(screen.getByText(/Updated:/)).toBeInTheDocument();
    expect(screen.getByText('Sub-task ID: subtask-1')).toBeInTheDocument();
    expect(screen.getByText('Parent Task ID: task-1')).toBeInTheDocument();
  });

  test('should show "Go to Parent Task" button for subtasks', () => {
    render(TaskDetailMetadata, {
      currentItem: mockSubTask,
      isSubTask: true,
      onGoToParentTask
    });

    const goToParentButton = screen.getByText('Go to Parent Task');
    expect(goToParentButton).toBeInTheDocument();
  });

  test('should not show "Go to Parent Task" button for main tasks', () => {
    render(TaskDetailMetadata, {
      currentItem: mockTask,
      isSubTask: false,
      onGoToParentTask
    });

    expect(screen.queryByText('Go to Parent Task')).not.toBeInTheDocument();
  });

  test('should call onGoToParentTask when button is clicked', async () => {
    render(TaskDetailMetadata, {
      currentItem: mockSubTask,
      isSubTask: true,
      onGoToParentTask
    });

    const goToParentButton = screen.getByText('Go to Parent Task');
    await fireEvent.click(goToParentButton);

    expect(onGoToParentTask).toHaveBeenCalledTimes(1);
  });

  test('should not show parent task button when onGoToParentTask is not provided', () => {
    render(TaskDetailMetadata, {
      currentItem: mockSubTask,
      isSubTask: true
    });

    expect(screen.queryByText('Go to Parent Task')).not.toBeInTheDocument();
  });

  test('should have correct styling classes', () => {
    const { container } = render(TaskDetailMetadata, {
      currentItem: mockTask,
      isSubTask: false,
      onGoToParentTask
    });

    expect(
      container.querySelector('.border-t.pt-4.space-y-2.text-sm.text-muted-foreground')
    ).toBeInTheDocument();
  });

  test('should format dates correctly', () => {
    render(TaskDetailMetadata, {
      currentItem: mockTask,
      isSubTask: false,
      onGoToParentTask
    });

    // The exact format depends on formatDateTime function
    // We check that the dates are displayed
    expect(screen.getByText(/Created:/)).toBeInTheDocument();
    expect(screen.getByText(/Updated:/)).toBeInTheDocument();
  });

  test('should handle subtask without task_id field gracefully', () => {
    const subTaskWithoutTaskId = {
      ...mockSubTask
    };
    delete (subTaskWithoutTaskId as Record<string, unknown>).task_id;

    render(TaskDetailMetadata, {
      currentItem: subTaskWithoutTaskId,
      isSubTask: true,
      onGoToParentTask
    });

    expect(screen.getByText('Sub-task ID: subtask-1')).toBeInTheDocument();
    expect(screen.queryByText(/Parent Task ID:/)).not.toBeInTheDocument();
  });
});
