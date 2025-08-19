import { test, expect, vi, beforeEach } from 'vitest';
import { TaskService } from '../../src/lib/services/task-service';
import type { TaskWithSubTasks } from '../../src/lib/types/task';

// Mock the store import
vi.mock('../../src/lib/stores/tasks.svelte', () => ({
  taskStore: {
    toggleTaskStatus: vi.fn(),
    selectTask: vi.fn(),
    selectSubTask: vi.fn(),
    updateTask: vi.fn(),
    deleteTask: vi.fn(),
    addTask: vi.fn(),
    updateSubTask: vi.fn(),
    deleteSubTask: vi.fn(),
    getTaskById: vi.fn()
  }
}));

// Get the mocked store for use in tests
const mockTaskStore = vi.mocked(await import('../../src/lib/stores/tasks.svelte')).taskStore;

// Note: deleteSubTask no longer uses window.confirm, it's handled by UI dialog

beforeEach(() => {
  vi.clearAllMocks();
});

test('TaskService.toggleTaskStatus: calls taskStore.toggleTaskStatus with correct taskId', () => {
  const taskId = 'task-123';
  TaskService.toggleTaskStatus(taskId);

  expect(mockTaskStore.toggleTaskStatus).toHaveBeenCalledWith(taskId);
  expect(mockTaskStore.toggleTaskStatus).toHaveBeenCalledTimes(1);
});

test('TaskService.selectTask: calls taskStore.selectTask with correct taskId', () => {
  const taskId = 'task-123';
  TaskService.selectTask(taskId);

  expect(mockTaskStore.selectTask).toHaveBeenCalledWith(taskId);
  expect(mockTaskStore.selectTask).toHaveBeenCalledTimes(1);
});

test('TaskService.selectSubTask: calls taskStore.selectSubTask with correct subTaskId', () => {
  const subTaskId = 'subtask-123';
  TaskService.selectSubTask(subTaskId);

  expect(mockTaskStore.selectSubTask).toHaveBeenCalledWith(subTaskId);
  expect(mockTaskStore.selectSubTask).toHaveBeenCalledTimes(1);
});

test('TaskService.updateTask: calls taskStore.updateTask with correct parameters', () => {
  const taskId = 'task-123';
  const updates = { title: 'Updated Title', priority: 2 };

  TaskService.updateTask(taskId, updates);

  expect(mockTaskStore.updateTask).toHaveBeenCalledWith(taskId, updates);
  expect(mockTaskStore.updateTask).toHaveBeenCalledTimes(1);
});

test('TaskService.updateTaskFromForm: converts form data and calls updateTask', () => {
  const taskId = 'task-123';
  const formData = {
    title: 'New Title',
    description: 'New Description',
    start_date: new Date('2024-01-15'),
    end_date: new Date('2024-01-20'),
    is_range_date: true,
    priority: 1
  };

  TaskService.updateTaskFromForm(taskId, formData);

  expect(mockTaskStore.updateTask).toHaveBeenCalledWith(taskId, {
    title: 'New Title',
    description: 'New Description',
    priority: 1,
    start_date: new Date('2024-01-15'),
    end_date: new Date('2024-01-20'),
    is_range_date: true
  });
});

test('TaskService.updateTaskFromForm: handles empty description', () => {
  const taskId = 'task-123';
  const formData = {
    title: 'Title Only',
    description: '',
    priority: 2
  };

  TaskService.updateTaskFromForm(taskId, formData);

  expect(mockTaskStore.updateTask).toHaveBeenCalledWith(taskId, {
    title: 'Title Only',
    description: undefined,
    priority: 2,
    start_date: undefined,
    end_date: undefined,
    is_range_date: false
  });
});

test('TaskService.changeTaskStatus: calls updateTask with new status', () => {
  const taskId = 'task-123';
  const newStatus = 'completed';

  TaskService.changeTaskStatus(taskId, newStatus);

  expect(mockTaskStore.updateTask).toHaveBeenCalledWith(taskId, { status: newStatus });
});

test('TaskService.deleteTask: calls taskStore.deleteTask and returns true', () => {
  const taskId = 'task-123';
  const result = TaskService.deleteTask(taskId);

  expect(mockTaskStore.deleteTask).toHaveBeenCalledWith(taskId);
  expect(result).toBe(true);
});

test('TaskService.addTask: calls taskStore.addTask with correct parameters', async () => {
  const listId = 'list-123';
  const taskData = {
    title: 'New Task',
    description: 'Task Description',
    priority: 2
  };

  const mockReturnTask = { id: 'new-task', title: 'New Task' } as TaskWithSubTasks;
  vi.mocked(mockTaskStore.addTask).mockImplementation(() => Promise.resolve(mockReturnTask));

  const result = await TaskService.addTask(listId, taskData);

  expect(mockTaskStore.addTask).toHaveBeenCalledWith(listId, {
    list_id: listId,
    title: 'New Task',
    description: 'Task Description',
    status: 'not_started',
    priority: 2,
    order_index: 0,
    is_archived: false
  });
  expect(result).toBe(mockReturnTask);
});

test('TaskService.addTask: handles default priority', async () => {
  const listId = 'list-123';
  const taskData = {
    title: 'Task Without Priority'
  };

  await TaskService.addTask(listId, taskData);

  expect(mockTaskStore.addTask).toHaveBeenCalledWith(listId, {
    list_id: listId,
    title: 'Task Without Priority',
    description: undefined,
    status: 'not_started',
    priority: 0,
    order_index: 0,
    is_archived: false
  });
});

test('TaskService.toggleSubTaskStatus: toggles subtask status correctly', () => {
  const task: TaskWithSubTasks = {
    id: 'task-123',
    list_id: 'list-123',
    title: 'Test Task',
    status: 'not_started',
    priority: 0,
    order_index: 0,
    is_archived: false,
    created_at: new Date(),
    updated_at: new Date(),
    sub_tasks: [
      {
        id: 'subtask-1',
        task_id: 'task-123',
        title: 'Subtask 1',
        status: 'not_started',
        order_index: 0,
        created_at: new Date(),
        updated_at: new Date(),
        tags: []
      },
      {
        id: 'subtask-2',
        task_id: 'task-123',
        title: 'Subtask 2',
        status: 'completed',
        order_index: 1,
        created_at: new Date(),
        updated_at: new Date(),
        tags: []
      }
    ],
    tags: []
  };

  // Toggle not_started to completed
  TaskService.toggleSubTaskStatus(task, 'subtask-1');

  const expectedSubTasks = [{ ...task.sub_tasks[0], status: 'completed' }, task.sub_tasks[1]];

  expect(mockTaskStore.updateTask).toHaveBeenCalledWith('task-123', {
    sub_tasks: expectedSubTasks
  });
});

test('TaskService.toggleSubTaskStatus: handles non-existent subtask', () => {
  const task: TaskWithSubTasks = {
    id: 'task-123',
    list_id: 'list-123',
    title: 'Test Task',
    status: 'not_started',
    priority: 0,
    order_index: 0,
    is_archived: false,
    created_at: new Date(),
    updated_at: new Date(),
    sub_tasks: [],
    tags: []
  };

  TaskService.toggleSubTaskStatus(task, 'non-existent');

  expect(mockTaskStore.updateTask).not.toHaveBeenCalled();
});

test('TaskService.updateSubTaskFromForm: converts form data and calls updateSubTask', () => {
  const subTaskId = 'subtask-123';
  const formData = {
    title: 'Updated Subtask',
    description: 'Updated Description',
    start_date: new Date('2024-01-15'),
    end_date: new Date('2024-01-20'),
    is_range_date: true,
    priority: 2
  };

  TaskService.updateSubTaskFromForm(subTaskId, formData);

  expect(mockTaskStore.updateSubTask).toHaveBeenCalledWith(subTaskId, {
    title: 'Updated Subtask',
    description: 'Updated Description',
    priority: 2,
    start_date: new Date('2024-01-15'),
    end_date: new Date('2024-01-20'),
    is_range_date: true
  });
});

test('TaskService.changeSubTaskStatus: calls updateSubTask with new status', () => {
  const subTaskId = 'subtask-123';
  const newStatus = 'in_progress';

  TaskService.changeSubTaskStatus(subTaskId, newStatus);

  expect(mockTaskStore.updateSubTask).toHaveBeenCalledWith(subTaskId, { status: newStatus });
});

test('TaskService.deleteSubTask: calls deleteSubTask directly', () => {
  const subTaskId = 'subtask-123';

  const result = TaskService.deleteSubTask(subTaskId);

  expect(mockTaskStore.deleteSubTask).toHaveBeenCalledWith(subTaskId);
  expect(result).toBe(true);
});

// Add mocks for new test requirements
vi.mock('../../src/lib/stores/tags.svelte', () => ({
  tagStore: {
    tags: [
      { id: 'tag-1', name: 'Important' },
      { id: 'tag-2', name: 'Work' }
    ]
  }
}));

vi.mock('../../src/lib/services/recurrence-service', () => ({
  RecurrenceService: {
    calculateNextDate: vi.fn()
  }
}));

const mockRecurrenceService = vi.mocked(await import('../../src/lib/services/recurrence-service')).RecurrenceService;

// Update mockTaskStore to include all required methods
Object.assign(mockTaskStore, {
  isNewTaskMode: false,
  pendingTaskSelection: null,
  pendingSubTaskSelection: null,
  cancelNewTaskMode: vi.fn(),
  addSubTask: vi.fn(),
  addTagToTask: vi.fn(),
  addTagToSubTask: vi.fn(),
  createRecurringTask: vi.fn()
});

test('TaskService.selectTask: returns false when in new task mode', () => {
  Object.assign(mockTaskStore, { isNewTaskMode: true, pendingTaskSelection: null });
  
  const result = TaskService.selectTask('task-123');
  
  expect(result).toBe(false);
  expect(mockTaskStore.pendingTaskSelection).toBe('task-123');
  expect(mockTaskStore.selectTask).not.toHaveBeenCalled();
});

test('TaskService.selectTask: returns true when not in new task mode', () => {
  Object.assign(mockTaskStore, { isNewTaskMode: false });
  
  const result = TaskService.selectTask('task-123');
  
  expect(result).toBe(true);
  expect(mockTaskStore.selectTask).toHaveBeenCalledWith('task-123');
});

test('TaskService.selectTask: works with null taskId', () => {
  Object.assign(mockTaskStore, { isNewTaskMode: false });
  
  const result = TaskService.selectTask(null);
  
  expect(result).toBe(true);
  expect(mockTaskStore.selectTask).toHaveBeenCalledWith(null);
});

test('TaskService.selectSubTask: returns false when in new task mode', () => {
  Object.assign(mockTaskStore, { isNewTaskMode: true, pendingSubTaskSelection: null });
  
  const result = TaskService.selectSubTask('subtask-123');
  
  expect(result).toBe(false);
  expect(mockTaskStore.pendingSubTaskSelection).toBe('subtask-123');
  expect(mockTaskStore.selectSubTask).not.toHaveBeenCalled();
});

test('TaskService.selectSubTask: returns true when not in new task mode', () => {
  Object.assign(mockTaskStore, { isNewTaskMode: false });
  
  const result = TaskService.selectSubTask('subtask-123');
  
  expect(result).toBe(true);
  expect(mockTaskStore.selectSubTask).toHaveBeenCalledWith('subtask-123');
});

test('TaskService.forceSelectTask: cancels new task mode and selects task', () => {
  Object.assign(mockTaskStore, { isNewTaskMode: true });
  
  TaskService.forceSelectTask('task-123');
  
  expect(mockTaskStore.cancelNewTaskMode).toHaveBeenCalledOnce();
  expect(mockTaskStore.selectTask).toHaveBeenCalledWith('task-123');
});

test('TaskService.forceSelectTask: works when not in new task mode', () => {
  Object.assign(mockTaskStore, { isNewTaskMode: false });
  
  TaskService.forceSelectTask('task-123');
  
  expect(mockTaskStore.cancelNewTaskMode).not.toHaveBeenCalled();
  expect(mockTaskStore.selectTask).toHaveBeenCalledWith('task-123');
});

test('TaskService.forceSelectSubTask: cancels new task mode and selects subtask', () => {
  Object.assign(mockTaskStore, { isNewTaskMode: true });
  
  TaskService.forceSelectSubTask('subtask-123');
  
  expect(mockTaskStore.cancelNewTaskMode).toHaveBeenCalledOnce();
  expect(mockTaskStore.selectSubTask).toHaveBeenCalledWith('subtask-123');
});

test('TaskService.addSubTask: calls taskStore.addSubTask with correct parameters', async () => {
  const taskId = 'task-123';
  const subTaskData = {
    title: 'New Subtask',
    description: 'Subtask Description',
    priority: 1
  };

  const mockSubTask = { 
    id: 'subtask-123', 
    title: 'New Subtask',
    task_id: taskId,
    status: 'not_started' as const,
    order_index: 0,
    tags: [],
    created_at: new Date(),
    updated_at: new Date()
  };
  vi.mocked(mockTaskStore.addSubTask).mockImplementation(() => Promise.resolve(mockSubTask));

  const result = await TaskService.addSubTask(taskId, subTaskData);

  expect(mockTaskStore.addSubTask).toHaveBeenCalledWith(taskId, {
    title: 'New Subtask',
    description: 'Subtask Description',
    status: 'not_started',
    priority: 1
  });
  expect(result).toBe(mockSubTask);
});

test('TaskService.addSubTask: handles default priority', async () => {
  const taskId = 'task-123';
  const subTaskData = { title: 'Subtask Without Priority' };

  await TaskService.addSubTask(taskId, subTaskData);

  expect(mockTaskStore.addSubTask).toHaveBeenCalledWith(taskId, {
    title: 'Subtask Without Priority',
    description: undefined,
    status: 'not_started',
    priority: 0
  });
});

test('TaskService.updateSubTask: calls taskStore.updateSubTask with correct parameters', () => {
  const subTaskId = 'subtask-123';
  const updates = { title: 'Updated Subtask', priority: 2 };

  TaskService.updateSubTask(subTaskId, updates);

  expect(mockTaskStore.updateSubTask).toHaveBeenCalledWith(subTaskId, updates);
});

test('TaskService.addTagToTask: finds tag by ID and calls taskStore.addTagToTask', () => {
  const taskId = 'task-123';
  const tagId = 'tag-1';

  TaskService.addTagToTask(taskId, tagId);

  expect(mockTaskStore.addTagToTask).toHaveBeenCalledWith(taskId, 'Important');
});

test('TaskService.addTagToTask: does nothing when tag not found', () => {
  const taskId = 'task-123';
  const tagId = 'nonexistent-tag';

  TaskService.addTagToTask(taskId, tagId);

  expect(mockTaskStore.addTagToTask).not.toHaveBeenCalled();
});

test('TaskService.addTagToSubTask: finds tag by ID and calls taskStore.addTagToSubTask', () => {
  const subTaskId = 'subtask-123';
  const taskId = 'task-123';
  const tagId = 'tag-2';

  TaskService.addTagToSubTask(subTaskId, taskId, tagId);

  expect(mockTaskStore.addTagToSubTask).toHaveBeenCalledWith(subTaskId, 'Work');
});

test('TaskService.updateTaskDueDateForView: updates due date for today view', () => {
  const taskId = 'task-123';
  const today = new Date();
  
  TaskService.updateTaskDueDateForView(taskId, 'today');

  expect(mockTaskStore.updateTask).toHaveBeenCalledWith(taskId, {
    end_date: expect.objectContaining({
      getDate: today.getDate,
      getMonth: today.getMonth,
      getFullYear: today.getFullYear
    })
  });
});

test('TaskService.updateTaskDueDateForView: updates due date for tomorrow view', () => {
  const taskId = 'task-123';
  
  TaskService.updateTaskDueDateForView(taskId, 'tomorrow');

  expect(mockTaskStore.updateTask).toHaveBeenCalledWith(taskId, {
    end_date: expect.any(Date)
  });
});

test('TaskService.updateTaskDueDateForView: updates due date for next3days view', () => {
  const taskId = 'task-123';
  
  TaskService.updateTaskDueDateForView(taskId, 'next3days');

  expect(mockTaskStore.updateTask).toHaveBeenCalledWith(taskId, {
    end_date: expect.any(Date)
  });
});

test('TaskService.updateTaskDueDateForView: updates due date for nextweek view', () => {
  const taskId = 'task-123';
  
  TaskService.updateTaskDueDateForView(taskId, 'nextweek');

  expect(mockTaskStore.updateTask).toHaveBeenCalledWith(taskId, {
    end_date: expect.any(Date)
  });
});

test('TaskService.updateTaskDueDateForView: updates due date for thismonth view', () => {
  const taskId = 'task-123';
  
  TaskService.updateTaskDueDateForView(taskId, 'thismonth');

  expect(mockTaskStore.updateTask).toHaveBeenCalledWith(taskId, {
    end_date: expect.any(Date)
  });
});

test('TaskService.updateTaskDueDateForView: does not update for unknown view', () => {
  const taskId = 'task-123';
  
  TaskService.updateTaskDueDateForView(taskId, 'unknown-view');

  expect(mockTaskStore.updateTask).not.toHaveBeenCalled();
});

test('TaskService.updateSubTaskDueDateForView: updates due date for subtask', () => {
  const subTaskId = 'subtask-123';
  const taskId = 'task-123';
  
  TaskService.updateSubTaskDueDateForView(subTaskId, taskId, 'today');

  expect(mockTaskStore.updateSubTask).toHaveBeenCalledWith(subTaskId, {
    end_date: expect.any(Date)
  });
});

test('TaskService.changeTaskStatus: handles completion with recurrence', () => {
  const taskId = 'task-123';
  const mockRecurringTask = {
    id: taskId,
    title: 'Recurring Task',
    status: 'not_started',
    list_id: 'list-123',
    end_date: new Date('2024-01-15'),
    recurrence_rule: {
      unit: 'day',
      interval: 1
    }
  };
  
  const nextDate = new Date('2024-01-16');
  (mockTaskStore.getTaskById as ReturnType<typeof vi.fn>).mockReturnValue(mockRecurringTask);
  (mockRecurrenceService.calculateNextDate as ReturnType<typeof vi.fn>).mockReturnValue(nextDate);

  TaskService.changeTaskStatus(taskId, 'completed');

  expect(mockRecurrenceService.calculateNextDate).toHaveBeenCalledWith(
    mockRecurringTask.end_date,
    mockRecurringTask.recurrence_rule
  );
  expect(mockTaskStore.createRecurringTask).toHaveBeenCalledWith(
    expect.objectContaining({
      list_id: 'list-123',
      title: 'Recurring Task',
      status: 'not_started',
      end_date: nextDate,
      recurrence_rule: mockRecurringTask.recurrence_rule
    })
  );
  expect(mockTaskStore.updateTask).toHaveBeenCalledWith(taskId, { status: 'completed' });
});

test('TaskService.changeTaskStatus: handles completion with no recurrence', () => {
  const taskId = 'task-123';
  
  TaskService.changeTaskStatus(taskId, 'in_progress');

  expect(mockTaskStore.updateTask).toHaveBeenCalledWith(taskId, { status: 'in_progress' });
  expect(mockRecurrenceService.calculateNextDate).not.toHaveBeenCalled();
  expect(mockTaskStore.createRecurringTask).not.toHaveBeenCalled();
});

test('TaskService.changeTaskStatus: handles completion when next date calculation fails', () => {
  const taskId = 'task-123';
  const mockRecurringTask = {
    id: taskId,
    title: 'Recurring Task',
    status: 'not_started',
    list_id: 'list-123',
    end_date: new Date('2024-01-15'),
    recurrence_rule: {
      unit: 'day',
      interval: 1
    }
  };
  
  (mockTaskStore.getTaskById as ReturnType<typeof vi.fn>).mockReturnValue(mockRecurringTask);
  (mockRecurrenceService.calculateNextDate as ReturnType<typeof vi.fn>).mockReturnValue(null); // No next date

  TaskService.changeTaskStatus(taskId, 'completed');

  expect(mockRecurrenceService.calculateNextDate).toHaveBeenCalled();
  expect(mockTaskStore.createRecurringTask).not.toHaveBeenCalled();
  expect(mockTaskStore.updateTask).toHaveBeenCalledWith(taskId, { status: 'completed' });
});

test('TaskService.changeTaskStatus: handles range date recurrence', () => {
  const taskId = 'task-123';
  const startDate = new Date('2024-01-10');
  const endDate = new Date('2024-01-15');
  const nextDate = new Date('2024-01-16');
  
  const mockRecurringTask = {
    id: taskId,
    title: 'Range Task',
    status: 'not_started',
    list_id: 'list-123',
    start_date: startDate,
    end_date: endDate,
    is_range_date: true,
    recurrence_rule: {
      unit: 'day',
      interval: 1
    }
  };
  
  (mockTaskStore.getTaskById as ReturnType<typeof vi.fn>).mockReturnValue(mockRecurringTask);
  (mockRecurrenceService.calculateNextDate as ReturnType<typeof vi.fn>).mockReturnValue(nextDate);

  TaskService.changeTaskStatus(taskId, 'completed');

  expect(mockTaskStore.createRecurringTask).toHaveBeenCalledWith(
    expect.objectContaining({
      start_date: new Date('2024-01-11'), // 5日間の範囲を維持
      end_date: nextDate,
      is_range_date: true
    })
  );
});
