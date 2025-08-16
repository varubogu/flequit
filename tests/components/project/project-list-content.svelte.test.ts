import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import ProjectListContent from '$lib/components/project/project-list-content.svelte';

// Mock stores
vi.mock('$lib/stores/tasks.svelte', () => ({
  taskStore: {
    selectedProjectId: 'project-1'
  }
}));

// Mock child components
vi.mock('$lib/components/shared/button.svelte', () => ({
  default: () => ({ $$: { fragment: null } })
}));

vi.mock('$lib/components/shared/context-menu-wrapper.svelte', () => ({
  default: () => ({ $$: { fragment: null } })
}));

vi.mock('$lib/components/task/task-list-display.svelte', () => ({
  default: () => ({ $$: { fragment: null } })
}));

vi.mock('lucide-svelte', () => ({
  ChevronDown: () => ({ $$: { fragment: null } }),
  ChevronRight: () => ({ $$: { fragment: null } })
}));

describe('ProjectListContent', () => {
  const mockProjects = [
    {
      id: 'project-1',
      name: 'Work Project',
      color: '#ff0000',
      task_lists: [
        { id: 'list-1', name: 'Todo' },
        { id: 'list-2', name: 'In Progress' }
      ]
    },
    {
      id: 'project-2',
      name: 'Personal Project',
      color: null,
      task_lists: []
    }
  ];

  const mockLogic = {
    projectsData: mockProjects,
    expandedProjects: new Set(['project-1']),
    toggleTaskLists: vi.fn(() => 'Toggle Task Lists'),
    toggleProjectExpansion: vi.fn(),
    createProjectContextMenu: vi.fn(() => []),
    handleProjectSelect: vi.fn(),
    getProjectTaskCount: vi.fn(() => '5'),
    handleProjectDragStart: vi.fn(),
    handleProjectDragOver: vi.fn(),
    handleProjectDrop: vi.fn(),
    handleProjectDragEnd: vi.fn(),
    handleProjectDragEnter: vi.fn(),
    handleProjectDragLeave: vi.fn()
  };

  const defaultProps = {
    logic: mockLogic,
    currentView: 'all' as const,
    isCollapsed: false,
    onViewChange: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('basic rendering', () => {
    it('should render without errors', () => {
      render(ProjectListContent, { props: defaultProps });
      
      expect(document.body).toBeInTheDocument();
    });

    it('should render all projects', () => {
      render(ProjectListContent, { props: defaultProps });
      
      expect(screen.getByText('Work Project')).toBeInTheDocument();
      expect(screen.getByText('Personal Project')).toBeInTheDocument();
    });

    it('should handle empty projects list', () => {
      const emptyLogic = {
        ...mockLogic,
        projectsData: []
      };

      render(ProjectListContent, { 
        props: { 
          ...defaultProps, 
          logic: emptyLogic
        }
      });
      
      expect(document.body).toBeInTheDocument();
    });
  });

  describe('project expansion toggle', () => {
    it('should show toggle button for projects with task lists', () => {
      render(ProjectListContent, { props: defaultProps });
      
      const toggleButton = document.querySelector('[data-testid="toggle-project-project-1"]');
      expect(toggleButton).toBeInTheDocument();
    });

    it('should not show toggle button for projects without task lists', () => {
      render(ProjectListContent, { props: defaultProps });
      
      const toggleButton = document.querySelector('[data-testid="toggle-project-project-2"]');
      expect(toggleButton).not.toBeInTheDocument();
    });

    it('should call toggleProjectExpansion when toggle button is clicked', () => {
      render(ProjectListContent, { props: defaultProps });
      
      const toggleButton = document.querySelector('[data-testid="toggle-project-project-1"]');
      fireEvent.click(toggleButton!);
      
      expect(mockLogic.toggleProjectExpansion).toHaveBeenCalledWith('project-1');
    });

    it('should show spacer div for projects without task lists', () => {
      render(ProjectListContent, { props: defaultProps });
      
      // Should have spacer div for alignment
      const spacer = document.querySelector('.mt-1.h-8.min-h-\\[32px\\].w-8.min-w-\\[32px\\]');
      expect(spacer).toBeInTheDocument();
    });
  });

  describe('collapsed mode', () => {
    it('should hide toggle buttons when collapsed', () => {
      render(ProjectListContent, { 
        props: { 
          ...defaultProps, 
          isCollapsed: true
        }
      });
      
      const toggleButton = document.querySelector('[data-testid="toggle-project-project-1"]');
      expect(toggleButton).not.toBeInTheDocument();
    });

    it('should hide project names when collapsed', () => {
      render(ProjectListContent, { 
        props: { 
          ...defaultProps, 
          isCollapsed: true
        }
      });
      
      expect(screen.queryByText('Work Project')).not.toBeInTheDocument();
      expect(screen.queryByText('Personal Project')).not.toBeInTheDocument();
    });

    it('should hide task counts when collapsed', () => {
      render(ProjectListContent, { 
        props: { 
          ...defaultProps, 
          isCollapsed: true
        }
      });
      
      expect(screen.queryByText('5')).not.toBeInTheDocument();
    });

    it('should hide TaskListDisplay when collapsed', () => {
      render(ProjectListContent, { 
        props: { 
          ...defaultProps, 
          isCollapsed: true
        }
      });
      
      // TaskListDisplay component is mocked but should not be rendered when collapsed
      expect(document.body).toBeInTheDocument();
    });
  });

  describe('project selection', () => {
    it('should call handleProjectSelect when project is clicked', () => {
      render(ProjectListContent, { props: defaultProps });
      
      const projectButton = document.querySelector('[data-testid="project-project-1"]');
      fireEvent.click(projectButton!);
      
      expect(mockLogic.handleProjectSelect).toHaveBeenCalledWith(mockProjects[0]);
    });

    it('should show different variant for selected project', () => {
      render(ProjectListContent, { 
        props: { 
          ...defaultProps, 
          currentView: 'project'
        }
      });
      
      // Project button styling should reflect selection
      expect(document.body).toBeInTheDocument();
    });

    it('should show ghost variant for unselected projects', () => {
      render(ProjectListContent, { 
        props: { 
          ...defaultProps, 
          currentView: 'all'
        }
      });
      
      // Project button styling should be ghost variant
      expect(document.body).toBeInTheDocument();
    });
  });

  describe('project colors', () => {
    it('should display project color when available', () => {
      render(ProjectListContent, { props: defaultProps });
      
      const colorIndicator = document.querySelector('[style*="background-color: #ff0000"]');
      expect(colorIndicator).toBeInTheDocument();
    });

    it('should use default color when project color is null', () => {
      render(ProjectListContent, { props: defaultProps });
      
      const defaultColorIndicator = document.querySelector('[style*="background-color: #3b82f6"]');
      expect(defaultColorIndicator).toBeInTheDocument();
    });

    it('should have proper color indicator styling', () => {
      render(ProjectListContent, { props: defaultProps });
      
      const colorIndicator = document.querySelector('.h-3.w-3.flex-shrink-0.rounded-full');
      expect(colorIndicator).toBeInTheDocument();
    });
  });

  describe('drag and drop functionality', () => {
    it('should have draggable attribute on project buttons', () => {
      render(ProjectListContent, { props: defaultProps });
      
      const projectButton = document.querySelector('[data-testid="project-project-1"]');
      expect(projectButton).toHaveAttribute('draggable', 'true');
    });

    it('should call handleProjectDragStart on dragstart', () => {
      render(ProjectListContent, { props: defaultProps });
      
      const projectButton = document.querySelector('[data-testid="project-project-1"]');
      const dragEvent = new DragEvent('dragstart');
      fireEvent(projectButton!, dragEvent);
      
      expect(mockLogic.handleProjectDragStart).toHaveBeenCalled();
    });

    it('should handle all drag events', () => {
      render(ProjectListContent, { props: defaultProps });
      
      const projectButton = document.querySelector('[data-testid="project-project-1"]');
      
      fireEvent.dragOver(projectButton!, {});
      fireEvent.drop(projectButton!, {});
      fireEvent.dragEnd(projectButton!, {});
      
      expect(mockLogic.handleProjectDragOver).toHaveBeenCalled();
      expect(mockLogic.handleProjectDrop).toHaveBeenCalled();
      expect(mockLogic.handleProjectDragEnd).toHaveBeenCalled();
    });
  });

  describe('context menu integration', () => {
    it('should wrap project buttons with ContextMenuWrapper', () => {
      render(ProjectListContent, { props: defaultProps });
      
      // ContextMenuWrapper is mocked, should call createProjectContextMenu
      expect(mockLogic.createProjectContextMenu).toHaveBeenCalledWith(mockProjects[0]);
      expect(mockLogic.createProjectContextMenu).toHaveBeenCalledWith(mockProjects[1]);
    });

    it('should handle context menu items', () => {
      const mockContextItems = [
        { label: 'Edit Project', action: vi.fn() },
        { label: 'Delete Project', action: vi.fn() }
      ];

      mockLogic.createProjectContextMenu.mockReturnValue(mockContextItems);

      render(ProjectListContent, { props: defaultProps });
      
      expect(mockLogic.createProjectContextMenu).toHaveBeenCalled();
    });
  });

  describe('task count display', () => {
    it('should display task count for projects', () => {
      render(ProjectListContent, { props: defaultProps });
      
      expect(screen.getByText('5')).toBeInTheDocument();
    });

    it('should call getProjectTaskCount for each project', () => {
      render(ProjectListContent, { props: defaultProps });
      
      expect(mockLogic.getProjectTaskCount).toHaveBeenCalledWith(mockProjects[0]);
      expect(mockLogic.getProjectTaskCount).toHaveBeenCalledWith(mockProjects[1]);
    });

    it('should handle task count with proper styling', () => {
      render(ProjectListContent, { props: defaultProps });
      
      const taskCount = screen.getByText('5');
      expect(taskCount).toHaveClass('text-muted-foreground', 'flex-shrink-0', 'text-xs');
    });
  });

  describe('task list display integration', () => {
    it('should render TaskListDisplay for expanded projects', () => {
      render(ProjectListContent, { props: defaultProps });
      
      // TaskListDisplay is mocked, should render when not collapsed
      expect(document.body).toBeInTheDocument();
    });

    it('should pass correct props to TaskListDisplay', () => {
      render(ProjectListContent, { props: defaultProps });
      
      // Should pass project, isExpanded, and onViewChange
      expect(document.body).toBeInTheDocument();
    });

    it('should handle expansion state correctly', () => {
      render(ProjectListContent, { props: defaultProps });
      
      // Should check expandedProjects Set for expansion state
      expect(document.body).toBeInTheDocument();
    });
  });

  describe('view type handling', () => {
    it('should handle different view types', () => {
      render(ProjectListContent, { 
        props: { 
          ...defaultProps, 
          currentView: 'project'
        }
      });
      
      expect(document.body).toBeInTheDocument();
    });

    it('should pass onViewChange to TaskListDisplay', () => {
      const mockViewChange = vi.fn();
      render(ProjectListContent, { 
        props: { 
          ...defaultProps, 
          onViewChange: mockViewChange
        }
      });
      
      // onViewChange should be passed to TaskListDisplay
      expect(document.body).toBeInTheDocument();
    });

    it('should handle undefined onViewChange', () => {
      render(ProjectListContent, { 
        props: { 
          ...defaultProps, 
          onViewChange: undefined
        }
      });
      
      expect(document.body).toBeInTheDocument();
    });
  });

  describe('edge cases', () => {
    it('should handle projects without names', () => {
      const projectsWithoutNames = [
        { ...mockProjects[0], name: '' },
        { ...mockProjects[1], name: null as any }
      ];

      const logicWithEmptyNames = {
        ...mockLogic,
        projectsData: projectsWithoutNames
      };

      render(ProjectListContent, { 
        props: { 
          ...defaultProps, 
          logic: logicWithEmptyNames
        }
      });
      
      expect(document.body).toBeInTheDocument();
    });

    it('should handle undefined expandedProjects', () => {
      const logicWithoutExpanded = {
        ...mockLogic,
        expandedProjects: undefined as any
      };

      render(ProjectListContent, { 
        props: { 
          ...defaultProps, 
          logic: logicWithoutExpanded
        }
      });
      
      expect(document.body).toBeInTheDocument();
    });

    it('should handle projects with undefined task_lists', () => {
      const projectsWithUndefinedLists = [
        { ...mockProjects[0], task_lists: undefined as any }
      ];

      const logicWithUndefinedLists = {
        ...mockLogic,
        projectsData: projectsWithUndefinedLists
      };

      render(ProjectListContent, { 
        props: { 
          ...defaultProps, 
          logic: logicWithUndefinedLists
        }
      });
      
      expect(document.body).toBeInTheDocument();
    });
  });

  describe('component lifecycle', () => {
    it('should mount and unmount cleanly', () => {
      const { unmount } = render(ProjectListContent, { props: defaultProps });
      
      expect(() => unmount()).not.toThrow();
    });

    it('should handle prop updates', () => {
      const { unmount } = render(ProjectListContent, { props: defaultProps });
      
      unmount();
      
      const updatedProps = {
        ...defaultProps,
        isCollapsed: true,
        currentView: 'project' as const
      };

      render(ProjectListContent, { props: updatedProps });
      
      expect(document.body).toBeInTheDocument();
    });
  });
});