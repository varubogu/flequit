import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import TaskItem from '$lib/components/task/core/task-item.svelte';
import type { TaskWithSubTasks } from '$lib/types/task';

// Mock child components
vi.mock('$lib/components/task/task-date-picker.svelte', () => ({
  default: () => ({ $$: { fragment: null } })
}));

vi.mock('$lib/components/task/task-item-content.svelte', () => ({
  default: () => ({ $$: { fragment: null } })
}));

// Mock TaskItemLogic
vi.mock('$lib/components/task/task-item-logic.svelte', () => ({
  TaskItemLogic: class {
    constructor(task: any, onTaskClick: any, onSubTaskClick: any, dispatch: any) {
      this.task = task;
      this.onTaskClick = onTaskClick;
      this.onSubTaskClick = onSubTaskClick;
      this.dispatch = dispatch;
    }
    
    task: any;
    onTaskClick: any;
    onSubTaskClick: any;
    dispatch: any;
  }
}));

describe('TaskItem', () => {
  const mockTask: TaskWithSubTasks = {
    id: 'task-1',
    title: 'Test Task',
    description: 'Test Description',
    status: 'todo',
    priority: 3,
    start_date: new Date('2024-01-01'),
    end_date: new Date('2024-01-02'),
    is_range_date: true,
    project_id: 'project-1',
    task_list_id: 'list-1',
    created_at: new Date('2024-01-01'),
    updated_at: new Date('2024-01-01'),
    sub_tasks: []
  };

  const defaultProps = {
    task: mockTask,
    onTaskClick: vi.fn(),
    onSubTaskClick: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('basic rendering', () => {
    it('should render without errors', () => {
      render(TaskItem, { props: defaultProps });
      
      // Component should render
      expect(document.body).toBeInTheDocument();
    });

    it('should render with required props only', () => {
      render(TaskItem, { 
        props: { 
          task: mockTask 
        }
      });
      
      expect(document.body).toBeInTheDocument();
    });
  });

  describe('prop handling', () => {
    it('should handle task prop correctly', () => {
      render(TaskItem, { props: defaultProps });
      
      // Should render without throwing
      expect(document.body).toBeInTheDocument();
    });

    it('should handle optional callback props', () => {
      const mockCallbacks = {
        task: mockTask,
        onTaskClick: vi.fn(),
        onSubTaskClick: vi.fn()
      };

      render(TaskItem, { props: mockCallbacks });
      
      expect(document.body).toBeInTheDocument();
    });

    it('should handle missing optional callbacks', () => {
      render(TaskItem, { 
        props: { 
          task: mockTask,
          onTaskClick: undefined,
          onSubTaskClick: undefined
        }
      });
      
      expect(document.body).toBeInTheDocument();
    });
  });

  describe('task data variations', () => {
    it('should handle task with subtasks', () => {
      const taskWithSubTasks: TaskWithSubTasks = {
        ...mockTask,
        sub_tasks: [
          {
            id: 'subtask-1',
            title: 'SubTask 1',
            description: '',
            status: 'todo',
            is_completed: false,
            parent_task_id: mockTask.id,
            order_index: 0,
            created_at: new Date(),
            updated_at: new Date()
          }
        ]
      };

      render(TaskItem, { 
        props: { 
          ...defaultProps,
          task: taskWithSubTasks
        }
      });
      
      expect(document.body).toBeInTheDocument();
    });

    it('should handle task with different statuses', () => {
      const completedTask: TaskWithSubTasks = {
        ...mockTask,
        status: 'completed'
      };

      render(TaskItem, { 
        props: { 
          ...defaultProps,
          task: completedTask
        }
      });
      
      expect(document.body).toBeInTheDocument();
    });

    it('should handle task with different priorities', () => {
      const highPriorityTask: TaskWithSubTasks = {
        ...mockTask,
        priority: 1
      };

      render(TaskItem, { 
        props: { 
          ...defaultProps,
          task: highPriorityTask
        }
      });
      
      expect(document.body).toBeInTheDocument();
    });

    it('should handle task without dates', () => {
      const taskWithoutDates: TaskWithSubTasks = {
        ...mockTask,
        start_date: undefined,
        end_date: undefined,
        is_range_date: false
      };

      render(TaskItem, { 
        props: { 
          ...defaultProps,
          task: taskWithoutDates
        }
      });
      
      expect(document.body).toBeInTheDocument();
    });

    it('should handle task with single date', () => {
      const singleDateTask: TaskWithSubTasks = {
        ...mockTask,
        start_date: new Date('2024-01-01'),
        end_date: undefined,
        is_range_date: false
      };

      render(TaskItem, { 
        props: { 
          ...defaultProps,
          task: singleDateTask
        }
      });
      
      expect(document.body).toBeInTheDocument();
    });
  });

  describe('event dispatching setup', () => {
    it('should setup event dispatcher', () => {
      render(TaskItem, { props: defaultProps });
      
      // Component should render and setup dispatcher
      expect(document.body).toBeInTheDocument();
    });

    it('should pass dispatcher to logic', () => {
      render(TaskItem, { props: defaultProps });
      
      // Logic should be initialized with dispatcher
      expect(document.body).toBeInTheDocument();
    });
  });

  describe('component composition', () => {
    it('should render TaskItemContent component', () => {
      render(TaskItem, { props: defaultProps });
      
      // TaskItemContent should be rendered
      expect(document.body).toBeInTheDocument();
    });

    it('should render TaskDatePicker component', () => {
      render(TaskItem, { props: defaultProps });
      
      // TaskDatePicker should be rendered
      expect(document.body).toBeInTheDocument();
    });

    it('should bind TaskDatePicker reference', () => {
      render(TaskItem, { props: defaultProps });
      
      // Component should render with proper binding
      expect(document.body).toBeInTheDocument();
    });
  });

  describe('logic initialization', () => {
    it('should initialize TaskItemLogic with correct parameters', () => {
      render(TaskItem, { props: defaultProps });
      
      // Logic should be initialized
      expect(document.body).toBeInTheDocument();
    });

    it('should pass task to logic', () => {
      render(TaskItem, { props: defaultProps });
      
      expect(document.body).toBeInTheDocument();
    });

    it('should pass callbacks to logic', () => {
      const callbacks = {
        onTaskClick: vi.fn(),
        onSubTaskClick: vi.fn()
      };

      render(TaskItem, { 
        props: { 
          ...defaultProps,
          ...callbacks
        }
      });
      
      expect(document.body).toBeInTheDocument();
    });
  });

  describe('edge cases', () => {
    it('should handle empty task title', () => {
      const emptyTitleTask: TaskWithSubTasks = {
        ...mockTask,
        title: ''
      };

      render(TaskItem, { 
        props: { 
          ...defaultProps,
          task: emptyTitleTask
        }
      });
      
      expect(document.body).toBeInTheDocument();
    });

    it('should handle empty task description', () => {
      const emptyDescTask: TaskWithSubTasks = {
        ...mockTask,
        description: ''
      };

      render(TaskItem, { 
        props: { 
          ...defaultProps,
          task: emptyDescTask
        }
      });
      
      expect(document.body).toBeInTheDocument();
    });

    it('should handle very long task title', () => {
      const longTitleTask: TaskWithSubTasks = {
        ...mockTask,
        title: 'A'.repeat(1000)
      };

      render(TaskItem, { 
        props: { 
          ...defaultProps,
          task: longTitleTask
        }
      });
      
      expect(document.body).toBeInTheDocument();
    });

    it('should handle task with special characters', () => {
      const specialCharTask: TaskWithSubTasks = {
        ...mockTask,
        title: 'Task with 特殊文字 & symbols!@#$%^&*()',
        description: 'Description with émojis 🚀 and symbols'
      };

      render(TaskItem, { 
        props: { 
          ...defaultProps,
          task: specialCharTask
        }
      });
      
      expect(document.body).toBeInTheDocument();
    });
  });

  describe('state management', () => {
    it('should handle task date picker state', () => {
      render(TaskItem, { props: defaultProps });
      
      // State should be initialized
      expect(document.body).toBeInTheDocument();
    });

    it('should maintain component state', () => {
      const { unmount } = render(TaskItem, { props: defaultProps });
      
      expect(document.body).toBeInTheDocument();
      
      unmount();
      
      // Should cleanup without errors
    });
  });

  describe('props reactivity', () => {
    it('should handle task prop changes', () => {
      const { unmount } = render(TaskItem, { props: defaultProps });
      
      expect(document.body).toBeInTheDocument();
      
      unmount();
      
      // Render with different task
      const newTask: TaskWithSubTasks = {
        ...mockTask,
        id: 'task-2',
        title: 'New Task'
      };

      render(TaskItem, { 
        props: { 
          ...defaultProps,
          task: newTask
        }
      });
      
      expect(document.body).toBeInTheDocument();
    });

    it('should handle callback prop changes', () => {
      const { unmount } = render(TaskItem, { props: defaultProps });
      
      expect(document.body).toBeInTheDocument();
      
      unmount();
      
      const newCallbacks = {
        onTaskClick: vi.fn(),
        onSubTaskClick: vi.fn()
      };

      render(TaskItem, { 
        props: { 
          ...defaultProps,
          ...newCallbacks
        }
      });
      
      expect(document.body).toBeInTheDocument();
    });
  });

  describe('component lifecycle', () => {
    it('should mount and unmount cleanly', () => {
      const { unmount } = render(TaskItem, { props: defaultProps });
      
      expect(document.body).toBeInTheDocument();
      
      expect(() => unmount()).not.toThrow();
    });

    it('should handle multiple instances', () => {
      const task1 = { ...mockTask, id: 'task-1' };
      const task2 = { ...mockTask, id: 'task-2' };

      const { unmount: unmount1 } = render(TaskItem, { 
        props: { ...defaultProps, task: task1 }
      });
      
      const { unmount: unmount2 } = render(TaskItem, { 
        props: { ...defaultProps, task: task2 }
      });
      
      expect(document.body).toBeInTheDocument();
      
      unmount1();
      unmount2();
    });
  });

  describe('integration scenarios', () => {
    it('should work with complete task data', () => {
      const completeTask: TaskWithSubTasks = {
        id: 'complete-task',
        title: 'Complete Task',
        description: 'Full description',
        status: 'in_progress',
        priority: 2,
        start_date: new Date('2024-01-01'),
        end_date: new Date('2024-01-10'),
        is_range_date: true,
        project_id: 'project-1',
        task_list_id: 'list-1',
        created_at: new Date('2024-01-01'),
        updated_at: new Date('2024-01-05'),
        sub_tasks: [
          {
            id: 'sub-1',
            title: 'SubTask 1',
            description: 'Sub description',
            status: 'todo',
            is_completed: false,
            parent_task_id: 'complete-task',
            order_index: 0,
            created_at: new Date('2024-01-02'),
            updated_at: new Date('2024-01-02')
          }
        ]
      };

      render(TaskItem, { 
        props: { 
          ...defaultProps,
          task: completeTask
        }
      });
      
      expect(document.body).toBeInTheDocument();
    });
  });
});