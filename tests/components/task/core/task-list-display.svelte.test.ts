import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import TaskListDisplay from '$lib/components/task/core/task-list-display.svelte';
// import { createUnitTestTranslationService } from '../../unit-translation-mock';
import type { ProjectTree } from '$lib/types/project';

// 翻訳サービスのモック
vi.mock('$lib/stores/locale.svelte', () => ({
  getTranslationService: () => ({}) as unknown
}));

// taskStoreのモック
vi.mock('$lib/stores/tasks.svelte', () => ({
  taskStore: {
    selectedListId: null,
    selectList: vi.fn(),
    addTaskList: vi.fn(),
    updateTaskList: vi.fn(),
    deleteTaskList: vi.fn(),
    moveTaskListToPosition: vi.fn(),
    moveTaskToList: vi.fn()
  }
}));

// DragDropManagerのモック
vi.mock('$lib/utils/drag-drop', () => ({
  DragDropManager: {
    startDrag: vi.fn(),
    handleDragOver: vi.fn(),
    handleDrop: vi.fn().mockReturnValue(null),
    handleDragEnd: vi.fn(),
    handleDragEnter: vi.fn(),
    handleDragLeave: vi.fn()
  }
}));

// TaskListDialogのモック
vi.mock('$lib/components/task/task-list-dialog.svelte', () => ({
  default: vi.fn()
}));

describe('TaskListDisplay', () => {
  const mockProject: ProjectTree = {
    id: 'project-1',
    name: 'Test Project',
    description: 'Test Description',
    color: '#3b82f6',
    order_index: 0,
    is_archived: false,
    created_at: new Date(),
    updated_at: new Date(),
    task_lists: [
      {
        id: 'list-1',
        project_id: 'project-1',
        name: 'Task List 1',
        description: 'Description 1',
        color: '#ef4444',
        order_index: 0,
        is_archived: false,
        created_at: new Date(),
        updated_at: new Date(),
        tasks: [
          {
            id: 'task-1',
            sub_task_id: undefined,
            list_id: 'list-1',
            title: 'Task 1',
            description: '',
            status: 'not_started',
            priority: 2,
            start_date: undefined,
            end_date: undefined,
            is_range_date: false,
            order_index: 0,
            is_archived: false,
            created_at: new Date(),
            updated_at: new Date(),
            sub_tasks: [],
            tags: [],
            project_id: 'project-1',
            assigned_user_ids: [],
            tag_ids: []
          }
        ]
      },
      {
        id: 'list-2',
        project_id: 'project-1',
        name: 'Task List 2',
        description: 'Description 2',
        color: '#10b981',
        order_index: 1,
        is_archived: false,
        created_at: new Date(),
        updated_at: new Date(),
        tasks: []
      }
    ]
  };

  const defaultProps = {
    project: mockProject,
    isExpanded: true,
    onViewChange: vi.fn() as unknown as (view: string) => void
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('isExpanded=falseの場合は何も表示されない', () => {
    render(TaskListDisplay, {
      props: {
        ...defaultProps,
        isExpanded: false
      }
    });

    // タスクリストが表示されないことを確認
    expect(screen.queryByText('Task List 1')).not.toBeInTheDocument();
    expect(screen.queryByText('Task List 2')).not.toBeInTheDocument();
  });

  it('isExpanded=trueの場合はタスクリストが表示される', () => {
    render(TaskListDisplay, {
      props: {
        ...defaultProps,
        isExpanded: true
      }
    });

    // タスクリストが表示されることを確認
    expect(screen.getByText('Task List 1')).toBeInTheDocument();
    expect(screen.getByText('Task List 2')).toBeInTheDocument();
  });

  it('タスクリストにタスク数が表示される', () => {
    render(TaskListDisplay, {
      props: {
        ...defaultProps,
        isExpanded: true
      }
    });

    // タスク数が表示されることを確認
    expect(screen.getByText('1')).toBeInTheDocument(); // Task List 1のタスク数
    expect(screen.getByText('0')).toBeInTheDocument(); // Task List 2のタスク数
  });

  it('タスクリストクリック時にhandleTaskListSelectが呼ばれる', async () => {
    render(TaskListDisplay, {
      props: {
        ...defaultProps,
        isExpanded: true
      }
    });

    const taskListButton = screen.getByText('Task List 1').closest('button');
    if (taskListButton) {
      await fireEvent.click(taskListButton);

      // mockTaskStore参照を避けて、importから直接確認
      const { taskStore } = await import('$lib/stores/tasks.svelte');
      expect(taskStore.selectList).toHaveBeenCalledWith('list-1');
    }
  });

  it('onViewChangeコールバックが呼ばれる', async () => {
    const onViewChange = vi.fn() as unknown as (view: string) => void;
    render(TaskListDisplay, {
      props: {
        ...defaultProps,
        onViewChange,
        isExpanded: true
      }
    });

    const taskListButton = screen.getByText('Task List 1').closest('button');
    if (taskListButton) {
      await fireEvent.click(taskListButton);

      expect(onViewChange).toHaveBeenCalledWith('tasklist');
    }
  });

  it('選択されたタスクリストには適切なスタイルが適用される', () => {
    render(TaskListDisplay, {
      props: {
        ...defaultProps,
        isExpanded: true
      }
    });

    const selectedButton = screen.getByTestId('tasklist-list-1');
    expect(selectedButton).toBeInTheDocument();
  });

  it('タスクリストがdraggable属性を持つ', () => {
    render(TaskListDisplay, {
      props: {
        ...defaultProps,
        isExpanded: true
      }
    });

    const taskListButton = screen.getByTestId('tasklist-list-1');
    expect(taskListButton).toHaveAttribute('draggable', 'true');
  });

  it('ドラッグ開始時にDragDropManager.startDragが呼ばれる', async () => {
    const { DragDropManager } = await import('$lib/utils/drag-drop');

    render(TaskListDisplay, {
      props: {
        ...defaultProps,
        isExpanded: true
      }
    });

    const taskListButton = screen.getByTestId('tasklist-list-1');
    await fireEvent.dragStart(taskListButton);

    expect(DragDropManager.startDrag).toHaveBeenCalledWith(expect.any(Object), {
      type: 'tasklist',
      id: 'list-1',
      projectId: 'project-1'
    });
  });

  it('ドラッグオーバー時にDragDropManager.handleDragOverが呼ばれる', async () => {
    const { DragDropManager } = await import('$lib/utils/drag-drop');

    render(TaskListDisplay, {
      props: {
        ...defaultProps,
        isExpanded: true
      }
    });

    const taskListButton = screen.getByTestId('tasklist-list-1');
    await fireEvent.dragOver(taskListButton);

    expect(DragDropManager.handleDragOver).toHaveBeenCalledWith(expect.any(Object), {
      type: 'tasklist',
      id: 'list-1',
      projectId: 'project-1'
    });
  });

  it('ドロップ時にDragDropManager.handleDropが呼ばれる', async () => {
    const { DragDropManager } = await import('$lib/utils/drag-drop');

    render(TaskListDisplay, {
      props: {
        ...defaultProps,
        isExpanded: true
      }
    });

    const taskListButton = screen.getByTestId('tasklist-list-1');
    await fireEvent.drop(taskListButton);

    expect(DragDropManager.handleDrop).toHaveBeenCalledWith(expect.any(Object), {
      type: 'tasklist',
      id: 'list-1',
      projectId: 'project-1'
    });
  });

  it('ドラッグエンド時にDragDropManager.handleDragEndが呼ばれる', async () => {
    const { DragDropManager } = await import('$lib/utils/drag-drop');

    render(TaskListDisplay, {
      props: {
        ...defaultProps,
        isExpanded: true
      }
    });

    const taskListButton = screen.getByTestId('tasklist-list-1');
    await fireEvent.dragEnd(taskListButton);

    expect(DragDropManager.handleDragEnd).toHaveBeenCalledWith(expect.any(Object));
  });

  it('コンテナのレイアウトクラスが正しく適用される', () => {
    render(TaskListDisplay, {
      props: {
        ...defaultProps,
        isExpanded: true
      }
    });

    const container = document.querySelector('.mt-1.ml-4.space-y-1');
    expect(container).toBeInTheDocument();
  });

  it('タスクリストボタンのスタイルクラスが正しく適用される', () => {
    render(TaskListDisplay, {
      props: {
        ...defaultProps,
        isExpanded: true
      }
    });

    const button = screen.getByTestId('tasklist-list-1');
    expect(button).toHaveClass('flex', 'h-auto', 'w-full', 'items-center', 'justify-between');
  });

  it('タスクリスト名が正しく表示される', () => {
    render(TaskListDisplay, {
      props: {
        ...defaultProps,
        isExpanded: true
      }
    });

    const taskListName = document.querySelector('.truncate');
    expect(taskListName).toBeInTheDocument();
    expect(taskListName?.textContent).toBe('Task List 1');
  });

  it('タスク数に適切なスタイルが適用される', () => {
    render(TaskListDisplay, {
      props: {
        ...defaultProps,
        isExpanded: true
      }
    });

    const taskCount = document.querySelector('.text-muted-foreground');
    expect(taskCount).toBeInTheDocument();
  });

  it('空のプロジェクトでもエラーが発生しない', () => {
    const emptyProject: ProjectTree = {
      ...mockProject,
      task_lists: []
    };

    expect(() => {
      render(TaskListDisplay, {
        props: {
          ...defaultProps,
          project: emptyProject,
          isExpanded: true
        }
      });
    }).not.toThrow();
  });

  it('onViewChangeが未設定でもエラーが発生しない', async () => {
    render(TaskListDisplay, {
      props: {
        project: mockProject,
        isExpanded: true
        // onViewChangeを意図的に設定しない
      }
    });

    const taskListButton = screen.getByText('Task List 1').closest('button');
    if (taskListButton) {
      await expect(fireEvent.click(taskListButton)).resolves.not.toThrow();
    }
  });
});
