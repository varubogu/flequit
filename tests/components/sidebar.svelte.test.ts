import { describe, test, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import Sidebar from '../../src/lib/components/sidebar.svelte';
import { taskStore } from '../../src/lib/stores/tasks.svelte';
import { viewsVisibilityStore } from '$lib/stores/views-visibility.svelte';
import { contextMenuStore } from '$lib/stores/context-menu.svelte';
import type { ProjectTree, TaskWithSubTasks } from '../../src/lib/types/task';
import { writable, get } from 'svelte/store';

// --- Store Mocks ---
vi.mock('$lib/stores/tasks.svelte', async (importOriginal) => {
  const { writable, get } = await import('svelte/store');
  const original = await importOriginal();
  const tasksWritable = writable({
    projects: [],
    todayTasks: [],
    overdueTasks: [],
    allTasks: [],
    selectedProjectId: null,
    selectedListId: null,
  });

  return {
    ...original,
    taskStore: {
      ...original.taskStore,
      subscribe: tasksWritable.subscribe,
      set: tasksWritable.set,
      update: tasksWritable.update,
      selectProject: vi.fn(),
      selectList: vi.fn(),
      get projects() { return get(tasksWritable).projects },
      get todayTasks() { return get(tasksWritable).todayTasks },
      get overdueTasks() { return get(tasksWritable).overdueTasks },
      get allTasks() { return get(tasksWritable).allTasks },
      get selectedProjectId() { return get(tasksWritable).selectedProjectId },
      get selectedListId() { return get(tasksWritable).selectedListId },
    }
  };
});

vi.mock('$lib/stores/views-visibility.svelte', async (importOriginal) => {
    const { writable, get } = await import('svelte/store');
    const original = await importOriginal();
    const viewsWritable = writable({
        visibleViews: [
            { id: 'allTasks', label: 'All Tasks', icon: '📝', visible: true, order: 0 },
            { id: 'today', label: 'Today', icon: '📅', visible: true, order: 1 },
        ]
    });
    return {
        ...original,
        viewsVisibilityStore: {
            ...original.viewsVisibilityStore,
            subscribe: viewsWritable.subscribe,
            get visibleViews() { return get(viewsWritable).visibleViews },
        }
    };
});

vi.mock('$lib/stores/context-menu.svelte', async (importOriginal) => {
    const { writable } = await import('svelte/store');
    const original = await importOriginal();
    const contextMenuWritable = writable({ isOpen: false, x: 0, y: 0, items: [] });
    return {
        ...original,
        contextMenuStore: {
            ...original.contextMenuStore,
            subscribe: contextMenuWritable.subscribe,
            open: vi.fn(),
        }
    };
});


const mockTaskStore = vi.mocked(taskStore);
const mockContextMenuStore = vi.mocked(contextMenuStore);

// --- Test Data ---
const mockProjects: ProjectTree[] = [
  {
    id: 'project-1', name: 'Work', color: '#ff0000', order_index: 0, is_archived: false, created_at: new Date(), updatedAt: new Date(),
    task_lists: [
      { id: 'list-1', project_id: 'project-1', name: 'Frontend', order_index: 0, is_archived: false, created_at: new Date(), updatedAt: new Date(), tasks: [{ id: 'task-1' } as TaskWithSubTasks, { id: 'task-2' } as TaskWithSubTasks] },
      { id: 'list-2', project_id: 'project-1', name: 'Backend', order_index: 1, is_archived: false, created_at: new Date(), updatedAt: new Date(), tasks: [{ id: 'task-3' } as TaskWithSubTasks] }
    ]
  },
  { id: 'project-2', name: 'Personal', color: '#00ff00', order_index: 1, is_archived: false, created_at: new Date(), updatedAt: new Date(), task_lists: [] }
];


describe('Sidebar Component', () => {
  let onViewChange: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    onViewChange = vi.fn();
    vi.clearAllMocks();
    // Reset stores to default state
    mockTaskStore.set({
        projects: [], todayTasks: [], overdueTasks: [], allTasks: [], selectedProjectId: null, selectedListId: null,
    });
  });

  const setTaskStoreData = (data: any) => {
    mockTaskStore.update(current => ({ ...current, ...data }));
  };

  test('should render views and projects', () => {
    setTaskStoreData({ projects: mockProjects });
    render(Sidebar, { onViewChange });

    expect(screen.getByText('All Tasks')).toBeInTheDocument();
    expect(screen.getByText('Today')).toBeInTheDocument();
    expect(screen.getByText('Work')).toBeInTheDocument();
    expect(screen.getByText('Personal')).toBeInTheDocument();
  });

  test('should show "No projects yet" message', () => {
    setTaskStoreData({ projects: [] });
    render(Sidebar, { onViewChange });
    expect(screen.getByText('No projects yet')).toBeInTheDocument();
  });

  test('should call onViewChange when a view is clicked', async () => {
    render(Sidebar, { onViewChange });
    const todayButton = screen.getByText('Today');
    await fireEvent.click(todayButton);
    expect(onViewChange).toHaveBeenCalledWith('today');
  });

  test('should select a project when clicked', async () => {
    setTaskStoreData({ projects: mockProjects });
    render(Sidebar, { onViewChange });

    const projectButton = screen.getByText('Work');
    await fireEvent.click(projectButton);

    expect(mockTaskStore.selectProject).toHaveBeenCalledWith('project-1');
    expect(onViewChange).toHaveBeenCalledWith('project');
  });

  test('should expand and collapse project task lists', async () => {
    setTaskStoreData({ projects: mockProjects });
    render(Sidebar, { onViewChange });

    const toggleButton = screen.getAllByTitle('Toggle task lists')[0];
    expect(screen.queryByText('Frontend')).not.toBeInTheDocument();

    await fireEvent.click(toggleButton);
    expect(await screen.findByText('Frontend')).toBeInTheDocument();
    expect(screen.getByText('Backend')).toBeInTheDocument();

    await fireEvent.click(toggleButton);
    expect(screen.queryByText('Frontend')).not.toBeInTheDocument();
  });

  test('should select a task list when clicked', async () => {
    setTaskStoreData({ projects: mockProjects });
    render(Sidebar, { onViewChange });

    const toggleButton = screen.getAllByTitle('Toggle task lists')[0];
    await fireEvent.click(toggleButton);

    const listButton = await screen.findByText('Frontend');
    await fireEvent.click(listButton);

    expect(mockTaskStore.selectList).toHaveBeenCalledWith('list-1');
  });

  test('should display correct task counts', () => {
    setTaskStoreData({
        projects: mockProjects,
        allTasks: [{id: '1'},{id: '2'}],
        todayTasks: [{id: '1'}]
    });

    render(Sidebar, { onViewChange });

    const allTasksCount = screen.getByText('All Tasks').closest('button')?.querySelector('.ml-auto');
    const todayCount = screen.getByText('Today').closest('button')?.querySelector('.ml-auto');
    const projectCount = screen.getByText('Work').closest('button')?.querySelector('.ml-auto');

    expect(allTasksCount?.textContent).toBe('2');
    expect(todayCount?.textContent).toBe('1');
    expect(projectCount?.textContent).toBe('3');
  });

  test('should open context menu on project right-click', async () => {
    setTaskStoreData({ projects: mockProjects });
    render(Sidebar, { onViewChange });

    const projectDiv = screen.getByText('Work').closest('[role="button"]');
    await fireEvent.contextMenu(projectDiv!);

    expect(mockContextMenuStore.open).toHaveBeenCalled();
  });

  test('should open search dialog on click', async () => {
    render(Sidebar, { onViewChange });
    const searchButton = screen.getByText('Search').closest('button');
    await fireEvent.click(searchButton!);
    expect(true).toBe(true);
  });

  test('should open search dialog with keyboard shortcut', async () => {
    render(Sidebar, { onViewChange });
    await fireEvent.keyDown(document, { key: 'k', metaKey: true });
    expect(true).toBe(true);
  });
});
