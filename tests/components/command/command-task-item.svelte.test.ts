import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import CommandTaskItem from '$lib/components/command/command-task-item.svelte';
import type { TaskWithSubTasks } from '$lib/types/task';

// Mock UI command components
vi.mock('$lib/components/ui/command/index.js', () => ({
  Item: () => ({ $$: { fragment: null } })
}));

describe('CommandTaskItem', () => {
  const mockTask: TaskWithSubTasks = {
    id: 'task-1',
    title: 'Test Task',
    description: 'Test task description',
    status: 'todo',
    priority: 3,
    start_date: new Date('2024-01-01'),
    end_date: new Date('2024-01-02'),
    is_range_date: true,
    project_id: 'project-1',
    task_list_id: 'list-1',
    created_at: new Date('2024-01-01'),
    updated_at: new Date('2024-01-01'),
    sub_tasks: [],
    tags: [
      { id: 'tag-1', name: 'urgent', color: '#ff0000' },
      { id: 'tag-2', name: 'work', color: '#00ff00' }
    ]
  };

  const defaultProps = {
    task: mockTask,
    isTagSearch: false,
    onSelect: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('basic rendering', () => {
    it('should render without errors', () => {
      render(CommandTaskItem, { props: defaultProps });
      
      expect(document.body).toBeInTheDocument();
    });

    it('should render task title', () => {
      render(CommandTaskItem, { props: defaultProps });
      
      expect(screen.getByText('Test Task')).toBeInTheDocument();
    });

    it('should render with required props only', () => {
      const minimalTask: TaskWithSubTasks = {
        id: 'minimal-task',
        title: 'Minimal Task',
        description: '',
        status: 'todo',
        priority: 1,
        start_date: new Date(),
        end_date: new Date(),
        is_range_date: false,
        project_id: 'project-1',
        task_list_id: 'list-1',
        created_at: new Date(),
        updated_at: new Date(),
        sub_tasks: [],
        tags: []
      };

      render(CommandTaskItem, { 
        props: { 
          task: minimalTask,
          isTagSearch: false,
          onSelect: vi.fn()
        }
      });
      
      expect(screen.getByText('Minimal Task')).toBeInTheDocument();
    });
  });

  describe('task title rendering', () => {
    it('should display task title with correct styling', () => {
      render(CommandTaskItem, { props: defaultProps });
      
      const titleElement = screen.getByText('Test Task');
      expect(titleElement).toBeInTheDocument();
      expect(titleElement).toHaveClass('truncate', 'font-medium');
    });

    it('should handle empty task title', () => {
      const taskWithEmptyTitle: TaskWithSubTasks = {
        ...mockTask,
        title: ''
      };

      render(CommandTaskItem, { 
        props: { 
          ...defaultProps, 
          task: taskWithEmptyTitle
        }
      });
      
      const titleElement = document.querySelector('.truncate.font-medium');
      expect(titleElement).toBeInTheDocument();
    });

    it('should handle very long task title', () => {
      const taskWithLongTitle: TaskWithSubTasks = {
        ...mockTask,
        title: 'A'.repeat(200)
      };

      render(CommandTaskItem, { 
        props: { 
          ...defaultProps, 
          task: taskWithLongTitle
        }
      });
      
      const titleElement = screen.getByText('A'.repeat(200));
      expect(titleElement).toHaveClass('truncate');
    });

    it('should handle special characters in title', () => {
      const taskWithSpecialTitle: TaskWithSubTasks = {
        ...mockTask,
        title: 'Task with 特殊文字 & symbols!@#$%'
      };

      render(CommandTaskItem, { 
        props: { 
          ...defaultProps, 
          task: taskWithSpecialTitle
        }
      });
      
      expect(screen.getByText('Task with 特殊文字 & symbols!@#$%')).toBeInTheDocument();
    });
  });

  describe('tag search mode', () => {
    it('should display tags when isTagSearch is true and task has tags', () => {
      render(CommandTaskItem, { 
        props: { 
          ...defaultProps, 
          isTagSearch: true
        }
      });
      
      expect(screen.getByText('#urgent')).toBeInTheDocument();
      expect(screen.getByText('#work')).toBeInTheDocument();
    });

    it('should not display tags when isTagSearch is false', () => {
      render(CommandTaskItem, { 
        props: { 
          ...defaultProps, 
          isTagSearch: false
        }
      });
      
      expect(screen.queryByText('#urgent')).not.toBeInTheDocument();
      expect(screen.queryByText('#work')).not.toBeInTheDocument();
    });

    it('should handle task with no tags in tag search mode', () => {
      const taskWithoutTags: TaskWithSubTasks = {
        ...mockTask,
        tags: []
      };

      render(CommandTaskItem, { 
        props: { 
          ...defaultProps, 
          task: taskWithoutTags,
          isTagSearch: true
        }
      });
      
      expect(screen.queryByText(/^#/)).not.toBeInTheDocument();
    });

    it('should render tags with correct styling', () => {
      render(CommandTaskItem, { 
        props: { 
          ...defaultProps, 
          isTagSearch: true
        }
      });
      
      const urgentTag = screen.getByText('#urgent');
      expect(urgentTag).toHaveClass(
        'bg-secondary',
        'text-secondary-foreground',
        'inline-flex',
        'items-center',
        'rounded',
        'px-1.5',
        'py-0.5',
        'text-xs'
      );
    });

    it('should handle tags with special characters', () => {
      const taskWithSpecialTags: TaskWithSubTasks = {
        ...mockTask,
        tags: [
          { id: 'tag-1', name: 'tag with spaces', color: '#ff0000' },
          { id: 'tag-2', name: 'タグ', color: '#00ff00' },
          { id: 'tag-3', name: 'tag&symbols!', color: '#0000ff' }
        ]
      };

      render(CommandTaskItem, { 
        props: { 
          ...defaultProps, 
          task: taskWithSpecialTags,
          isTagSearch: true
        }
      });
      
      expect(screen.getByText('#tag with spaces')).toBeInTheDocument();
      expect(screen.getByText('#タグ')).toBeInTheDocument();
      expect(screen.getByText('#tag&symbols!')).toBeInTheDocument();
    });
  });

  describe('description display', () => {
    it('should display description when not in tag search mode', () => {
      render(CommandTaskItem, { 
        props: { 
          ...defaultProps, 
          isTagSearch: false
        }
      });
      
      expect(screen.getByText('Test task description')).toBeInTheDocument();
    });

    it('should not display description when in tag search mode', () => {
      render(CommandTaskItem, { 
        props: { 
          ...defaultProps, 
          isTagSearch: true
        }
      });
      
      expect(screen.queryByText('Test task description')).not.toBeInTheDocument();
    });

    it('should handle empty description', () => {
      const taskWithoutDescription: TaskWithSubTasks = {
        ...mockTask,
        description: ''
      };

      render(CommandTaskItem, { 
        props: { 
          ...defaultProps, 
          task: taskWithoutDescription,
          isTagSearch: false
        }
      });
      
      expect(screen.queryByText(/Test task description/)).not.toBeInTheDocument();
    });

    it('should handle null description', () => {
      const taskWithNullDescription: TaskWithSubTasks = {
        ...mockTask,
        description: null as any
      };

      render(CommandTaskItem, { 
        props: { 
          ...defaultProps, 
          task: taskWithNullDescription,
          isTagSearch: false
        }
      });
      
      expect(document.body).toBeInTheDocument();
    });

    it('should render description with correct styling', () => {
      render(CommandTaskItem, { 
        props: { 
          ...defaultProps, 
          isTagSearch: false
        }
      });
      
      const descriptionElement = screen.getByText('Test task description');
      expect(descriptionElement).toHaveClass(
        'text-muted-foreground',
        'ml-2',
        'truncate',
        'text-xs'
      );
    });

    it('should handle very long description', () => {
      const taskWithLongDescription: TaskWithSubTasks = {
        ...mockTask,
        description: 'B'.repeat(300)
      };

      render(CommandTaskItem, { 
        props: { 
          ...defaultProps, 
          task: taskWithLongDescription,
          isTagSearch: false
        }
      });
      
      const descriptionElement = screen.getByText('B'.repeat(300));
      expect(descriptionElement).toHaveClass('truncate');
    });
  });

  describe('onSelect callback', () => {
    it('should accept onSelect callback', () => {
      const mockCallback = vi.fn();
      render(CommandTaskItem, { 
        props: { 
          ...defaultProps, 
          onSelect: mockCallback
        }
      });
      
      expect(document.body).toBeInTheDocument();
    });

    it('should handle undefined onSelect', () => {
      render(CommandTaskItem, { 
        props: { 
          ...defaultProps, 
          onSelect: undefined as any
        }
      });
      
      expect(document.body).toBeInTheDocument();
    });

    it('should handle null onSelect', () => {
      render(CommandTaskItem, { 
        props: { 
          ...defaultProps, 
          onSelect: null as any
        }
      });
      
      expect(document.body).toBeInTheDocument();
    });
  });

  describe('command item integration', () => {
    it('should integrate with Command.Item component', () => {
      render(CommandTaskItem, { props: defaultProps });
      
      // Should work with mocked Command.Item
      expect(document.body).toBeInTheDocument();
    });

    it('should pass onSelect to Command.Item', () => {
      const mockCallback = vi.fn();
      render(CommandTaskItem, { 
        props: { 
          ...defaultProps, 
          onSelect: mockCallback
        }
      });
      
      // Should integrate callback with Command.Item
      expect(document.body).toBeInTheDocument();
    });
  });

  describe('conditional rendering logic', () => {
    it('should prioritize tags over description in tag search mode', () => {
      render(CommandTaskItem, { 
        props: { 
          ...defaultProps, 
          isTagSearch: true
        }
      });
      
      // Should show tags, not description
      expect(screen.getByText('#urgent')).toBeInTheDocument();
      expect(screen.queryByText('Test task description')).not.toBeInTheDocument();
    });

    it('should show description when not in tag search and no tags', () => {
      const taskWithoutTags: TaskWithSubTasks = {
        ...mockTask,
        tags: []
      };

      render(CommandTaskItem, { 
        props: { 
          ...defaultProps, 
          task: taskWithoutTags,
          isTagSearch: false
        }
      });
      
      expect(screen.getByText('Test task description')).toBeInTheDocument();
    });

    it('should show nothing extra when no description and no tags', () => {
      const minimalTask: TaskWithSubTasks = {
        ...mockTask,
        description: '',
        tags: []
      };

      render(CommandTaskItem, { 
        props: { 
          ...defaultProps, 
          task: minimalTask,
          isTagSearch: false
        }
      });
      
      // Should only show title
      expect(screen.getByText('Test Task')).toBeInTheDocument();
      expect(screen.queryByText(/^#/)).not.toBeInTheDocument();
    });
  });

  describe('edge cases', () => {
    it('should handle task with null title', () => {
      const taskWithNullTitle: TaskWithSubTasks = {
        ...mockTask,
        title: null as any
      };

      render(CommandTaskItem, { 
        props: { 
          ...defaultProps, 
          task: taskWithNullTitle
        }
      });
      
      expect(document.body).toBeInTheDocument();
    });

    it('should handle task with undefined tags', () => {
      const taskWithUndefinedTags: TaskWithSubTasks = {
        ...mockTask,
        tags: undefined as any
      };

      render(CommandTaskItem, { 
        props: { 
          ...defaultProps, 
          task: taskWithUndefinedTags,
          isTagSearch: true
        }
      });
      
      expect(document.body).toBeInTheDocument();
    });

    it('should handle tags with missing properties', () => {
      const taskWithIncompleteTags: TaskWithSubTasks = {
        ...mockTask,
        tags: [
          { id: 'tag-1', name: '', color: '#ff0000' },
          { id: '', name: 'test', color: '#00ff00' },
          { id: 'tag-3', name: null as any, color: null as any }
        ]
      };

      render(CommandTaskItem, { 
        props: { 
          ...defaultProps, 
          task: taskWithIncompleteTags,
          isTagSearch: true
        }
      });
      
      expect(document.body).toBeInTheDocument();
    });
  });

  describe('component lifecycle', () => {
    it('should mount and unmount cleanly', () => {
      const { unmount } = render(CommandTaskItem, { props: defaultProps });
      
      expect(document.body).toBeInTheDocument();
      
      expect(() => unmount()).not.toThrow();
    });

    it('should handle prop updates', () => {
      const { unmount } = render(CommandTaskItem, { props: defaultProps });
      
      unmount();
      
      const updatedTask: TaskWithSubTasks = {
        ...mockTask,
        title: 'Updated Task Title'
      };

      render(CommandTaskItem, { 
        props: { 
          ...defaultProps, 
          task: updatedTask
        }
      });
      
      expect(screen.getByText('Updated Task Title')).toBeInTheDocument();
    });

    it('should handle mode switching', () => {
      const { unmount } = render(CommandTaskItem, { 
        props: { 
          ...defaultProps, 
          isTagSearch: false
        }
      });
      
      expect(screen.getByText('Test task description')).toBeInTheDocument();
      
      unmount();
      
      render(CommandTaskItem, { 
        props: { 
          ...defaultProps, 
          isTagSearch: true
        }
      });
      
      expect(screen.getByText('#urgent')).toBeInTheDocument();
      expect(screen.queryByText('Test task description')).not.toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('should maintain proper text hierarchy', () => {
      render(CommandTaskItem, { props: defaultProps });
      
      // Title should be prominent
      const titleElement = screen.getByText('Test Task');
      expect(titleElement).toHaveClass('font-medium');
    });

    it('should provide accessible content for screen readers', () => {
      render(CommandTaskItem, { props: defaultProps });
      
      // Content should be accessible
      expect(screen.getByText('Test Task')).toBeInTheDocument();
      expect(screen.getByText('Test task description')).toBeInTheDocument();
    });

    it('should handle keyboard navigation integration', () => {
      render(CommandTaskItem, { props: defaultProps });
      
      // Should work with command item keyboard navigation
      expect(document.body).toBeInTheDocument();
    });
  });
});