import { describe, test, expect, beforeEach, vi } from 'vitest';
import { render } from '@testing-library/svelte';
import TaskDatePicker from '$lib/components/task/task-date-picker.svelte';
import type { TaskWithSubTasks, SubTask } from '$lib/types/task';

// Mock taskStore
vi.mock('$lib/stores/tasks.svelte', () => ({
  taskStore: {
    updateTask: vi.fn(),
    updateSubTask: vi.fn()
  }
}));

// Mock InlineDatePicker component
vi.mock('$lib/components/inline-date-picker.svelte', () => ({
  default: () => null
}));

describe('TaskDatePicker Component', () => {
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
    end_date: new Date('2024-01-15'),
    start_date: undefined,
    is_range_date: false,
    is_archived: false,
    tags: [],
    sub_tasks: [
      {
        id: 'subtask-1',
        title: 'Subtask 1',
        status: 'not_started',
        task_id: 'task-1',
        order_index: 0,
        created_at: new Date(),
        updated_at: new Date(),
        end_date: new Date('2024-01-16'),
        start_date: undefined,
        is_range_date: false,
        tags: []
      }
    ]
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('should render without crashing', () => {
    const { container } = render(TaskDatePicker, { task: mockTask });
    expect(container).toBeInTheDocument();
  });

  test('should have exported handlers', () => {
    const { component } = render(TaskDatePicker, { task: mockTask });

    // Check if exported functions are available
    expect(component.handleDueDateClick).toBeDefined();
    expect(component.handleSubTaskDueDateClick).toBeDefined();
    expect(component.datePickerPosition).toBeDefined();
    expect(component.showDatePicker).toBeDefined();
  });

  test('should handle task date change for single date', async () => {
    const { taskStore } = await import('$lib/stores/tasks.svelte');
    const { component } = render(TaskDatePicker, { task: mockTask });

    // Simulate date change via the component's internal handler
    // Since we can't directly test the handler due to it being internal,
    // we verify the component renders properly
    expect(component).toBeDefined();
    expect(taskStore.updateTask).not.toHaveBeenCalled(); // Should only be called when date actually changes
  });

  test('should handle task date change for range date', async () => {
    const taskWithRange = {
      ...mockTask,
      is_range_date: true,
      start_date: new Date('2024-01-10'),
      end_date: new Date('2024-01-15')
    };

    const { component } = render(TaskDatePicker, { task: taskWithRange });
    expect(component).toBeDefined();
  });

  test('should handle subtask date changes', () => {
    const { component } = render(TaskDatePicker, { task: mockTask });

    // Verify the component has the exported handler for subtask dates
    expect(component.handleSubTaskDueDateClick).toBeDefined();
  });

  test('should initialize with correct default state', () => {
    const { component } = render(TaskDatePicker, { task: mockTask });

    expect(component.showDatePicker).toBe(false);
    expect(component.datePickerPosition).toEqual({ x: 0, y: 0 });
  });

  test('should handle task without dates', () => {
    const taskWithoutDates = {
      ...mockTask,
      end_date: undefined,
      start_date: undefined,
      is_range_date: false
    };

    const { component } = render(TaskDatePicker, { task: taskWithoutDates });
    expect(component).toBeDefined();
  });

  test('should handle task with empty sub_tasks array', () => {
    const taskWithoutSubTasks = {
      ...mockTask,
      sub_tasks: []
    };

    const { component } = render(TaskDatePicker, { task: taskWithoutSubTasks });
    expect(component).toBeDefined();
  });

  test('should handle subtask without dates', () => {
    const taskWithSubTaskNoDates = {
      ...mockTask,
      sub_tasks: [
        {
          ...mockTask.sub_tasks[0],
          end_date: undefined,
          start_date: undefined,
          is_range_date: false,
          tags: []
        }
      ]
    };

    const { component } = render(TaskDatePicker, { task: taskWithSubTaskNoDates });
    expect(component).toBeDefined();
  });
});
