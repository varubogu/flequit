import { describe, test, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import TaskDescriptionEditor from '$lib/components/task/task-description-editor.svelte';
import type { TaskWithSubTasks, SubTask } from '$lib/types/task';

describe('TaskDescriptionEditor Component', () => {
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

  let onDescriptionChange: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    onDescriptionChange = vi.fn();
    vi.clearAllMocks();
  });

  test('should render description editor correctly', () => {
    render(TaskDescriptionEditor, {
      currentItem: mockTask,
      isSubTask: false,
      formData: mockFormData,
      onDescriptionChange
    });

    const descriptionTextarea = screen.getByLabelText('Description');
    expect(descriptionTextarea).toBeInTheDocument();
    expect(descriptionTextarea).toHaveValue('Test description');
  });

  test('should show optional label for subtask', () => {
    render(TaskDescriptionEditor, {
      currentItem: mockTask,
      isSubTask: true,
      formData: mockFormData,
      onDescriptionChange
    });

    expect(screen.getByText('(Optional)')).toBeInTheDocument();
  });

  test('should not show optional label for main task', () => {
    render(TaskDescriptionEditor, {
      currentItem: mockTask,
      isSubTask: false,
      formData: mockFormData,
      onDescriptionChange
    });

    expect(screen.queryByText('(Optional)')).not.toBeInTheDocument();
  });

  test('should call onDescriptionChange when textarea value changes', async () => {
    render(TaskDescriptionEditor, {
      currentItem: mockTask,
      isSubTask: false,
      formData: mockFormData,
      onDescriptionChange
    });

    const descriptionTextarea = screen.getByLabelText('Description');
    await fireEvent.input(descriptionTextarea, { target: { value: 'New description' } });

    expect(onDescriptionChange).toHaveBeenCalledWith('New description');
  });

  test('should show correct placeholder for main task', () => {
    const formDataWithoutDescription = { ...mockFormData, description: '' };
    
    render(TaskDescriptionEditor, {
      currentItem: mockTask,
      isSubTask: false,
      formData: formDataWithoutDescription,
      onDescriptionChange
    });

    const descriptionTextarea = screen.getByLabelText('Description');
    expect(descriptionTextarea).toHaveAttribute('placeholder', 'Task description');
  });

  test('should show correct placeholder for subtask', () => {
    const formDataWithoutDescription = { ...mockFormData, description: '' };
    
    render(TaskDescriptionEditor, {
      currentItem: mockTask,
      isSubTask: true,
      formData: formDataWithoutDescription,
      onDescriptionChange
    });

    const descriptionTextarea = screen.getByRole('textbox');
    expect(descriptionTextarea).toHaveAttribute('placeholder', 'Sub-task description (optional)');
  });
});