import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/svelte';
import TaskItem from '$lib/components/task/core/task-item.svelte';
import { TaskService } from '$lib/services/domain/task';
import { DragDropManager } from '$lib/utils/drag-drop';
import type { TaskWithSubTasks } from '$lib/types/task';

// モック
vi.mock('$lib/services/task-service', () => ({
  TaskService: {
    selectTask: vi.fn(() => true),
    toggleTaskStatus: vi.fn(),
    addTagToTask: vi.fn()
  }
}));

vi.mock('$lib/utils/drag-drop', () => ({
  DragDropManager: {
    startDrag: vi.fn(),
    handleDragOver: vi.fn(),
    handleDrop: vi.fn(),
    handleDragEnd: vi.fn(),
    handleDragEnter: vi.fn(),
    handleDragLeave: vi.fn()
  }
}));

vi.mock('$lib/stores/tasks.svelte', () => ({
  taskStore: {
    selectedTaskId: null,
    selectedSubTaskId: null
  }
}));

describe('TaskItem - Drag & Drop', () => {
  const mockTask: TaskWithSubTasks = {
    id: 'task-1',
    projectId: 'project-1',
    title: 'Test Task',
    description: '',
    status: 'not_started' as const,
    priority: 1,
    assignedUserIds: [],
    tagIds: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    subTasks: [],
    tags: [],
    listId: 'list-1',
    orderIndex: 0,
    isArchived: false
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('ドラッグ機能', () => {
    it('ドラッグ開始時にDragDropManager.startDragが呼ばれる', async () => {
      const { container } = render(TaskItem, { props: { task: mockTask } });
      const taskElement = container.querySelector('[draggable="true"]');

      const dragEvent = new Event('dragstart') as DragEvent;
      Object.defineProperty(dragEvent, 'dataTransfer', {
        value: {
          effectAllowed: '',
          setData: vi.fn()
        }
      });

      await fireEvent(taskElement!, dragEvent);

      expect(DragDropManager.startDrag).toHaveBeenCalledWith(dragEvent, {
        type: 'task',
        id: 'task-1'
      });
    });

    it('ドラッグオーバー時にDragDropManager.handleDragOverが呼ばれる', async () => {
      const { container } = render(TaskItem, { props: { task: mockTask } });
      const taskElement = container.querySelector('[draggable="true"]');

      const dragEvent = new Event('dragover') as DragEvent;
      Object.defineProperty(dragEvent, 'dataTransfer', {
        value: { dropEffect: '' }
      });

      await fireEvent(taskElement!, dragEvent);

      expect(DragDropManager.handleDragOver).toHaveBeenCalledWith(dragEvent, {
        type: 'task',
        id: 'task-1'
      });
    });

    it('ドラッグ終了時にDragDropManager.handleDragEndが呼ばれる', async () => {
      const { container } = render(TaskItem, { props: { task: mockTask } });
      const taskElement = container.querySelector('[draggable="true"]');

      const dragEvent = new Event('dragend') as DragEvent;

      await fireEvent(taskElement!, dragEvent);

      expect(DragDropManager.handleDragEnd).toHaveBeenCalledWith(dragEvent);
    });
  });

  describe('ドロップ機能', () => {
    it('タグがドロップされた場合にTaskService.addTagToTaskが呼ばれる', async () => {
      // DragDropManager.handleDropがタグのドラッグデータを返すようにモック
      vi.mocked(DragDropManager.handleDrop).mockReturnValue({
        type: 'tag',
        id: 'tag-1'
      });

      const { container } = render(TaskItem, { props: { task: mockTask } });
      const taskElement = container.querySelector('[draggable="true"]');

      const dropEvent = new Event('drop') as DragEvent;
      Object.defineProperty(dropEvent, 'dataTransfer', {
        value: { dropEffect: '' }
      });

      await fireEvent(taskElement!, dropEvent);

      expect(DragDropManager.handleDrop).toHaveBeenCalledWith(dropEvent, {
        type: 'task',
        id: 'task-1'
      });
      expect(TaskService.addTagToTask).toHaveBeenCalledWith('task-1', 'tag-1');
    });

    it('タグ以外がドロップされた場合はaddTagToTaskが呼ばれない', async () => {
      // DragDropManager.handleDropが他のタイプのドラッグデータを返すようにモック
      vi.mocked(DragDropManager.handleDrop).mockReturnValue({
        type: 'project',
        id: 'project-1'
      });

      const { container } = render(TaskItem, { props: { task: mockTask } });
      const taskElement = container.querySelector('[draggable="true"]');

      const dropEvent = new Event('drop') as DragEvent;
      Object.defineProperty(dropEvent, 'dataTransfer', {
        value: { dropEffect: '' }
      });

      await fireEvent(taskElement!, dropEvent);

      expect(DragDropManager.handleDrop).toHaveBeenCalled();
      expect(TaskService.addTagToTask).not.toHaveBeenCalled();
    });

    it('無効なドロップの場合はaddTagToTaskが呼ばれない', async () => {
      // DragDropManager.handleDropがnullを返すようにモック
      vi.mocked(DragDropManager.handleDrop).mockReturnValue(null);

      const { container } = render(TaskItem, { props: { task: mockTask } });
      const taskElement = container.querySelector('[draggable="true"]');

      const dropEvent = new Event('drop') as DragEvent;
      Object.defineProperty(dropEvent, 'dataTransfer', {
        value: { dropEffect: '' }
      });

      await fireEvent(taskElement!, dropEvent);

      expect(DragDropManager.handleDrop).toHaveBeenCalled();
      expect(TaskService.addTagToTask).not.toHaveBeenCalled();
    });
  });

  describe('ドラッグエンター/リーブ', () => {
    it('ドラッグエンター時にDragDropManager.handleDragEnterが呼ばれる', async () => {
      const { container } = render(TaskItem, { props: { task: mockTask } });
      const taskElement = container.querySelector('[draggable="true"]') as HTMLElement;

      const dragEvent = new Event('dragenter') as DragEvent;

      await fireEvent(taskElement, dragEvent);

      expect(DragDropManager.handleDragEnter).toHaveBeenCalledWith(dragEvent, taskElement);
    });

    it('ドラッグリーブ時にDragDropManager.handleDragLeaveが呼ばれる', async () => {
      const { container } = render(TaskItem, { props: { task: mockTask } });
      const taskElement = container.querySelector('[draggable="true"]') as HTMLElement;

      const dragEvent = new Event('dragleave') as DragEvent;

      await fireEvent(taskElement, dragEvent);

      expect(DragDropManager.handleDragLeave).toHaveBeenCalledWith(dragEvent, taskElement);
    });
  });
});
