import { describe, test, expect, beforeEach, afterEach, vi, type Mock } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import { setTranslationService } from '$lib/stores/locale.svelte';
import { createUnitTestTranslationService } from '../../unit-translation-mock';
import SidebarViewList from '$lib/components/sidebar/sidebar-view-list.svelte';
import { taskStore } from '$lib/stores/tasks.svelte';
import { type TaskWithSubTasks } from '$lib/types/task';
import { setupViewsVisibilityStoreOverride } from '../../utils/store-overrides';
import type { ViewsVisibilityStore } from '$lib/hooks/use-views-visibility-store.svelte';
import { MockViewsVisibilityStore } from '../../utils/mock-factories';
import { DragDropManager, type DragData } from '$lib/utils/drag-drop';
import { TaskOperations } from '$lib/services/domain/task';
import { subTaskOperations } from '$lib/services/domain/subtask';

const { sidebarStub } = vi.hoisted(() => ({
  sidebarStub: {
    state: 'expanded' as 'expanded' | 'collapsed',
    open: true,
    isMobile: false,
    toggleSidebar: () => {},
    setOpen: () => {}
  }
}));

// --- Sidebar Context Mock ---
vi.mock('$lib/components/ui/sidebar/context.svelte.js', () => ({
  useSidebar: () => sidebarStub
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

const mockTaskStore = vi.mocked(taskStore);

// Initialize mock store outside hoisted to avoid initialization errors
const mockViewsVisibilityStore = new MockViewsVisibilityStore({
  visible: [
    { id: 'allTasks', label: 'All Tasks', icon: '📝', visible: true, order: 0 },
    { id: 'today', label: 'Today', icon: '📅', visible: true, order: 1 },
    { id: 'overdue', label: 'Overdue', icon: '⚠️', visible: true, order: 2 }
  ]
});

describe('SidebarViewList Component', () => {
  let onViewChange: Mock;

  let cleanup: (() => void) | null = null;

  beforeEach(() => {
    setTranslationService(createUnitTestTranslationService());
    onViewChange = vi.fn();
    sidebarStub.state = 'expanded';
    vi.clearAllMocks();
    cleanup = setupViewsVisibilityStoreOverride(mockViewsVisibilityStore as ViewsVisibilityStore);
  });

  afterEach(() => {
    mockViewsVisibilityStore.setLists(
      [
        { id: 'allTasks', label: 'All Tasks', icon: '📝', visible: true, order: 0 },
        { id: 'today', label: 'Today', icon: '📅', visible: true, order: 1 },
        { id: 'overdue', label: 'Overdue', icon: '⚠️', visible: true, order: 2 }
      ],
      []
    );
    cleanup?.();
  });

  const setTaskStoreData = (data: {
    todayTasks?: TaskWithSubTasks[];
    overdueTasks?: TaskWithSubTasks[];
    allTasks?: TaskWithSubTasks[];
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
      allTasks: [{ id: '1' } as TaskWithSubTasks, { id: '2' } as TaskWithSubTasks],
      todayTasks: [{ id: '1' } as TaskWithSubTasks],
      overdueTasks: [{ id: '3' } as TaskWithSubTasks]
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

  test('hides the views heading when the sidebar is collapsed and ignores a click without a callback', async () => {
    sidebarStub.state = 'collapsed';
    render(SidebarViewList, { currentView: 'today' });

    expect(screen.queryByText('TEST_VIEWS')).not.toBeInTheDocument();
    await fireEvent.click(screen.getByTestId('view-today'));
    expect(onViewChange).not.toHaveBeenCalled();
  });

  test('counts tomorrow, upcoming, monthly, completed, and unknown views from task dates', () => {
    const now = new Date();
    const shiftDays = (days: number, hour: number) => {
      const date = new Date(now);
      date.setDate(date.getDate() + days);
      date.setHours(hour, 0, 0, 0);
      return date;
    };
    const tomorrow = shiftDays(1, 12);
    const inTwoDays = shiftDays(2, 12);
    const inFiveDays = shiftDays(5, 12);
    const inEightDays = shiftDays(8, 12);
    const soon = new Date(now.getTime() + 60 * 60 * 1000);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const thisMonthCount = [tomorrow, inTwoDays, inFiveDays, inEightDays, soon].filter(
      (due) => due >= now && due <= endOfMonth
    ).length;

    mockViewsVisibilityStore.setLists(
      [
        { id: 'allTasks', label: 'All Tasks', icon: '📝', visible: true, order: 0 },
        { id: 'tomorrow', label: 'Tomorrow', icon: '🌅', visible: true, order: 1 },
        { id: 'next3days', label: 'Next 3', icon: '3️⃣', visible: true, order: 2 },
        { id: 'nextweek', label: 'Next Week', icon: '7️⃣', visible: true, order: 3 },
        { id: 'thismonth', label: 'This Month', icon: '📆', visible: true, order: 4 },
        { id: 'completed', label: 'Completed', icon: '✅', visible: true, order: 5 },
        { id: 'custom', label: 'Custom', icon: '✦', visible: true, order: 6 }
      ],
      []
    );

    const tasks = [
      { id: 'tomorrow', status: 'not_started', planEndDate: tomorrow },
      { id: 'done-tomorrow', status: 'completed', planEndDate: tomorrow },
      { id: 'no-date', status: 'not_started' },
      { id: 'yesterday', status: 'not_started', planEndDate: shiftDays(-1, 12) },
      { id: 'in-two-days', status: 'not_started', planEndDate: inTwoDays },
      { id: 'in-five-days', status: 'not_started', planEndDate: inFiveDays },
      { id: 'in-eight-days', status: 'not_started', planEndDate: inEightDays },
      { id: 'done', status: 'completed', planEndDate: inTwoDays },
      { id: 'soon', status: 'not_started', planEndDate: soon }
    ] as TaskWithSubTasks[];
    setTaskStoreData({ allTasks: tasks, todayTasks: [], overdueTasks: [] });

    render(SidebarViewList, { onViewChange });

    const countFor = (label: string) =>
      screen.getByText(label).closest('button')?.querySelector('.ml-auto')?.textContent;

    expect(countFor('All Tasks')).toBe('9');
    expect(countFor('Tomorrow')).toBe('1');
    expect(countFor('Next 3')).toBe('3');
    expect(countFor('Next Week')).toBe('4');
    expect(countFor('This Month')).toBe(String(thisMonthCount));
    expect(countFor('Completed')).toBe('2');
    expect(countFor('Custom')).toBe('0');
  });

  test('routes a dropped task or subtask to the matching due-date update and ignores other payloads', async () => {
    const updateTaskDueDate = vi
      .spyOn(TaskOperations.prototype, 'updateTaskDueDateForView')
      .mockResolvedValue(undefined);
    const updateSubTaskDueDate = vi.mocked(subTaskOperations.updateSubTaskDueDateForView);

    render(SidebarViewList, { onViewChange });
    const region = screen.getByTestId('view-today').parentElement;
    expect(region).not.toBeNull();

    const drop = async (data: DragData) => {
      const dataTransfer = {
        effectAllowed: '',
        dropEffect: '',
        setData: vi.fn(),
        getData: vi.fn(() => '')
      };
      DragDropManager.startDrag({ dataTransfer, target: region } as unknown as DragEvent, data);
      await fireEvent.drop(region!);
    };

    await drop({ type: 'task', id: 'task-9' });
    expect(updateTaskDueDate).toHaveBeenCalledWith('task-9', 'today');

    await drop({ type: 'subtask', id: 'sub-2', taskId: 'task-9' });
    expect(updateSubTaskDueDate).toHaveBeenCalledWith('sub-2', 'task-9', 'today');

    updateTaskDueDate.mockClear();
    updateSubTaskDueDate.mockClear();
    await drop({ type: 'subtask', id: 'sub-orphan' });
    await drop({ type: 'tag', id: 'tag-1' });
    expect(updateTaskDueDate).not.toHaveBeenCalled();
    expect(updateSubTaskDueDate).not.toHaveBeenCalled();

    DragDropManager.handleDragEnd({ target: region } as unknown as DragEvent);
    updateTaskDueDate.mockRestore();
  });
});
