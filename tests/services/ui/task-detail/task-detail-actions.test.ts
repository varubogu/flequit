/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { createTaskDetailActions } from '$lib/services/ui/task-detail/task-detail-actions';
import type { TaskDetailDomainActions } from '$lib/stores/task-detail-view-store.svelte';
import type { TaskDetailViewStore } from '$lib/stores/task-detail-view-store.svelte';
import type { TaskProjectContext } from '$lib/stores/task-detail/task-detail-view-state.svelte';
import type { Project } from '$lib/types/project';
import type { TaskList } from '$lib/types/task-list';
import type { TaskWithSubTasks } from '$lib/types/task';
import type { SubTask } from '$lib/types/sub-task';

function createTask(overrides: Partial<TaskWithSubTasks> = {}): TaskWithSubTasks {
  const defaultTask: TaskWithSubTasks = {
    id: 'task-1',
    projectId: 'project-1',
    listId: 'list-1',
    title: 'Sample Task',
    description: 'desc',
    status: 'not_started',
    priority: 0,
    assignedUserIds: [],
    tagIds: [],
    orderIndex: 0,
    isArchived: false,
    deleted: false,
    updatedBy: 'test-user-id',
    createdAt: new Date(),
    updatedAt: new Date(),
    subTasks: [],
    tags: []
  };
  return { ...defaultTask, ...overrides };
}

function createSubTask(overrides: Partial<SubTask> = {}): SubTask {
  const defaultSubTask: SubTask = {
    id: 'subtask-1',
    taskId: 'task-1',
    title: 'sub',
    status: 'not_started',
    orderIndex: 0,
    assignedUserIds: [],
    completed: false,
    deleted: false,
    updatedBy: 'test-user-id',
    createdAt: new Date(),
    updatedAt: new Date()
  };
  return { ...defaultSubTask, ...overrides };
}

const createStoreStub = () => {
  const form = {
    queueSave: vi.fn(),
    handleTitleChange: vi.fn(),
    handleDescriptionChange: vi.fn(),
    handlePriorityChange: vi.fn(),
    updateDates: vi.fn(),
    updateRecurrence: vi.fn(),
    clearDates: vi.fn()
  };

  const dialogs = {
    openDatePicker: vi.fn(),
    closeDatePicker: vi.fn(),
    openDeleteDialog: vi.fn(),
    confirmDelete: vi.fn(),
    cancelDelete: vi.fn(),
    toggleSubTaskAddForm: vi.fn(),
    closeSubTaskAddForm: vi.fn(),
    openProjectTaskListDialog: vi.fn(),
    closeProjectTaskListDialog: vi.fn(),
    confirmDiscard: vi.fn(),
    cancelDiscard: vi.fn(),
    openRecurrenceDialog: vi.fn(),
    closeRecurrenceDialog: vi.fn()
  };

  const store = {
    form,
    dialogs,
    task: null as TaskWithSubTasks | null,
    subTask: null as SubTask | null,
    isSubTask: false,
    isNewTaskMode: false,
    currentItem: null as TaskWithSubTasks | SubTask | null,
    projectInfo: null as TaskProjectContext,
    dispose: vi.fn(),
    showSubTaskAddForm: false,
    selectedSubTaskId: null,
    datePickerPosition: { x: 0, y: 0 },
    showDatePicker: false,
    showConfirmationDialog: false,
    showDeleteDialog: false,
    deleteDialogTitle: '',
    deleteDialogMessage: '',
    showProjectTaskListDialog: false,
    showRecurrenceDialog: false
  } satisfies Partial<TaskDetailViewStore> & Record<string, unknown>;

  return store as unknown as TaskDetailViewStore;
};

describe('TaskDetailActionsService', () => {
  let store: TaskDetailViewStore;
  let domain: TaskDetailDomainActions;
  let recurrence: { save: Mock };
  let interactions: {
    cancelNewTaskMode: Mock;
    saveNewTask: Mock;
    updateNewTaskData: Mock;
  };

  beforeEach(() => {
    store = createStoreStub();

    domain = {
      selectTask: vi.fn(),
      selectSubTask: vi.fn(),
      forceSelectTask: vi.fn(),
      forceSelectSubTask: vi.fn(),
      changeTaskStatus: vi.fn(),
      changeSubTaskStatus: vi.fn(),
      deleteTask: vi.fn(),
      deleteSubTask: vi.fn(),
      toggleSubTaskStatus: vi.fn(),
      addSubTask: vi.fn().mockResolvedValue({ id: 'subtask-1' }),
      moveTaskToList: vi.fn()
    };

    recurrence = {
      save: vi.fn().mockResolvedValue(undefined)
    };

    interactions = {
      cancelNewTaskMode: vi.fn(),
      saveNewTask: vi.fn().mockResolvedValue('task-999'),
      updateNewTaskData: vi.fn()
    };
  });

  it('updates new task draft when status changes in new task mode', () => {
    store.isNewTaskMode = true;
    store.currentItem = createTask();

    const actions = createTaskDetailActions({ store, domain, recurrence, interactions });
    const event = { target: { value: 'completed' } } as unknown as Event;

    actions.handleStatusChange(event);

    expect(interactions.updateNewTaskData).toHaveBeenCalledWith({ status: 'completed' });
    expect(domain.changeTaskStatus).not.toHaveBeenCalled();
    expect(domain.changeSubTaskStatus).not.toHaveBeenCalled();
  });

  it('moves subtask to list via domain actions', async () => {
    const subTask = createSubTask();
    store.currentItem = subTask;
    store.isSubTask = true;

    const actions = createTaskDetailActions({ store, domain, recurrence, interactions });

    await actions.handleProjectTaskListChange({ projectId: 'project-1', taskListId: 'list-2' });

    expect(domain.moveTaskToList).toHaveBeenCalledWith(subTask.taskId, 'list-2');
  });

  it('saves recurrence rule with project context', async () => {
    store.currentItem = createTask({ id: 'task-1', updatedBy: 'test-user-id' });
    const mockProject: Project = {
      id: 'project-1',
      name: 'Project 1',
      orderIndex: 0,
      isArchived: false,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    const mockList: TaskList = {
      id: 'list-1',
      projectId: 'project-1',
      name: 'List 1',
      orderIndex: 0,
      isArchived: false,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    store.projectInfo = { project: mockProject, taskList: mockList } satisfies TaskProjectContext;

    const actions = createTaskDetailActions({ store, domain, recurrence, interactions });

    await actions.handleRecurrenceChange(null);

    expect(recurrence.save).toHaveBeenCalledWith({
      projectId: 'project-1',
      itemId: 'task-1',
      isSubTask: false,
      rule: null,
      userId: 'test-user-id'
    });
  });

  it('routes status changes through draft, subtask, and task updates', () => {
    const actions = createTaskDetailActions({ store, domain, recurrence, interactions });
    const event = { target: { value: 'in_progress' } } as unknown as Event;

    actions.handleStatusChange(event);
    expect(domain.changeTaskStatus).not.toHaveBeenCalled();

    store.currentItem = createSubTask();
    actions.handleStatusChange(event);
    expect(domain.changeSubTaskStatus).toHaveBeenCalledWith('subtask-1', 'in_progress');

    store.currentItem = createTask();
    actions.handleStatusChange(event);
    expect(domain.changeTaskStatus).toHaveBeenCalledWith('task-1', 'in_progress');
  });

  it('updates form fields and date dialog state', async () => {
    const actions = createTaskDetailActions({ store, domain, recurrence, interactions });

    actions.handleFormChange();
    actions.handleTitleChange('Title');
    actions.handleDescriptionChange('Description');
    actions.handlePriorityChange(2);
    actions.handleDueDateClick();
    actions.handleDateClear();
    actions.handleDatePickerClose();
    await actions.handleDateChange({
      date: '2024-04-01',
      dateTime: '2024-04-01T00:00:00Z',
      isRangeDate: false
    });

    expect(store.form.queueSave).toHaveBeenCalled();
    expect(store.form.handleTitleChange).toHaveBeenCalledWith('Title');
    expect(store.form.handleDescriptionChange).toHaveBeenCalledWith('Description');
    expect(store.form.handlePriorityChange).toHaveBeenCalledWith(2);
    expect(store.dialogs.openDatePicker).toHaveBeenCalled();
    expect(store.form.clearDates).toHaveBeenCalled();
    expect(store.dialogs.closeDatePicker).toHaveBeenCalled();
  });

  it('ignores delete and save when there is nothing to persist', async () => {
    const actions = createTaskDetailActions({ store, domain, recurrence, interactions });

    actions.handleDelete();
    await actions.handleSaveNewTask();
    expect(store.dialogs.openDeleteDialog).not.toHaveBeenCalled();
    expect(interactions.saveNewTask).not.toHaveBeenCalled();

    store.currentItem = createTask();
    actions.handleDelete();
    expect(store.dialogs.openDeleteDialog).toHaveBeenCalledWith(false, 'task-1');

    store.isNewTaskMode = true;
    interactions.saveNewTask.mockResolvedValueOnce(null);
    await actions.handleSaveNewTask();
    expect(domain.selectTask).not.toHaveBeenCalled();

    interactions.saveNewTask.mockResolvedValueOnce('task-999');
    await actions.handleSaveNewTask();
    expect(domain.selectTask).toHaveBeenCalledWith('task-999');
  });

  it('forwards subtask actions and parent navigation', async () => {
    store.task = createTask();
    store.currentItem = createSubTask();
    const actions = createTaskDetailActions({ store, domain, recurrence, interactions });

    actions.handleSubTaskToggle('subtask-1');
    actions.handleSubTaskClick('subtask-1');
    actions.handleAddSubTask();
    await actions.handleSubTaskAdded('child');
    actions.handleSubTaskAddCancel();
    actions.handleGoToParentTask();

    expect(domain.toggleSubTaskStatus).toHaveBeenCalled();
    expect(domain.selectSubTask).toHaveBeenCalledWith('subtask-1');
    expect(store.dialogs.toggleSubTaskAddForm).toHaveBeenCalled();
    expect(domain.addSubTask).toHaveBeenCalled();
    expect(store.dialogs.closeSubTaskAddForm).toHaveBeenCalled();
    expect(domain.selectTask).toHaveBeenCalledWith('task-1');

    store.currentItem = createTask();
    actions.handleGoToParentTask();
    expect(domain.selectTask).toHaveBeenCalledTimes(1);
  });

  it('moves a task between lists and closes the related dialogs', async () => {
    const actions = createTaskDetailActions({ store, domain, recurrence, interactions });

    await actions.handleProjectTaskListChange({ projectId: 'project-1', taskListId: 'list-2' });
    expect(domain.moveTaskToList).not.toHaveBeenCalled();

    store.currentItem = createTask();
    store.isNewTaskMode = true;
    await actions.handleProjectTaskListChange({ projectId: 'project-1', taskListId: 'list-2' });
    expect(domain.moveTaskToList).not.toHaveBeenCalled();

    store.isNewTaskMode = false;
    await actions.handleProjectTaskListChange({ projectId: 'project-1', taskListId: 'list-2' });
    expect(domain.moveTaskToList).toHaveBeenCalledWith('task-1', 'list-2');
    expect(store.dialogs.closeProjectTaskListDialog).toHaveBeenCalled();

    actions.handleProjectTaskListEdit();
    actions.handleProjectTaskListDialogClose();
    actions.handleConfirmDiscard();
    actions.handleCancelDiscard();
    actions.handleConfirmDelete();
    actions.handleCancelDelete();
    actions.handleRecurrenceDialogOpen();
    actions.handleRecurrenceDialogClose(false);

    expect(store.dialogs.openProjectTaskListDialog).toHaveBeenCalled();
    expect(store.dialogs.closeProjectTaskListDialog).toHaveBeenCalledTimes(2);
    expect(store.dialogs.confirmDiscard).toHaveBeenCalled();
    expect(store.dialogs.cancelDiscard).toHaveBeenCalled();
    expect(store.dialogs.confirmDelete).toHaveBeenCalled();
    expect(store.dialogs.cancelDelete).toHaveBeenCalled();
    expect(store.dialogs.openRecurrenceDialog).toHaveBeenCalled();
    expect(store.dialogs.closeRecurrenceDialog).toHaveBeenCalled();
  });

  it('cancels new task mode when delete invoked in draft mode', () => {
    store.currentItem = createTask();
    store.isNewTaskMode = true;

    const actions = createTaskDetailActions({ store, domain, recurrence, interactions });

    actions.handleDelete();

    expect(interactions.cancelNewTaskMode).toHaveBeenCalledTimes(1);
    expect(store.dialogs.openDeleteDialog).not.toHaveBeenCalled();
  });
});
