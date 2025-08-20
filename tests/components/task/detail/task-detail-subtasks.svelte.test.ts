import { describe, test, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import TaskDetailSubTasks from '$lib/components/task/detail/task-detail-subtasks.svelte';
import type { TaskWithSubTasks } from '$lib/types/task';

describe('TaskDetailSubTasks Component', () => {
  const mockTask: TaskWithSubTasks = {
    id: 'task-1',
    title: 'Test Task',
    description: '',
    status: 'not_started',
    priority: 2,
    created_at: new Date(),
    updated_at: new Date(),
    list_id: 'list-1',
    order_index: 0,
    end_date: undefined,
    start_date: undefined,
    is_range_date: false,
    tags: [],
    is_archived: false,
    sub_tasks: [
      {
        id: 'subtask-1',
        title: 'SubTask 1',
        status: 'not_started',
        task_id: 'task-1',
        order_index: 0,
        created_at: new Date(),
        updated_at: new Date(),
        end_date: new Date('2024-01-15'),
        start_date: undefined,
        is_range_date: false,
        tags: []
      },
      {
        id: 'subtask-2',
        title: 'SubTask 2',
        status: 'completed',
        task_id: 'task-1',
        order_index: 1,
        created_at: new Date(),
        updated_at: new Date(),
        end_date: undefined,
        start_date: undefined,
        is_range_date: false,
        tags: []
      }
    ]
  };

  const mockTaskWithoutSubTasks: TaskWithSubTasks = {
    ...mockTask,
    sub_tasks: []
  };

  let onSubTaskClick: ReturnType<typeof vi.fn>;
  let onSubTaskToggle: ReturnType<typeof vi.fn>;
  let onAddSubTask: ReturnType<typeof vi.fn>;
  let onSubTaskAdded: ReturnType<typeof vi.fn>;
  let onSubTaskAddCancel: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    onSubTaskClick = vi.fn();
    onSubTaskToggle = vi.fn();
    onAddSubTask = vi.fn();
    onSubTaskAdded = vi.fn();
    onSubTaskAddCancel = vi.fn();
    vi.clearAllMocks();
  });

  test('should render subtasks when they exist', () => {
    render(TaskDetailSubTasks, {
      task: mockTask,
      selectedSubTaskId: null,
      onSubTaskClick,
      onSubTaskToggle,
      onAddSubTask
    });

    expect(screen.getByText('Sub-tasks')).toBeInTheDocument();
    expect(screen.getByText('SubTask 1')).toBeInTheDocument();
    expect(screen.getByText('SubTask 2')).toBeInTheDocument();
  });

  test('should render header with subtask count even when no subtasks exist', () => {
    render(TaskDetailSubTasks, {
      task: mockTaskWithoutSubTasks,
      selectedSubTaskId: null,
      onSubTaskClick,
      onSubTaskToggle,
      onAddSubTask
    });

    // ヘッダーは表示されるべき
    expect(screen.getByText('Sub-tasks')).toBeInTheDocument();
    // サブタスクカウントが0 subtasksであることを確認
    expect(screen.getByText('0 subtasks')).toBeInTheDocument();
    // サブタスクのアイテムは表示されない
    expect(screen.queryByText('SubTask 1')).not.toBeInTheDocument();
  });

  test('should highlight selected subtask', () => {
    render(TaskDetailSubTasks, {
      task: mockTask,
      selectedSubTaskId: 'subtask-1',
      onSubTaskClick,
      onSubTaskToggle,
      onAddSubTask
    });

    const selectedSubTask = screen.getByText('SubTask 1').closest('button');
    expect(selectedSubTask).toHaveClass('bg-primary/10', 'border-primary');
  });

  test('should call onSubTaskClick when subtask is clicked', async () => {
    render(TaskDetailSubTasks, {
      task: mockTask,
      selectedSubTaskId: null,
      onSubTaskClick,
      onSubTaskToggle,
      onAddSubTask
    });

    const subTaskButton = screen.getByText('SubTask 1').closest('button');
    await fireEvent.click(subTaskButton!);

    expect(onSubTaskClick).toHaveBeenCalledWith('subtask-1');
  });

  test('should call onSubTaskToggle when toggle button is clicked', async () => {
    render(TaskDetailSubTasks, {
      task: mockTask,
      selectedSubTaskId: null,
      onSubTaskClick,
      onSubTaskToggle,
      onAddSubTask
    });

    const toggleButtons = screen.getAllByLabelText('Toggle subtask completion');
    await fireEvent.click(toggleButtons[0]);

    expect(onSubTaskToggle).toHaveBeenCalledWith('subtask-1');
    expect(onSubTaskClick).not.toHaveBeenCalled(); // Should stop propagation
  });

  test('should show completed checkmark for completed subtasks', () => {
    render(TaskDetailSubTasks, {
      task: mockTask,
      selectedSubTaskId: null,
      onSubTaskClick,
      onSubTaskToggle,
      onAddSubTask
    });

    const toggleButtons = screen.getAllByLabelText('Toggle subtask completion');
    expect(toggleButtons[0]).toHaveTextContent('⚪'); // not completed
    expect(toggleButtons[1]).toHaveTextContent('✅'); // completed
  });

  test('should show strikethrough for completed subtasks', () => {
    render(TaskDetailSubTasks, {
      task: mockTask,
      selectedSubTaskId: null,
      onSubTaskClick,
      onSubTaskToggle,
      onAddSubTask
    });

    const completedSubTask = screen.getByText('SubTask 2');
    expect(completedSubTask).toHaveClass('line-through', 'text-muted-foreground');
  });

  test('should display subtask due date when present', () => {
    render(TaskDetailSubTasks, {
      task: mockTask,
      selectedSubTaskId: null,
      onSubTaskClick,
      onSubTaskToggle,
      onAddSubTask
    });

    // Check that the subtask with a due date is rendered
    const subtaskWithDate = screen.getByText('SubTask 1').closest('button');
    expect(subtaskWithDate).toBeInTheDocument();
  });

  test('should not display date when subtask has no due date', () => {
    render(TaskDetailSubTasks, {
      task: mockTask,
      selectedSubTaskId: null,
      onSubTaskClick,
      onSubTaskToggle,
      onAddSubTask
    });

    const subtaskWithoutDate = screen.getByText('SubTask 2').closest('button');
    expect(
      subtaskWithoutDate?.querySelector('.text-xs.text-muted-foreground.whitespace-nowrap')
    ).not.toBeInTheDocument();
  });

  test('should display add subtask button when onAddSubTask is provided', () => {
    render(TaskDetailSubTasks, {
      task: mockTask,
      selectedSubTaskId: null,
      onSubTaskClick,
      onSubTaskToggle,
      onAddSubTask
    });

    const addButton = screen.getByTestId('add-subtask');
    expect(addButton).toBeInTheDocument();
  });

  test('should call onAddSubTask when add button is clicked', async () => {
    render(TaskDetailSubTasks, {
      task: mockTask,
      selectedSubTaskId: null,
      onSubTaskClick,
      onSubTaskToggle,
      onAddSubTask
    });

    const addButton = screen.getByTestId('add-subtask');
    await fireEvent.click(addButton);

    expect(onAddSubTask).toHaveBeenCalledOnce();
  });

  test('should display subtask count text', () => {
    render(TaskDetailSubTasks, {
      task: mockTask,
      selectedSubTaskId: null,
      onSubTaskClick,
      onSubTaskToggle,
      onAddSubTask
    });

    expect(screen.getByText('2 subtasks')).toBeInTheDocument();
  });

  test('should display subtask add form when showSubTaskAddForm is true', () => {
    render(TaskDetailSubTasks, {
      task: mockTask,
      selectedSubTaskId: null,
      onSubTaskClick,
      onSubTaskToggle,
      onAddSubTask,
      showSubTaskAddForm: true,
      onSubTaskAdded,
      onSubTaskAddCancel
    });

    // サブタスク追加フォームが表示されることを確認
    expect(screen.getByPlaceholderText('Sub-task title')).toBeInTheDocument();
    // フォーム内の保存ボタンとキャンセルボタンを確認
    const addButtons = screen.getAllByTitle('Add Subtask');
    expect(addButtons).toHaveLength(2); // ヘッダーの＋ボタンとフォーム内の保存ボタン
    expect(screen.getByTitle('Cancel')).toBeInTheDocument();
  });

  test('should not display subtask add form when showSubTaskAddForm is false', () => {
    render(TaskDetailSubTasks, {
      task: mockTask,
      selectedSubTaskId: null,
      onSubTaskClick,
      onSubTaskToggle,
      onAddSubTask,
      showSubTaskAddForm: false,
      onSubTaskAdded,
      onSubTaskAddCancel
    });

    // サブタスク追加フォームが表示されないことを確認
    expect(screen.queryByPlaceholderText('Sub-task title')).not.toBeInTheDocument();
  });

  test('should call onSubTaskAdded when form is submitted', async () => {
    render(TaskDetailSubTasks, {
      task: mockTask,
      selectedSubTaskId: null,
      onSubTaskClick,
      onSubTaskToggle,
      onAddSubTask,
      showSubTaskAddForm: true,
      onSubTaskAdded,
      onSubTaskAddCancel
    });

    const input = screen.getByPlaceholderText('Sub-task title');
    const addButtons = screen.getAllByTitle('Add Subtask');
    const saveButton = addButtons.find((btn) =>
      btn.querySelector('svg')?.getAttribute('class')?.includes('lucide-save')
    )!;

    // タイトルを入力してサブタスクを追加
    await fireEvent.input(input, { target: { value: 'New SubTask' } });
    await fireEvent.click(saveButton);

    // onSubTaskAddedが呼ばれることを確認
    expect(onSubTaskAdded).toHaveBeenCalledWith('New SubTask');
  });

  test('should display add form above subtask list', () => {
    render(TaskDetailSubTasks, {
      task: mockTask,
      selectedSubTaskId: null,
      onSubTaskClick,
      onSubTaskToggle,
      onAddSubTask,
      showSubTaskAddForm: true,
      onSubTaskAdded,
      onSubTaskAddCancel
    });

    const formInput = screen.getByPlaceholderText('Sub-task title');
    const subtask1 = screen.getByText('SubTask 1');

    // フォームがサブタスクリストより上に表示されることを確認
    // DOM内での位置関係をチェック
    const container = formInput.closest('div');
    const subtaskContainer = subtask1.closest('button');

    // formInputの親要素がsubtaskより前に現れることを確認
    expect(container?.compareDocumentPosition(subtaskContainer!)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING
    );
  });
});
