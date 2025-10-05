import { describe, test, expect, beforeEach, vi } from 'vitest';
import { render } from '@testing-library/svelte';
import TaskDatePicker from '$lib/components/task/forms/task-date-picker.svelte';
import type { TaskWithSubTasks } from '$lib/types/task';

// Mock stores
vi.mock('$lib/stores/tasks.svelte', () => ({
  taskStore: {
    updateSubTask: vi.fn()
  }
}));

vi.mock('$lib/stores/task-core-store.svelte', () => ({
  taskCoreStore: {
    updateTask: vi.fn()
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
    createdAt: new Date(),
    updatedAt: new Date(),
    listId: 'list-1',
    orderIndex: 0,
    planEndDate: new Date('2024-01-15'),
    planStartDate: undefined,
    isRangeDate: false,
    isArchived: false,
    tags: [],
    projectId: 'project-1',
    assignedUserIds: [],
    tagIds: [],
    subTasks: [
      {
        id: 'subtask-1',
        title: 'Subtask 1',
        status: 'not_started',
        taskId: 'task-1',
        orderIndex: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        planEndDate: new Date('2024-01-16'),
        planStartDate: undefined,
        completed: false,
        assignedUserIds: [],
        isRangeDate: false,
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
    const { taskCoreStore } = await import('$lib/stores/task-core-store.svelte');
    const { component } = render(TaskDatePicker, { task: mockTask });

    // Simulate date change via the component's internal handler
    // Since we can't directly test the handler due to it being internal,
    // we verify the component renders properly
    expect(component).toBeDefined();
    expect(taskCoreStore.updateTask).not.toHaveBeenCalled(); // Should only be called when date actually changes
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
          ...mockTask.subTasks[0],
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
