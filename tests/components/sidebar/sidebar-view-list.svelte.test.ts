import { describe, test, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import { createUnitTestTranslationService } from '../../unit-translation-mock';
import SidebarViewList from '$lib/components/sidebar/sidebar-view-list.svelte';
import { taskStore } from '$lib/stores/tasks.svelte';

// getTranslationServiceのモック化
vi.mock('$lib/stores/locale.svelte', async () => {
  const actual = await vi.importActual('$lib/stores/locale.svelte');
  return {
    ...actual,
    getTranslationService: vi.fn(() => createUnitTestTranslationService()),
    reactiveMessage: (fn: () => string) => fn
  };
});

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
  const original = (await importOriginal()) as Record<string, unknown>;

  return {
    ...original,
    taskStore: {
      projects: [],
      selectedTaskId: null,
      selectedSubTaskId: null,
      selectedProjectId: null,
      selectedListId: null,
      isNewTaskMode: false,
      newTaskData: null,
      pendingTaskSelection: null,
      pendingSubTaskSelection: null,
      get todayTasks() {
        return [];
      },
      get overdueTasks() {
        return [];
      },
      get allTasks() {
        return [];
      },
      get selectedTask() {
        return null;
      },
      get selectedSubTask() {
        return null;
      },
      getTaskById: () => null
    }
  };
});

vi.mock('$lib/stores/views-visibility.svelte', async (importOriginal) => {
  const { writable, get } = await import('svelte/store');
  const original = (await importOriginal()) as Record<string, unknown>;
  const viewsWritable = writable({
    visibleViews: [
      { id: 'allTasks', label: 'All Tasks', icon: '📝', visible: true, order: 0 },
      { id: 'today', label: 'Today', icon: '📅', visible: true, order: 1 },
      { id: 'overdue', label: 'Overdue', icon: '⚠️', visible: true, order: 2 }
    ]
  });
  return {
    ...original,
    viewsVisibilityStore: {
      ...(original.viewsVisibilityStore || {}),
      subscribe: viewsWritable.subscribe,
      get visibleViews() {
        return get(viewsWritable).visibleViews;
      }
    }
  };
});

const mockTaskStore = vi.mocked(taskStore);

describe('SidebarViewList Component', () => {
  let onViewChange: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    onViewChange = vi.fn();
    vi.clearAllMocks();
  });

  const setTaskStoreData = (data: {
    todayTasks?: unknown[];
    overdueTasks?: unknown[];
    allTasks?: unknown[];
  }) => {
    if (data.todayTasks !== undefined) {
      vi.spyOn(mockTaskStore, 'todayTasks', 'get').mockReturnValue(data.todayTasks);
    }
    if (data.overdueTasks !== undefined) {
      vi.spyOn(mockTaskStore, 'overdueTasks', 'get').mockReturnValue(data.overdueTasks);
    }
    if (data.allTasks !== undefined) {
      vi.spyOn(mockTaskStore, 'allTasks', 'get').mockReturnValue(data.allTasks);
    }
  };

  test('should render views section header', () => {
    render(SidebarViewList, { onViewChange });
    expect(screen.getByText('TEST_VIEWS')).toBeInTheDocument();
  });

  test('should render all visible views', () => {
    render(SidebarViewList, { onViewChange });
    expect(screen.getByText('All Tasks')).toBeInTheDocument();
    expect(screen.getByText('Today')).toBeInTheDocument();
    expect(screen.getByText('Overdue')).toBeInTheDocument();
  });

  test('should call onViewChange when a view is clicked', async () => {
    render(SidebarViewList, { onViewChange });
    const todayButton = screen.getByText('Today');
    await fireEvent.click(todayButton);
    expect(onViewChange).toHaveBeenCalledWith('today');
  });

  test('should display correct task counts', () => {
    setTaskStoreData({
      allTasks: [{ id: '1' }, { id: '2' }],
      todayTasks: [{ id: '1' }],
      overdueTasks: [{ id: '3' }]
    });

    render(SidebarViewList, { onViewChange });

    const allTasksCount = screen
      .getByText('All Tasks')
      .closest('button')
      ?.querySelector('.ml-auto');
    const todayCount = screen.getByText('Today').closest('button')?.querySelector('.ml-auto');
    const overdueCount = screen.getByText('Overdue').closest('button')?.querySelector('.ml-auto');

    expect(allTasksCount?.textContent).toBe('2');
    expect(todayCount?.textContent).toBe('1');
    expect(overdueCount?.textContent).toBe('1');
  });

  test('should highlight active view', () => {
    render(SidebarViewList, { currentView: 'today', onViewChange });
    const todayButton = screen.getByText('Today').closest('button');
    expect(todayButton).toHaveClass('bg-muted');
  });

  test('should not highlight inactive views', () => {
    render(SidebarViewList, { currentView: 'today', onViewChange });
    const allTasksButton = screen.getByText('All Tasks').closest('button');
    expect(allTasksButton).not.toHaveClass('bg-muted');
  });
});
