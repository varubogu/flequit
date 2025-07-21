import { test, expect, vi, beforeEach } from 'vitest';
import { render, fireEvent, screen } from '@testing-library/svelte';
import { writable } from 'svelte/store';

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

vi.mock('$lib/stores/context-menu.svelte', () => ({
  contextMenuStore: {
    open: vi.fn(),
    close: vi.fn(),
  }
}));

import TaskItem from '$lib/components/task-item.svelte';
import type { TaskWithSubTasks } from '$lib/types/task';
import { taskStore } from '$lib/stores/tasks.svelte';
import { TaskService } from '$lib/services/task-service';
import { contextMenuStore } from '$lib/stores/context-menu.svelte';

const createMockTask = (overrides: Partial<TaskWithSubTasks> = {}): TaskWithSubTasks => ({
  id: 'task-1',
  title: 'Test Task',
  status: 'not_started',
  priority: 1,
  sub_tasks: [],
  tags: [],
  created_at: new Date(),
  updated_at: new Date(),
  ...overrides,
});

describe('TaskItem.svelte', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset store states if necessary
    taskStore.set({
        tasks: [],
        selectedTaskId: null,
        selectedSubTaskId: null,
    });
  });

  test('renders task title and status toggle', () => {
    const task = createMockTask({ title: 'My Awesome Task', status: 'not_started' });
    render(TaskItem, { props: { task } });

    expect(screen.getByText('My Awesome Task')).toBeTruthy();
    // TaskStatusToggle is present
    expect(screen.getByRole('button', { name: '⚪' })).toBeTruthy();
  });

  test('calls TaskService.selectTask when task is clicked', async () => {
    const task = createMockTask({ id: 'task-to-click' });
    render(TaskItem, { props: { task } });

    // The main clickable area is a button that contains the task content
    const taskButtons = screen.getAllByRole('button', { name: /Test Task/i });
    const taskButton = taskButtons.find(b => b.classList.contains('task-item-button'));
    if (!taskButton) throw new Error('Task button not found');
    await fireEvent.click(taskButton);

    expect(TaskService.selectTask).toHaveBeenCalledWith('task-to-click');
  });

  test('opens context menu on right-click', async () => {
    const task = createMockTask();
    render(TaskItem, { props: { task } });

    const taskButtons = screen.getAllByRole('button', { name: /Test Task/i });
    const taskButton = taskButtons.find(b => b.classList.contains('task-item-button'));
    if (!taskButton) throw new Error('Task button not found');

    await fireEvent.contextMenu(taskButton);

    expect(contextMenuStore.open).toHaveBeenCalled();
  });

  test('shows accordion toggle when sub-tasks exist', () => {
    const task = createMockTask({
      sub_tasks: [{
        id: 'sub-1',
        title: 'Sub task',
        status: 'not_started',
        task_id: 'task-1',
        created_at: new Date(),
        updated_at: new Date()
      }],
    });
    render(TaskItem, { props: { task } });

    expect(screen.getByRole('button', { name: 'Toggle subtasks' })).toBeTruthy();
  });

  test('does not show accordion toggle when no sub-tasks exist', () => {
    const task = createMockTask({ sub_tasks: [] });
    render(TaskItem, { props: { task } });

    expect(screen.queryByRole('button', { name: 'Toggle subtasks' })).toBeNull();
  });

  test('toggles sub-task visibility on accordion click', async () => {
    const task = createMockTask({
      sub_tasks: [{
        id: 'sub-1',
        title: 'My Sub Task',
        status: 'not_started',
        task_id: 'task-1',
        created_at: new Date(),
        updated_at: new Date()
      }],
    });
    render(TaskItem, { props: { task } });

    // Initially, sub-tasks are not visible
    expect(screen.queryByText('My Sub Task')).toBeNull();

    const toggleButton = screen.getByRole('button', { name: 'Toggle subtasks' });
    await fireEvent.click(toggleButton);

    // After click, sub-tasks should be visible
    expect(await screen.findByText('My Sub Task')).toBeTruthy();

    await fireEvent.click(toggleButton);
    // After second click, sub-tasks should be hidden again
    expect(screen.queryByText('My Sub Task')).toBeNull();
  });
});
