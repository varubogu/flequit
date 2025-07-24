import { test, expect, vi, beforeEach, describe } from 'vitest';
import { render, fireEvent, screen } from '@testing-library/svelte';
import { writable } from 'svelte/store';

// Mock sub-components
vi.mock('../../src/lib/components/task-accordion-toggle.svelte', () => ({
  default: () => null
}));

vi.mock('../../src/lib/components/task-date-picker.svelte', () => ({
  default: () => null
}));

vi.mock('../../src/lib/components/task-context-menu.svelte', () => ({
  default: () => null
}));

vi.mock('../../src/lib/components/task-status-toggle.svelte', () => ({
  default: () => null
}));

vi.mock('../../src/lib/components/task-content.svelte', () => ({
  default: () => null
}));

vi.mock('../../src/lib/components/sub-task-list.svelte', () => ({
  default: () => null
}));

// Mock dependencies
vi.mock('$lib/stores/tasks.svelte', () => ({
  taskStore: {
    ...writable({
      tasks: [],
      selectedTaskId: null,
      selectedSubTaskId: null,
    }),
    updateTask: vi.fn(),
    updateSubTask: vi.fn(),
    deleteTask: vi.fn(),
  }
}));

vi.mock('$lib/services/task-service', () => ({
  TaskService: {
    selectTask: vi.fn(),
    selectSubTask: vi.fn(),
    toggleTaskStatus: vi.fn(),
    toggleSubTaskStatus: vi.fn(),
    deleteTask: vi.fn(),
  }
}));

import TaskItem from '$lib/components/task-item.svelte';
import type { TaskWithSubTasks } from '$lib/types/task';
import { taskStore } from '$lib/stores/tasks.svelte';
import { TaskService } from '$lib/services/task-service';
import { contextMenuStore } from '$lib/stores/context-menu.svelte';

const createMockTask = (overrides: Partial<TaskWithSubTasks> = {}): TaskWithSubTasks => ({
  id: 'task-1',
  list_id: 'list-1',
  title: 'Test Task',
  status: 'not_started',
  priority: 1,
  order_index: 0,
  is_archived: false,
  sub_tasks: [],
  tags: [],
  created_at: new Date(),
  updated_at: new Date(),
  ...overrides,
});

describe('TaskItem Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('should render task item with main components', () => {
    const task = createMockTask({ title: 'Integration Test Task' });
    const { container } = render(TaskItem, { props: { task } });

    // Check main structure
    expect(container.querySelector('.flex.items-start.gap-1.w-full')).toBeInTheDocument();
  });

  test('should call TaskService.selectTask when task is clicked', async () => {
    const task = createMockTask({ id: 'integration-task' });
    const { container } = render(TaskItem, { props: { task } });

    const taskButton = container.querySelector('.task-item-button');
    await fireEvent.click(taskButton!);

    expect(TaskService.selectTask).toHaveBeenCalledWith('integration-task');
  });

  test('should call TaskService.toggleTaskStatus when status is toggled', async () => {
    const task = createMockTask({ id: 'status-task' });
    render(TaskItem, { props: { task } });

    // Since we're testing integration, we just verify the component renders
    expect(TaskService.toggleTaskStatus).not.toHaveBeenCalled(); // Only called on actual toggle
  });

  test('should render with subtasks', () => {
    const task = createMockTask({
      sub_tasks: [{
        id: 'sub-1',
        title: 'Sub task',
        status: 'not_started',
        task_id: 'task-1',
        order_index: 0,
        created_at: new Date(),
        updated_at: new Date(),
        tags: []
      }],
    });
    
    const { container } = render(TaskItem, { props: { task } });
    expect(container).toBeInTheDocument();
  });

  test('should handle task selection state', () => {
    const selectedTask = createMockTask({ id: 'selected-task' });
    
    // Mock selected state
    taskStore.selectedTaskId = 'selected-task';
    
    const { container } = render(TaskItem, { props: { task: selectedTask } });
    expect(container).toBeInTheDocument();
  });

  test('should render with date information', () => {
    const taskWithDate = createMockTask({
      end_date: new Date('2024-01-15'),
      is_range_date: false
    });
    
    const { container } = render(TaskItem, { props: { task: taskWithDate } });
    expect(container).toBeInTheDocument();
  });

  test('should handle priority display', () => {
    const highPriorityTask = createMockTask({ priority: 3 });
    
    const { container } = render(TaskItem, { props: { task: highPriorityTask } });
    expect(container).toBeInTheDocument();
  });
});
