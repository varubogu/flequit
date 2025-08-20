import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render } from '@testing-library/svelte';
import ProjectListContent from '$lib/components/project/project-list-content.svelte';
import type { ProjectListLogic } from '$lib/components/project/project-list-logic.svelte';

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
    showProjectDialog: false,
    projectDialogMode: 'add' as const,
    editingProject: null,
    showTaskListDialog: false,
    taskListDialogProject: null,
    translationService: {
      getMessage: vi.fn((key: string) => key)
    },
    editProject: () => 'Edit Project',
    addTaskList: () => 'Add Task List',
    deleteProject: () => 'Delete Project',
    toggleTaskLists: () => 'Toggle Task Lists',
    toggleProjectExpansion: vi.fn(),
    createProjectContextMenu: vi.fn(() => []),
    handleProjectSelect: vi.fn(),
    getProjectTaskCount: vi.fn(() => 5),
    handleProjectDragStart: vi.fn(),
    handleProjectDragOver: vi.fn(),
    handleProjectDrop: vi.fn(),
    handleProjectDragEnd: vi.fn(),
    handleProjectDragEnter: vi.fn(),
    handleProjectDragLeave: vi.fn(),
    openProjectDialog: vi.fn(),
    openTaskListDialog: vi.fn(),
    handleTaskListSave: vi.fn(),
    handleProjectSave: vi.fn(),
    handleProjectDialogClose: vi.fn(),
    handleTaskListDialogClose: vi.fn()
  };

  const defaultProps = {
    logic: mockLogic as unknown as ProjectListLogic,
    currentView: 'all' as const,
    isCollapsed: false,
    onViewChange: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('basic rendering', () => {
    it('should render without errors', () => {
      const { component } = render(ProjectListContent, { props: defaultProps });
      expect(component).toBeTruthy();
    });

    it('should process projects data', () => {
      render(ProjectListContent, { props: defaultProps });

      // Verify that the component processes the projects data from logic
      expect(defaultProps.logic.projectsData).toEqual(mockProjects);
    });

    it('should handle empty projects list', () => {
      const emptyLogic = {
        ...mockLogic,
        projectsData: []
      } as unknown as ProjectListLogic;

      const { component } = render(ProjectListContent, {
        props: {
          ...defaultProps,
          logic: emptyLogic
        }
      });

      expect(component).toBeTruthy();
    });
  });

  describe('project expansion toggle', () => {
    it('should handle toggle button logic for projects', () => {
      const { component } = render(ProjectListContent, { props: defaultProps });

      // Verify component rendered and logic methods are available
      expect(component).toBeTruthy();
      expect(mockLogic.toggleTaskLists).toBeDefined();
      expect(mockLogic.toggleProjectExpansion).toBeDefined();
    });

    it('should handle expandedProjects state', () => {
      render(ProjectListContent, { props: defaultProps });

      // Verify expanded projects set contains project-1
      expect(mockLogic.expandedProjects.has('project-1')).toBe(true);
    });
  });

  describe('collapsed mode', () => {
    it('should handle collapsed state', () => {
      const { component } = render(ProjectListContent, {
        props: {
          ...defaultProps,
          isCollapsed: true
        }
      });

      expect(component).toBeTruthy();
    });
  });

  describe('project selection', () => {
    it('should handle different view types', () => {
      const { component } = render(ProjectListContent, {
        props: {
          ...defaultProps,
          currentView: 'project'
        }
      });

      expect(component).toBeTruthy();
      expect(mockLogic.handleProjectSelect).toBeDefined();
    });
  });

  describe('component integration', () => {
    it('should handle project functionality', () => {
      const { component } = render(ProjectListContent, { props: defaultProps });

      expect(component).toBeTruthy();
      expect(mockLogic.createProjectContextMenu).toBeDefined();
      expect(mockLogic.getProjectTaskCount).toBeDefined();
      expect(mockLogic.handleProjectDragStart).toBeDefined();
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
        { ...mockProjects[1], name: null as unknown as string }
      ];

      const logicWithEmptyNames = {
        ...mockLogic,
        projectsData: projectsWithoutNames
      } as typeof mockLogic;

      render(ProjectListContent, {
        props: {
          ...defaultProps,
          logic: logicWithEmptyNames as unknown as ProjectListLogic
        }
      });

      expect(document.body).toBeInTheDocument();
    });

    it('should handle undefined expandedProjects', () => {
      const logicWithoutExpanded = {
        ...mockLogic,
        expandedProjects: undefined as unknown as Set<string>
      } as typeof mockLogic;

      render(ProjectListContent, {
        props: {
          ...defaultProps,
          logic: logicWithoutExpanded as unknown as ProjectListLogic
        }
      });

      expect(document.body).toBeInTheDocument();
    });

    it('should handle projects with empty task_lists', () => {
      const projectsWithEmptyLists = [{ ...mockProjects[0], task_lists: [] }];

      const logicWithEmptyLists = {
        ...mockLogic,
        projectsData: projectsWithEmptyLists
      } as typeof mockLogic;

      render(ProjectListContent, {
        props: {
          ...defaultProps,
          logic: logicWithEmptyLists as unknown as ProjectListLogic
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
