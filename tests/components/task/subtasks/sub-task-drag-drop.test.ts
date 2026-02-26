import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, fireEvent } from '@testing-library/svelte';
import SubTaskList from '$lib/components/task/subtasks/sub-task-list.svelte';
import type { TaskWithSubTasks } from '$lib/types/task';
import { DragDropManager } from '$lib/utils/drag-drop';

// Mock DragDropManager
vi.mock('$lib/utils/drag-drop', () => ({
  DragDropManager: {
    startDrag: vi.fn(),
    handleDragEnd: vi.fn()
  }
}));

// Mock DragEvent for test environment
class MockDragEvent extends Event {
  dataTransfer: DataTransfer | null;

  constructor(type: string, eventInitDict?: DragEventInit) {
    super(type, eventInitDict);
    this.dataTransfer = eventInitDict?.dataTransfer || null;
  }
}

// Make DragEvent available globally for tests
Object.defineProperty(globalThis, 'DragEvent', {
  value: MockDragEvent,
  writable: true
});

// Mock DataTransfer for test environment
class MockDataTransfer {
  effectAllowed: string = 'uninitialized';
  dropEffect: string = 'none';
  files: FileList = [] as unknown as FileList;
  items: DataTransferItemList = [] as unknown as DataTransferItemList;
  types: readonly string[] = [];

  clearData(): void {}
  getData(): string {
    return '';
  }
  setData(): void {}
  setDragImage(): void {}
}

Object.defineProperty(globalThis, 'DataTransfer', {
  value: MockDataTransfer,
  writable: true
});

describe('SubTaskList - Drag and Drop', () => {
  const mockTask: TaskWithSubTasks = {
    id: 'task-1',
    projectId: 'proj-1',
    listId: 'list-1',
    title: 'Test Task',
    description: '',
    status: 'not_started',
    priority: 0,
    orderIndex: 0,
    isArchived: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    assignedUserIds: [],
    tagIds: [],
    subTasks: [
      {
        id: 'subtask-1',
        taskId: 'task-1',
        title: 'Test SubTask 1',
        description: '',
        status: 'not_started',
        priority: 0,
        orderIndex: 0,
        tags: [],
        completed: false,
        assignedUserIds: [],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'subtask-2',
        taskId: 'task-1',
        title: 'Test SubTask 2',
        description: '',
        status: 'not_started',
        priority: 0,
        orderIndex: 1,
        tags: [],
        completed: false,
        assignedUserIds: [],
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ],
    tags: []
  };

  const mockProps = {
    task: mockTask,
    subTaskDatePickerPosition: { x: 0, y: 0 },
    showSubTaskDatePicker: false,
    handleSubTaskClick: vi.fn(),
    handleSubTaskToggle: vi.fn(),
    handleSubTaskDueDateClick: vi.fn(),
    createSubTaskContextMenu: vi.fn(() => [])
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render subtasks with draggable attribute', () => {
    render(SubTaskList, mockProps);

    // Find draggable containers
    const draggableElements = document.querySelectorAll('[draggable="true"]');
    expect(draggableElements).toHaveLength(2);
  });

  it('should call DragDropManager.startDrag on dragstart with correct data', async () => {
    const { container } = render(SubTaskList, mockProps);

    const draggableElement = container.querySelector('[draggable="true"]');
    expect(draggableElement).toBeTruthy();

    const dragEvent = new DragEvent('dragstart', {
      bubbles: true,
      cancelable: true,
      dataTransfer: new DataTransfer()
    });

    await fireEvent(draggableElement!, dragEvent);

    expect(DragDropManager.startDrag).toHaveBeenCalledWith(dragEvent, {
      type: 'subtask',
      id: 'subtask-1',
      taskId: 'task-1'
    });
  });

  it('should call DragDropManager.handleDragEnd on dragend', async () => {
    const { container } = render(SubTaskList, mockProps);

    const draggableElement = container.querySelector('[draggable="true"]');
    expect(draggableElement).toBeTruthy();

    const dragEvent = new DragEvent('dragend', {
      bubbles: true,
      cancelable: true
    });

    await fireEvent(draggableElement!, dragEvent);

    expect(DragDropManager.handleDragEnd).toHaveBeenCalledWith(dragEvent);
  });

  it('should handle multiple subtasks drag and drop correctly', async () => {
    const { container } = render(SubTaskList, mockProps);

    const draggableElements = container.querySelectorAll('[draggable="true"]');
    expect(draggableElements).toHaveLength(2);

    // Test first subtask
    const dragEvent1 = new DragEvent('dragstart', {
      bubbles: true,
      cancelable: true,
      dataTransfer: new DataTransfer()
    });

    await fireEvent(draggableElements[0], dragEvent1);

    expect(DragDropManager.startDrag).toHaveBeenCalledWith(dragEvent1, {
      type: 'subtask',
      id: 'subtask-1',
      taskId: 'task-1'
    });

    // Test second subtask
    const dragEvent2 = new DragEvent('dragstart', {
      bubbles: true,
      cancelable: true,
      dataTransfer: new DataTransfer()
    });

    await fireEvent(draggableElements[1], dragEvent2);

    expect(DragDropManager.startDrag).toHaveBeenCalledWith(dragEvent2, {
      type: 'subtask',
      id: 'subtask-2',
      taskId: 'task-1'
    });
  });
});
