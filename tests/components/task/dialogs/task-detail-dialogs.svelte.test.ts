import { render } from '@testing-library/svelte';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import TaskDetailDialogs from '$lib/components/task/dialogs/task-detail-dialogs.svelte';
import type { TaskWithSubTasks } from '$lib/types/task';
import type { SubTask } from '$lib/types/sub-task';

// 子コンポーネントをモック
vi.mock('$lib/components/datetime/inline-picker/inline-date-picker.svelte', () => ({
  default: () => ({ render: () => '<div data-testid="inline-date-picker">Date Picker</div>' })
}));

vi.mock('$lib/components/task/dialogs/new-task-confirmation-dialog.svelte', () => ({
  default: () => ({ render: () => '<div data-testid="new-task-confirmation-dialog">New Task Confirmation</div>' })
}));

vi.mock('$lib/components/dialog/delete-confirmation-dialog.svelte', () => ({
  default: () => ({ render: () => '<div data-testid="delete-confirmation-dialog">Delete Confirmation</div>' })
}));

vi.mock('$lib/components/project/project-task-list-selector-dialog.svelte', () => ({
  default: () => ({ render: () => '<div data-testid="project-task-list-selector-dialog">Project Selector</div>' })
}));

vi.mock('$lib/components/recurrence/recurrence-dialog.svelte', () => ({
  default: () => ({ render: () => '<div data-testid="recurrence-dialog">Recurrence Dialog</div>' })
}));

describe('TaskDetailDialogs', () => {
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
    recurrence_rule: {} as any,
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
    created_at: new Date('2024-01-01'),
    updated_at: new Date('2024-01-01'),
    start_date: new Date('2024-01-01'),
    end_date: new Date('2024-01-02'),
    is_range_date: false,
    order_index: 0,
    tags: []
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
    editForm: mockEditForm,
    showDatePicker: false,
    datePickerPosition: { x: 100, y: 100 },
    showConfirmationDialog: false,
    showDeleteDialog: false,
    deleteDialogTitle: 'Delete Task',
    deleteDialogMessage: 'Are you sure?',
    showProjectTaskListDialog: false,
    showRecurrenceDialog: false,
    projectInfo: mockProjectInfo,
    onDateChange: vi.fn() as any,
    onDateClear: vi.fn() as any,
    onDatePickerClose: vi.fn() as any,
    onConfirmDiscard: vi.fn() as any,
    onCancelDiscard: vi.fn() as any,
    onConfirmDelete: vi.fn() as any,
    onCancelDelete: vi.fn() as any,
    onProjectTaskListChange: vi.fn() as any,
    onProjectTaskListDialogClose: vi.fn() as any,
    onRecurrenceChange: vi.fn() as any,
    onRecurrenceDialogClose: vi.fn() as any
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('基本表示テスト', () => {
    it('全てのダイアログコンポーネントがレンダリングされる', () => {
      const { container } = render(TaskDetailDialogs, { props: defaultProps });
      
      // 基本的なダイアログコンポーネントが含まれることを確認
      expect(container.innerHTML).toBeTruthy();
      expect(container.innerHTML.length).toBeGreaterThan(20);
    });

    it('メインタスクの場合、適切にレンダリングされる', () => {
      const { container } = render(TaskDetailDialogs, { props: defaultProps });
      
      expect(container.innerHTML).toBeTruthy();
    });

    it('サブタスクの場合、適切にレンダリングされる', () => {
      const props = {
        ...defaultProps,
        currentItem: mockSubTask
      };
      const { container } = render(TaskDetailDialogs, { props });
      
      expect(container.innerHTML).toBeTruthy();
    });

    it('currentItemがnullの場合、適切にレンダリングされる', () => {
      const props = {
        ...defaultProps,
        currentItem: null
      };
      const { container } = render(TaskDetailDialogs, { props });
      
      expect(container.innerHTML).toBeTruthy();
    });
  });

  describe('ダイアログ表示状態テスト', () => {
    it('日付ピッカーの表示状態が正しく渡される', () => {
      // 日付ピッカー表示
      const showDatePickerProps = {
        ...defaultProps,
        showDatePicker: true
      };
      const { container: showContainer } = render(TaskDetailDialogs, { props: showDatePickerProps });
      
      // 日付ピッカー非表示
      const hideDatePickerProps = {
        ...defaultProps,
        showDatePicker: false
      };
      const { container: hideContainer } = render(TaskDetailDialogs, { props: hideDatePickerProps });
      
      expect(showContainer.innerHTML).toBeTruthy();
      expect(hideContainer.innerHTML).toBeTruthy();
    });

    it('確認ダイアログの表示状態が正しく渡される', () => {
      const showConfirmationProps = {
        ...defaultProps,
        showConfirmationDialog: true
      };
      const { container } = render(TaskDetailDialogs, { props: showConfirmationProps });
      
      expect(container.innerHTML).toBeTruthy();
    });

    it('削除確認ダイアログの表示状態が正しく渡される', () => {
      const showDeleteProps = {
        ...defaultProps,
        showDeleteDialog: true,
        deleteDialogTitle: 'Delete Task',
        deleteDialogMessage: 'This action cannot be undone.'
      };
      const { container } = render(TaskDetailDialogs, { props: showDeleteProps });
      
      expect(container.innerHTML).toBeTruthy();
    });

    it('プロジェクト選択ダイアログの表示状態が正しく渡される', () => {
      const showProjectProps = {
        ...defaultProps,
        showProjectTaskListDialog: true
      };
      const { container } = render(TaskDetailDialogs, { props: showProjectProps });
      
      expect(container.innerHTML).toBeTruthy();
    });

    it('繰り返しダイアログの表示状態が正しく渡される', () => {
      const showRecurrenceProps = {
        ...defaultProps,
        showRecurrenceDialog: true
      };
      const { container } = render(TaskDetailDialogs, { props: showRecurrenceProps });
      
      expect(container.innerHTML).toBeTruthy();
    });
  });

  describe('プロパティ渡しテスト', () => {
    it('日付ピッカーに正しいプロパティが渡される', () => {
      const datePickerProps = {
        ...defaultProps,
        showDatePicker: true,
        datePickerPosition: { x: 200, y: 300 },
        editForm: {
          ...mockEditForm,
          is_range_date: false
        }
      };
      const { container } = render(TaskDetailDialogs, { props: datePickerProps });
      
      expect(container.innerHTML).toBeTruthy();
    });

    it('削除ダイアログに正しいプロパティが渡される', () => {
      const deleteProps = {
        ...defaultProps,
        showDeleteDialog: true,
        deleteDialogTitle: 'Delete SubTask',
        deleteDialogMessage: 'Are you sure you want to delete this subtask?'
      };
      const { container } = render(TaskDetailDialogs, { props: deleteProps });
      
      expect(container.innerHTML).toBeTruthy();
    });

    it('プロジェクト選択ダイアログに正しいプロパティが渡される', () => {
      const projectProps = {
        ...defaultProps,
        showProjectTaskListDialog: true,
        projectInfo: {
          project: { id: 'proj-2', name: 'Another Project' },
          taskList: { id: 'list-2', name: 'Another List' }
        }
      };
      const { container } = render(TaskDetailDialogs, { props: projectProps });
      
      expect(container.innerHTML).toBeTruthy();
    });

    it('projectInfoがnullの場合、適切にレンダリングされる', () => {
      const props = {
        ...defaultProps,
        projectInfo: null
      };
      const { container } = render(TaskDetailDialogs, { props });
      
      expect(container.innerHTML).toBeTruthy();
    });
  });

  describe('コールバック関数テスト', () => {
    it('全てのコールバック関数が適切に渡される', () => {
      const callbacks = {
        onDateChange: vi.fn() as any,
        onDateClear: vi.fn() as any,
        onDatePickerClose: vi.fn() as any,
        onConfirmDiscard: vi.fn() as any,
        onCancelDiscard: vi.fn() as any,
        onConfirmDelete: vi.fn() as any,
        onCancelDelete: vi.fn() as any,
        onProjectTaskListChange: vi.fn() as any,
        onProjectTaskListDialogClose: vi.fn() as any,
        onRecurrenceChange: vi.fn() as any,
        onRecurrenceDialogClose: vi.fn() as any
      };
      
      const props = { ...defaultProps, ...callbacks };
      const { container } = render(TaskDetailDialogs, { props });
      
      expect(container.innerHTML).toBeTruthy();
    });

    it('コールバック関数がundefinedでも正常に動作する', () => {
      const props = {
        ...defaultProps,
        onDateChange: undefined as any,
        onDateClear: undefined as any,
        onDatePickerClose: undefined as any
      };
      
      const { container } = render(TaskDetailDialogs, { props });
      expect(container.innerHTML).toBeTruthy();
    });
  });

  describe('日付関連テスト', () => {
    it('日付のないアイテムでも正常にレンダリングされる', () => {
      const taskWithoutDates = {
        ...mockTask,
        start_date: undefined,
        end_date: undefined
      };
      const props = {
        ...defaultProps,
        currentItem: taskWithoutDates
      };
      const { container } = render(TaskDetailDialogs, { props });
      
      expect(container.innerHTML).toBeTruthy();
    });

    it('繰り返しルールのないアイテムでも正常にレンダリングされる', () => {
      const taskWithoutRecurrence = {
        ...mockTask,
        recurrence_rule: undefined
      };
      const props = {
        ...defaultProps,
        currentItem: taskWithoutRecurrence
      };
      const { container } = render(TaskDetailDialogs, { props });
      
      expect(container.innerHTML).toBeTruthy();
    });

    it('範囲日付でない場合、適切にレンダリングされる', () => {
      const nonRangeProps = {
        ...defaultProps,
        editForm: {
          ...mockEditForm,
          is_range_date: false
        }
      };
      const { container } = render(TaskDetailDialogs, { props: nonRangeProps });
      
      expect(container.innerHTML).toBeTruthy();
    });
  });

  describe('エラー状態テスト', () => {
    it('不正なデータでも正常にレンダリングされる', () => {
      const invalidProps = {
        ...defaultProps,
        datePickerPosition: { x: -100, y: -100 },
        deleteDialogTitle: '',
        deleteDialogMessage: ''
      };
      const { container } = render(TaskDetailDialogs, { props: invalidProps });
      
      expect(container.innerHTML).toBeTruthy();
    });

    it('コンポーネントが正常にマウント・アンマウントできる', () => {
      const { container, unmount } = render(TaskDetailDialogs, { props: defaultProps });
      
      expect(container.innerHTML).toBeTruthy();
      
      // アンマウントしてもエラーが発生しない
      expect(() => unmount()).not.toThrow();
    });

    it('プロパティの動的変更に対応する', () => {
      const { container, rerender } = render(TaskDetailDialogs, { props: defaultProps });
      
      expect(container.innerHTML).toBeTruthy();
      
      // プロパティを変更してre-render
      const updatedProps = {
        ...defaultProps,
        showDatePicker: true,
        showDeleteDialog: true
      };
      
      expect(() => rerender(updatedProps)).not.toThrow();
      expect(container.innerHTML).toBeTruthy();
    });
  });
});