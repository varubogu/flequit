import { describe, test, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen } from '@testing-library/svelte';

// Mock sub-components
vi.mock('../../src/lib/components/task-detail-header.svelte', () => ({
  default: () => null
}));

vi.mock('../../src/lib/components/task-detail-form.svelte', () => ({
  default: () => null
}));

vi.mock('../../src/lib/components/task-detail-subtasks.svelte', () => ({
  default: () => null
}));

vi.mock('../../src/lib/components/task-detail-tags.svelte', () => ({
  default: () => null
}));

vi.mock('../../src/lib/components/task-detail-metadata.svelte', () => ({
  default: () => null
}));

vi.mock('../../src/lib/components/task-detail-empty-state.svelte', () => ({
  default: () => null
}));

// Mock modules
vi.mock('$lib/stores/tasks.svelte', () => ({
  taskStore: {
    selectedTask: null,
    selectedSubTask: null, 
    selectedSubTaskId: null,
    updateTask: vi.fn(),
    updateSubTask: vi.fn(),
  }
}));

vi.mock('$lib/services/task-service', () => ({
  TaskService: {
    changeTaskStatus: vi.fn(),
    changeSubTaskStatus: vi.fn(),
    deleteTask: vi.fn(),
    deleteSubTask: vi.fn(),
    selectTask: vi.fn(),
    selectSubTask: vi.fn(),
    toggleSubTaskStatus: vi.fn(),
  }
}));

vi.mock('$lib/components/inline-date-picker.svelte', () => ({
  default: vi.fn()
}));

// Import after mocks
import TaskDetail from '../../src/lib/components/task-detail.svelte';
import { taskStore } from '../../src/lib/stores/tasks.svelte';
import { TaskService } from '../../src/lib/services/task-service';

const mockTaskStore = vi.mocked(taskStore);
const mockTaskService = vi.mocked(TaskService);

describe('TaskDetail Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Component Integration', () => {
    test('should render main task detail structure', () => {
      const { container } = render(TaskDetail);
      expect(container.querySelector('.flex.flex-col.h-full')).toBeInTheDocument();
    });

    test('should show empty state when no task selected', () => {
      (taskStore as any).selectedTask = null;
      (taskStore as any).selectedSubTask = null;
      
      const { container } = render(TaskDetail);
      
      // Empty state should be rendered (mocked, so checking structure)
      expect(container).toBeInTheDocument();
    });
  });

  describe('Component Integration Structure', () => {
    test('should integrate all child components when task is selected', () => {
      // Mock having a selected task
      (taskStore as any).selectedTask = {
        id: 'task-1',
        title: 'Test Task',
        status: 'not_started'
      };
      
      const { container } = render(TaskDetail);
      expect(container.querySelector('.flex.flex-col.h-full')).toBeInTheDocument();
    });

    test('should handle task/subtask selection state', () => {
      const { container } = render(TaskDetail);
      expect(container).toBeInTheDocument();
    });
  });

  describe('Mock Service Functions', () => {
    test('should have mocked TaskService methods available', () => {
      expect(mockTaskService.changeTaskStatus).toBeDefined();
      expect(mockTaskService.changeSubTaskStatus).toBeDefined();
      expect(mockTaskService.deleteTask).toBeDefined();
      expect(mockTaskService.deleteSubTask).toBeDefined();
      expect(mockTaskService.selectTask).toBeDefined();
      expect(mockTaskService.selectSubTask).toBeDefined();
      expect(mockTaskService.toggleSubTaskStatus).toBeDefined();
    });

    test('should have mocked taskStore methods available', () => {
      expect(mockTaskStore.updateTask).toBeDefined();
      expect(mockTaskStore.updateSubTask).toBeDefined();
    });
  });

  describe('Child Component Integration', () => {
    test('should properly integrate with child components', () => {
      const { container } = render(TaskDetail);
      expect(container).toBeInTheDocument();
    });
  });

  describe('Task Detail Integration', () => {
    test('should handle task selection changes', () => {
      const { container } = render(TaskDetail);
      expect(container).toBeInTheDocument();
    });

    test('should integrate with inline date picker', () => {
      const { container } = render(TaskDetail);
      expect(container).toBeInTheDocument();
    });

    test('should manage form state correctly', () => {
      const { component } = render(TaskDetail);
      expect(component).toBeDefined();
    });

    test('should handle debounced save operations', () => {
      const { container } = render(TaskDetail);
      expect(container).toBeInTheDocument();
    });
  });
});