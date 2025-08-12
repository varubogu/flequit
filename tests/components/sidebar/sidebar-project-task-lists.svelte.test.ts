import { describe, test, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import { setTranslationService } from '$lib/stores/locale.svelte';
import { createUnitTestTranslationService } from '../../unit-translation-mock';
import TaskListDisplay from '$lib/components/task/task-list-display.svelte';
import { taskStore } from '$lib/stores/tasks.svelte';
import type { TaskWithSubTasks } from '$lib/types/task';
import type { ProjectTree } from "$lib/types/project";

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
    selectedListId: null
  });

  return {
    ...original,
    taskStore: {
      ...(original.taskStore || {}),
      subscribe: tasksWritable.subscribe,
      set: tasksWritable.set,
      update: tasksWritable.update,
      selectList: vi.fn(),
      selectedListId: null
    }
  };
});

const mockTaskStore = vi.mocked(taskStore);

// --- Test Data ---
const mockProject: ProjectTree = {
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
};

describe('TaskListDisplay Component', () => {
  beforeEach(() => {
    setTranslationService(createUnitTestTranslationService());
    vi.clearAllMocks();
    mockTaskStore.selectedListId = null;
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

    expect(mockTaskStore.selectList).toHaveBeenCalledWith('list-1');
  });

  test('should highlight selected task list', () => {
    setTaskStoreData({ selectedListId: 'list-1' });

    render(TaskListDisplay, {
      project: mockProject,
      isExpanded: true
    });

    const frontendButton = screen.getByText('Frontend').closest('button');
    const backendButton = screen.getByText('Backend').closest('button');

    expect(frontendButton).toHaveClass('bg-secondary');
    expect(backendButton).not.toHaveClass('bg-secondary');
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
    const emptyProject = { ...mockProject, task_lists: [] };

    render(TaskListDisplay, {
      project: emptyProject,
      isExpanded: true
    });

    expect(screen.queryByText('Frontend')).not.toBeInTheDocument();
    expect(screen.queryByText('Backend')).not.toBeInTheDocument();
  });

  test('should handle task list with zero tasks', () => {
    const projectWithEmptyList = {
      ...mockProject,
      task_lists: [
        {
          id: 'empty-list',
          project_id: 'project-1',
          name: 'Empty List',
          order_index: 0,
          is_archived: false,
          created_at: new Date(),
          updated_at: new Date(),
          tasks: []
        }
      ]
    };

    render(TaskListDisplay, {
      project: projectWithEmptyList,
      isExpanded: true
    });

    const emptyListButton = screen.getByText('Empty List').closest('button');
    expect(emptyListButton?.textContent).toContain('0');
  });
});
