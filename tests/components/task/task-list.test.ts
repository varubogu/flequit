import { describe, test, expect, beforeEach, vi } from 'vitest';
import { render, fireEvent, screen } from '@testing-library/svelte';
import TaskList from '$lib/components/task/task-list.svelte';
import { TaskListService } from '$lib/services/task-list-service';
import type { TaskWithSubTasks } from '$lib/types/task';

// Mock services
vi.mock('$lib/services/task-list-service', () => ({
  TaskListService: {
    getTaskCountText: vi.fn()
  }
}));

// Mock components
vi.mock('$lib/components/task/task-item.svelte', () => {
  return {
    default: vi.fn(() => ({
      $$: { fragment: { create: vi.fn(), mount: vi.fn() } }
    }))
  };
});

vi.mock('$lib/components/task/task-add-form.svelte', () => {
  return {
    default: vi.fn(() => ({
      $$: { fragment: { create: vi.fn(), mount: vi.fn() } }
    }))
  };
});

// Mock useSidebar
vi.mock('$lib/components/ui/sidebar/context.svelte.js', () => ({
  useSidebar: () => ({
    state: 'expanded',
    isMobile: false,
    toggle: vi.fn()
  })
}));

// Mock locale and messages
vi.mock('$lib/stores/locale.svelte', () => ({
  reactiveMessage: <T extends (...args: unknown[]) => string>(fn: T): T => fn,
  getTranslationService: () => ({
    getMessage: (key: string) => () => key,
    getCurrentLocale: () => 'en',
    setLocale: () => {},
    reactiveMessage: <T extends (...args: unknown[]) => string>(fn: T): T => fn
  })
}));

const mockTaskListService = vi.mocked(TaskListService);

describe('TaskList', () => {
  const createMockTask = (overrides: Partial<TaskWithSubTasks> = {}): TaskWithSubTasks => ({
    id: 'task-1',
    list_id: 'list-1',
    title: 'Test Task',
    status: 'not_started',
    priority: 1,
    order_index: 0,
    is_archived: false,
    created_at: new Date(),
    updated_at: new Date(),
    sub_tasks: [],
    tags: [],
    ...overrides
  });

  beforeEach(() => {
    vi.clearAllMocks();
    mockTaskListService.getTaskCountText.mockReturnValue('1 task');
  });

  describe('rendering', () => {
    test('should render with default title', () => {
      render(TaskList);

      expect(screen.getByText('Tasks')).toBeInTheDocument();
    });

    test('should render with custom title', () => {
      render(TaskList, { props: { title: 'My Custom Tasks' } });

      expect(screen.getByText('My Custom Tasks')).toBeInTheDocument();
    });

    test('should display task count', () => {
      const tasks = [createMockTask()];
      mockTaskListService.getTaskCountText.mockReturnValue('1 task');

      render(TaskList, { props: { tasks } });

      expect(screen.getByText('1 task')).toBeInTheDocument();
      expect(mockTaskListService.getTaskCountText).toHaveBeenCalledWith(1);
    });

    test('should display correct count for multiple tasks', () => {
      const tasks = [createMockTask({ id: 'task-1' }), createMockTask({ id: 'task-2' })];
      mockTaskListService.getTaskCountText.mockReturnValue('2 tasks');

      render(TaskList, { props: { tasks } });

      expect(screen.getByText('2 tasks')).toBeInTheDocument();
      expect(mockTaskListService.getTaskCountText).toHaveBeenCalledWith(2);
    });

    test('should show add button when showAddButton is true', () => {
      render(TaskList, { props: { showAddButton: true } });

      const addButton = screen.getByRole('button');
      expect(addButton).toBeInTheDocument();
    });

    test('should not show add button when showAddButton is false', () => {
      render(TaskList, { props: { showAddButton: false } });

      const addButton = screen.queryByRole('button');
      expect(addButton).not.toBeInTheDocument();
    });

    test('should not show add button by default', () => {
      render(TaskList);

      const addButton = screen.queryByRole('button');
      expect(addButton).not.toBeInTheDocument();
    });
  });

  describe('add form toggle', () => {
    test('should show add form when add button is clicked', async () => {
      render(TaskList, { props: { showAddButton: true } });

      const addButton = screen.getByRole('button');
      await fireEvent.click(addButton);

      // The add form should be rendered (mocked)
      // In real implementation, this would show the TaskAddForm component
    });

    test('should hide add form initially', () => {
      render(TaskList, { props: { showAddButton: true } });

      // Add form should not be visible initially
      // This would be tested by checking if TaskAddForm is not rendered
    });
  });

  describe('search view detection', () => {
    test('should detect search view from title starting with "Search:"', () => {
      render(TaskList, { props: { title: 'Search: test query' } });

      // The component should internally detect this as a search view
      // This affects the rendering logic but may not be directly testable
      // without inspecting the component's internal state
    });

    test('should detect "Search Results" as search view', () => {
      render(TaskList, { props: { title: 'Search Results' } });

      // Similar to above, this should be detected as a search view
    });

    test('should not detect regular titles as search view', () => {
      render(TaskList, { props: { title: 'Today Tasks' } });

      // Should not be detected as a search view
    });
  });

  describe('props handling', () => {
    test('should handle empty tasks array', () => {
      mockTaskListService.getTaskCountText.mockReturnValue('0 tasks');

      render(TaskList, { props: { tasks: [] } });

      expect(screen.getByText('0 tasks')).toBeInTheDocument();
      expect(mockTaskListService.getTaskCountText).toHaveBeenCalledWith(0);
    });

    test('should handle undefined tasks', () => {
      mockTaskListService.getTaskCountText.mockReturnValue('0 tasks');

      render(TaskList);

      expect(screen.getByText('0 tasks')).toBeInTheDocument();
      expect(mockTaskListService.getTaskCountText).toHaveBeenCalledWith(0);
    });

    test('should handle undefined title', () => {
      render(TaskList);

      expect(screen.getByText('Tasks')).toBeInTheDocument();
    });
  });

  describe('task list content', () => {
    test('should render task items for provided tasks', () => {
      const tasks = [
        createMockTask({ id: 'task-1', title: 'First Task' }),
        createMockTask({ id: 'task-2', title: 'Second Task' })
      ];

      render(TaskList, { props: { tasks } });

      // In a real test, we would check that TaskItem components are rendered
      // for each task. Since we're mocking TaskItem, we can't directly test this
      // but we can verify the component doesn't crash with multiple tasks
    });

    test('should handle tasks with different statuses', () => {
      const tasks = [
        createMockTask({ id: 'task-1', status: 'not_started' }),
        createMockTask({ id: 'task-2', status: 'completed' }),
        createMockTask({ id: 'task-3', status: 'in_progress' })
      ];

      render(TaskList, { props: { tasks } });

      // Component should render without crashing
      expect(screen.getByText('Tasks')).toBeInTheDocument();
    });
  });

  describe('responsive behavior', () => {
    test('should render with proper CSS classes', () => {
      const { container } = render(TaskList);

      const mainDiv = container.firstChild as HTMLElement;
      expect(mainDiv).toHaveClass('flex', 'flex-col', 'h-full');
    });

    test('should render header with proper styling', () => {
      render(TaskList);

      const header = screen.getByText('Tasks').closest('.p-4');
      expect(header).toHaveClass('p-4', 'border-b', 'bg-card');
    });
  });
});
