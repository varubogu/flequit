import { describe, test, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import TaskDetailForm from '../../src/lib/components/task-detail-form.svelte';
import type { TaskWithSubTasks, SubTask } from '../../src/lib/types/task';

describe('TaskDetailForm Component', () => {
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

  let onStatusChange: ReturnType<typeof vi.fn>;
  let onFormChange: ReturnType<typeof vi.fn>;
  let onDueDateClick: ReturnType<typeof vi.fn>;
  let onDescriptionChange: ReturnType<typeof vi.fn>;
  let onPriorityChange: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    onStatusChange = vi.fn();
    onFormChange = vi.fn();
    onDueDateClick = vi.fn();
    onDescriptionChange = vi.fn();
    onPriorityChange = vi.fn();
    vi.clearAllMocks();
  });

  test('should render form fields correctly', () => {
    render(TaskDetailForm, {
      currentItem: mockTask,
      isSubTask: false,
      formData: mockFormData,
      onStatusChange,
      onFormChange,
      onDueDateClick,
      onDescriptionChange,
      onPriorityChange
    });

    expect(screen.getByLabelText('Status')).toBeInTheDocument();
    expect(screen.getByText('Due Date')).toBeInTheDocument(); // Changed from getByLabelText
    expect(screen.getByLabelText('Priority')).toBeInTheDocument();
    expect(screen.getByLabelText('Description')).toBeInTheDocument();
  });

  test('should show optional labels for subtask', () => {
    render(TaskDetailForm, {
      currentItem: mockTask,
      isSubTask: true,
      formData: mockFormData,
      onStatusChange,
      onFormChange,
      onDueDateClick,
      onDescriptionChange,
      onPriorityChange
    });

    const optionalTexts = screen.getAllByText('(Optional)');
    expect(optionalTexts.length).toBeGreaterThan(0);
  });

  test('should call onStatusChange when status is changed', async () => {
    render(TaskDetailForm, {
      currentItem: mockTask,
      isSubTask: false,
      formData: mockFormData,
      onStatusChange,
      onFormChange,
      onDueDateClick,
      onDescriptionChange,
      onPriorityChange
    });

    const statusSelect = screen.getByLabelText('Status');
    await fireEvent.change(statusSelect, { target: { value: 'completed' } });

    expect(onStatusChange).toHaveBeenCalled();
  });

  test('should call onDueDateClick when date button is clicked', async () => {
    render(TaskDetailForm, {
      currentItem: mockTask,
      isSubTask: false,
      formData: mockFormData,
      onStatusChange,
      onFormChange,
      onDueDateClick,
      onDescriptionChange,
      onPriorityChange
    });

    const dateButton = screen.getByRole('button');
    await fireEvent.click(dateButton);

    expect(onDueDateClick).toHaveBeenCalled();
  });

  test('should render description textarea correctly', () => {
    render(TaskDetailForm, {
      currentItem: mockTask,
      isSubTask: false,
      formData: mockFormData,
      onStatusChange,
      onFormChange,
      onDueDateClick,
      onDescriptionChange,
      onPriorityChange
    });

    const descriptionTextarea = screen.getByLabelText('Description');
    expect(descriptionTextarea).toBeInTheDocument();
    expect(descriptionTextarea).toHaveValue('Test description');
  });

  test('should call onPriorityChange when priority is changed', async () => {
    render(TaskDetailForm, {
      currentItem: mockTask,
      isSubTask: false,
      formData: mockFormData,
      onStatusChange,
      onFormChange,
      onDueDateClick,
      onDescriptionChange,
      onPriorityChange
    });

    const prioritySelect = screen.getByLabelText('Priority');
    await fireEvent.change(prioritySelect, { target: { value: '1' } });

    expect(onPriorityChange).toHaveBeenCalledWith(1);
    expect(onFormChange).toHaveBeenCalled();
  });

  test('should show "Not Set" option for subtask priority', () => {
    render(TaskDetailForm, {
      currentItem: mockTask,
      isSubTask: true,
      formData: mockFormData,
      onStatusChange,
      onFormChange,
      onDueDateClick,
      onDescriptionChange,
      onPriorityChange
    });

    expect(screen.getByText('Not Set')).toBeInTheDocument();
  });

  test('should display formatted date when end_date is set', () => {
    render(TaskDetailForm, {
      currentItem: mockTask,
      isSubTask: false,
      formData: mockFormData,
      onStatusChange,
      onFormChange,
      onDueDateClick,
      onDescriptionChange,
      onPriorityChange
    });

    // The exact date format depends on formatDate function, 
    // but we can check that it's not showing "Select date"
    expect(screen.queryByText('Select date')).not.toBeInTheDocument();
  });

  test('should show "Select date" placeholder when no end_date', () => {
    const formDataWithoutDate = { ...mockFormData, end_date: undefined };
    
    render(TaskDetailForm, {
      currentItem: mockTask,
      isSubTask: false,
      formData: formDataWithoutDate,
      onStatusChange,
      onFormChange,
      onDueDateClick,
      onDescriptionChange,
      onPriorityChange
    });

    expect(screen.getByText('Select date')).toBeInTheDocument();
  });
});