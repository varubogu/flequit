import { describe, test, expect, beforeEach, vi } from 'vitest';
import { render, fireEvent, screen } from '@testing-library/svelte';
import TaskAddForm from '$lib/components/task/task-add-form.svelte';
import { TaskListService } from '$lib/services/task-list-service';
import { TaskService } from '$lib/services/task-service';
import { taskStore } from '$lib/stores/tasks.svelte';
import { setTranslationService } from '$lib/stores/locale.svelte';
import {
  createUnitTestTranslationService,
  unitTestTranslations
} from '../../unit-translation-mock';

// Mock services
vi.mock('$lib/services/task-list-service', () => ({
  TaskListService: {
    addNewTask: vi.fn()
  }
}));

vi.mock('$lib/services/task-service', () => ({
  TaskService: {
    selectTask: vi.fn()
  }
}));

vi.mock('$lib/stores/tasks.svelte', () => ({
  taskStore: {
    startNewTaskMode: vi.fn(),
    updateNewTaskData: vi.fn(),
    selectedListId: 'list-1',
    projects: [
      {
        id: 'project-1',
        task_lists: [{ id: 'list-1', name: 'Test List' }]
      }
    ]
  }
}));

vi.mock('$lib/stores/view-store.svelte', () => ({
  viewStore: {}
}));

const mockTaskListService = vi.mocked(TaskListService);
const mockTaskService = vi.mocked(TaskService);
const mockTaskStore = vi.mocked(taskStore);

describe('TaskAddForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setTranslationService(createUnitTestTranslationService());
  });

  describe('rendering', () => {
    test('should render input field and buttons', () => {
      render(TaskAddForm);

      const input = screen.getByPlaceholderText(unitTestTranslations.task_title);
      const saveButton = screen.getByTitle(unitTestTranslations.add_task);
      const cancelButton = screen.getByTitle(unitTestTranslations.cancel);

      expect(input).toBeInTheDocument();
      expect(saveButton).toBeInTheDocument();
      expect(cancelButton).toBeInTheDocument();
    });

    test('should render with empty input initially', () => {
      render(TaskAddForm);

      const input = screen.getByPlaceholderText(
        unitTestTranslations.task_title
      ) as HTMLInputElement;
      expect(input.value).toBe('');
    });
  });

  describe('task creation', () => {
    test('should create task when save button is clicked', async () => {
      const taskId = 'new-task-id';
      const onTaskAdded = vi.fn();

      mockTaskListService.addNewTask.mockReturnValue(taskId);

      render(TaskAddForm, { props: { onTaskAdded } });

      const input = screen.getByPlaceholderText(
        unitTestTranslations.task_title
      ) as HTMLInputElement;
      const saveButton = screen.getByTitle(unitTestTranslations.add_task);

      // Type in the input
      await fireEvent.input(input, { target: { value: 'New task title' } });
      expect(input.value).toBe('New task title');

      // Click save
      await fireEvent.click(saveButton);

      expect(mockTaskListService.addNewTask).toHaveBeenCalledWith('New task title');
      expect(mockTaskService.selectTask).toHaveBeenCalledWith(taskId);
      expect(onTaskAdded).toHaveBeenCalled();
      expect(input.value).toBe(''); // Should clear input after saving
    });

    test('should not create task when input is empty', async () => {
      const onTaskAdded = vi.fn();

      mockTaskListService.addNewTask.mockReturnValue(null);

      render(TaskAddForm, { props: { onTaskAdded } });

      const saveButton = screen.getByTitle(unitTestTranslations.add_task);

      await fireEvent.click(saveButton);

      expect(mockTaskListService.addNewTask).toHaveBeenCalledWith('');
      expect(onTaskAdded).not.toHaveBeenCalled();
      expect(mockTaskService.selectTask).not.toHaveBeenCalled();
    });

    test('should handle failed task creation', async () => {
      const onTaskAdded = vi.fn();

      mockTaskListService.addNewTask.mockReturnValue(null);

      render(TaskAddForm, { props: { onTaskAdded } });

      const input = screen.getByPlaceholderText(
        unitTestTranslations.task_title
      ) as HTMLInputElement;
      const saveButton = screen.getByTitle(unitTestTranslations.add_task);

      await fireEvent.input(input, { target: { value: 'Failed task' } });
      await fireEvent.click(saveButton);

      expect(mockTaskListService.addNewTask).toHaveBeenCalledWith('Failed task');
      expect(mockTaskService.selectTask).not.toHaveBeenCalled();
      expect(onTaskAdded).not.toHaveBeenCalled();
      expect(input.value).toBe('Failed task'); // Should not clear input on failure
    });
  });

  describe('keyboard interactions', () => {
    test('should create task when Enter key is pressed', async () => {
      const taskId = 'new-task-id';
      const onTaskAdded = vi.fn();

      mockTaskListService.addNewTask.mockReturnValue(taskId);

      render(TaskAddForm, { props: { onTaskAdded } });

      const input = screen.getByPlaceholderText(
        unitTestTranslations.task_title
      ) as HTMLInputElement;

      await fireEvent.input(input, { target: { value: 'Keyboard task' } });
      await fireEvent.keyDown(input, { key: 'Enter' });

      expect(mockTaskListService.addNewTask).toHaveBeenCalledWith('Keyboard task');
      expect(mockTaskService.selectTask).toHaveBeenCalledWith(taskId);
      expect(onTaskAdded).toHaveBeenCalled();
    });

    test('should cancel when Escape key is pressed', async () => {
      const onCancel = vi.fn();

      render(TaskAddForm, { props: { onCancel } });

      const input = screen.getByPlaceholderText(
        unitTestTranslations.task_title
      ) as HTMLInputElement;

      await fireEvent.input(input, { target: { value: 'Cancel this task' } });
      await fireEvent.keyDown(input, { key: 'Escape' });

      expect(input.value).toBe(''); // Should clear input
      expect(onCancel).toHaveBeenCalled();
      expect(mockTaskListService.addNewTask).not.toHaveBeenCalled();
    });

    test('should not trigger action on other keys', async () => {
      const onTaskAdded = vi.fn();
      const onCancel = vi.fn();

      render(TaskAddForm, { props: { onTaskAdded, onCancel } });

      const input = screen.getByPlaceholderText(unitTestTranslations.task_title);

      await fireEvent.keyDown(input, { key: 'Tab' });
      await fireEvent.keyDown(input, { key: 'Space' });
      await fireEvent.keyDown(input, { key: 'a' });

      expect(onTaskAdded).not.toHaveBeenCalled();
      expect(onCancel).not.toHaveBeenCalled();
      expect(mockTaskListService.addNewTask).not.toHaveBeenCalled();
    });
  });

  describe('cancel functionality', () => {
    test('should clear input and call onCancel when cancel button is clicked', async () => {
      const onCancel = vi.fn();

      render(TaskAddForm, { props: { onCancel } });

      const input = screen.getByPlaceholderText(
        unitTestTranslations.task_title
      ) as HTMLInputElement;
      const cancelButton = screen.getByTitle(unitTestTranslations.cancel);

      await fireEvent.input(input, { target: { value: 'Task to cancel' } });
      expect(input.value).toBe('Task to cancel');

      await fireEvent.click(cancelButton);

      expect(input.value).toBe('');
      expect(onCancel).toHaveBeenCalled();
      expect(mockTaskListService.addNewTask).not.toHaveBeenCalled();
    });

    test('should work without onCancel prop', async () => {
      render(TaskAddForm);

      const input = screen.getByPlaceholderText(
        unitTestTranslations.task_title
      ) as HTMLInputElement;
      const cancelButton = screen.getByTitle(unitTestTranslations.cancel);

      await fireEvent.input(input, { target: { value: 'Task to cancel' } });
      await fireEvent.click(cancelButton);

      expect(input.value).toBe('');
      // Should not throw error when onCancel is not provided
    });
  });

  describe('callback handling', () => {
    test('should work without onTaskAdded prop', async () => {
      const taskId = 'new-task-id';

      mockTaskListService.addNewTask.mockReturnValue(taskId);

      render(TaskAddForm);

      const input = screen.getByPlaceholderText(
        unitTestTranslations.task_title
      ) as HTMLInputElement;
      const saveButton = screen.getByTitle(unitTestTranslations.add_task);

      await fireEvent.input(input, { target: { value: 'Task without callback' } });
      await fireEvent.click(saveButton);

      expect(mockTaskListService.addNewTask).toHaveBeenCalledWith('Task without callback');
      expect(mockTaskService.selectTask).toHaveBeenCalledWith(taskId);
      // Should not throw error when onTaskAdded is not provided
    });
  });

  describe('edit functionality', () => {
    test('should render edit button', () => {
      render(TaskAddForm);

      const editButton = screen.getByTitle(unitTestTranslations.edit_task);
      expect(editButton).toBeInTheDocument();
    });

    test('should start new task mode when edit button is clicked', async () => {
      const onTaskAdded = vi.fn();

      render(TaskAddForm, { props: { onTaskAdded } });

      const input = screen.getByPlaceholderText(
        unitTestTranslations.task_title
      ) as HTMLInputElement;
      const editButton = screen.getByTitle(unitTestTranslations.edit_task);

      await fireEvent.input(input, { target: { value: 'New task for editing' } });
      await fireEvent.click(editButton);

      expect(mockTaskStore.startNewTaskMode).toHaveBeenCalledWith('list-1');
      expect(mockTaskStore.updateNewTaskData).toHaveBeenCalledWith({
        title: 'New task for editing'
      });
      expect(input.value).toBe(''); // Should clear input
      expect(onTaskAdded).toHaveBeenCalled();
    });

    test('should always enable edit button (allows creating task without title)', async () => {
      render(TaskAddForm);

      const editButton = screen.getByTitle(unitTestTranslations.edit_task) as HTMLButtonElement;
      expect(editButton.disabled).toBe(false);

      const input = screen.getByPlaceholderText(
        unitTestTranslations.task_title
      ) as HTMLInputElement;
      await fireEvent.input(input, { target: { value: 'Some text' } });

      expect(editButton.disabled).toBe(false);
    });
  });
});
