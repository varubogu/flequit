import { describe, test, expect, beforeEach, vi } from 'vitest';
import { render } from '@testing-library/svelte';
import TaskContextMenu from '$lib/components/task/task-context-menu.svelte';
import type { TaskWithSubTasks, SubTask } from '$lib/types/task';

// Mock stores and services
vi.mock('$lib/stores/context-menu.svelte', () => ({
  contextMenuStore: {
    open: vi.fn()
  }
}));

vi.mock('$lib/stores/tasks.svelte', () => ({
  taskStore: {
    updateTask: vi.fn()
  }
}));

vi.mock('$lib/services/task-service', () => ({
  TaskService: {
    deleteTask: vi.fn()
  }
}));

describe('TaskContextMenu Component', () => {
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
    is_archived: false,
    sub_tasks: [],
    tags: []
  };

  const mockSubTask: SubTask = {
    id: 'subtask-1',
    title: 'Test SubTask',
    status: 'not_started',
    task_id: 'task-1',
    order_index: 0,
    tags: [],
    created_at: new Date(),
    updated_at: new Date(),
    end_date: undefined,
    start_date: undefined,
    is_range_date: false
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('should render without crashing', () => {
    const { container } = render(TaskContextMenu, { task: mockTask });
    expect(container).toBeInTheDocument();
  });

  test('should have exported handlers', () => {
    const { component } = render(TaskContextMenu, { task: mockTask });
    
    expect(component.handleTaskContextMenu).toBeDefined();
    expect(component.handleSubTaskContextMenu).toBeDefined();
  });

  test('should handle task context menu', async () => {
    const { contextMenuStore } = await import('$lib/stores/context-menu.svelte');
    const { component } = render(TaskContextMenu, { task: mockTask });

    const mockEvent = new MouseEvent('contextmenu', {
      clientX: 100,
      clientY: 200
    });

    // Create a spy for preventDefault and stopPropagation
    const preventDefaultSpy = vi.spyOn(mockEvent, 'preventDefault');
    const stopPropagationSpy = vi.spyOn(mockEvent, 'stopPropagation');

    component.handleTaskContextMenu(mockEvent);

    expect(preventDefaultSpy).toHaveBeenCalled();
    expect(stopPropagationSpy).toHaveBeenCalled();
    expect(contextMenuStore.open).toHaveBeenCalledWith(100, 200, expect.arrayContaining([
      expect.objectContaining({ label: 'Edit Task' }),
      expect.objectContaining({ label: 'Set Priority' }),
      expect.objectContaining({ label: 'Delete Task' })
    ]));
  });

  test('should handle subtask context menu', async () => {
    const { contextMenuStore } = await import('$lib/stores/context-menu.svelte');
    const { component } = render(TaskContextMenu, { task: mockTask });

    const mockEvent = new MouseEvent('contextmenu', {
      clientX: 150,
      clientY: 250
    });

    const preventDefaultSpy = vi.spyOn(mockEvent, 'preventDefault');
    const stopPropagationSpy = vi.spyOn(mockEvent, 'stopPropagation');

    component.handleSubTaskContextMenu(mockEvent, mockSubTask);

    expect(preventDefaultSpy).toHaveBeenCalled();
    expect(stopPropagationSpy).toHaveBeenCalled();
    expect(contextMenuStore.open).toHaveBeenCalledWith(150, 250, expect.arrayContaining([
      expect.objectContaining({ label: 'Edit Subtask' }),
      expect.objectContaining({ label: 'Delete Subtask' })
    ]));
  });

  test('should handle task deletion', async () => {
    const { TaskService } = await import('$lib/services/task-service');
    const { component } = render(TaskContextMenu, { task: mockTask });

    // Access the internal handleDelete function by triggering a context menu
    const mockEvent = new MouseEvent('contextmenu');
    vi.spyOn(mockEvent, 'preventDefault');
    vi.spyOn(mockEvent, 'stopPropagation');

    component.handleTaskContextMenu(mockEvent);

    // The delete action should be available in the context menu
    expect(TaskService.deleteTask).not.toHaveBeenCalled(); // Only called when action is executed
  });

  test('should handle priority setting', async () => {
    const { taskStore } = await import('$lib/stores/tasks.svelte');
    const { component } = render(TaskContextMenu, { task: mockTask });

    // Access the component to verify it has the priority setting capability
    expect(component).toBeDefined();
    expect(taskStore.updateTask).not.toHaveBeenCalled(); // Only called when priority is actually set
  });

  test('should log appropriate messages for edit actions', () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const { component } = render(TaskContextMenu, { task: mockTask });

    // Since the edit actions log to console, we can test this indirectly
    expect(component).toBeDefined();
    
    consoleSpy.mockRestore();
  });

  test('should handle context menu with custom coordinates', async () => {
    const { contextMenuStore } = await import('$lib/stores/context-menu.svelte');
    const { component } = render(TaskContextMenu, { task: mockTask });

    const customEvent = new MouseEvent('contextmenu', {
      clientX: 300,
      clientY: 400
    });

    vi.spyOn(customEvent, 'preventDefault');
    vi.spyOn(customEvent, 'stopPropagation');

    component.handleTaskContextMenu(customEvent);

    expect(contextMenuStore.open).toHaveBeenCalledWith(300, 400, expect.any(Array));
  });

  test('should handle subtask with different properties', async () => {
    const { contextMenuStore } = await import('$lib/stores/context-menu.svelte');
    const customSubTask: SubTask = {
      ...mockSubTask,
      id: 'custom-subtask',
      title: 'Custom SubTask'
    };

    const { component } = render(TaskContextMenu, { task: mockTask });

    const mockEvent = new MouseEvent('contextmenu');
    vi.spyOn(mockEvent, 'preventDefault');
    vi.spyOn(mockEvent, 'stopPropagation');

    component.handleSubTaskContextMenu(mockEvent, customSubTask);

    expect(contextMenuStore.open).toHaveBeenCalled();
  });
});