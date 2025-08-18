import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import { taskStore } from '$lib/stores/tasks.svelte';
import TaskDetail from '$lib/components/task/detail/task-detail.svelte';

// Mock the translation service
vi.mock('$lib/stores/locale.svelte', () => ({
  getTranslationService: () => ({
    getMessage: (key: string) => () => `Mock message for ${key}`
  })
}));

// Mock other dependencies
vi.mock('$lib/services/task-service', () => ({
  TaskService: {
    forceSelectTask: vi.fn(),
    forceSelectSubTask: vi.fn(),
    changeSubTaskStatus: vi.fn(),
    changeTaskStatus: vi.fn(),
    deleteSubTask: vi.fn(),
    deleteTask: vi.fn(),
    selectTask: vi.fn(),
    selectSubTask: vi.fn(),
    toggleSubTaskStatus: vi.fn()
  }
}));

describe('TaskDetail Component', () => {
  beforeEach(() => {
    // Reset task store state
    taskStore.selectedTaskId = null;
    taskStore.selectedSubTaskId = null;
    taskStore.isNewTaskMode = false;
    taskStore.newTaskData = null;
  });

  it('renders empty state when no task is selected', () => {
    render(TaskDetail, { isDrawerMode: false });

    // Should show empty state component
    expect(screen.getByTestId?.('task-detail-empty-state')).toBeTruthy();
  });

  it('renders in drawer mode without Card wrapper', () => {
    const { container } = render(TaskDetail, { isDrawerMode: true });

    // Should not have Card component class
    expect(container.querySelector('.bg-card')).toBeNull();
  });

  it('renders in desktop mode with Card wrapper', () => {
    const { container } = render(TaskDetail, { isDrawerMode: false });

    // Should have a div with flex h-full flex-col class structure
    expect(container.querySelector('.flex.h-full.flex-col')).toBeTruthy();
  });
});

describe('TaskDetailLogic', () => {
  it('can be imported without errors', async () => {
    const module = await import('$lib/components/task/detail/task-detail-logic.svelte');
    expect(module.TaskDetailLogic).toBeDefined();
    expect(typeof module.TaskDetailLogic).toBe('function');
  });
});
