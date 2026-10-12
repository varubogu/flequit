import { beforeEach, describe, expect, it, vi } from 'vitest';

const { subTaskStore, taskListUIState } = vi.hoisted(() => ({
  subTaskStore: { getTaskIdBySubTaskId: vi.fn() },
  taskListUIState: { expandTask: vi.fn() }
}));

vi.mock('$lib/stores/sub-task-store.svelte', () => ({ subTaskStore }));
vi.mock('$lib/stores/task-list/task-list-ui-state.svelte', () => ({ taskListUIState }));

import {
  handleAddSubTaskImpl,
  handleSubTaskAddCancelImpl,
  handleSubTaskAddedImpl,
  handleSubTaskClickImpl,
  handleSubTaskToggleImpl
} from '$lib/services/ui/task-detail/task-detail-subtask-handlers';
import type { TaskDetailDomainActions } from '$lib/stores/task-detail/task-detail-types';
import type { TaskDetailViewStore } from '$lib/stores/task-detail-view-store.svelte';
import type { TaskWithSubTasks } from '$lib/types/task';

function createStore(task: TaskWithSubTasks | null = null) {
  return {
    task,
    dialogs: {
      toggleSubTaskAddForm: vi.fn(),
      closeSubTaskAddForm: vi.fn()
    }
  } as unknown as TaskDetailViewStore;
}

function createDomain(): TaskDetailDomainActions {
  return {
    toggleSubTaskStatus: vi.fn(),
    selectSubTask: vi.fn(),
    addSubTask: vi.fn()
  } as unknown as TaskDetailDomainActions;
}

describe('task detail subtask handlers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('ignores a status toggle when no task is selected', () => {
    const domain = createDomain();
    handleSubTaskToggleImpl(createStore(null), domain, 'sub-1');
    expect(domain.toggleSubTaskStatus).not.toHaveBeenCalled();
  });

  it('toggles the selected task subtask status', () => {
    const domain = createDomain();
    const task = { id: 'task-1' } as TaskWithSubTasks;
    handleSubTaskToggleImpl(createStore(task), domain, 'sub-1');
    expect(domain.toggleSubTaskStatus).toHaveBeenCalledWith(task, 'sub-1');
  });

  it('expands the parent task when one exists and always selects the subtask', () => {
    const domain = createDomain();
    subTaskStore.getTaskIdBySubTaskId.mockReturnValueOnce('task-1');

    handleSubTaskClickImpl(domain, 'sub-1');

    expect(taskListUIState.expandTask).toHaveBeenCalledWith('task-1');
    expect(domain.selectSubTask).toHaveBeenCalledWith('sub-1');

    subTaskStore.getTaskIdBySubTaskId.mockReturnValueOnce(null);
    handleSubTaskClickImpl(domain, 'sub-2');
    expect(taskListUIState.expandTask).toHaveBeenCalledTimes(1);
    expect(domain.selectSubTask).toHaveBeenCalledWith('sub-2');
  });

  it('toggles and cancels the add form', () => {
    const store = createStore();
    handleAddSubTaskImpl(store);
    handleSubTaskAddCancelImpl(store);
    expect(store.dialogs.toggleSubTaskAddForm).toHaveBeenCalled();
    expect(store.dialogs.closeSubTaskAddForm).toHaveBeenCalled();
  });

  it('does not create a subtask without a task or a title', async () => {
    const domain = createDomain();
    await handleSubTaskAddedImpl(createStore(null), domain, 'Title');
    await handleSubTaskAddedImpl(createStore({ id: 'task-1' } as TaskWithSubTasks), domain, '   ');
    expect(domain.addSubTask).not.toHaveBeenCalled();
  });

  it('closes the form only when creation returns a subtask', async () => {
    const domain = createDomain();
    const store = createStore({ id: 'task-1' } as TaskWithSubTasks);
    vi.mocked(domain.addSubTask).mockResolvedValueOnce(null);

    await handleSubTaskAddedImpl(store, domain, '  New subtask  ');
    expect(domain.addSubTask).toHaveBeenCalledWith('task-1', { title: 'New subtask' });
    expect(store.dialogs.closeSubTaskAddForm).not.toHaveBeenCalled();

    vi.mocked(domain.addSubTask).mockResolvedValueOnce({ id: 'sub-1' });
    await handleSubTaskAddedImpl(store, domain, 'Another');
    expect(store.dialogs.closeSubTaskAddForm).toHaveBeenCalled();
  });
});
