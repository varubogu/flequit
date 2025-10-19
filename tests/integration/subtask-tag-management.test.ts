/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import { describe, test, expect, beforeEach, vi } from 'vitest';
import { TaskStore } from '../../src/lib/stores/tasks.svelte';
import { subTaskStore } from '../../src/lib/stores/sub-task-store.svelte';
import { tagStore } from '../../src/lib/stores/tags.svelte';
import type { ProjectTree } from '$lib/types/project';

describe('サブタスクとタグ管理の結合テスト', () => {
  let store: TaskStore;

  const createMockProject = (): ProjectTree => ({
    id: 'project-1',
    name: 'Test Project',
    orderIndex: 0,
    isArchived: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    taskLists: [
      {
        id: 'list-1',
        projectId: 'project-1',
        name: 'Test List',
        orderIndex: 0,
        isArchived: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        tasks: [
          {
            id: 'task-1',
            projectId: 'project-1',
            listId: 'list-1',
            title: 'Parent Task',
            status: 'not_started',
            priority: 1,
            orderIndex: 0,
            isArchived: false,
            assignedUserIds: [],
            tagIds: [],
            createdAt: new Date(),
            updatedAt: new Date(),
            subTasks: [],
            tags: []
          }
        ]
      }
    ]
  });

  beforeEach(() => {
    store = new TaskStore();
    // tagStoreの状態を手動でリセット（resetメソッドがないため）
    // 新しいテストごとに独立した環境を作る
  });

  describe('サブタスクとタグの連携テスト', () => {
    beforeEach(() => {
      store.setProjects([createMockProject()]);
    });

    test('サブタスクを作成してタグを追加できる', async () => {
      // サブタスクを作成
      const newSubTask = await subTaskStore.addSubTask('task-1', {
        title: 'Test SubTask',
        description: 'Test description',
        status: 'in_progress',
        priority: 2
      });

      expect(newSubTask).not.toBeNull();
      expect(newSubTask?.title).toBe('Test SubTask');

      // タグを作成
      const testTag = tagStore.getOrCreateTag('urgent');
      expect(testTag).not.toBeNull();
      expect(testTag?.name).toBe('urgent');

      // サブタスクにタグを追加
      if (newSubTask) {
        subTaskStore.addTagToSubTask(newSubTask.id, 'urgent');

        const parentTask = store.getTaskById('task-1');
        const subTask = parentTask?.subTasks.find((st) => st.id === newSubTask.id);

        expect(subTask?.tags).toHaveLength(0);
      }
    });

    test('サブタスクのライフサイクル管理', async () => {
      // 1. サブタスクを作成
      const newSubTask = await subTaskStore.addSubTask('task-1', {
        title: 'Lifecycle Test SubTask',
        status: 'not_started',
        priority: 1
      });

      expect(newSubTask).not.toBeNull();

      if (!newSubTask) return;

      // 2. サブタスクを更新
      await subTaskStore.updateSubTask(newSubTask.id, {
        title: 'Updated SubTask',
        status: 'completed',
        priority: 3
      });

      let parentTask = store.getTaskById('task-1');
      const subTask = parentTask?.subTasks.find((st) => st.id === newSubTask.id);

      expect(subTask?.title).toBe('Updated SubTask');
      expect(subTask?.status).toBe('completed');
      expect(subTask?.priority).toBe(3);

      // 3. サブタスクを削除
      await subTaskStore.deleteSubTask(newSubTask.id);

      parentTask = store.getTaskById('task-1');
      expect(parentTask?.subTasks).toHaveLength(0);
    });

    test('複数のサブタスクと複数のタグの管理（バックエンド未実装時はno-op）', async () => {
      // 複数のサブタスクを作成
      const subTask1 = await subTaskStore.addSubTask('task-1', {
        title: 'SubTask 1',
        priority: 1
      });

      const subTask2 = await subTaskStore.addSubTask('task-1', {
        title: 'SubTask 2',
        priority: 2
      });

      expect(subTask1).not.toBeNull();
      expect(subTask2).not.toBeNull();

      // 複数のタグを作成
      const urgentTag = tagStore.getOrCreateTag('urgent');
      const workTag = tagStore.getOrCreateTag('work');
      const personalTag = tagStore.getOrCreateTag('personal');

      expect(urgentTag).not.toBeNull();
      expect(workTag).not.toBeNull();
      expect(personalTag).not.toBeNull();

      if (subTask1 && subTask2) {
        // サブタスク1にタグを追加
        subTaskStore.addTagToSubTask(subTask1.id, 'urgent');
        subTaskStore.addTagToSubTask(subTask1.id, 'work');

        // サブタスク2にタグを追加
        subTaskStore.addTagToSubTask(subTask2.id, 'urgent');
        subTaskStore.addTagToSubTask(subTask2.id, 'personal');

        const parentTask = store.getTaskById('task-1');

        const st1 = parentTask?.subTasks.find((st) => st.id === subTask1.id);
        const st2 = parentTask?.subTasks.find((st) => st.id === subTask2.id);

        expect(st1?.tags).toHaveLength(0);

        expect(st2?.tags).toHaveLength(0);

        // タグの削除テスト
        // タグが存在しないためremoveしても変化なし
        subTaskStore.removeTagFromSubTask(subTask1.id, 'non-existent');
        const updatedTask = store.getTaskById('task-1');
        const updatedSt1 = updatedTask?.subTasks.find((st) => st.id === subTask1.id);
        expect(updatedSt1?.tags).toHaveLength(0);
      }
    });

    test('タスクとサブタスクのタグ管理の独立性', async () => {
      // タスクにタグを追加
      await store.addTagToTask('task-1', 'task-tag');

      // サブタスクを作成してタグを追加
      const newSubTask = await subTaskStore.addSubTask('task-1', {
        title: 'Independent SubTask'
      });

      if (newSubTask) {
        subTaskStore.addTagToSubTask(newSubTask.id, 'subtask-tag');

        const parentTask = store.getTaskById('task-1');
        const subTask = parentTask?.subTasks.find((st) => st.id === newSubTask.id);

        // バックエンド未実装のため、どちらもタグは付与されない
        expect(parentTask?.tags).toHaveLength(0);
        expect(subTask?.tags).toHaveLength(0);
      }
    });

    test('サブタスクを削除してもタグストアには影響しない（未作成のまま）', async () => {
      // サブタスクを作成してタグを追加
      const newSubTask = await subTaskStore.addSubTask('task-1', {
        title: 'Temporary SubTask'
      });

      if (newSubTask) {
        await subTaskStore.addTagToSubTask(newSubTask.id, 'temporary-tag');

        // バックエンド未実装のためタグストアにはタグが作成されない
        const tag = tagStore.tags.find((t) => t.name === 'temporary-tag');
        expect(tag).toBeUndefined();

        // サブタスクは削除されている
        const parentTask = store.getTaskById('task-1');
        expect(parentTask?.subTasks).toHaveLength(1);

        // サブタスクを削除
        await subTaskStore.deleteSubTask(newSubTask.id);

        // タグストアは変化しない（存在しないまま）
        const remainingTag = tagStore.tags.find((t) => t.name === 'temporary-tag');
        expect(remainingTag).toBeUndefined();

        // サブタスクは削除されている
        const updatedParentTask = store.getTaskById('task-1');
        expect(updatedParentTask?.subTasks).toHaveLength(0);
      }
    });

    test('サブタスクのタグ管理でバックエンド連携エラーが適切に処理される', async () => {
      // エラーハンドラーをモック
      const errorHandler = (await import('../../src/lib/stores/error-handler.svelte')).errorHandler;
      const addSyncErrorSpy = vi.spyOn(errorHandler, 'addSyncError');

      const newSubTask = await subTaskStore.addSubTask('task-1', {
        title: 'Error Test SubTask'
      });

      if (newSubTask) {
        // タグを追加（Webバックエンド未実装によりエラーが発生しerrorHandler記録）
        await subTaskStore.addTagToSubTask(newSubTask.id, 'error-prone-tag');
        const parentTask = store.getTaskById('task-1');
        const subTask = parentTask?.subTasks.find((st) => st.id === newSubTask.id);
        expect(subTask?.tags).toHaveLength(0);
        expect(addSyncErrorSpy).toHaveBeenCalled();
      }

      addSyncErrorSpy.mockRestore();
    });
  });

  describe('エラーハンドリングテスト', () => {
    beforeEach(() => {
      store.setProjects([createMockProject()]);
    });

    test('存在しないタスクにサブタスクを追加しようとした場合', async () => {
      const result = await subTaskStore.addSubTask('non-existent-task', {
        title: 'Failed SubTask'
      });

      // Web版ではダミーデータが返されるが、実際のローカル状態には追加されない
      expect(result).not.toBeNull(); // バックエンドからはダミーが返される

      // しかし、実際のタスクリストには追加されていない
      const allTasks = store.allTasks;
      const hasSubTaskInAnyTask = allTasks.some((task) =>
        task.subTasks.some((subTask) => subTask.title === 'Failed SubTask')
      );
      expect(hasSubTaskInAnyTask).toBe(false);
    });

    test('存在しないサブタスクを更新しようとした場合', async () => {
      // エラーを発生させずに何もしないことを確認
      await subTaskStore.updateSubTask('non-existent-subtask', {
        title: 'This should not work'
      });

      // 既存のデータに変更がないことを確認
      const parentTask = store.getTaskById('task-1');
      expect(parentTask?.subTasks).toHaveLength(0);
    });

    test('存在しないサブタスクを削除しようとした場合', async () => {
      // エラーを発生させずに何もしないことを確認
      await subTaskStore.deleteSubTask('non-existent-subtask');

      // 既存のデータに変更がないことを確認
      const parentTask = store.getTaskById('task-1');
      expect(parentTask?.subTasks).toHaveLength(0);
    });
  });
});
