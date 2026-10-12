import { afterEach, describe, expect, test, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/svelte';
import TaskAddForm from '$lib/components/task/forms/task-add-form.svelte';
import { TaskListService } from '$lib/services/domain/task-list';
import { taskInteractions } from '$lib/services/ui/task';
import { selectionStore } from '$lib/stores/selection-store.svelte';

const taskState = vi.hoisted(() => ({
  selectedListId: null as string | null,
  projects: [] as Array<{ id: string; taskLists: Array<{ id: string }> }>
}));

vi.mock('$lib/stores/tasks.svelte', () => ({
  taskStore: taskState
}));

vi.mock('$lib/services/domain/task-list', () => ({
  TaskListService: { addNewTask: vi.fn() },
  configureTaskListSelectionResolver: vi.fn()
}));

vi.mock('$lib/services/ui/task', () => ({
  taskInteractions: {
    startNewTaskMode: vi.fn(),
    updateNewTaskData: vi.fn()
  }
}));

afterEach(() => {
  taskState.selectedListId = null;
  taskState.projects = [];
  selectionStore.reset();
  vi.clearAllMocks();
});

async function typeTitle(title: string) {
  await fireEvent.input(screen.getByPlaceholderText('task_title_placeholder'), {
    target: { value: title }
  });
}

describe('TaskAddForm list selection', () => {
  test('uses the selected list, then the first list that contains tasks', async () => {
    const onTaskAdded = vi.fn();
    vi.mocked(TaskListService.addNewTask).mockResolvedValue('task-new');
    taskState.selectedListId = 'list-selected';
    render(TaskAddForm, { props: { onTaskAdded } });

    await typeTitle('  Buy milk  ');
    await fireEvent.click(screen.getByTitle('add_task'));
    expect(TaskListService.addNewTask).toHaveBeenCalledWith('  Buy milk  ');
    expect(selectionStore.selectedTaskId).toBe('task-new');
    expect(onTaskAdded).toHaveBeenCalledOnce();

    taskState.selectedListId = null;
    taskState.projects = [
      { id: 'empty-project', taskLists: [] },
      { id: 'project-1', taskLists: [{ id: 'list-fallback' }] }
    ];
    await typeTitle('Fallback');
    await fireEvent.click(screen.getByTitle('edit_task'));
    expect(taskInteractions.startNewTaskMode).toHaveBeenCalledWith('list-fallback');
    expect(taskInteractions.updateNewTaskData).toHaveBeenCalledWith({ title: 'Fallback' });
  });

  test('does not add or edit when no list exists, and skips a blank edit title', async () => {
    taskState.projects = [{ id: 'empty-project', taskLists: [] }];
    render(TaskAddForm, { props: {} });

    await typeTitle('Nowhere');
    await fireEvent.click(screen.getByTitle('add_task'));
    expect(TaskListService.addNewTask).not.toHaveBeenCalled();

    await fireEvent.click(screen.getByTitle('edit_task'));
    expect(taskInteractions.startNewTaskMode).not.toHaveBeenCalled();

    taskState.selectedListId = 'list-1';
    await fireEvent.input(screen.getByPlaceholderText('task_title_placeholder'), {
      target: { value: '   ' }
    });
    await fireEvent.click(screen.getByTitle('edit_task'));
    expect(taskInteractions.startNewTaskMode).toHaveBeenCalledWith('list-1');
    expect(taskInteractions.updateNewTaskData).not.toHaveBeenCalled();
  });

  test('leaves the title in place when the new task is not created', async () => {
    vi.mocked(TaskListService.addNewTask).mockResolvedValue(null);
    taskState.selectedListId = 'list-1';
    const onTaskAdded = vi.fn();
    render(TaskAddForm, { props: { onTaskAdded } });

    await typeTitle('Keep me');
    await fireEvent.click(screen.getByTitle('add_task'));

    expect(selectionStore.selectedTaskId).toBeNull();
    expect(onTaskAdded).not.toHaveBeenCalled();
    expect(screen.getByPlaceholderText('task_title_placeholder')).toHaveValue('Keep me');
  });
});
