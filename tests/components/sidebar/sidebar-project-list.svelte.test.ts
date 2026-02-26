import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import { tick } from 'svelte';
import { setTranslationService } from '$lib/stores/locale.svelte';
import { createUnitTestTranslationService } from '../../unit-translation-mock';
import SidebarProjectList from '$lib/components/sidebar/sidebar-project-list.svelte';
import { projectStore } from '$lib/stores/project-store.svelte';
import { taskCoreStore } from '$lib/stores/task-core-store.svelte';
import { selectionStore } from '$lib/stores/selection-store.svelte';
import type { TaskWithSubTasks } from '$lib/types/task';
import type { ProjectTree } from '$lib/types/project';

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

// --- Test Data ---
const mockProjects: ProjectTree[] = [
  {
    id: 'project-1',
    name: 'Work',
    color: '#ff0000',
    orderIndex: 0,
    isArchived: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    deleted: false,
    updatedBy: 'test-user-id',
    taskLists: [
      {
        id: 'list-1',
        projectId: 'project-1',
        name: 'Frontend',
        orderIndex: 0,
        isArchived: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        deleted: false,
        updatedBy: 'test-user-id',
        tasks: [{ id: 'task-1' } as TaskWithSubTasks, { id: 'task-2' } as TaskWithSubTasks]
      },
      {
        id: 'list-2',
        projectId: 'project-1',
        name: 'Backend',
        orderIndex: 1,
        isArchived: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        deleted: false,
        updatedBy: 'test-user-id',
        tasks: [{ id: 'task-3' } as TaskWithSubTasks]
      }
    ]
  },
  {
    id: 'project-2',
    name: 'Personal',
    color: '#00ff00',
    orderIndex: 1,
    isArchived: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    deleted: false,
    updatedBy: 'test-user-id',
    taskLists: []
  }
];

describe('SidebarProjectList Component', () => {
  let onViewChange: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    setTranslationService(createUnitTestTranslationService());
    onViewChange = vi.fn();
    vi.clearAllMocks();
    projectStore.reset();
    selectionStore.reset();
    taskCoreStore.setProjects([]);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    projectStore.reset();
    selectionStore.reset();
    taskCoreStore.setProjects([]);
  });

  const cloneProjects = (projects: ProjectTree[]): ProjectTree[] =>
    projects.map((project) => ({
      ...project,
      taskLists: project.taskLists.map((list) => ({
        ...list,
        tasks: [...list.tasks]
      }))
    }));

  const setProjectState = (data: {
    projects?: ProjectTree[];
    selectedProjectId?: string | null;
    selectedListId?: string | null;
  }) => {
    if (data.projects !== undefined) {
      const cloned = cloneProjects(data.projects);
      projectStore.setProjects(cloned);
      taskCoreStore.setProjects(projectStore.projects);
    }
    if (data.selectedProjectId !== undefined) {
      selectionStore.selectProject(data.selectedProjectId);
    }
    if (data.selectedListId !== undefined) {
      selectionStore.selectList(data.selectedListId);
    }
  };

  test('should render projects section header', () => {
    render(SidebarProjectList, { onViewChange });
    expect(screen.getByText('TEST_PROJECTS')).toBeInTheDocument();
  });

  test('should render projects', () => {
    setProjectState({ projects: mockProjects });
    render(SidebarProjectList, { onViewChange });

    expect(screen.getByText('Work')).toBeInTheDocument();
    expect(screen.getByText('Personal')).toBeInTheDocument();
  });

  test('should show "No projects yet" message when no projects', () => {
    setProjectState({ projects: [] });
    render(SidebarProjectList, { onViewChange });
    expect(screen.getByText('TEST_NO_PROJECTS_YET')).toBeInTheDocument();
  });

  test('should select a project when clicked', async () => {
    setProjectState({ projects: mockProjects });
    const selectProjectSpy = vi.spyOn(selectionStore, 'selectProject');
    selectProjectSpy.mockClear();
    render(SidebarProjectList, { onViewChange });

    const projectButton = screen.getByText('Work');
    await fireEvent.click(projectButton);

    expect(selectProjectSpy).toHaveBeenCalledWith('project-1');
    expect(onViewChange).toHaveBeenCalledWith('project');
  });

  test('should expand and collapse project task lists', async () => {
    setProjectState({ projects: mockProjects });
    render(SidebarProjectList, { onViewChange });

    const toggleButton = screen.getByTestId('toggle-project-project-1');

    // 初期状態では TaskList が表示されていないことを確認
    expect(screen.queryByTestId('tasklist-list-1')).not.toBeInTheDocument();

    // トグルボタンをクリックして展開
    await fireEvent.click(toggleButton);
    // Svelteの更新サイクルを待つ
    await tick();

    // TaskList が表示されることを確認（data-testidで検索）
    expect(await screen.findByTestId('tasklist-list-1')).toBeInTheDocument();
    expect(screen.getByTestId('tasklist-list-2')).toBeInTheDocument();

    // 再度クリックして折りたたみ
    await fireEvent.click(toggleButton);
    await tick();
    expect(screen.queryByTestId('tasklist-list-1')).not.toBeInTheDocument();
  });

  test('should select a task list when clicked', async () => {
    setProjectState({ projects: mockProjects });
    const selectListSpy = vi.spyOn(selectionStore, 'selectList');
    selectListSpy.mockClear();
    render(SidebarProjectList, { onViewChange });

    const toggleButton = screen.getByTestId('toggle-project-project-1');
    await fireEvent.click(toggleButton);
    await tick();

    const listButton = await screen.findByTestId('tasklist-list-1');
    await fireEvent.click(listButton);

    expect(selectListSpy).toHaveBeenCalledWith('list-1');
  });

  test('should display project names', () => {
    setProjectState({ projects: mockProjects });
    render(SidebarProjectList, { onViewChange });

    expect(screen.getByText('Work')).toBeInTheDocument();
    expect(screen.getByText('Personal')).toBeInTheDocument();
  });

  test('should open context menu on project right-click', async () => {
    setProjectState({ projects: mockProjects });
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
    setProjectState({
      projects: mockProjects,
      selectedProjectId: 'project-1'
    });
    render(SidebarProjectList, { currentView: 'project', onViewChange });

    const workButton = screen.getByText('Work').closest('button');
    expect(workButton).toHaveClass(
      'bg-primary/20',
      'border-2',
      'border-primary',
      'shadow-md',
      'shadow-primary/40',
      'text-foreground'
    );
  });

  test('should not show toggle button for projects without task lists', () => {
    setProjectState({ projects: mockProjects });
    render(SidebarProjectList, { onViewChange });

    const toggleButtons = screen.queryAllByTestId(/toggle-project-/);
    expect(toggleButtons).toHaveLength(1);
  });
});
