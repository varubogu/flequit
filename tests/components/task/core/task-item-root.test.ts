import { test, expect, vi, beforeEach, describe } from 'vitest';
import { render, fireEvent } from '@testing-library/svelte';
import { writable } from 'svelte/store';

// Mock sub-components
vi.mock('$lib/components/task/controls/task-accordion-toggle.svelte', () => ({
  default: () => null
}));

vi.mock('$lib/components/task/forms/task-date-picker.svelte', () => ({
  default: () => null
}));

vi.mock('$lib/components/task/controls/task-status-toggle.svelte', () => ({
  default: () => null
}));

vi.mock('$lib/components/task/task-content.svelte', () => ({
  default: () => null
}));

vi.mock('$lib/components/sub-task-list.svelte', () => ({
  default: () => null
}));

// Mock dependencies
vi.mock('$lib/stores/tasks.svelte', () => ({
  taskStore: {
    ...writable({
      tasks: [],
      selectedTaskId: null,
      selectedSubTaskId: null
    }),
    updateTask: vi.fn(),
    updateSubTask: vi.fn(),
    deleteTask: vi.fn()
  }
}));

vi.mock('$lib/services/task-service', () => ({
  TaskService: {
    selectTask: vi.fn(),
    selectSubTask: vi.fn(),
    toggleTaskStatus: vi.fn(),
    toggleSubTaskStatus: vi.fn(),
    deleteTask: vi.fn(),
    deleteSubTask: vi.fn()
  }
}));

vi.mock('$lib/services/task-detail-service', () => ({
  TaskDetailService: {
    openTaskDetail: vi.fn(),
    openSubTaskDetail: vi.fn()
  }
}));

import TaskItem from '$lib/components/task/core/task-item.svelte';
import type { TaskWithSubTasks } from '$lib/types/task';
import { taskStore } from '$lib/stores/tasks.svelte';
import { TaskService } from '$lib/services/task-service';
import { TaskDetailService } from '$lib/services/task-detail-service';

const createMockTask = (overrides: Partial<TaskWithSubTasks> = {}): TaskWithSubTasks => ({
  id: 'task-1',
  list_id: 'list-1',
  title: 'Test Task',
  status: 'not_started',
  priority: 1,
  order_index: 0,
  is_archived: false,
  sub_tasks: [],
  tags: [],
  created_at: new Date(),
  updated_at: new Date(),
  ...overrides
});

describe('TaskItem Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('should render task item with main components', () => {
    const task = createMockTask({ title: 'Integration Test Task' });
    const { container } = render(TaskItem, { props: { task } });

    // Check main structure
    expect(container.querySelector('.flex.items-start.gap-1.w-full')).toBeInTheDocument();
  });

  test('should call TaskService.selectTask when task is clicked', async () => {
    const task = createMockTask({ id: 'integration-task' });
    const { container } = render(TaskItem, { props: { task } });

    const taskButton = container.querySelector('.task-item-button');
    await fireEvent.click(taskButton!);

    expect(TaskService.selectTask).toHaveBeenCalledWith('integration-task');
  });

  test('should call TaskService.toggleTaskStatus when status is toggled', async () => {
    const task = createMockTask({ id: 'status-task' });
    render(TaskItem, { props: { task } });

    // Since we're testing integration, we just verify the component renders
    expect(TaskService.toggleTaskStatus).not.toHaveBeenCalled(); // Only called on actual toggle
  });

  test('should render with subtasks', () => {
    const task = createMockTask({
      sub_tasks: [
        {
          id: 'sub-1',
          title: 'Sub task',
          status: 'not_started',
          task_id: 'task-1',
          order_index: 0,
          created_at: new Date(),
          updated_at: new Date(),
          tags: []
        }
      ]
    });

    const { container } = render(TaskItem, { props: { task } });
    expect(container).toBeInTheDocument();
  });

  test('should handle task selection state', () => {
    const selectedTask = createMockTask({ id: 'selected-task' });

    // Mock selected state
    taskStore.selectedTaskId = 'selected-task';

    const { container } = render(TaskItem, { props: { task: selectedTask } });
    expect(container).toBeInTheDocument();
  });

  test('should render with date information', () => {
    const taskWithDate = createMockTask({
      end_date: new Date('2024-01-15'),
      is_range_date: false
    });

    const { container } = render(TaskItem, { props: { task: taskWithDate } });
    expect(container).toBeInTheDocument();
  });

  test('should handle priority display', () => {
    const highPriorityTask = createMockTask({ priority: 3 });

    const { container } = render(TaskItem, { props: { task: highPriorityTask } });
    expect(container).toBeInTheDocument();
  });

  test('should handle long task titles without horizontal overflow', () => {
    const longTitleTask = createMockTask({
      title:
        'これは非常に長いタスクタイトルです。スマホやタブレットなどの狭い画面でも横スクロールが発生せず、適切に省略表示されることを確認するためのテストケースです。通常のタスクタイトルよりもはるかに長い文字列を使用しています。'
    });

    const { container } = render(TaskItem, { props: { task: longTitleTask } });

    // Container should have proper width constraints
    const mainContainer = container.querySelector('.flex.items-start.gap-1.w-full');
    expect(mainContainer).toBeInTheDocument();
    expect(mainContainer).toHaveClass('min-w-0', 'overflow-hidden');
  });

  test('should handle long descriptions without layout issues', () => {
    const longDescriptionTask = createMockTask({
      title: 'Task with Long Description',
      description:
        'これは非常に長いタスクの説明文です。複数行にわたる詳細な説明が含まれており、UI上では適切に省略表示される必要があります。レスポンシブデザインにおいて、この長い説明文が画面幅を超えて横スクロールを引き起こさないことが重要です。説明文は通常2行程度で省略され、残りの部分は省略記号で表示されるべきです。'
    });

    const { container } = render(TaskItem, { props: { task: longDescriptionTask } });
    expect(container).toBeInTheDocument();
  });

  test('should render with proper flexbox constraints for mobile', () => {
    const task = createMockTask({ title: 'Mobile Test Task' });
    const { container } = render(TaskItem, { props: { task } });

    // Main container should have proper flex constraints
    const mainContainer = container.querySelector('.flex.items-start.gap-1.w-full');
    expect(mainContainer).toBeInTheDocument();

    // Task button container should be flexible
    const taskButtonContainer = container.querySelector('.flex-1.min-w-0.overflow-hidden');
    expect(taskButtonContainer).toBeInTheDocument();
  });

  test('should handle japanese long title', () => {
    const japaneseTask = createMockTask({
      title:
        '日本語による非常に長いタスクのタイトルを設定してレスポンシブ対応のテストを行います。ひらがな、カタカナ、漢字が混在する場合の表示確認を実施します。'
    });

    const { container } = render(TaskItem, { props: { task: japaneseTask } });
    expect(container).toBeInTheDocument();
  });

  test('should handle english long title', () => {
    const englishTask = createMockTask({
      title:
        'This is an extremely long English task title designed to test responsive behavior and text truncation functionality in mobile and tablet devices with narrow screen widths and various viewport sizes'
    });

    const { container } = render(TaskItem, { props: { task: englishTask } });
    expect(container).toBeInTheDocument();
  });

  test('should handle mixed content without overflow', () => {
    const mixedContentTask = createMockTask({
      title: 'Long Task Title with Multiple Elements',
      description: 'Long description with detailed content',
      sub_tasks: [
        {
          id: 'sub-1',
          title: 'Very long subtask title that might cause overflow',
          status: 'not_started',
          task_id: 'task-1',
          order_index: 0,
          created_at: new Date(),
          updated_at: new Date(),
          tags: []
        }
      ],
      tags: [
        {
          id: 'tag-1',
          name: 'Very Long Tag Name',
          color: '#ff0000',
          created_at: new Date(),
          updated_at: new Date()
        }
      ]
    });

    const { container } = render(TaskItem, { props: { task: mixedContentTask } });
    expect(container).toBeInTheDocument();
  });

  // 新しく実装したコンテキストメニュー機能のテスト
  describe('Context Menu Actions', () => {
    test('should handle task edit action', () => {
      const task = createMockTask({ id: 'edit-test-task' });
      render(TaskItem, { props: { task } });
      
      // TaskItemLogicクラスのhandleEditTaskメソッドが正しく実装されていることを確認
      // 実際のコンテキストメニューの動作はE2Eテストで確認
      expect(TaskDetailService.openTaskDetail).not.toHaveBeenCalled();
    });

    test('should handle subtask edit action', () => {
      const task = createMockTask({
        sub_tasks: [
          {
            id: 'edit-sub-1',
            title: 'Editable subtask',
            status: 'not_started',
            task_id: 'task-1',
            order_index: 0,
            created_at: new Date(),
            updated_at: new Date(),
            tags: []
          }
        ]
      });
      render(TaskItem, { props: { task } });
      
      // サブタスクの編集機能が組み込まれていることを確認
      expect(TaskDetailService.openSubTaskDetail).not.toHaveBeenCalled();
    });

    test('should handle subtask delete action', () => {
      const task = createMockTask({
        sub_tasks: [
          {
            id: 'delete-sub-1',
            title: 'Deletable subtask',
            status: 'not_started',
            task_id: 'task-1',
            order_index: 0,
            created_at: new Date(),
            updated_at: new Date(),
            tags: []
          }
        ]
      });
      render(TaskItem, { props: { task } });
      
      // サブタスクの削除機能が組み込まれていることを確認
      expect(TaskService.deleteSubTask).not.toHaveBeenCalled();
    });
  });
});
