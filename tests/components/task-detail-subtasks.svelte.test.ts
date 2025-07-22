import { describe, test, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import TaskDetailSubTasks from '../../src/lib/components/task-detail-subtasks.svelte';
import type { TaskWithSubTasks } from '../../src/lib/types/task';

describe('TaskDetailSubTasks Component', () => {
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
    tags: [],
    is_archived: false,
    sub_tasks: [
      {
        id: 'subtask-1',
        title: 'SubTask 1',
        status: 'not_started',
        task_id: 'task-1',
        order_index: 0,
        created_at: new Date(),
        updated_at: new Date(),
        end_date: new Date('2024-01-15'),
        start_date: undefined,
        is_range_date: false
      },
      {
        id: 'subtask-2',
        title: 'SubTask 2',
        status: 'completed',
        task_id: 'task-1',
        order_index: 1,
        created_at: new Date(),
        updated_at: new Date(),
        end_date: undefined,
        start_date: undefined,
        is_range_date: false
      }
    ]
  };

  const mockTaskWithoutSubTasks: TaskWithSubTasks = {
    ...mockTask,
    sub_tasks: []
  };

  let onSubTaskClick: ReturnType<typeof vi.fn>;
  let onSubTaskToggle: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    onSubTaskClick = vi.fn();
    onSubTaskToggle = vi.fn();
    vi.clearAllMocks();
  });

  test('should render subtasks when they exist', () => {
    render(TaskDetailSubTasks, {
      task: mockTask,
      selectedSubTaskId: null,
      onSubTaskClick,
      onSubTaskToggle
    });

    expect(screen.getByText('Sub-tasks')).toBeInTheDocument();
    expect(screen.getByText('SubTask 1')).toBeInTheDocument();
    expect(screen.getByText('SubTask 2')).toBeInTheDocument();
  });

  test('should not render when no subtasks exist', () => {
    render(TaskDetailSubTasks, {
      task: mockTaskWithoutSubTasks,
      selectedSubTaskId: null,
      onSubTaskClick,
      onSubTaskToggle
    });

    expect(screen.queryByText('Sub-tasks')).not.toBeInTheDocument();
  });

  test('should highlight selected subtask', () => {
    render(TaskDetailSubTasks, {
      task: mockTask,
      selectedSubTaskId: 'subtask-1',
      onSubTaskClick,
      onSubTaskToggle
    });

    const selectedSubTask = screen.getByText('SubTask 1').closest('button');
    expect(selectedSubTask).toHaveClass('bg-primary/10', 'border-primary');
  });

  test('should call onSubTaskClick when subtask is clicked', async () => {
    render(TaskDetailSubTasks, {
      task: mockTask,
      selectedSubTaskId: null,
      onSubTaskClick,
      onSubTaskToggle
    });

    const subTaskButton = screen.getByText('SubTask 1').closest('button');
    await fireEvent.click(subTaskButton!);

    expect(onSubTaskClick).toHaveBeenCalledWith('subtask-1');
  });

  test('should call onSubTaskToggle when toggle button is clicked', async () => {
    render(TaskDetailSubTasks, {
      task: mockTask,
      selectedSubTaskId: null,
      onSubTaskClick,
      onSubTaskToggle
    });

    const toggleButtons = screen.getAllByLabelText('Toggle subtask completion');
    await fireEvent.click(toggleButtons[0]);

    expect(onSubTaskToggle).toHaveBeenCalledWith('subtask-1');
    expect(onSubTaskClick).not.toHaveBeenCalled(); // Should stop propagation
  });

  test('should show completed checkmark for completed subtasks', () => {
    render(TaskDetailSubTasks, {
      task: mockTask,
      selectedSubTaskId: null,
      onSubTaskClick,
      onSubTaskToggle
    });

    const toggleButtons = screen.getAllByLabelText('Toggle subtask completion');
    expect(toggleButtons[0]).toHaveTextContent('⚪'); // not completed
    expect(toggleButtons[1]).toHaveTextContent('✅'); // completed
  });

  test('should show strikethrough for completed subtasks', () => {
    render(TaskDetailSubTasks, {
      task: mockTask,
      selectedSubTaskId: null,
      onSubTaskClick,
      onSubTaskToggle
    });

    const completedSubTask = screen.getByText('SubTask 2');
    expect(completedSubTask).toHaveClass('line-through', 'text-muted-foreground');
  });

  test('should display subtask due date when present', () => {
    render(TaskDetailSubTasks, {
      task: mockTask,
      selectedSubTaskId: null,
      onSubTaskClick,
      onSubTaskToggle
    });

    // The exact date format depends on formatDate function
    // We check that the date container exists for the first subtask
    const subtaskWithDate = screen.getByText('SubTask 1').closest('button');
    expect(subtaskWithDate?.querySelector('.text-xs.text-muted-foreground.whitespace-nowrap')).toBeInTheDocument();
  });

  test('should not display date when subtask has no due date', () => {
    render(TaskDetailSubTasks, {
      task: mockTask,
      selectedSubTaskId: null,
      onSubTaskClick,
      onSubTaskToggle
    });

    const subtaskWithoutDate = screen.getByText('SubTask 2').closest('button');
    expect(subtaskWithoutDate?.querySelector('.text-xs.text-muted-foreground.whitespace-nowrap')).not.toBeInTheDocument();
  });
});