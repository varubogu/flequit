import { describe, test, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import { setTranslationService } from '$lib/stores/locale.svelte';
import { createUnitTestTranslationService } from '../../unit-translation-mock';
import TaskListDisplay from '$lib/components/task/core/task-list-display.svelte';
import { taskStore } from '$lib/stores/tasks.svelte';
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

// --- Store Mocks ---
vi.mock('$lib/stores/tasks.svelte', async (importOriginal) => {
  const { writable } = await import('svelte/store');
  const original = (await importOriginal()) as Record<string, unknown>;
  const tasksWritable = writable({
    projects: [],
    selectedListId: null
  });

  return {
    ...original,
    taskStore: {
      ...(original.taskStore || {}),
      subscribe: tasksWritable.subscribe,
      set: tasksWritable.set,
      update: tasksWritable.update,
      selectedListId: null,
      projects: []
    }
  };
});

vi.mock('$lib/stores/selection-store.svelte', () => {
  class MockSelectionStore {
    selectList = vi.fn();
    selectProject = vi.fn();
    selectTask = vi.fn();
    selectSubTask = vi.fn();
  }

  return {
    SelectionStore: MockSelectionStore,
    selectionStore: new MockSelectionStore()
  };
});

vi.mock('$lib/stores/task-list-store.svelte', () => {
  class MockTaskListStore {
    addTaskList = vi.fn();
    updateTaskList = vi.fn();
    deleteTaskList = vi.fn();
    moveTaskListToPosition = vi.fn();
  }

  return {
    TaskListStore: MockTaskListStore,
    taskListStore: new MockTaskListStore()
  };
});

const mockTaskStore = vi.mocked(taskStore);
const mockSelectionStore = vi.mocked(await import('$lib/stores/selection-store.svelte').then(m => m.selectionStore));

// --- Test Data ---
const mockProject: ProjectTree = {
  id: 'project-1',
  name: 'Work',
  color: '#ff0000',
  orderIndex: 0,
  isArchived: false,
  createdAt: new Date(),
  updatedAt: new Date(),
  taskLists: [
    {
      id: 'list-1',
      projectId: 'project-1',
      name: 'Frontend',
      orderIndex: 0,
      isArchived: false,
      createdAt: new Date(),
      updatedAt: new Date(),
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
      tasks: [{ id: 'task-3' } as TaskWithSubTasks]
    }
  ]
};

describe('TaskListDisplay Component', () => {
  beforeEach(() => {
    setTranslationService(createUnitTestTranslationService());
    vi.clearAllMocks();
    mockTaskStore.selectedListId = null;
    mockTaskStore.projects = [mockProject];
  });

  const setTaskStoreData = (data: { selectedListId?: string | null }) => {
    if (data.selectedListId !== undefined) mockTaskStore.selectedListId = data.selectedListId;
  };

  test('should not render anything when not expanded', () => {
    render(TaskListDisplay, {
      project: mockProject,
      isExpanded: false
    });

    expect(screen.queryByText('Frontend')).not.toBeInTheDocument();
    expect(screen.queryByText('Backend')).not.toBeInTheDocument();
  });

  test('should render task lists when expanded', () => {
    render(TaskListDisplay, {
      project: mockProject,
      isExpanded: true
    });

    expect(screen.getByText('Frontend')).toBeInTheDocument();
    expect(screen.getByText('Backend')).toBeInTheDocument();
  });

  test('should display correct task counts for each list', () => {
    render(TaskListDisplay, {
      project: mockProject,
      isExpanded: true
    });

    const frontendButton = screen.getByText('Frontend').closest('button');
    const backendButton = screen.getByText('Backend').closest('button');

    expect(frontendButton?.textContent).toContain('2');
    expect(backendButton?.textContent).toContain('1');
  });

  test('should call selectList when task list is clicked', async () => {
    render(TaskListDisplay, {
      project: mockProject,
      isExpanded: true
    });

    const frontendButton = screen.getByText('Frontend');
    await fireEvent.click(frontendButton);

    expect(mockSelectionStore.selectList).toHaveBeenCalledWith('list-1');
  });

  test('should highlight selected task list', () => {
    setTaskStoreData({ selectedListId: 'list-1' });

    render(TaskListDisplay, {
      project: mockProject,
      isExpanded: true,
      currentView: 'tasklist' as const
    });

    const frontendButton = screen.getByTestId('tasklist-list-1');
    const backendButton = screen.getByTestId('tasklist-list-2');

    // 選択中のタスクリストは強調クラスが付与される
    expect(frontendButton).toHaveClass('bg-primary/20', 'border-2', 'border-primary', 'shadow-md', 'shadow-primary/40', 'text-foreground');
    expect(backendButton).not.toHaveClass('bg-primary/20', 'border-2', 'border-primary', 'shadow-md', 'shadow-primary/40', 'text-foreground');
  });

  test('should open context menu on right-click', async () => {
    render(TaskListDisplay, {
      project: mockProject,
      isExpanded: true
    });

    // 現在の実装ではContextMenu.TriggerでButtonを囲んでいるため、Buttonに右クリックする
    const frontendButton = screen.getByText('Frontend').closest('button');
    await fireEvent.contextMenu(frontendButton!);

    // ContextMenuコンテンツが表示されることを確認
    // bits-uiのContextMenuは右クリック時に自動的にメニューを表示する
    await expect(screen.findByText('TEST_EDIT_TASK_LIST')).resolves.toBeInTheDocument();
    await expect(screen.findByText('TEST_ADD_TASK')).resolves.toBeInTheDocument();
    await expect(screen.findByText('TEST_DELETE_TASK_LIST')).resolves.toBeInTheDocument();
  });

  test('should render empty list when project has no task lists', () => {
    const emptyProject = { ...mockProject, taskLists: [] } as ProjectTree;

    // currentProject参照のため、ストアにも同じプロジェクトを反映
    setTaskStoreData({});
    mockTaskStore.projects = [emptyProject];

    render(TaskListDisplay, {
      project: emptyProject,
      isExpanded: true
    });

    expect(screen.queryByText('Frontend')).not.toBeInTheDocument();
    expect(screen.queryByText('Backend')).not.toBeInTheDocument();
  });

  test('should handle task list with zero tasks', () => {
    const projectWithEmptyList: ProjectTree = {
      ...mockProject,
      taskLists: [
        {
          id: 'empty-list',
          projectId: 'project-1',
          name: 'Empty List',
          orderIndex: 0,
          isArchived: false,
          createdAt: new Date(),
          updatedAt: new Date(),
          tasks: []
        }
      ]
    } as ProjectTree;

    // ストアにも反映
    setTaskStoreData({});
    mockTaskStore.projects = [projectWithEmptyList];

    render(TaskListDisplay, {
      project: projectWithEmptyList,
      isExpanded: true
    });

    const emptyListButton = screen.getByTestId('tasklist-empty-list');
    expect(emptyListButton.textContent).toContain('0');
  });
});
