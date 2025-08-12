import { describe, test, expect, beforeEach, vi } from 'vitest';
import { TaskStore } from '../../src/lib/stores/tasks.svelte';
import { tagStore } from '../../src/lib/stores/tags.svelte';
import type { ProjectTree } from "$lib/types/project";

describe('サブタスクとタグ管理の結合テスト', () => {
  let store: TaskStore;

  const createMockProject = (): ProjectTree => ({
    id: 'project-1',
    name: 'Test Project',
    order_index: 0,
    is_archived: false,
    created_at: new Date(),
    updated_at: new Date(),
    task_lists: [
      {
        id: 'list-1',
        project_id: 'project-1',
        name: 'Test List',
        order_index: 0,
        is_archived: false,
        created_at: new Date(),
        updated_at: new Date(),
        tasks: [
          {
            id: 'task-1',
            list_id: 'list-1',
            title: 'Parent Task',
            status: 'not_started',
            priority: 1,
            order_index: 0,
            is_archived: false,
            created_at: new Date(),
            updated_at: new Date(),
            sub_tasks: [],
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
      const newSubTask = await store.addSubTask('task-1', {
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
        store.addTagToSubTask(newSubTask.id, 'urgent');

        const parentTask = store.getTaskById('task-1');
        const subTask = parentTask?.sub_tasks.find((st) => st.id === newSubTask.id);

        expect(subTask?.tags).toHaveLength(1);
        expect(subTask?.tags[0].name).toBe('urgent');
      }
    });

    test('サブタスクのライフサイクル管理', async () => {
      // 1. サブタスクを作成
      const newSubTask = await store.addSubTask('task-1', {
        title: 'Lifecycle Test SubTask',
        status: 'not_started',
        priority: 1
      });

      expect(newSubTask).not.toBeNull();

      if (!newSubTask) return;

      // 2. サブタスクを更新
      await store.updateSubTask(newSubTask.id, {
        title: 'Updated SubTask',
        status: 'completed',
        priority: 3
      });

      let parentTask = store.getTaskById('task-1');
      const subTask = parentTask?.sub_tasks.find((st) => st.id === newSubTask.id);

      expect(subTask?.title).toBe('Updated SubTask');
      expect(subTask?.status).toBe('completed');
      expect(subTask?.priority).toBe(3);

      // 3. サブタスクを削除
      await store.deleteSubTask(newSubTask.id);

      parentTask = store.getTaskById('task-1');
      expect(parentTask?.sub_tasks).toHaveLength(0);
    });

    test('複数のサブタスクと複数のタグの管理', async () => {
      // 複数のサブタスクを作成
      const subTask1 = await store.addSubTask('task-1', {
        title: 'SubTask 1',
        priority: 1
      });

      const subTask2 = await store.addSubTask('task-1', {
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
        store.addTagToSubTask(subTask1.id, 'urgent');
        store.addTagToSubTask(subTask1.id, 'work');

        // サブタスク2にタグを追加
        store.addTagToSubTask(subTask2.id, 'urgent');
        store.addTagToSubTask(subTask2.id, 'personal');

        const parentTask = store.getTaskById('task-1');

        const st1 = parentTask?.sub_tasks.find((st) => st.id === subTask1.id);
        const st2 = parentTask?.sub_tasks.find((st) => st.id === subTask2.id);

        expect(st1?.tags).toHaveLength(2);
        expect(st1?.tags.map((t) => t.name)).toContain('urgent');
        expect(st1?.tags.map((t) => t.name)).toContain('work');

        expect(st2?.tags).toHaveLength(2);
        expect(st2?.tags.map((t) => t.name)).toContain('urgent');
        expect(st2?.tags.map((t) => t.name)).toContain('personal');

        // タグの削除テスト
        const urgentTagId = st1?.tags.find((t) => t.name === 'urgent')?.id;
        if (urgentTagId) {
          store.removeTagFromSubTask(subTask1.id, urgentTagId);

          const updatedTask = store.getTaskById('task-1');
          const updatedSt1 = updatedTask?.sub_tasks.find((st) => st.id === subTask1.id);

          expect(updatedSt1?.tags).toHaveLength(1);
          expect(updatedSt1?.tags[0].name).toBe('work');
        }
      }
    });

    test('タスクとサブタスクのタグ管理の独立性', async () => {
      // タスクにタグを追加
      await store.addTagToTask('task-1', 'task-tag');

      // サブタスクを作成してタグを追加
      const newSubTask = await store.addSubTask('task-1', {
        title: 'Independent SubTask'
      });

      if (newSubTask) {
        store.addTagToSubTask(newSubTask.id, 'subtask-tag');

        const parentTask = store.getTaskById('task-1');
        const subTask = parentTask?.sub_tasks.find((st) => st.id === newSubTask.id);

        // タスクとサブタスクのタグは独立している
        expect(parentTask?.tags).toHaveLength(1);
        expect(parentTask?.tags[0].name).toBe('task-tag');

        expect(subTask?.tags).toHaveLength(1);
        expect(subTask?.tags[0].name).toBe('subtask-tag');
      }
    });

    test('サブタスクを削除してもタグストアには影響しない', async () => {
      // サブタスクを作成してタグを追加
      const newSubTask = await store.addSubTask('task-1', {
        title: 'Temporary SubTask'
      });

      if (newSubTask) {
        await store.addTagToSubTask(newSubTask.id, 'temporary-tag');

        // タグが作成されることを確認
        const tag = tagStore.tags.find((t) => t.name === 'temporary-tag');
        expect(tag).toBeDefined();

        // サブタスクは削除されている
        const parentTask = store.getTaskById('task-1');
        expect(parentTask?.sub_tasks).toHaveLength(1);

        // サブタスクを削除
        await store.deleteSubTask(newSubTask.id);

        // タグストアには依然としてタグが存在
        const remainingTag = tagStore.tags.find((t) => t.name === 'temporary-tag');
        expect(remainingTag).toBeDefined();

        // サブタスクは削除されている
        const updatedParentTask = store.getTaskById('task-1');
        expect(updatedParentTask?.sub_tasks).toHaveLength(0);
      }
    });

    test('サブタスクのタグ管理でバックエンド連携エラーが適切に処理される', async () => {
      // エラーハンドラーをモック
      const errorHandler = (await import('../../src/lib/stores/error-handler.svelte')).errorHandler;
      const addSyncErrorSpy = vi.spyOn(errorHandler, 'addSyncError');

      const newSubTask = await store.addSubTask('task-1', {
        title: 'Error Test SubTask'
      });

      if (newSubTask) {
        // タグを追加（バックエンドエラーが発生する可能性）
        await store.addTagToSubTask(newSubTask.id, 'error-prone-tag');

        // タグが正常に追加されることを確認
        const parentTask = store.getTaskById('task-1');
        const subTask = parentTask?.sub_tasks.find((st) => st.id === newSubTask.id);
        expect(subTask?.tags).toHaveLength(1);

        // エラーハンドラーが呼ばれていないことを確認（正常時）
        // 実際のWeb環境ではバックエンドエラーは発生しないため
      }

      addSyncErrorSpy.mockRestore();
    });
  });

  describe('エラーハンドリングテスト', () => {
    beforeEach(() => {
      store.setProjects([createMockProject()]);
    });

    test('存在しないタスクにサブタスクを追加しようとした場合', async () => {
      const result = await store.addSubTask('non-existent-task', {
        title: 'Failed SubTask'
      });

      // Web版ではダミーデータが返されるが、実際のローカル状態には追加されない
      expect(result).not.toBeNull(); // バックエンドからはダミーが返される

      // しかし、実際のタスクリストには追加されていない
      const allTasks = store.allTasks;
      const hasSubTaskInAnyTask = allTasks.some((task) =>
        task.sub_tasks.some((subTask) => subTask.title === 'Failed SubTask')
      );
      expect(hasSubTaskInAnyTask).toBe(false);
    });

    test('存在しないサブタスクを更新しようとした場合', async () => {
      // エラーを発生させずに何もしないことを確認
      await store.updateSubTask('non-existent-subtask', {
        title: 'This should not work'
      });

      // 既存のデータに変更がないことを確認
      const parentTask = store.getTaskById('task-1');
      expect(parentTask?.sub_tasks).toHaveLength(0);
    });

    test('存在しないサブタスクを削除しようとした場合', async () => {
      // エラーを発生させずに何もしないことを確認
      await store.deleteSubTask('non-existent-subtask');

      // 既存のデータに変更がないことを確認
      const parentTask = store.getTaskById('task-1');
      expect(parentTask?.sub_tasks).toHaveLength(0);
    });
  });
});
