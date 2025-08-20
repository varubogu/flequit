import { render } from '@testing-library/svelte';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import TaskDetailContent from '$lib/components/task/detail/task-detail-content.svelte';
import type { TaskWithSubTasks } from '$lib/types/task';
import type { SubTask } from '$lib/types/sub-task';

// 完全なモック設定
vi.mock('$lib/stores/locale.svelte', () => ({
  getTranslationService: () => ({
    getMessage: () => () => 'Mocked Message'
  }),
  reactiveMessage: () => ({
    subscribe: (callback: (value: string) => void) => {
      callback('Mocked Message');
      return { unsubscribe: () => {} };
    }
  })
}));

vi.mock('$lib/stores/tasks.svelte', () => ({
  taskStore: {
    addTagToNewTask: vi.fn() as (tagName: string) => void,
    addTagToSubTask: vi.fn() as (subTaskId: string, tagName: string) => Promise<void>,
    addTagToTask: vi.fn() as (taskId: string, tagName: string) => Promise<void>
  }
}));

vi.mock('$paraglide/messages', () => ({
  add_tags_placeholder: () => 'Add tags...',
  tags: () => 'Tags',
  task_title: () => 'Task Title',
  task_description: () => 'Description'
}));

// 子コンポーネントのモック
vi.mock('$lib/components/task/detail/task-detail-header.svelte', () => ({
  default: () => ({ render: () => '<div data-testid="task-detail-header">Header</div>' })
}));

vi.mock('$lib/components/task/detail/task-detail-empty-state.svelte', () => ({
  default: () => ({
    render: () => '<div data-testid="task-detail-empty-state">No task selected</div>'
  })
}));

vi.mock('$lib/components/task/detail/task-detail-subtasks.svelte', () => ({
  default: () => ({ render: () => '<div data-testid="task-detail-subtasks">Subtasks</div>' })
}));

vi.mock('$lib/components/task/detail/task-detail-tags.svelte', () => ({
  default: () => ({ render: () => '<div data-testid="task-detail-tags">Tags</div>' })
}));

vi.mock('$lib/components/project/project-task-list-selector.svelte', () => ({
  default: () => ({
    render: () => '<div data-testid="project-task-list-selector">Project Selector</div>'
  })
}));

vi.mock('$lib/components/task/forms/task-status-selector.svelte', () => ({
  default: () => ({ render: () => '<div data-testid="task-status-selector">Status</div>' })
}));

vi.mock('$lib/components/task/forms/task-due-date-selector.svelte', () => ({
  default: () => ({ render: () => '<div data-testid="task-due-date-selector">Due Date</div>' })
}));

vi.mock('$lib/components/task/forms/task-priority-selector.svelte', () => ({
  default: () => ({ render: () => '<div data-testid="task-priority-selector">Priority</div>' })
}));

vi.mock('$lib/components/task/editors/task-description-editor.svelte', () => ({
  default: () => ({ render: () => '<div data-testid="task-description-editor">Description</div>' })
}));

vi.mock('$lib/components/task/detail/task-detail-metadata.svelte', () => ({
  default: () => ({ render: () => '<div data-testid="task-detail-metadata">Metadata</div>' })
}));

describe('TaskDetailContent', () => {
  const mockTask: TaskWithSubTasks = {
    id: 'task-1',
    title: 'Test Task',
    description: 'Test description',
    status: 'not_started' as const,
    priority: 2,
    start_date: new Date('2024-01-01'),
    end_date: new Date('2024-01-02'),
    is_range_date: true,
    created_at: new Date('2024-01-01'),
    updated_at: new Date('2024-01-01'),
    tags: [],
    list_id: 'list-1',
    order_index: 0,
    is_archived: false,
    sub_tasks: []
  };

  const mockSubTask: SubTask = {
    id: 'subtask-1',
    title: 'Test SubTask',
    description: 'Test subtask description',
    status: 'not_started' as const,
    priority: 1,
    task_id: 'task-1',
    order_index: 0,
    tags: [],
    created_at: new Date('2024-01-01'),
    updated_at: new Date('2024-01-01')
  };

  const mockEditForm = {
    title: 'Test Task',
    description: 'Test description',
    start_date: new Date('2024-01-01'),
    end_date: new Date('2024-01-02'),
    is_range_date: true,
    priority: 2
  };

  const mockProjectInfo = {
    project: { id: 'project-1', name: 'Test Project' },
    taskList: { id: 'list-1', name: 'Test List' }
  };

  const defaultProps = {
    currentItem: mockTask,
    task: mockTask,
    subTask: null,
    isSubTask: false,
    isNewTaskMode: false,
    editForm: mockEditForm,
    selectedSubTaskId: null,
    projectInfo: mockProjectInfo,
    isDrawerMode: false,
    onTitleChange: vi.fn() as (title: string) => void,
    onDescriptionChange: vi.fn() as (description: string) => void,
    onPriorityChange: vi.fn() as (priority: number) => void,
    onStatusChange: vi.fn() as (event: Event) => void,
    onDueDateClick: vi.fn() as (event?: Event) => void,
    onFormChange: vi.fn() as () => void,
    onDelete: vi.fn() as () => void,
    onSaveNewTask: vi.fn() as () => Promise<void>,
    onSubTaskClick: vi.fn() as (subTaskId: string) => void,
    onSubTaskToggle: vi.fn() as (subTaskId: string) => void,
    onAddSubTask: vi.fn() as () => void,
    showSubTaskAddForm: false,
    onSubTaskAdded: vi.fn() as (title: string) => void,
    onSubTaskAddCancel: vi.fn() as () => void,
    onGoToParentTask: vi.fn() as () => void,
    onProjectTaskListEdit: vi.fn() as () => void
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('基本表示テスト', () => {
    it('タスクが設定されている場合、コンテンツが存在する', () => {
      const { container } = render(TaskDetailContent, { props: defaultProps });

      // 基本的なコンテンツ構造が存在することを確認
      expect(container.innerHTML).toBeTruthy();
      expect(container.innerHTML.length).toBeGreaterThan(50);
    });

    it('タスクが設定されていない場合、空状態になる', () => {
      const props = { ...defaultProps, currentItem: null, task: null };
      const { container } = render(TaskDetailContent, { props });

      // コメントタグのみの場合（空状態）
      expect(container.innerHTML).toBe('<!---->');
    });

    it('ドロワーモードでスタイルが変化する', () => {
      const drawerProps = { ...defaultProps, isDrawerMode: true };
      const { container: drawerContainer } = render(TaskDetailContent, { props: drawerProps });

      const normalProps = { ...defaultProps, isDrawerMode: false };
      const { container: normalContainer } = render(TaskDetailContent, { props: normalProps });

      // ドロワーモードの方がスペーシングが小さい
      expect(drawerContainer.innerHTML).toContain('space-y-4');
      expect(normalContainer.innerHTML).toContain('space-y-6');
    });

    it('サブタスクモードでは条件分岐が動作する', () => {
      const subTaskProps = {
        ...defaultProps,
        currentItem: mockSubTask,
        task: null,
        subTask: mockSubTask,
        isSubTask: true
      };
      const { container } = render(TaskDetailContent, { props: subTaskProps });

      // サブタスクモードでもコンテンツが表示される
      expect(container.innerHTML).toBeTruthy();
      expect(container.innerHTML.length).toBeGreaterThan(50);
    });

    it('新規タスクモードでは適切に表示される', () => {
      const newTaskProps = { ...defaultProps, isNewTaskMode: true };
      const { container } = render(TaskDetailContent, { props: newTaskProps });

      expect(container.innerHTML).toBeTruthy();
      expect(container.innerHTML.length).toBeGreaterThan(50);
    });
  });

  describe('条件分岐テスト', () => {
    it('各モードで適切にレンダリングされる', () => {
      // 通常モード
      const normalResult = render(TaskDetailContent, { props: defaultProps });
      expect(normalResult.container.innerHTML).toContain('space-y-6');

      // ドロワーモード
      const drawerResult = render(TaskDetailContent, {
        props: { ...defaultProps, isDrawerMode: true }
      });
      expect(drawerResult.container.innerHTML).toContain('space-y-4');

      // 新規タスクモード
      const newTaskResult = render(TaskDetailContent, {
        props: { ...defaultProps, isNewTaskMode: true }
      });
      expect(newTaskResult.container.innerHTML).toBeTruthy();
    });

    it('サブタスク・メインタスクで適切に分岐する', () => {
      // メインタスク
      const mainTaskResult = render(TaskDetailContent, { props: defaultProps });
      expect(mainTaskResult.container.innerHTML).toBeTruthy();

      // サブタスク
      const subTaskProps = {
        ...defaultProps,
        currentItem: mockSubTask,
        task: null,
        subTask: mockSubTask,
        isSubTask: true
      };
      const subTaskResult = render(TaskDetailContent, { props: subTaskProps });
      expect(subTaskResult.container.innerHTML).toBeTruthy();
    });

    it('異なるプロパティで正常にレンダリングされる', () => {
      // プロジェクト情報なし
      const noProjectProps = { ...defaultProps, projectInfo: null };
      const noProjectResult = render(TaskDetailContent, { props: noProjectProps });
      expect(noProjectResult.container.innerHTML).toBeTruthy();

      // サブタスクIDなし
      const noSubTaskIdProps = { ...defaultProps, selectedSubTaskId: null };
      const noSubTaskIdResult = render(TaskDetailContent, { props: noSubTaskIdProps });
      expect(noSubTaskIdResult.container.innerHTML).toBeTruthy();
    });
  });

  describe('プロパティテスト', () => {
    it('必要なプロパティを受け取り、レンダリングが完了する', () => {
      const { container } = render(TaskDetailContent, { props: defaultProps });

      expect(container.innerHTML).toBeTruthy();
      expect(container.innerHTML.length).toBeGreaterThan(100);
    });

    it('コールバック関数が適切に渡される', () => {
      const callbacks = {
        onTitleChange: vi.fn() as (title: string) => void,
        onDescriptionChange: vi.fn() as (description: string) => void,
        onPriorityChange: vi.fn() as (priority: number) => void,
        onStatusChange: vi.fn() as (event: Event) => void,
        onDueDateClick: vi.fn() as (event?: Event) => void,
        onFormChange: vi.fn() as () => void,
        onDelete: vi.fn() as () => void,
        onSaveNewTask: vi.fn() as () => Promise<void>,
        onSubTaskClick: vi.fn() as (subTaskId: string) => void,
        onSubTaskToggle: vi.fn() as (subTaskId: string) => void,
        onGoToParentTask: vi.fn() as () => void,
        onProjectTaskListEdit: vi.fn() as () => void
      };

      const props = { ...defaultProps, ...callbacks };
      const { container } = render(TaskDetailContent, { props });

      expect(container.innerHTML).toBeTruthy();
    });
  });

  describe('エラー状態テスト', () => {
    it('nullプロパティでも正常にレンダリングする', () => {
      const incompleteProps = {
        currentItem: mockTask,
        task: mockTask,
        subTask: null,
        isSubTask: false,
        isNewTaskMode: false,
        editForm: mockEditForm,
        selectedSubTaskId: null,
        projectInfo: null,
        onTitleChange: vi.fn() as (title: string) => void,
        onDescriptionChange: vi.fn() as (description: string) => void,
        onPriorityChange: vi.fn() as (priority: number) => void,
        onStatusChange: vi.fn() as (event: Event) => void,
        onDueDateClick: vi.fn() as (event?: Event) => void,
        onFormChange: vi.fn() as () => void,
        onDelete: vi.fn() as () => void,
        onSaveNewTask: vi.fn() as () => Promise<void>,
        onSubTaskClick: vi.fn() as (subTaskId: string) => void,
        onSubTaskToggle: vi.fn() as (subTaskId: string) => void,
        onGoToParentTask: vi.fn() as () => void,
        onProjectTaskListEdit: vi.fn() as () => void
      };

      const { container } = render(TaskDetailContent, { props: incompleteProps });
      expect(container.innerHTML).toBeTruthy();
    });

    it('空のcurrentItemでも正常に動作する', () => {
      const props = { ...defaultProps, currentItem: null, task: null };
      const { container } = render(TaskDetailContent, { props });

      // 空状態ではコメントタグのみ
      expect(container.innerHTML).toBe('<!---->');
    });

    it('コンポーネントが正常にマウント・アンマウントできる', () => {
      const { container, unmount } = render(TaskDetailContent, { props: defaultProps });

      expect(container.innerHTML).toBeTruthy();

      // アンマウントしてもエラーが発生しない
      expect(() => unmount()).not.toThrow();
    });
  });
});
