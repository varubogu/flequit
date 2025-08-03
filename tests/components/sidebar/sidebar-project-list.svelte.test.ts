import { describe, test, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import { setTranslationService } from '$lib/stores/locale.svelte';
import { createUnitTestTranslationService } from '../../unit-translation-mock';
import SidebarProjectList from '$lib/components/sidebar/sidebar-project-list.svelte';
import { taskStore } from '$lib/stores/tasks.svelte';
import type { ProjectTree, TaskWithSubTasks } from '$lib/types/task';

// --- Sidebar Context Mock ---
vi.mock('$lib/components/ui/sidebar/context.svelte.js', () => ({
  useSidebar: () => ({
    state: 'expanded',
    open: true,
    isMobile: false,
    toggleSidebar: vi.fn(),
    setOpen: vi.fn()
  })
}));

// --- Store Mocks ---
vi.mock('$lib/stores/tasks.svelte', async (importOriginal) => {
  const { writable } = await import('svelte/store');
  const original = (await importOriginal()) as Record<string, unknown>;

  const taskStoreData = {
    projects: [],
    selectedProjectId: null,
    selectedListId: null
  };

  const tasksWritable = writable(taskStoreData);

  return {
    ...original,
    taskStore: {
      ...(original.taskStore || {}),
      subscribe: tasksWritable.subscribe,
      set: tasksWritable.set,
      update: tasksWritable.update,
      selectProject: vi.fn(),
      selectList: vi.fn(),
      projects: [],
      selectedProjectId: null,
      selectedListId: null
    }
  };
});

const mockTaskStore = vi.mocked(taskStore);

// --- Test Data ---
const mockProjects: ProjectTree[] = [
  {
    id: 'project-1',
    name: 'Work',
    color: '#ff0000',
    order_index: 0,
    is_archived: false,
    created_at: new Date(),
    updated_at: new Date(),
    task_lists: [
      {
        id: 'list-1',
        project_id: 'project-1',
        name: 'Frontend',
        order_index: 0,
        is_archived: false,
        created_at: new Date(),
        updated_at: new Date(),
        tasks: [{ id: 'task-1' } as TaskWithSubTasks, { id: 'task-2' } as TaskWithSubTasks]
      },
      {
        id: 'list-2',
        project_id: 'project-1',
        name: 'Backend',
        order_index: 1,
        is_archived: false,
        created_at: new Date(),
        updated_at: new Date(),
        tasks: [{ id: 'task-3' } as TaskWithSubTasks]
      }
    ]
  },
  {
    id: 'project-2',
    name: 'Personal',
    color: '#00ff00',
    order_index: 1,
    is_archived: false,
    created_at: new Date(),
    updated_at: new Date(),
    task_lists: []
  }
];

describe('SidebarProjectList Component', () => {
  let onViewChange: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    setTranslationService(createUnitTestTranslationService());
    onViewChange = vi.fn();
    vi.clearAllMocks();
    // Reset store state
    mockTaskStore.projects = [];
    mockTaskStore.selectedProjectId = null;
    mockTaskStore.selectedListId = null;
  });

  const setTaskStoreData = (data: {
    projects?: ProjectTree[];
    selectedProjectId?: string | null;
    selectedListId?: string | null;
  }) => {
    if (data.projects !== undefined) mockTaskStore.projects = data.projects;
    if (data.selectedProjectId !== undefined)
      mockTaskStore.selectedProjectId = data.selectedProjectId;
    if (data.selectedListId !== undefined) mockTaskStore.selectedListId = data.selectedListId;
  };

  test('should render projects section header', () => {
    render(SidebarProjectList, { onViewChange });
    expect(screen.getByText('TEST_PROJECTS')).toBeInTheDocument();
  });

  test('should render projects', () => {
    setTaskStoreData({ projects: mockProjects });
    render(SidebarProjectList, { onViewChange });

    expect(screen.getByText('Work')).toBeInTheDocument();
    expect(screen.getByText('Personal')).toBeInTheDocument();
  });

  test('should show "No projects yet" message when no projects', () => {
    setTaskStoreData({ projects: [] });
    render(SidebarProjectList, { onViewChange });
    expect(screen.getByText('TEST_NO_PROJECTS_YET')).toBeInTheDocument();
  });

  test('should select a project when clicked', async () => {
    setTaskStoreData({ projects: mockProjects });
    render(SidebarProjectList, { onViewChange });

    const projectButton = screen.getByText('Work');
    await fireEvent.click(projectButton);

    expect(mockTaskStore.selectProject).toHaveBeenCalledWith('project-1');
    expect(onViewChange).toHaveBeenCalledWith('project');
  });

  test('should expand and collapse project task lists', async () => {
    setTaskStoreData({ projects: mockProjects });
    render(SidebarProjectList, { onViewChange });

    const toggleButton = screen.getAllByTitle('TEST_TOGGLE_TASK_LISTS')[0];
    expect(screen.queryByText('Frontend')).not.toBeInTheDocument();

    await fireEvent.click(toggleButton);
    expect(await screen.findByText('Frontend')).toBeInTheDocument();
    expect(screen.getByText('Backend')).toBeInTheDocument();

    await fireEvent.click(toggleButton);
    expect(screen.queryByText('Frontend')).not.toBeInTheDocument();
  });

  test('should select a task list when clicked', async () => {
    setTaskStoreData({ projects: mockProjects });
    render(SidebarProjectList, { onViewChange });

    const toggleButton = screen.getAllByTitle('TEST_TOGGLE_TASK_LISTS')[0];
    await fireEvent.click(toggleButton);

    const listButton = await screen.findByText('Frontend');
    await fireEvent.click(listButton);

    expect(mockTaskStore.selectList).toHaveBeenCalledWith('list-1');
  });

  test('should display project names', () => {
    setTaskStoreData({ projects: mockProjects });
    render(SidebarProjectList, { onViewChange });

    expect(screen.getByText('Work')).toBeInTheDocument();
    expect(screen.getByText('Personal')).toBeInTheDocument();
  });

  test('should open context menu on project right-click', async () => {
    setTaskStoreData({ projects: mockProjects });
    render(SidebarProjectList, { onViewChange });

    // 現在の実装ではContextMenu.TriggerでButtonを囲んでいるため、Buttonに右クリックする
    const projectButton = screen.getByText('Work').closest('button');
    await fireEvent.contextMenu(projectButton!);

    // ContextMenuコンテンツが表示されることを確認
    await expect(screen.findByText('TEST_EDIT_PROJECT')).resolves.toBeInTheDocument();
    await expect(screen.findByText('TEST_ADD_TASK_LIST')).resolves.toBeInTheDocument();
    await expect(screen.findByText('TEST_DELETE_PROJECT')).resolves.toBeInTheDocument();
  });

  test('should highlight selected project', () => {
    setTaskStoreData({
      projects: mockProjects,
      selectedProjectId: 'project-1'
    });
    render(SidebarProjectList, { currentView: 'project', onViewChange });

    const workButton = screen.getByText('Work').closest('button');
    expect(workButton).toHaveClass('bg-secondary');
  });

  test('should not show toggle button for projects without task lists', () => {
    setTaskStoreData({ projects: mockProjects });
    render(SidebarProjectList, { onViewChange });

    const toggleButtons = screen.queryAllByTitle('TEST_TOGGLE_TASK_LISTS');
    expect(toggleButtons).toHaveLength(1);
  });
});
