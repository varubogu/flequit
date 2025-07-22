import { describe, test, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import SidebarViewList from '../../src/lib/components/sidebar-view-list.svelte';
import { taskStore } from '../../src/lib/stores/tasks.svelte';
import { viewsVisibilityStore } from '$lib/stores/views-visibility.svelte';
import { writable, get } from 'svelte/store';

// --- Store Mocks ---
vi.mock('$lib/stores/tasks.svelte', async (importOriginal) => {
  const { writable, get } = await import('svelte/store');
  const original = await importOriginal();
  const tasksWritable = writable({
    todayTasks: [],
    overdueTasks: [],
    allTasks: [],
  });

  return {
    ...original,
    taskStore: {
      ...original.taskStore,
      subscribe: tasksWritable.subscribe,
      set: tasksWritable.set,
      update: tasksWritable.update,
      get todayTasks() { return get(tasksWritable).todayTasks },
      get overdueTasks() { return get(tasksWritable).overdueTasks },
      get allTasks() { return get(tasksWritable).allTasks },
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
            { id: 'overdue', label: 'Overdue', icon: '⚠️', visible: true, order: 2 },
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

const mockTaskStore = vi.mocked(taskStore);

describe('SidebarViewList Component', () => {
  let onViewChange: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    onViewChange = vi.fn();
    vi.clearAllMocks();
    mockTaskStore.set({
        todayTasks: [],
        overdueTasks: [],
        allTasks: [],
    });
  });

  const setTaskStoreData = (data: any) => {
    mockTaskStore.update(current => ({ ...current, ...data }));
  };

  test('should render views section header', () => {
    render(SidebarViewList, { onViewChange });
    expect(screen.getByText('Views')).toBeInTheDocument();
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
        allTasks: [{id: '1'},{id: '2'}],
        todayTasks: [{id: '1'}],
        overdueTasks: [{id: '3'}]
    });

    render(SidebarViewList, { onViewChange });

    const allTasksCount = screen.getByText('All Tasks').closest('button')?.querySelector('.ml-auto');
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