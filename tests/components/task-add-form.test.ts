import { describe, test, expect, beforeEach, vi } from 'vitest';
import { render, fireEvent, screen } from '@testing-library/svelte';
import TaskAddForm from '../../src/lib/components/task-add-form.svelte';
import { TaskListService } from '../../src/lib/services/task-list-service';
import { TaskService } from '../../src/lib/services/task-service';

// Mock services
vi.mock('../../src/lib/services/task-list-service', () => ({
  TaskListService: {
    addNewTask: vi.fn()
  }
}));

vi.mock('../../src/lib/services/task-service', () => ({
  TaskService: {
    selectTask: vi.fn()
  }
}));

const mockTaskListService = vi.mocked(TaskListService);
const mockTaskService = vi.mocked(TaskService);

describe('TaskAddForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    test('should render input field and buttons', () => {
      render(TaskAddForm);
      
      const input = screen.getByPlaceholderText('Enter task title...');
      const saveButton = screen.getByTitle('Add Task');
      const cancelButton = screen.getByTitle('Cancel');
      
      expect(input).toBeInTheDocument();
      expect(saveButton).toBeInTheDocument();
      expect(cancelButton).toBeInTheDocument();
    });

    test('should render with empty input initially', () => {
      render(TaskAddForm);
      
      const input = screen.getByPlaceholderText('Enter task title...') as HTMLInputElement;
      expect(input.value).toBe('');
    });
  });

  describe('task creation', () => {
    test('should create task when save button is clicked', async () => {
      const taskId = 'new-task-id';
      const onTaskAdded = vi.fn();
      
      mockTaskListService.addNewTask.mockReturnValue(taskId);
      
      render(TaskAddForm, { props: { onTaskAdded } });
      
      const input = screen.getByPlaceholderText('Enter task title...') as HTMLInputElement;
      const saveButton = screen.getByTitle('Add Task');
      
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
      
      const saveButton = screen.getByTitle('Add Task');
      
      await fireEvent.click(saveButton);
      
      expect(mockTaskListService.addNewTask).toHaveBeenCalledWith('');
      expect(onTaskAdded).not.toHaveBeenCalled();
      expect(mockTaskService.selectTask).not.toHaveBeenCalled();
    });

    test('should handle failed task creation', async () => {
      const onTaskAdded = vi.fn();
      
      mockTaskListService.addNewTask.mockReturnValue(null);
      
      render(TaskAddForm, { props: { onTaskAdded } });
      
      const input = screen.getByPlaceholderText('Enter task title...') as HTMLInputElement;
      const saveButton = screen.getByTitle('Add Task');
      
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
      
      const input = screen.getByPlaceholderText('Enter task title...') as HTMLInputElement;
      
      await fireEvent.input(input, { target: { value: 'Keyboard task' } });
      await fireEvent.keyDown(input, { key: 'Enter' });
      
      expect(mockTaskListService.addNewTask).toHaveBeenCalledWith('Keyboard task');
      expect(mockTaskService.selectTask).toHaveBeenCalledWith(taskId);
      expect(onTaskAdded).toHaveBeenCalled();
    });

    test('should cancel when Escape key is pressed', async () => {
      const onCancel = vi.fn();
      
      render(TaskAddForm, { props: { onCancel } });
      
      const input = screen.getByPlaceholderText('Enter task title...') as HTMLInputElement;
      
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
      
      const input = screen.getByPlaceholderText('Enter task title...');
      
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
      
      const input = screen.getByPlaceholderText('Enter task title...') as HTMLInputElement;
      const cancelButton = screen.getByTitle('Cancel');
      
      await fireEvent.input(input, { target: { value: 'Task to cancel' } });
      expect(input.value).toBe('Task to cancel');
      
      await fireEvent.click(cancelButton);
      
      expect(input.value).toBe('');
      expect(onCancel).toHaveBeenCalled();
      expect(mockTaskListService.addNewTask).not.toHaveBeenCalled();
    });

    test('should work without onCancel prop', async () => {
      render(TaskAddForm);
      
      const input = screen.getByPlaceholderText('Enter task title...') as HTMLInputElement;
      const cancelButton = screen.getByTitle('Cancel');
      
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
      
      const input = screen.getByPlaceholderText('Enter task title...') as HTMLInputElement;
      const saveButton = screen.getByTitle('Add Task');
      
      await fireEvent.input(input, { target: { value: 'Task without callback' } });
      await fireEvent.click(saveButton);
      
      expect(mockTaskListService.addNewTask).toHaveBeenCalledWith('Task without callback');
      expect(mockTaskService.selectTask).toHaveBeenCalledWith(taskId);
      // Should not throw error when onTaskAdded is not provided
    });
  });
});