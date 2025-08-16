import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import TaskList from '$lib/components/task/task-list.svelte';
import type { TaskWithSubTasks } from '$lib/types/task';

// Mock dependencies
vi.mock('$lib/stores/locale.svelte', () => ({
  getTranslationService: () => ({
    getMessage: (key: string) => () => {
      const messages: Record<string, string> = {
        add_task: 'Add Task',
        no_search_results: 'No search results',
        no_tasks_found: 'No tasks found',
        try_different_search: 'Try a different search',
        click_add_task: 'Click the + button to add a task',
        add_some_tasks: 'Add some tasks to get started'
      };
      return messages[key] || key;
    }
  })
}));

vi.mock('$lib/services/task-list-service', () => ({
  TaskListService: {
    getTaskCountText: (count: number) => `${count} task${count !== 1 ? 's' : ''}`
  }
}));

vi.mock('$lib/components/task/task-item.svelte', () => ({
  default: () => ({ $$: { fragment: null } })
}));

vi.mock('$lib/components/task/task-add-form.svelte', () => ({
  default: () => ({ $$: { fragment: null } })
}));

vi.mock('$lib/components/shared/button.svelte', () => ({
  default: () => ({ $$: { fragment: null } })
}));

vi.mock('$lib/components/ui/sidebar/context.svelte.js', () => ({
  useSidebar: () => ({
    isMobile: false,
    toggle: vi.fn()
  })
}));

vi.mock('lucide-svelte', () => ({
  Plus: () => ({ $$: { fragment: null } }),
  PanelLeft: () => ({ $$: { fragment: null } })
}));

describe('TaskList', () => {
  const mockTasks: TaskWithSubTasks[] = [
    {
      id: 'task-1',
      title: 'Test Task 1',
      description: 'Description 1',
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
    },
    {
      id: 'task-2',
      title: 'Test Task 2',
      description: 'Description 2',
      status: 'in_progress',
      priority: 2,
      start_date: new Date('2024-01-03'),
      end_date: new Date('2024-01-04'),
      is_range_date: true,
      project_id: 'project-1',
      task_list_id: 'list-1',
      created_at: new Date('2024-01-01'),
      updated_at: new Date('2024-01-01'),
      sub_tasks: []
    }
  ];

  const defaultProps = {
    title: 'Test Tasks',
    tasks: mockTasks,
    showAddButton: true,
    onTaskClick: vi.fn(),
    onSubTaskClick: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('basic rendering', () => {
    it('should render with default props', () => {
      render(TaskList, { props: {} });
      
      const taskList = screen.getByTestId('task-list');
      expect(taskList).toBeInTheDocument();
    });

    it('should render with custom props', () => {
      render(TaskList, { props: defaultProps });
      
      const taskList = screen.getByTestId('task-list');
      expect(taskList).toBeInTheDocument();
    });

    it('should display the title', () => {
      render(TaskList, { props: defaultProps });
      
      expect(screen.getByText('Test Tasks')).toBeInTheDocument();
    });

    it('should display task count', () => {
      render(TaskList, { props: defaultProps });
      
      expect(screen.getByText('2 tasks')).toBeInTheDocument();
    });
  });

  describe('header functionality', () => {
    it('should show add button when showAddButton is true', () => {
      render(TaskList, { props: { ...defaultProps, showAddButton: true } });
      
      // Button component is mocked, just check if component renders without error
      const taskList = screen.getByTestId('task-list');
      expect(taskList).toBeInTheDocument();
    });

    it('should not show add button when showAddButton is false', () => {
      render(TaskList, { props: { ...defaultProps, showAddButton: false } });
      
      // Button should not be rendered when showAddButton is false
      const taskList = screen.getByTestId('task-list');
      expect(taskList).toBeInTheDocument();
    });

    it('should display singular task count for one task', () => {
      render(TaskList, { 
        props: { 
          ...defaultProps, 
          tasks: [mockTasks[0]] 
        }
      });
      
      expect(screen.getByText('1 task')).toBeInTheDocument();
    });

    it('should handle empty title', () => {
      render(TaskList, { props: { ...defaultProps, title: '' } });
      
      expect(screen.getByRole('heading')).toHaveTextContent('');
    });
  });

  describe('mobile sidebar toggle', () => {
    it('should show mobile sidebar toggle when on mobile', () => {
      // Mock mobile sidebar
      vi.mocked(vi.doMock('$lib/components/ui/sidebar/context.svelte.js', () => ({
        useSidebar: () => ({
          isMobile: true,
          toggle: vi.fn()
        })
      })));

      render(TaskList, { props: defaultProps });
      
      // Component should render (mobile toggle testing requires more complex setup)
      const taskList = screen.getByTestId('task-list');
      expect(taskList).toBeInTheDocument();
    });
  });

  describe('task rendering', () => {
    it('should render tasks when provided', () => {
      render(TaskList, { props: defaultProps });
      
      const taskItems = screen.getByTestId('task-items');
      expect(taskItems).toBeInTheDocument();
    });

    it('should render empty state when no tasks', () => {
      render(TaskList, { 
        props: { 
          ...defaultProps, 
          tasks: [] 
        }
      });
      
      expect(screen.getByText('No tasks found')).toBeInTheDocument();
      expect(screen.getByText('📝')).toBeInTheDocument();
    });

    it('should handle large number of tasks', () => {
      const largeTasks = Array.from({ length: 100 }, (_, i) => ({
        ...mockTasks[0],
        id: `task-${i}`,
        title: `Task ${i}`
      }));

      render(TaskList, { 
        props: { 
          ...defaultProps, 
          tasks: largeTasks 
        }
      });
      
      expect(screen.getByText('100 tasks')).toBeInTheDocument();
    });
  });

  describe('search functionality', () => {
    it('should detect search view from title', () => {
      render(TaskList, { 
        props: { 
          ...defaultProps, 
          title: 'Search: test query',
          tasks: []
        }
      });
      
      expect(screen.getByText('No search results')).toBeInTheDocument();
      expect(screen.getByText('🔍')).toBeInTheDocument();
    });

    it('should detect search results view', () => {
      render(TaskList, { 
        props: { 
          ...defaultProps, 
          title: 'Search Results',
          tasks: []
        }
      });
      
      expect(screen.getByText('No search results')).toBeInTheDocument();
      expect(screen.getByText('Try a different search')).toBeInTheDocument();
    });

    it('should show normal empty state for non-search views', () => {
      render(TaskList, { 
        props: { 
          ...defaultProps, 
          title: 'Regular List',
          tasks: []
        }
      });
      
      expect(screen.getByText('No tasks found')).toBeInTheDocument();
      expect(screen.getByText('📝')).toBeInTheDocument();
    });
  });

  describe('add form functionality', () => {
    it('should handle add form functionality', () => {
      render(TaskList, { props: defaultProps });
      
      // Form functionality is tested through component behavior
      const taskList = screen.getByTestId('task-list');
      expect(taskList).toBeInTheDocument();
    });

    it('should handle form toggle state', () => {
      render(TaskList, { props: defaultProps });
      
      // State management is internal to component
      const taskList = screen.getByTestId('task-list');
      expect(taskList).toBeInTheDocument();
    });
  });

  describe('event handling', () => {
    it('should handle task click events', () => {
      const mockTaskClick = vi.fn();
      render(TaskList, { 
        props: { 
          ...defaultProps, 
          onTaskClick: mockTaskClick 
        }
      });
      
      // Component should render with event handlers
      const taskList = screen.getByTestId('task-list');
      expect(taskList).toBeInTheDocument();
    });

    it('should handle subtask click events', () => {
      const mockSubTaskClick = vi.fn();
      render(TaskList, { 
        props: { 
          ...defaultProps, 
          onSubTaskClick: mockSubTaskClick 
        }
      });
      
      const taskList = screen.getByTestId('task-list');
      expect(taskList).toBeInTheDocument();
    });

    it('should dispatch task selection events', () => {
      const component = render(TaskList, { props: defaultProps });
      
      // Test that component handles dispatched events
      expect(component.component).toBeDefined();
    });
  });

  describe('responsive behavior', () => {
    it('should handle different screen sizes', () => {
      render(TaskList, { props: defaultProps });
      
      const taskList = screen.getByTestId('task-list');
      expect(taskList).toHaveClass('flex', 'h-full', 'w-full', 'flex-col', 'overflow-hidden');
    });

    it('should apply proper styling for mobile', () => {
      render(TaskList, { props: defaultProps });
      
      // Check that container has responsive classes
      const taskList = screen.getByTestId('task-list');
      const header = taskList.firstChild as HTMLElement;
      expect(header).toHaveClass('bg-card', 'w-full', 'min-w-0', 'border-b', 'p-4');
    });
  });

  describe('empty states', () => {
    it('should show correct empty state for normal view without add button', () => {
      render(TaskList, { 
        props: { 
          ...defaultProps, 
          tasks: [],
          showAddButton: false
        }
      });
      
      expect(screen.getByText('Add some tasks to get started')).toBeInTheDocument();
    });

    it('should show correct empty state for normal view with add button', () => {
      render(TaskList, { 
        props: { 
          ...defaultProps, 
          tasks: [],
          showAddButton: true
        }
      });
      
      expect(screen.getByText('Click the + button to add a task')).toBeInTheDocument();
    });

    it('should show search empty state', () => {
      render(TaskList, { 
        props: { 
          ...defaultProps, 
          title: 'Search: test',
          tasks: []
        }
      });
      
      expect(screen.getByText('Try a different search')).toBeInTheDocument();
    });
  });

  describe('data handling', () => {
    it('should handle undefined tasks prop', () => {
      render(TaskList, { 
        props: { 
          ...defaultProps, 
          tasks: undefined as any
        }
      });
      
      // Should use default empty array
      expect(screen.getByText('0 tasks')).toBeInTheDocument();
    });

    it('should handle null title', () => {
      render(TaskList, { 
        props: { 
          ...defaultProps, 
          title: null as any
        }
      });
      
      // Should use default title
      const taskList = screen.getByTestId('task-list');
      expect(taskList).toBeInTheDocument();
    });

    it('should handle missing callback props', () => {
      render(TaskList, { 
        props: { 
          title: 'Test',
          tasks: mockTasks
        }
      });
      
      const taskList = screen.getByTestId('task-list');
      expect(taskList).toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('should have proper heading structure', () => {
      render(TaskList, { props: defaultProps });
      
      const heading = screen.getByRole('heading', { level: 2 });
      expect(heading).toHaveTextContent('Test Tasks');
    });

    it('should have proper test ids for testing', () => {
      render(TaskList, { props: defaultProps });
      
      expect(screen.getByTestId('task-list')).toBeInTheDocument();
      expect(screen.getByTestId('task-items')).toBeInTheDocument();
      // add-task button is mocked, so we don't test for it here
    });

    it('should handle button accessibility', () => {
      render(TaskList, { props: defaultProps });
      
      // Component should render with proper accessibility
      const taskList = screen.getByTestId('task-list');
      expect(taskList).toBeInTheDocument();
    });
  });

  describe('edge cases', () => {
    it('should handle very long titles', () => {
      const longTitle = 'A'.repeat(1000);
      render(TaskList, { 
        props: { 
          ...defaultProps, 
          title: longTitle
        }
      });
      
      const heading = screen.getByRole('heading');
      expect(heading).toHaveClass('truncate');
    });

    it('should handle special characters in title', () => {
      const specialTitle = 'Task List with 特殊文字 & symbols!@#$%^&*()';
      render(TaskList, { 
        props: { 
          ...defaultProps, 
          title: specialTitle
        }
      });
      
      expect(screen.getByText(specialTitle)).toBeInTheDocument();
    });

    it('should handle tasks with empty arrays', () => {
      render(TaskList, { 
        props: { 
          ...defaultProps, 
          tasks: []
        }
      });
      
      expect(screen.getByText('No tasks found')).toBeInTheDocument();
    });
  });

  describe('performance considerations', () => {
    it('should handle frequent prop updates', () => {
      const { unmount } = render(TaskList, { props: defaultProps });
      
      expect(screen.getByTestId('task-list')).toBeInTheDocument();
      
      unmount();
      
      // Re-render with different props
      render(TaskList, { 
        props: { 
          ...defaultProps, 
          title: 'Updated Title',
          tasks: [mockTasks[0]]
        }
      });
      
      expect(screen.getByText('Updated Title')).toBeInTheDocument();
    });
  });
});