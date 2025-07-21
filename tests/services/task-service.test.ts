import { test, expect, vi, beforeEach } from "vitest";
import { TaskService } from "../../src/lib/services/task-service";
import type { TaskWithSubTasks } from "../../src/lib/types/task";

// Mock the store import
vi.mock("../../src/lib/stores/tasks.svelte", () => ({
  taskStore: {
    toggleTaskStatus: vi.fn(),
    selectTask: vi.fn(),
    selectSubTask: vi.fn(),
    updateTask: vi.fn(),
    deleteTask: vi.fn(),
    addTask: vi.fn(),
    updateSubTask: vi.fn(),
    deleteSubTask: vi.fn()
  }
}));

// Get the mocked store for use in tests
const mockTaskStore = vi.mocked(await import("../../src/lib/stores/tasks.svelte")).taskStore;

// Mock window.confirm for deleteSubTask
Object.defineProperty(window, 'confirm', {
  writable: true,
  value: vi.fn()
});

beforeEach(() => {
  vi.clearAllMocks();
});

test("TaskService.toggleTaskStatus: calls taskStore.toggleTaskStatus with correct taskId", () => {
  const taskId = "task-123";
  TaskService.toggleTaskStatus(taskId);
  
  expect(mockTaskStore.toggleTaskStatus).toHaveBeenCalledWith(taskId);
  expect(mockTaskStore.toggleTaskStatus).toHaveBeenCalledTimes(1);
});

test("TaskService.selectTask: calls taskStore.selectTask with correct taskId", () => {
  const taskId = "task-123";
  TaskService.selectTask(taskId);
  
  expect(mockTaskStore.selectTask).toHaveBeenCalledWith(taskId);
  expect(mockTaskStore.selectTask).toHaveBeenCalledTimes(1);
});

test("TaskService.selectSubTask: calls taskStore.selectSubTask with correct subTaskId", () => {
  const subTaskId = "subtask-123";
  TaskService.selectSubTask(subTaskId);
  
  expect(mockTaskStore.selectSubTask).toHaveBeenCalledWith(subTaskId);
  expect(mockTaskStore.selectSubTask).toHaveBeenCalledTimes(1);
});

test("TaskService.updateTask: calls taskStore.updateTask with correct parameters", () => {
  const taskId = "task-123";
  const updates = { title: "Updated Title", priority: 2 };
  
  TaskService.updateTask(taskId, updates);
  
  expect(mockTaskStore.updateTask).toHaveBeenCalledWith(taskId, updates);
  expect(mockTaskStore.updateTask).toHaveBeenCalledTimes(1);
});

test("TaskService.updateTaskFromForm: converts form data and calls updateTask", () => {
  const taskId = "task-123";
  const formData = {
    title: "New Title",
    description: "New Description",
    start_date: new Date('2024-01-15'),
    end_date: new Date('2024-01-20'),
    is_range_date: true,
    priority: 1
  };
  
  TaskService.updateTaskFromForm(taskId, formData);
  
  expect(mockTaskStore.updateTask).toHaveBeenCalledWith(taskId, {
    title: "New Title",
    description: "New Description",
    priority: 1,
    start_date: new Date('2024-01-15'),
    end_date: new Date('2024-01-20'),
    is_range_date: true
  });
});

test("TaskService.updateTaskFromForm: handles empty description", () => {
  const taskId = "task-123";
  const formData = {
    title: "Title Only",
    description: "",
    priority: 2
  };
  
  TaskService.updateTaskFromForm(taskId, formData);
  
  expect(mockTaskStore.updateTask).toHaveBeenCalledWith(taskId, {
    title: "Title Only",
    description: undefined,
    priority: 2,
    start_date: undefined,
    end_date: undefined,
    is_range_date: false
  });
});

test("TaskService.changeTaskStatus: calls updateTask with new status", () => {
  const taskId = "task-123";
  const newStatus = "completed";
  
  TaskService.changeTaskStatus(taskId, newStatus);
  
  expect(mockTaskStore.updateTask).toHaveBeenCalledWith(taskId, { status: newStatus });
});

test("TaskService.deleteTask: calls taskStore.deleteTask and returns true", () => {
  const taskId = "task-123";
  const result = TaskService.deleteTask(taskId);
  
  expect(mockTaskStore.deleteTask).toHaveBeenCalledWith(taskId);
  expect(result).toBe(true);
});

test("TaskService.addTask: calls taskStore.addTask with correct parameters", () => {
  const listId = "list-123";
  const taskData = {
    title: "New Task",
    description: "Task Description",
    priority: 2
  };
  
  const mockReturnTask = { id: "new-task", title: "New Task" };
  (mockTaskStore.addTask as any).mockImplementation(() => mockReturnTask);
  
  const result = TaskService.addTask(listId, taskData);
  
  expect(mockTaskStore.addTask).toHaveBeenCalledWith(listId, {
    list_id: listId,
    title: "New Task",
    description: "Task Description",
    status: 'not_started',
    priority: 2,
    order_index: 0,
    is_archived: false
  });
  expect(result).toBe(mockReturnTask);
});

test("TaskService.addTask: handles default priority", () => {
  const listId = "list-123";
  const taskData = {
    title: "Task Without Priority"
  };
  
  TaskService.addTask(listId, taskData);
  
  expect(mockTaskStore.addTask).toHaveBeenCalledWith(listId, {
    list_id: listId,
    title: "Task Without Priority",
    description: undefined,
    status: 'not_started',
    priority: 0,
    order_index: 0,
    is_archived: false
  });
});

test("TaskService.toggleSubTaskStatus: toggles subtask status correctly", () => {
  const task: TaskWithSubTasks = {
    id: "task-123",
    list_id: "list-123",
    title: "Test Task",
    status: "not_started",
    priority: 0,
    order_index: 0,
    is_archived: false,
    created_at: new Date(),
    updated_at: new Date(),
    sub_tasks: [
      {
        id: "subtask-1",
        task_id: "task-123",
        title: "Subtask 1",
        status: "not_started",
        order_index: 0,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: "subtask-2", 
        task_id: "task-123",
        title: "Subtask 2",
        status: "completed",
        order_index: 1,
        created_at: new Date(),
        updated_at: new Date()
      }
    ],
    tags: []
  };
  
  // Toggle not_started to completed
  TaskService.toggleSubTaskStatus(task, "subtask-1");
  
  const expectedSubTasks = [
    { ...task.sub_tasks[0], status: "completed" },
    task.sub_tasks[1]
  ];
  
  expect(mockTaskStore.updateTask).toHaveBeenCalledWith("task-123", { sub_tasks: expectedSubTasks });
});

test("TaskService.toggleSubTaskStatus: handles non-existent subtask", () => {
  const task: TaskWithSubTasks = {
    id: "task-123",
    list_id: "list-123",
    title: "Test Task",
    status: "not_started",
    priority: 0,
    order_index: 0,
    is_archived: false,
    created_at: new Date(),
    updated_at: new Date(),
    sub_tasks: [],
    tags: []
  };
  
  TaskService.toggleSubTaskStatus(task, "non-existent");
  
  expect(mockTaskStore.updateTask).not.toHaveBeenCalled();
});

test("TaskService.updateSubTaskFromForm: converts form data and calls updateSubTask", () => {
  const subTaskId = "subtask-123";
  const formData = {
    title: "Updated Subtask",
    description: "Updated Description",
    start_date: new Date('2024-01-15'),
    end_date: new Date('2024-01-20'),
    is_range_date: true,
    priority: 2
  };
  
  TaskService.updateSubTaskFromForm(subTaskId, formData);
  
  expect(mockTaskStore.updateSubTask).toHaveBeenCalledWith(subTaskId, {
    title: "Updated Subtask",
    description: "Updated Description",
    priority: 2,
    start_date: new Date('2024-01-15'),
    end_date: new Date('2024-01-20'),
    is_range_date: true
  });
});

test("TaskService.changeSubTaskStatus: calls updateSubTask with new status", () => {
  const subTaskId = "subtask-123";
  const newStatus = "in_progress";
  
  TaskService.changeSubTaskStatus(subTaskId, newStatus);
  
  expect(mockTaskStore.updateSubTask).toHaveBeenCalledWith(subTaskId, { status: newStatus });
});

test("TaskService.deleteSubTask: calls deleteSubTask when confirmed", () => {
  const subTaskId = "subtask-123";
  window.confirm = vi.fn().mockReturnValue(true);
  
  const result = TaskService.deleteSubTask(subTaskId);
  
  expect(window.confirm).toHaveBeenCalledWith('Are you sure you want to delete this subtask?');
  expect(mockTaskStore.deleteSubTask).toHaveBeenCalledWith(subTaskId);
  expect(result).toBe(true);
});

test("TaskService.deleteSubTask: does not delete when cancelled", () => {
  const subTaskId = "subtask-123";
  window.confirm = vi.fn().mockReturnValue(false);
  
  const result = TaskService.deleteSubTask(subTaskId);
  
  expect(window.confirm).toHaveBeenCalledWith('Are you sure you want to delete this subtask?');
  expect(mockTaskStore.deleteSubTask).not.toHaveBeenCalled();
  expect(result).toBe(false);
});