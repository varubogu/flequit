import { describe, test, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import TaskPrioritySelector from '$lib/components/task/task-priority-selector.svelte';

describe('TaskPrioritySelector Component', () => {
  const mockFormData = {
    title: 'Test Task',
    description: 'Test description',
    start_date: undefined,
    end_date: new Date('2024-01-15'),
    is_range_date: false,
    priority: 2
  };

  let onPriorityChange: ReturnType<typeof vi.fn>;
  let onFormChange: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    onPriorityChange = vi.fn();
    onFormChange = vi.fn();
    vi.clearAllMocks();
  });

  test('should render priority selector with current value', () => {
    render(TaskPrioritySelector, {
      isSubTask: false,
      formData: mockFormData,
      onPriorityChange,
      onFormChange
    });

    const prioritySelect = screen.getByLabelText('Priority');
    expect(prioritySelect).toBeInTheDocument();
    expect(prioritySelect).toHaveValue('2');
  });

  test('should show optional label for subtask', () => {
    render(TaskPrioritySelector, {
      isSubTask: true,
      formData: mockFormData,
      onPriorityChange,
      onFormChange
    });

    expect(screen.getByText('(Optional)')).toBeInTheDocument();
  });

  test('should show "Not Set" option for subtask', () => {
    render(TaskPrioritySelector, {
      isSubTask: true,
      formData: mockFormData,
      onPriorityChange,
      onFormChange
    });

    expect(screen.getByText('Not Set')).toBeInTheDocument();
  });

  test('should not show "Not Set" option for main task', () => {
    render(TaskPrioritySelector, {
      isSubTask: false,
      formData: mockFormData,
      onPriorityChange,
      onFormChange
    });

    expect(screen.queryByText('Not Set')).not.toBeInTheDocument();
  });

  test('should have all priority options', () => {
    render(TaskPrioritySelector, {
      isSubTask: false,
      formData: mockFormData,
      onPriorityChange,
      onFormChange
    });

    expect(screen.getByText('High (1)')).toBeInTheDocument();
    expect(screen.getByText('Medium (2)')).toBeInTheDocument();
    expect(screen.getByText('Low (3)')).toBeInTheDocument();
    expect(screen.getByText('Lowest (4)')).toBeInTheDocument();
  });

  test('should call onPriorityChange and onFormChange when priority is changed', async () => {
    render(TaskPrioritySelector, {
      isSubTask: false,
      formData: mockFormData,
      onPriorityChange,
      onFormChange
    });

    const prioritySelect = screen.getByLabelText('Priority');
    await fireEvent.change(prioritySelect, { target: { value: '1' } });

    expect(onPriorityChange).toHaveBeenCalledWith(1);
    expect(onFormChange).toHaveBeenCalled();
  });
});