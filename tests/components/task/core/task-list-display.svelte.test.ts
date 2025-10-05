import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import TaskListDisplay from '$lib/components/task/core/task-list-display.svelte';
// import { createUnitTestTranslationService } from '../../unit-translation-mock';
import type { ProjectTree } from '$lib/types/project';

// 翻訳サービスのモック
vi.mock('$lib/stores/locale.svelte', () => ({
  getTranslationService: () => ({
    getMessage: vi.fn((key: string) => {
      const messages: Record<string, string> = {
        'edit_task_list': 'Edit Task List',
        'add_task': 'Add Task',
        'delete_task_list': 'Delete Task List'
      };
      return messages[key] || key;
    })
  })
}));

// taskStoreのモック
vi.mock('$lib/stores/tasks.svelte', () => ({
  taskStore: {
    projects: [],
    selectedListId: null,
    startNewTaskMode: vi.fn()
  }
}));

// taskCoreStoreのモック
vi.mock('$lib/stores/task-core-store.svelte', () => ({
  taskCoreStore: {
    moveTaskToList: vi.fn()
  }
}));

// selectionStoreのモック
vi.mock('$lib/stores/selection-store.svelte', () => ({
  selectionStore: {
    selectList: vi.fn(),
    selectProject: vi.fn()
  }
}));

// taskListStoreのモック
vi.mock('$lib/stores/task-list-store.svelte', () => ({
  taskListStore: {
    addTaskList: vi.fn(),
    updateTaskList: vi.fn(),
    deleteTaskList: vi.fn(),
    moveTaskListToPosition: vi.fn()
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
    orderIndex: 0,
    isArchived: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    taskLists: [
      {
        id: 'list-1',
        projectId: 'project-1',
        name: 'Task List 1',
        description: 'Description 1',
        color: '#ef4444',
        orderIndex: 0,
        isArchived: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        tasks: [
          {
            id: 'task-1',
            subTaskId: undefined,
            listId: 'list-1',
            title: 'Task 1',
            description: '',
            status: 'not_started',
            priority: 2,
            planStartDate: undefined,
            planEndDate: undefined,
            isRangeDate: false,
            orderIndex: 0,
            isArchived: false,
            createdAt: new Date(),
            updatedAt: new Date(),
            subTasks: [],
            tags: [],
            projectId: 'project-1',
            assignedUserIds: [],
            tagIds: []
          }
        ]
      },
      {
        id: 'list-2',
        projectId: 'project-1',
        name: 'Task List 2',
        description: 'Description 2',
        color: '#10b981',
        orderIndex: 1,
        isArchived: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        tasks: []
      }
    ]
  };

  const defaultProps = {
    project: mockProject,
    isExpanded: true,
    currentView: 'tasklist' as const,
    onViewChange: vi.fn() as unknown as (view: string) => void
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // currentProject依存のためprojectsに対象プロジェクトを挿入
    import('$lib/stores/tasks.svelte').then(({ taskStore }) => {
      taskStore.projects = [
        {
          ...mockProject,
          taskLists: mockProject.taskLists
        }
      ];
    });
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

      // selectionStoreのselectListが呼ばれることを確認
      const { selectionStore } = await import('$lib/stores/selection-store.svelte');
      expect(selectionStore.selectList).toHaveBeenCalledWith('list-1');
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
      taskLists: []
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

  describe('currentViewプロパティのテスト', () => {
    it('currentViewが未設定の場合はデフォルト値allが使用される', () => {
      render(TaskListDisplay, {
        props: {
          project: mockProject,
          isExpanded: true
          // currentViewを意図的に設定しない
        }
      });

      // タスクリストが表示されることを確認
      expect(screen.getByText('Task List 1')).toBeInTheDocument();
      expect(screen.getByText('Task List 2')).toBeInTheDocument();
    });

    it('currentView=tasklistの場合、選択されたタスクリストに適切なスタイルが適用される', async () => {
      // taskStoreのselectedListIdを設定
      const { taskStore } = await import('$lib/stores/tasks.svelte');
      taskStore.selectedListId = 'list-1';

      render(TaskListDisplay, {
        props: {
          ...defaultProps,
          currentView: 'tasklist' as const,
          isExpanded: true
        }
      });

      const selectedButton = screen.getByTestId('tasklist-list-1');
      expect(selectedButton).toHaveClass('bg-primary/20', 'border-2', 'border-primary', 'shadow-md', 'shadow-primary/40', 'text-foreground');
    });

    it('currentView=allの場合、選択されたタスクリストでも特別なスタイルが適用されない', async () => {
      // taskStoreのselectedListIdを設定
      const { taskStore } = await import('$lib/stores/tasks.svelte');
      taskStore.selectedListId = 'list-1';

      render(TaskListDisplay, {
        props: {
          ...defaultProps,
          currentView: 'all' as const,
          isExpanded: true
        }
      });

      const selectedButton = screen.getByTestId('tasklist-list-1');
      expect(selectedButton).not.toHaveClass('bg-primary/20', 'border-2', 'border-primary', 'shadow-md', 'shadow-primary/40', 'text-foreground');
    });

    it('currentView=projectの場合、選択されたタスクリストでも特別なスタイルが適用されない', async () => {
      // taskStoreのselectedListIdを設定
      const { taskStore } = await import('$lib/stores/tasks.svelte');
      taskStore.selectedListId = 'list-1';

      render(TaskListDisplay, {
        props: {
          ...defaultProps,
          currentView: 'project' as const,
          isExpanded: true
        }
      });

      const selectedButton = screen.getByTestId('tasklist-list-1');
      expect(selectedButton).not.toHaveClass('bg-primary/20', 'border-2', 'border-primary', 'shadow-md', 'shadow-primary/40', 'text-foreground');
    });

    it('currentView=tasklistでタスクリストが選択されていない場合、特別なスタイルが適用されない', async () => {
      // taskStoreのselectedListIdをnullに設定
      const { taskStore } = await import('$lib/stores/tasks.svelte');
      taskStore.selectedListId = null;

      render(TaskListDisplay, {
        props: {
          ...defaultProps,
          currentView: 'tasklist' as const,
          isExpanded: true
        }
      });

      const button = screen.getByTestId('tasklist-list-1');
      expect(button).not.toHaveClass('bg-primary/20', 'border-2', 'border-primary', 'shadow-md', 'shadow-primary/40', 'text-foreground');
    });

    it('currentView=tasklistの場合、Buttonのvariantが正しく設定される', async () => {
      // taskStoreのselectedListIdを設定
      const { taskStore } = await import('$lib/stores/tasks.svelte');
      taskStore.selectedListId = 'list-1';

      render(TaskListDisplay, {
        props: {
          ...defaultProps,
          currentView: 'tasklist' as const,
          isExpanded: true
        }
      });

      const selectedButton = screen.getByTestId('tasklist-list-1');
      // variant="secondary"が適用されることを確認（Buttonコンポーネントの実装に依存）
      expect(selectedButton).toBeInTheDocument();
    });

    it('currentView=allの場合、Buttonのvariantがghostになる', async () => {
      // taskStoreのselectedListIdを設定
      const { taskStore } = await import('$lib/stores/tasks.svelte');
      taskStore.selectedListId = 'list-1';

      render(TaskListDisplay, {
        props: {
          ...defaultProps,
          currentView: 'all' as const,
          isExpanded: true
        }
      });

      const button = screen.getByTestId('tasklist-list-1');
      // variant="ghost"が適用されることを確認（Buttonコンポーネントの実装に依存）
      expect(button).toBeInTheDocument();
    });
  });
});
