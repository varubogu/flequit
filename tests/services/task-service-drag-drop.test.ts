import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TaskService } from '$lib/services/domain/task';

// TaskStoreをモック
vi.mock('$lib/stores/tasks.svelte', () => ({
  taskStore: {
    addTagToTask: vi.fn()
  }
}));

vi.mock('$lib/stores/task-core-store.svelte', () => ({
  taskCoreStore: {
    updateTask: vi.fn()
  }
}));

// TagStoreをモック
vi.mock('$lib/stores/tags.svelte', () => ({
  tagStore: {
    tags: [
      { id: 'tag-1', name: 'Work', color: '#blue' },
      { id: 'tag-2', name: 'Personal', color: '#green' }
    ]
  }
}));

const mockTaskStore = vi.mocked(await import('$lib/stores/tasks.svelte')).taskStore;
const mockTaskCoreStore = vi.mocked(await import('$lib/stores/task-core-store.svelte')).taskCoreStore;

describe('TaskService - Drag & Drop', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('addTagToTask', () => {
    it('タスクにタグを追加する（IDからタグ名に変換）', () => {
      const taskId = 'task-1';
      const tagId = 'tag-1';

      TaskService.addTagToTask(taskId, tagId);

      expect(mockTaskStore.addTagToTask).toHaveBeenCalledWith(taskId, 'Work');
    });

    it('存在しないタグIDの場合は何もしない', () => {
      const taskId = 'task-1';
      const nonExistentTagId = 'non-existent-tag';

      TaskService.addTagToTask(taskId, nonExistentTagId);

      expect(mockTaskStore.addTagToTask).not.toHaveBeenCalled();
    });
  });

  describe('updateTaskDueDateForView', () => {
    beforeEach(() => {
      // 固定日付でテスト
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2024-01-15T10:00:00Z'));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('todayビューにドロップされた場合、今日の日付を設定する', () => {
      const taskId = 'task-1';
      const viewId = 'today';

      TaskService.updateTaskDueDateForView(taskId, viewId);

      expect(mockTaskCoreStore.updateTask).toHaveBeenCalledWith(taskId, {
        planEndDate: new Date('2024-01-15T10:00:00Z')
      });
    });

    it('tomorrowビューにドロップされた場合、明日の日付を設定する', () => {
      const taskId = 'task-1';
      const viewId = 'tomorrow';

      TaskService.updateTaskDueDateForView(taskId, viewId);

      const expectedDate = new Date('2024-01-15T10:00:00Z');
      expectedDate.setDate(expectedDate.getDate() + 1);

      expect(mockTaskCoreStore.updateTask).toHaveBeenCalledWith(taskId, {
        planEndDate: expectedDate
      });
    });

    it('next3daysビューにドロップされた場合、3日後の日付を設定する', () => {
      const taskId = 'task-1';
      const viewId = 'next3days';

      TaskService.updateTaskDueDateForView(taskId, viewId);

      const expectedDate = new Date('2024-01-15T10:00:00Z');
      expectedDate.setDate(expectedDate.getDate() + 3);

      expect(mockTaskCoreStore.updateTask).toHaveBeenCalledWith(taskId, {
        planEndDate: expectedDate
      });
    });

    it('nextweekビューにドロップされた場合、1週間後の日付を設定する', () => {
      const taskId = 'task-1';
      const viewId = 'nextweek';

      TaskService.updateTaskDueDateForView(taskId, viewId);

      const expectedDate = new Date('2024-01-15T10:00:00Z');
      expectedDate.setDate(expectedDate.getDate() + 7);

      expect(mockTaskCoreStore.updateTask).toHaveBeenCalledWith(taskId, {
        planEndDate: expectedDate
      });
    });

    it('thismonthビューにドロップされた場合、月末の日付を設定する', () => {
      const taskId = 'task-1';
      const viewId = 'thismonth';

      TaskService.updateTaskDueDateForView(taskId, viewId);

      const expectedDate = new Date(2024, 1, 0); // 1月の最後の日

      expect(mockTaskCoreStore.updateTask).toHaveBeenCalledWith(taskId, {
        planEndDate: expectedDate
      });
    });

    it('対応していないビューの場合は何もしない', () => {
      const taskId = 'task-1';
      const viewId = 'unknown-view';

      TaskService.updateTaskDueDateForView(taskId, viewId);

      expect(mockTaskCoreStore.updateTask).not.toHaveBeenCalled();
    });

    it('allビューの場合は何もしない', () => {
      const taskId = 'task-1';
      const viewId = 'all';

      TaskService.updateTaskDueDateForView(taskId, viewId);

      expect(mockTaskCoreStore.updateTask).not.toHaveBeenCalled();
    });

    it('completedビューの場合は何もしない', () => {
      const taskId = 'task-1';
      const viewId = 'completed';

      TaskService.updateTaskDueDateForView(taskId, viewId);

      expect(mockTaskCoreStore.updateTask).not.toHaveBeenCalled();
    });
  });
});
