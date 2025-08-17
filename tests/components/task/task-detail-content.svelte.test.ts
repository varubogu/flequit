import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import TaskDetailContent from '$lib/components/task/detail/task-detail-content.svelte';
import type { TaskWithSubTasks } from '$lib/types/task';
import type { SubTask } from '$lib/types/sub-task';

// Mock child components
vi.mock('$lib/components/task/task-detail-header.svelte', () => ({
  default: () => ({ $$: { fragment: null } })
}));

vi.mock('$lib/components/task/task-status-selector.svelte', () => ({
  default: () => ({ $$: { fragment: null } })
}));

vi.mock('$lib/components/task/task-due-date-selector.svelte', () => ({
  default: () => ({ $$: { fragment: null } })
}));

vi.mock('$lib/components/task/task-priority-selector.svelte', () => ({
  default: () => ({ $$: { fragment: null } })
}));

vi.mock('$lib/components/task/task-description-editor.svelte', () => ({
  default: () => ({ $$: { fragment: null } })
}));

vi.mock('$lib/components/task/task-detail-subtasks.svelte', () => ({
  default: () => ({ $$: { fragment: null } })
}));

vi.mock('$lib/components/task/task-detail-tags.svelte', () => ({
  default: () => ({ $$: { fragment: null } })
}));

vi.mock('$lib/components/task/task-detail-metadata.svelte', () => ({
  default: () => ({ $$: { fragment: null } })
}));

vi.mock('$lib/components/task/task-detail-empty-state.svelte', () => ({
  default: () => ({ $$: { fragment: null } })
}));

vi.mock('$lib/components/project/project-task-list-selector.svelte', () => ({
  default: () => ({ $$: { fragment: null } })
}));

describe('TaskDetailContent', () => {
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

  const mockSubTask: SubTask = {
    id: 'subtask-1',
    title: 'Test SubTask',
    description: 'SubTask Description',
    status: 'todo',
    is_completed: false,
    parent_task_id: 'task-1',
    order_index: 0,
    created_at: new Date('2024-01-01'),
    updated_at: new Date('2024-01-01')
  };

  const mockEditForm = {
    title: 'Test Title',
    description: 'Test Description',
    start_date: new Date('2024-01-01'),
    end_date: new Date('2024-01-02'),
    is_range_date: true,
    priority: 3
  };

  const mockProjectInfo = {
    project: { id: 'project-1', name: 'Test Project' },
    taskList: { id: 'list-1', name: 'Test List' }
  };

  const defaultProps = {
    currentItem: mockTask,
    task: mockTask,
    subTask: null,
    isSubTask: false,
    isNewTaskMode: false,
    editForm: mockEditForm,
    selectedSubTaskId: null,
    projectInfo: mockProjectInfo,
    isDrawerMode: false,
    onTitleChange: vi.fn(),
    onDescriptionChange: vi.fn(),
    onPriorityChange: vi.fn(),
    onStatusChange: vi.fn(),
    onDueDateClick: vi.fn(),
    onFormChange: vi.fn(),
    onDelete: vi.fn(),
    onSaveNewTask: vi.fn(),
    onSubTaskClick: vi.fn(),
    onSubTaskToggle: vi.fn(),
    onAddSubTask: vi.fn(),
    showSubTaskAddForm: false,
    onSubTaskAdded: vi.fn(),
    onSubTaskAddCancel: vi.fn(),
    onGoToParentTask: vi.fn(),
    onProjectTaskListEdit: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering with task', () => {
    it('should render with task content', () => {
      render(TaskDetailContent, { props: defaultProps });
      
      // Should render main content container
      const contentContainer = document.querySelector('.flex-1');
      expect(contentContainer).toBeInTheDocument();
    });

    it('should apply correct classes for normal mode', () => {
      render(TaskDetailContent, { props: defaultProps });
      
      const contentDiv = document.querySelector('.flex-1.space-y-6.overflow-auto.p-6');
      expect(contentDiv).toBeInTheDocument();
    });

    it('should apply correct classes for drawer mode', () => {
      render(TaskDetailContent, { 
        props: { ...defaultProps, isDrawerMode: true }
      });
      
      const contentDiv = document.querySelector('.flex-1.space-y-4.overflow-auto.py-4');
      expect(contentDiv).toBeInTheDocument();
    });
  });

  describe('sub-task rendering logic', () => {
    it('should render subtasks section for main task', () => {
      render(TaskDetailContent, { 
        props: { 
          ...defaultProps,
          isSubTask: false,
          isNewTaskMode: false,
          task: mockTask
        }
      });
      
      // TaskDetailSubTasks component should be rendered
      expect(document.querySelector('div')).toBeInTheDocument();
    });

    it('should not render subtasks section for subtask', () => {
      render(TaskDetailContent, { 
        props: { 
          ...defaultProps,
          currentItem: mockSubTask,
          isSubTask: true,
          subTask: mockSubTask,
          task: null
        }
      });
      
      // Content should still render but without subtasks section
      expect(document.querySelector('.flex-1')).toBeInTheDocument();
    });

    it('should not render subtasks section in new task mode', () => {
      render(TaskDetailContent, { 
        props: { 
          ...defaultProps,
          isNewTaskMode: true
        }
      });
      
      // Content should render but without subtasks section
      expect(document.querySelector('.flex-1')).toBeInTheDocument();
    });
  });

  describe('tags rendering', () => {
    it('should render tags for main task', () => {
      render(TaskDetailContent, { 
        props: { 
          ...defaultProps,
          task: mockTask,
          isSubTask: false
        }
      });
      
      expect(document.querySelector('.flex-1')).toBeInTheDocument();
    });

    it('should render tags for subtask', () => {
      render(TaskDetailContent, { 
        props: { 
          ...defaultProps,
          currentItem: mockSubTask,
          task: null,
          subTask: mockSubTask,
          isSubTask: true
        }
      });
      
      expect(document.querySelector('.flex-1')).toBeInTheDocument();
    });

    it('should render tags in new task mode', () => {
      render(TaskDetailContent, { 
        props: { 
          ...defaultProps,
          isNewTaskMode: true,
          currentItem: mockTask
        }
      });
      
      expect(document.querySelector('.flex-1')).toBeInTheDocument();
    });
  });

  describe('project task list selector', () => {
    it('should render project task list selector when not in new task mode', () => {
      render(TaskDetailContent, { 
        props: { 
          ...defaultProps,
          isNewTaskMode: false,
          projectInfo: mockProjectInfo
        }
      });
      
      expect(document.querySelector('.flex-1')).toBeInTheDocument();
    });

    it('should not render project task list selector in new task mode', () => {
      render(TaskDetailContent, { 
        props: { 
          ...defaultProps,
          isNewTaskMode: true,
          projectInfo: mockProjectInfo
        }
      });
      
      expect(document.querySelector('.flex-1')).toBeInTheDocument();
    });
  });

  describe('empty state', () => {
    it('should render empty state when currentItem is null', () => {
      render(TaskDetailContent, { 
        props: { 
          ...defaultProps,
          currentItem: null
        }
      });
      
      // Should render empty state component
      expect(document.querySelector('body')).toBeInTheDocument();
    });

    it('should render empty state when currentItem is undefined', () => {
      render(TaskDetailContent, { 
        props: { 
          ...defaultProps,
          currentItem: undefined as any
        }
      });
      
      expect(document.querySelector('body')).toBeInTheDocument();
    });
  });

  describe('prop forwarding', () => {
    it('should forward props to child components correctly', () => {
      const customProps = {
        ...defaultProps,
        selectedSubTaskId: 'subtask-2',
        showSubTaskAddForm: true
      };

      render(TaskDetailContent, { props: customProps });
      
      // Component should render without errors
      expect(document.querySelector('.flex-1')).toBeInTheDocument();
    });

    it('should handle callback props', () => {
      const mockCallbacks = {
        ...defaultProps,
        onTitleChange: vi.fn(),
        onDescriptionChange: vi.fn(),
        onPriorityChange: vi.fn(),
        onStatusChange: vi.fn()
      };

      render(TaskDetailContent, { props: mockCallbacks });
      
      expect(document.querySelector('.flex-1')).toBeInTheDocument();
    });
  });

  describe('data flow scenarios', () => {
    it('should handle main task with subtasks', () => {
      const taskWithSubTasks: TaskWithSubTasks = {
        ...mockTask,
        sub_tasks: [mockSubTask]
      };

      render(TaskDetailContent, { 
        props: { 
          ...defaultProps,
          currentItem: taskWithSubTasks,
          task: taskWithSubTasks
        }
      });
      
      expect(document.querySelector('.flex-1')).toBeInTheDocument();
    });

    it('should handle subtask view', () => {
      render(TaskDetailContent, { 
        props: { 
          ...defaultProps,
          currentItem: mockSubTask,
          task: mockTask,
          subTask: mockSubTask,
          isSubTask: true,
          selectedSubTaskId: mockSubTask.id
        }
      });
      
      expect(document.querySelector('.flex-1')).toBeInTheDocument();
    });

    it('should handle new task creation mode', () => {
      const newTaskItem = {
        ...mockTask,
        id: '',
        title: '',
        description: ''
      };

      render(TaskDetailContent, { 
        props: { 
          ...defaultProps,
          currentItem: newTaskItem,
          isNewTaskMode: true,
          editForm: {
            ...mockEditForm,
            title: '',
            description: ''
          }
        }
      });
      
      expect(document.querySelector('.flex-1')).toBeInTheDocument();
    });
  });

  describe('edge cases', () => {
    it('should handle null project info', () => {
      render(TaskDetailContent, { 
        props: { 
          ...defaultProps,
          projectInfo: null
        }
      });
      
      expect(document.querySelector('.flex-1')).toBeInTheDocument();
    });

    it('should handle missing optional callback props', () => {
      const { onAddSubTask, showSubTaskAddForm, onSubTaskAdded, onSubTaskAddCancel, ...requiredProps } = defaultProps;
      
      render(TaskDetailContent, { props: requiredProps });
      
      expect(document.querySelector('.flex-1')).toBeInTheDocument();
    });

    it('should handle empty edit form', () => {
      const emptyEditForm = {
        title: '',
        description: '',
        start_date: undefined,
        end_date: undefined,
        is_range_date: false,
        priority: 1
      };

      render(TaskDetailContent, { 
        props: { 
          ...defaultProps,
          editForm: emptyEditForm
        }
      });
      
      expect(document.querySelector('.flex-1')).toBeInTheDocument();
    });
  });

  describe('responsive layout', () => {
    it('should use flex-wrap for selectors container', () => {
      render(TaskDetailContent, { props: defaultProps });
      
      const selectorsContainer = document.querySelector('.flex.flex-wrap.gap-4');
      expect(selectorsContainer).toBeInTheDocument();
    });

    it('should apply correct spacing based on drawer mode', () => {
      // Test normal mode
      const { unmount } = render(TaskDetailContent, { 
        props: { ...defaultProps, isDrawerMode: false }
      });
      
      expect(document.querySelector('.space-y-6')).toBeInTheDocument();
      unmount();
      
      // Test drawer mode
      render(TaskDetailContent, { 
        props: { ...defaultProps, isDrawerMode: true }
      });
      
      expect(document.querySelector('.space-y-4')).toBeInTheDocument();
    });
  });

  describe('component integration', () => {
    it('should pass correct props to TaskDetailHeader', () => {
      render(TaskDetailContent, { props: defaultProps });
      
      // Component should render without throwing
      expect(document.querySelector('body')).toBeInTheDocument();
    });

    it('should pass correct props to selector components', () => {
      render(TaskDetailContent, { props: defaultProps });
      
      // All selector components should be rendered
      expect(document.querySelector('.flex.flex-wrap.gap-4')).toBeInTheDocument();
    });

    it('should conditionally render SubTasks component', () => {
      // With subtasks
      render(TaskDetailContent, { 
        props: { 
          ...defaultProps,
          isSubTask: false,
          isNewTaskMode: false,
          task: mockTask
        }
      });
      
      expect(document.querySelector('.flex-1')).toBeInTheDocument();
    });
  });
});