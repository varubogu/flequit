import { test, expect, vi, beforeEach, type Mock } from 'vitest';
import { TaskService } from '../../src/lib/services/domain/task';
import type { TaskWithSubTasks } from '../../src/lib/types/task';

// Mock the store imports
vi.mock('../../src/lib/stores/tasks.svelte', () => ({
  taskStore: {
    isNewTaskMode: false,
    pendingTaskSelection: null,
    pendingSubTaskSelection: null,
    cancelNewTaskMode: vi.fn(),
    getTaskById: vi.fn(),
    selectedTaskId: null,
    newTaskData: null
  }
}));

vi.mock('../../src/lib/stores/task-core-store.svelte', () => ({
  taskCoreStore: {
    toggleTaskStatus: vi.fn(),
    updateTask: vi.fn(),
    deleteTask: vi.fn(),
    addTask: vi.fn(),
    createRecurringTask: vi.fn()
  }
}));

// Mock selectionStore
vi.mock('../../src/lib/stores/selection-store.svelte', () => ({
  selectionStore: {
    selectTask: vi.fn(),
    selectSubTask: vi.fn()
  }
}));

// Mock taskListStore
vi.mock('../../src/lib/stores/task-list-store.svelte', () => ({
  taskListStore: {
    getProjectIdByListId: vi.fn()
  }
}));

// Mock subTaskStore
vi.mock('../../src/lib/stores/sub-task-store.svelte', () => ({
  subTaskStore: {
    addSubTask: vi.fn(),
    updateSubTask: vi.fn(),
    deleteSubTask: vi.fn(),
    addTagToSubTask: vi.fn()
  }
}));

// Get the mocked store for use in tests
const mockTaskStore = vi.mocked(await import('../../src/lib/stores/tasks.svelte')).taskStore;
const mockTaskCoreStore = vi.mocked(await import('../../src/lib/stores/task-core-store.svelte')).taskCoreStore;
const mockSelectionStore = vi.mocked(await import('../../src/lib/stores/selection-store.svelte')).selectionStore;
const mockTaskListStore = vi.mocked(await import('../../src/lib/stores/task-list-store.svelte')).taskListStore;
const mockSubTaskStore = vi.mocked(await import('../../src/lib/stores/sub-task-store.svelte')).subTaskStore;

// Note: deleteSubTask no longer uses window.confirm, it's handled by UI dialog

beforeEach(() => {
  vi.clearAllMocks();
  mockTaskStore.selectedTaskId = null;
  mockTaskStore.isNewTaskMode = false;
  mockTaskStore.pendingTaskSelection = null;
  mockTaskStore.pendingSubTaskSelection = null;
  (mockTaskCoreStore.deleteTask as unknown as Mock).mockResolvedValue(undefined);
  (mockTaskCoreStore.addTask as unknown as Mock).mockResolvedValue(null as unknown as TaskWithSubTasks);
});

test('TaskService.toggleTaskStatus: calls taskCoreStore.toggleTaskStatus with correct taskId', () => {
  const taskId = 'task-123';
  TaskService.toggleTaskStatus(taskId);

  expect(mockTaskCoreStore.toggleTaskStatus).toHaveBeenCalledWith(taskId);
  expect(mockTaskCoreStore.toggleTaskStatus).toHaveBeenCalledTimes(1);
});

test('TaskService.selectTask: calls selectionStore.selectTask with correct taskId', () => {
  const taskId = 'task-123';
  TaskService.selectTask(taskId);

  expect(mockSelectionStore.selectTask).toHaveBeenCalledWith(taskId);
  expect(mockSelectionStore.selectTask).toHaveBeenCalledTimes(1);
});

test('TaskService.selectSubTask: calls selectionStore.selectSubTask with correct subTaskId', () => {
  const subTaskId = 'subtask-123';
  TaskService.selectSubTask(subTaskId);

  expect(mockSelectionStore.selectSubTask).toHaveBeenCalledWith(subTaskId);
  expect(mockSelectionStore.selectSubTask).toHaveBeenCalledTimes(1);
});

test('TaskService.updateTask: calls taskCoreStore.updateTask with correct parameters', () => {
  const taskId = 'task-123';
  const updates = { title: 'Updated Title', priority: 2 };

  TaskService.updateTask(taskId, updates);

  expect(mockTaskCoreStore.updateTask).toHaveBeenCalledWith(taskId, updates);
  expect(mockTaskCoreStore.updateTask).toHaveBeenCalledTimes(1);
});

test('TaskService.updateTaskFromForm: converts form data and calls updateTask', () => {
  const taskId = 'task-123';
  const formData = {
    title: 'New Title',
    description: 'New Description',
    planStartDate: new Date('2024-01-15'),
    planEndDate: new Date('2024-01-20'),
    isRangeDate: true,
    priority: 1
  };

  TaskService.updateTaskFromForm(taskId, formData);

  expect(mockTaskCoreStore.updateTask).toHaveBeenCalledWith(taskId, {
    title: 'New Title',
    description: 'New Description',
    priority: 1,
    planStartDate: new Date('2024-01-15'),
    planEndDate: new Date('2024-01-20'),
    isRangeDate: true
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

  expect(mockTaskCoreStore.updateTask).toHaveBeenCalledWith(taskId, {
    title: 'Title Only',
    description: undefined,
    priority: 2,
    planStartDate: undefined,
    planEndDate: undefined,
    isRangeDate: false
  });
});

test('TaskService.changeTaskStatus: calls updateTask with new status', () => {
  const taskId = 'task-123';
  const newStatus = 'completed';

  TaskService.changeTaskStatus(taskId, newStatus);

  expect(mockTaskCoreStore.updateTask).toHaveBeenCalledWith(taskId, { status: newStatus });
});

test('TaskService.deleteTask: clears selection and calls taskCoreStore.deleteTask', () => {
  const taskId = 'task-123';
  mockTaskStore.selectedTaskId = taskId;
  const result = TaskService.deleteTask(taskId);

  expect(mockSelectionStore.selectTask).toHaveBeenCalledWith(null);
  expect(mockTaskCoreStore.deleteTask).toHaveBeenCalledWith(taskId);
  expect(result).toBe(true);
});

test('TaskService.addTask: calls taskCoreStore.addTask with correct parameters', async () => {
  const listId = 'list-123';
  const taskData = {
    title: 'New Task',
    description: 'Task Description',
    priority: 2
  };

  // Mock getProjectIdByListId to return a project ID
  vi.mocked(mockTaskListStore.getProjectIdByListId).mockReturnValue('project-123');

  const mockReturnTask = { id: 'new-task', title: 'New Task' } as TaskWithSubTasks;
  vi.mocked(mockTaskCoreStore.addTask).mockImplementation(() => Promise.resolve(mockReturnTask));

  const result = await TaskService.addTask(listId, taskData);

  expect(mockTaskCoreStore.addTask).toHaveBeenCalledWith(
    listId,
    expect.objectContaining({
      listId: listId,
      title: 'New Task',
      description: 'Task Description',
      status: 'not_started',
      priority: 2,
      orderIndex: 0,
      isArchived: false,
      projectId: 'project-123',
      assignedUserIds: [],
      tagIds: []
    })
  );
  expect(result).toBe(mockReturnTask);
});

test('TaskService.addTask: handles default priority', async () => {
  const listId = 'list-123';
  const taskData = {
    title: 'Task Without Priority'
  };

  // Mock getProjectIdByListId to return a project ID
  vi.mocked(mockTaskListStore.getProjectIdByListId).mockReturnValue('project-123');

  await TaskService.addTask(listId, taskData);

  expect(mockTaskCoreStore.addTask).toHaveBeenCalledWith(
    listId,
    expect.objectContaining({
      listId: listId,
      title: 'Task Without Priority',
      description: undefined,
      status: 'not_started',
      priority: 0,
      orderIndex: 0,
      isArchived: false,
      projectId: 'project-123',
      assignedUserIds: [],
      tagIds: []
    })
  );
});

test('TaskService.toggleSubTaskStatus: toggles subtask status correctly', () => {
  const task: TaskWithSubTasks = {
    id: 'task-123',
    projectId: 'proj-1',
    listId: 'list-123',
    title: 'Test Task',
    status: 'not_started',
    priority: 0,
    orderIndex: 0,
    isArchived: false,
    assignedUserIds: [],
    tagIds: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    subTasks: [
      {
        id: 'subtask-1',
        taskId: 'task-123',
        title: 'Subtask 1',
        status: 'not_started',
        orderIndex: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        tags: [],
        completed: false,
        assignedUserIds: []
      },
      {
        id: 'subtask-2',
        taskId: 'task-123',
        title: 'Subtask 2',
        status: 'completed',
        orderIndex: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
        tags: [],
        completed: false,
        assignedUserIds: []
      }
    ],
    tags: []
  };

  // Toggle not_started to completed
  TaskService.toggleSubTaskStatus(task, 'subtask-1');

  const expectedSubTasks = [{ ...task.subTasks[0], status: 'completed' }, task.subTasks[1]];

  expect(mockTaskCoreStore.updateTask).toHaveBeenCalledWith('task-123', {
    sub_tasks: expectedSubTasks
  });
});

test('TaskService.toggleSubTaskStatus: handles non-existent subtask', () => {
  const task: TaskWithSubTasks = {
    id: 'task-123',
    projectId: 'proj-1',
    listId: 'list-123',
    title: 'Test Task',
    status: 'not_started',
    priority: 0,
    orderIndex: 0,
    isArchived: false,
    assignedUserIds: [],
    tagIds: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    subTasks: [],
    tags: []
  };

  TaskService.toggleSubTaskStatus(task, 'non-existent');

  expect(mockTaskCoreStore.updateTask).not.toHaveBeenCalled();
});

test('TaskService.updateSubTaskFromForm: converts form data and calls updateSubTask', () => {
  const subTaskId = 'subtask-123';
  const formData = {
    title: 'Updated Subtask',
    description: 'Updated Description',
    planStartDate: new Date('2024-01-15'),
    planEndDate: new Date('2024-01-20'),
    isRangeDate: true,
    priority: 2
  };

  TaskService.updateSubTaskFromForm(subTaskId, formData);

  expect(mockSubTaskStore.updateSubTask).toHaveBeenCalledWith(subTaskId, {
    title: 'Updated Subtask',
    description: 'Updated Description',
    priority: 2,
    planStartDate: new Date('2024-01-15'),
    planEndDate: new Date('2024-01-20'),
    isRangeDate: true
  });
});

test('TaskService.changeSubTaskStatus: calls updateSubTask with new status', () => {
  const subTaskId = 'subtask-123';
  const newStatus = 'in_progress';

  TaskService.changeSubTaskStatus(subTaskId, newStatus);

  expect(mockSubTaskStore.updateSubTask).toHaveBeenCalledWith(subTaskId, { status: newStatus });
});

test('TaskService.deleteSubTask: calls deleteSubTask directly', () => {
  const subTaskId = 'subtask-123';

  const result = TaskService.deleteSubTask(subTaskId);

  expect(mockSubTaskStore.deleteSubTask).toHaveBeenCalledWith(subTaskId);
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

vi.mock('../../src/lib/services/composite/recurrence-composite', () => ({
  RecurrenceService: {
    calculateNextDate: vi.fn()
  }
}));

const mockRecurrenceService = vi.mocked(
  await import('../../src/lib/services/composite/recurrence-composite')
).RecurrenceService;

// Update mockTaskStore to include all required methods
Object.assign(mockTaskStore, {
  isNewTaskMode: false,
  pendingTaskSelection: null,
  pendingSubTaskSelection: null,
  cancelNewTaskMode: vi.fn(),
  addSubTask: vi.fn(),
  addTagToTask: vi.fn(),
  addTagToSubTask: vi.fn()
});

test('TaskService.selectTask: returns false when in new task mode', () => {
  Object.assign(mockTaskStore, { isNewTaskMode: true, pendingTaskSelection: null });

  const result = TaskService.selectTask('task-123');

  expect(result).toBe(false);
  expect(mockTaskStore.pendingTaskSelection).toBe('task-123');
  expect(mockSelectionStore.selectTask).not.toHaveBeenCalled();
});

test('TaskService.selectTask: returns true when not in new task mode', () => {
  Object.assign(mockTaskStore, { isNewTaskMode: false });

  const result = TaskService.selectTask('task-123');

  expect(result).toBe(true);
  expect(mockSelectionStore.selectTask).toHaveBeenCalledWith('task-123');
  expect(mockSelectionStore.selectTask).toHaveBeenCalledTimes(1);
  // Note: selectSubTask should NOT be called - mutual exclusivity handled by SelectionStore
  expect(mockSelectionStore.selectSubTask).not.toHaveBeenCalled();
});

test('TaskService.selectTask: works with null taskId', () => {
  Object.assign(mockTaskStore, { isNewTaskMode: false });

  const result = TaskService.selectTask(null);

  expect(result).toBe(true);
  expect(mockSelectionStore.selectTask).toHaveBeenCalledWith(null);
  expect(mockSelectionStore.selectSubTask).not.toHaveBeenCalled();
});

test('TaskService.selectSubTask: returns false when in new task mode', () => {
  Object.assign(mockTaskStore, { isNewTaskMode: true, pendingSubTaskSelection: null });

  const result = TaskService.selectSubTask('subtask-123');

  expect(result).toBe(false);
  expect(mockTaskStore.pendingSubTaskSelection).toBe('subtask-123');
  expect(mockSelectionStore.selectSubTask).not.toHaveBeenCalled();
  expect(mockSelectionStore.selectTask).not.toHaveBeenCalled();
});

test('TaskService.selectSubTask: returns true when not in new task mode', () => {
  Object.assign(mockTaskStore, { isNewTaskMode: false });

  const result = TaskService.selectSubTask('subtask-123');

  expect(result).toBe(true);
  expect(mockSelectionStore.selectSubTask).toHaveBeenCalledWith('subtask-123');
  expect(mockSelectionStore.selectSubTask).toHaveBeenCalledTimes(1);
  // Note: selectTask should NOT be called - mutual exclusivity handled by SelectionStore
  expect(mockSelectionStore.selectTask).not.toHaveBeenCalled();
});

test('TaskService.forceSelectTask: cancels new task mode and selects task', () => {
  Object.assign(mockTaskStore, { isNewTaskMode: true });

  TaskService.forceSelectTask('task-123');

  expect(mockTaskStore.cancelNewTaskMode).toHaveBeenCalledOnce();
  expect(mockSelectionStore.selectTask).toHaveBeenCalledWith('task-123');
  expect(mockSelectionStore.selectTask).toHaveBeenCalledTimes(1);
  // Note: selectSubTask should NOT be called - mutual exclusivity handled by SelectionStore
  expect(mockSelectionStore.selectSubTask).not.toHaveBeenCalled();
});

test('TaskService.forceSelectTask: works when not in new task mode', () => {
  Object.assign(mockTaskStore, { isNewTaskMode: false });

  TaskService.forceSelectTask('task-123');

  expect(mockTaskStore.cancelNewTaskMode).not.toHaveBeenCalled();
  expect(mockSelectionStore.selectTask).toHaveBeenCalledWith('task-123');
  expect(mockSelectionStore.selectTask).toHaveBeenCalledTimes(1);
  // Note: selectSubTask should NOT be called - mutual exclusivity handled by SelectionStore
  expect(mockSelectionStore.selectSubTask).not.toHaveBeenCalled();
});

test('TaskService.forceSelectSubTask: cancels new task mode and selects subtask', () => {
  Object.assign(mockTaskStore, { isNewTaskMode: true });

  TaskService.forceSelectSubTask('subtask-123');

  expect(mockTaskStore.cancelNewTaskMode).toHaveBeenCalledOnce();
  expect(mockSelectionStore.selectSubTask).toHaveBeenCalledWith('subtask-123');
  expect(mockSelectionStore.selectSubTask).toHaveBeenCalledTimes(1);
  // Note: selectTask should NOT be called - mutual exclusivity handled by SelectionStore
  expect(mockSelectionStore.selectTask).not.toHaveBeenCalled();
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
    taskId: taskId,
    status: 'not_started' as const,
    orderIndex: 0,
    tags: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    completed: false,
    assignedUserIds: []
  };
  vi.mocked(mockSubTaskStore.addSubTask).mockImplementation(() => Promise.resolve(mockSubTask));

  const result = await TaskService.addSubTask(taskId, subTaskData);

  expect(mockSubTaskStore.addSubTask).toHaveBeenCalledWith(taskId, {
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

  expect(mockSubTaskStore.addSubTask).toHaveBeenCalledWith(taskId, {
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

  expect(mockSubTaskStore.updateSubTask).toHaveBeenCalledWith(subTaskId, updates);
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

  expect(mockSubTaskStore.addTagToSubTask).toHaveBeenCalledWith(subTaskId, 'Work');
});

test('TaskService.updateTaskDueDateForView: updates due date for today view', () => {
  const taskId = 'task-123';
  const today = new Date();

  TaskService.updateTaskDueDateForView(taskId, 'today');

  expect(mockTaskCoreStore.updateTask).toHaveBeenCalledWith(taskId, {
    planEndDate: expect.objectContaining({
      getDate: today.getDate,
      getMonth: today.getMonth,
      getFullYear: today.getFullYear
    })
  });
});

test('TaskService.updateTaskDueDateForView: updates due date for tomorrow view', () => {
  const taskId = 'task-123';

  TaskService.updateTaskDueDateForView(taskId, 'tomorrow');

  expect(mockTaskCoreStore.updateTask).toHaveBeenCalledWith(taskId, {
    planEndDate: expect.any(Date)
  });
});

test('TaskService.updateTaskDueDateForView: updates due date for next3days view', () => {
  const taskId = 'task-123';

  TaskService.updateTaskDueDateForView(taskId, 'next3days');

  expect(mockTaskCoreStore.updateTask).toHaveBeenCalledWith(taskId, {
    planEndDate: expect.any(Date)
  });
});

test('TaskService.updateTaskDueDateForView: updates due date for nextweek view', () => {
  const taskId = 'task-123';

  TaskService.updateTaskDueDateForView(taskId, 'nextweek');

  expect(mockTaskCoreStore.updateTask).toHaveBeenCalledWith(taskId, {
    planEndDate: expect.any(Date)
  });
});

test('TaskService.updateTaskDueDateForView: updates due date for thismonth view', () => {
  const taskId = 'task-123';

  TaskService.updateTaskDueDateForView(taskId, 'thismonth');

  expect(mockTaskCoreStore.updateTask).toHaveBeenCalledWith(taskId, {
    planEndDate: expect.any(Date)
  });
});

test('TaskService.updateTaskDueDateForView: does not update for unknown view', () => {
  const taskId = 'task-123';

  TaskService.updateTaskDueDateForView(taskId, 'unknown-view');

  expect(mockTaskCoreStore.updateTask).not.toHaveBeenCalled();
});

test('TaskService.updateSubTaskDueDateForView: updates due date for subtask', () => {
  const subTaskId = 'subtask-123';
  const taskId = 'task-123';

  TaskService.updateSubTaskDueDateForView(subTaskId, taskId, 'today');

  expect(mockSubTaskStore.updateSubTask).toHaveBeenCalledWith(subTaskId, {
    planEndDate: expect.any(Date)
  });
});

test('TaskService.changeTaskStatus: handles completion with recurrence', () => {
  const taskId = 'task-123';
  const mockRecurringTask = {
    id: taskId,
    projectId: 'proj-1',
    title: 'Recurring Task',
    status: 'not_started',
    listId: 'list-123',
    planEndDate: new Date('2024-01-15'),
    recurrenceRule: { unit: 'day', interval: 1 }
  };

  const nextDate = new Date('2024-01-16');
  (mockTaskStore.getTaskById as ReturnType<typeof vi.fn>).mockReturnValue(mockRecurringTask);
  (mockRecurrenceService.calculateNextDate as ReturnType<typeof vi.fn>).mockReturnValue(nextDate);

  TaskService.changeTaskStatus(taskId, 'completed');

  expect(mockRecurrenceService.calculateNextDate).toHaveBeenCalledWith(
    mockRecurringTask.planEndDate,
    mockRecurringTask.recurrenceRule
  );
  expect(mockTaskCoreStore.createRecurringTask).toHaveBeenCalledWith(
    expect.objectContaining({
      listId: 'list-123',
      title: 'Recurring Task',
      status: 'not_started',
      planEndDate: nextDate,
      recurrenceRule: mockRecurringTask.recurrenceRule
    })
  );
  expect(mockTaskCoreStore.updateTask).toHaveBeenCalledWith(taskId, { status: 'completed' });
});

test('TaskService.changeTaskStatus: handles completion with no recurrence', () => {
  const taskId = 'task-123';

  TaskService.changeTaskStatus(taskId, 'in_progress');

  expect(mockTaskCoreStore.updateTask).toHaveBeenCalledWith(taskId, { status: 'in_progress' });
  expect(mockRecurrenceService.calculateNextDate).not.toHaveBeenCalled();
  expect(mockTaskCoreStore.createRecurringTask).not.toHaveBeenCalled();
});

test('TaskService.changeTaskStatus: handles completion when next date calculation fails', () => {
  const taskId = 'task-123';
  const mockRecurringTask = {
    id: taskId,
    projectId: 'proj-1',
    title: 'Recurring Task',
    status: 'not_started',
    listId: 'list-123',
    planEndDate: new Date('2024-01-15'),
    recurrenceRule: { unit: 'day', interval: 1 }
  };

  (mockTaskStore.getTaskById as ReturnType<typeof vi.fn>).mockReturnValue(mockRecurringTask);
  (mockRecurrenceService.calculateNextDate as ReturnType<typeof vi.fn>).mockReturnValue(null); // No next date

  TaskService.changeTaskStatus(taskId, 'completed');

  expect(mockRecurrenceService.calculateNextDate).toHaveBeenCalled();
  expect(mockTaskCoreStore.createRecurringTask).not.toHaveBeenCalled();
  expect(mockTaskCoreStore.updateTask).toHaveBeenCalledWith(taskId, { status: 'completed' });
});

test('TaskService.changeTaskStatus: handles range date recurrence', () => {
  const taskId = 'task-123';
  const startDate = new Date('2024-01-10');
  const endDate = new Date('2024-01-15');
  const nextDate = new Date('2024-01-16');

  const mockRecurringTask = {
    id: taskId,
    projectId: 'proj-1',
    title: 'Range Task',
    status: 'not_started',
    listId: 'list-123',
    planStartDate: startDate,
    planEndDate: endDate,
    isRangeDate: true,
    recurrenceRule: { unit: 'day', interval: 1 }
  };

  (mockTaskStore.getTaskById as ReturnType<typeof vi.fn>).mockReturnValue(mockRecurringTask);
  (mockRecurrenceService.calculateNextDate as ReturnType<typeof vi.fn>).mockReturnValue(nextDate);

  TaskService.changeTaskStatus(taskId, 'completed');

  expect(mockTaskCoreStore.createRecurringTask).toHaveBeenCalledWith(
    expect.objectContaining({
      planStartDate: new Date('2024-01-11'), // 5日間の範囲を維持
      planEndDate: nextDate,
      isRangeDate: true
    })
  );
});
