import { describe, it, expect, beforeEach } from 'vitest';
import { taskStore } from '$lib/stores/tasks.svelte';
import type { ProjectTree } from '$lib/types/task';

describe('ドラッグ&ドロップワークフロー統合テスト', () => {
  beforeEach(() => {
    // テスト前にタスクストアをリセット
    taskStore.projects = [];
    taskStore.selectedProjectId = null;
    taskStore.selectedListId = null;
  });

  describe('プロジェクトの並び替え', () => {
    it('プロジェクトの順序を正しく変更できる', () => {
      // テストデータを設定
      const project1 = taskStore.addProject({ name: 'プロジェクト1', color: '#ff0000' });
      const project2 = taskStore.addProject({ name: 'プロジェクト2', color: '#00ff00' });
      const project3 = taskStore.addProject({ name: 'プロジェクト3', color: '#0000ff' });

      expect(project1).toBeTruthy();
      expect(project2).toBeTruthy();
      expect(project3).toBeTruthy();

      // 初期順序を確認
      expect(taskStore.projects.map((p) => p.name)).toEqual([
        'プロジェクト1',
        'プロジェクト2',
        'プロジェクト3'
      ]);

      // プロジェクト3を先頭に移動
      taskStore.moveProjectToPosition(project3!.id, 0);

      expect(taskStore.projects.map((p) => p.name)).toEqual([
        'プロジェクト3',
        'プロジェクト1',
        'プロジェクト2'
      ]);

      // order_indexが正しく設定されているか確認
      expect(taskStore.projects[0].order_index).toBe(0);
      expect(taskStore.projects[1].order_index).toBe(1);
      expect(taskStore.projects[2].order_index).toBe(2);
    });

    it('複数回の並び替えが正しく動作する', () => {
      const project1 = taskStore.addProject({ name: 'A', color: '#ff0000' });
      const project2 = taskStore.addProject({ name: 'B', color: '#00ff00' });
      const project3 = taskStore.addProject({ name: 'C', color: '#0000ff' });
      const project4 = taskStore.addProject({ name: 'D', color: '#ffff00' });

      expect(project1 && project2 && project3 && project4).toBeTruthy();

      // B を最後に移動
      taskStore.moveProjectToPosition(project2!.id, 3);
      expect(taskStore.projects.map((p) => p.name)).toEqual(['A', 'C', 'D', 'B']);

      // D を先頭に移動
      taskStore.moveProjectToPosition(project4!.id, 0);
      expect(taskStore.projects.map((p) => p.name)).toEqual(['D', 'A', 'C', 'B']);

      // C を A の前に移動
      taskStore.moveProjectToPosition(project3!.id, 1);
      expect(taskStore.projects.map((p) => p.name)).toEqual(['D', 'C', 'A', 'B']);
    });
  });

  describe('タスクリストの並び替え', () => {
    it('同一プロジェクト内でタスクリストを並び替えできる', () => {
      const project = taskStore.addProject({ name: 'テストプロジェクト', color: '#ff0000' });
      expect(project).toBeTruthy();

      const list1 = taskStore.addTaskList(project!.id, { name: 'リスト1' });
      const list2 = taskStore.addTaskList(project!.id, { name: 'リスト2' });
      const list3 = taskStore.addTaskList(project!.id, { name: 'リスト3' });

      expect(list1 && list2 && list3).toBeTruthy();

      // 初期順序を確認
      expect(taskStore.projects[0].task_lists.map((l) => l.name)).toEqual([
        'リスト1',
        'リスト2',
        'リスト3'
      ]);

      // リスト3を先頭に移動
      taskStore.moveTaskListToPosition(list3!.id, project!.id, 0);

      expect(taskStore.projects[0].task_lists.map((l) => l.name)).toEqual([
        'リスト3',
        'リスト1',
        'リスト2'
      ]);

      // order_indexが正しく設定されているか確認
      expect(taskStore.projects[0].task_lists[0].order_index).toBe(0);
      expect(taskStore.projects[0].task_lists[1].order_index).toBe(1);
      expect(taskStore.projects[0].task_lists[2].order_index).toBe(2);
    });

    it('タスクリストを別プロジェクトに移動できる', () => {
      const project1 = taskStore.addProject({ name: 'プロジェクト1', color: '#ff0000' });
      const project2 = taskStore.addProject({ name: 'プロジェクト2', color: '#00ff00' });

      expect(project1 && project2).toBeTruthy();

      const list1 = taskStore.addTaskList(project1!.id, { name: 'リスト1' });
      const list2 = taskStore.addTaskList(project1!.id, { name: 'リスト2' });
      const list3 = taskStore.addTaskList(project2!.id, { name: 'リスト3' });

      expect(list1 && list2 && list3).toBeTruthy();

      // 初期状態を確認
      expect(taskStore.projects[0].task_lists.map((l) => l.name)).toEqual(['リスト1', 'リスト2']);
      expect(taskStore.projects[1].task_lists.map((l) => l.name)).toEqual(['リスト3']);

      // リスト2をプロジェクト2に移動
      taskStore.moveTaskListToProject(list2!.id, project2!.id);

      expect(taskStore.projects[0].task_lists.map((l) => l.name)).toEqual(['リスト1']);
      expect(taskStore.projects[1].task_lists.map((l) => l.name)).toEqual(['リスト3', 'リスト2']);

      // プロジェクトIDが正しく更新されているか確認
      const movedList = taskStore.projects[1].task_lists.find((l) => l.name === 'リスト2');
      expect(movedList?.project_id).toBe(project2!.id);
    });

    it('タスクリストを別プロジェクトの指定位置に移動できる', () => {
      const project1 = taskStore.addProject({ name: 'プロジェクト1', color: '#ff0000' });
      const project2 = taskStore.addProject({ name: 'プロジェクト2', color: '#00ff00' });

      expect(project1 && project2).toBeTruthy();

      const listA = taskStore.addTaskList(project1!.id, { name: 'リストA' });
      const listB = taskStore.addTaskList(project2!.id, { name: 'リストB' });
      const listC = taskStore.addTaskList(project2!.id, { name: 'リストC' });

      expect(listA && listB && listC).toBeTruthy();

      // 初期状態
      expect(taskStore.projects[0].task_lists.map((l) => l.name)).toEqual(['リストA']);
      expect(taskStore.projects[1].task_lists.map((l) => l.name)).toEqual(['リストB', 'リストC']);

      // リストAをプロジェクト2の先頭（リストBの前）に移動
      taskStore.moveTaskListToPosition(listA!.id, project2!.id, 0);

      expect(taskStore.projects[0].task_lists.map((l) => l.name)).toEqual([]);
      expect(taskStore.projects[1].task_lists.map((l) => l.name)).toEqual([
        'リストA',
        'リストB',
        'リストC'
      ]);

      // order_indexが正しく設定されているか確認
      expect(taskStore.projects[1].task_lists[0].order_index).toBe(0);
      expect(taskStore.projects[1].task_lists[1].order_index).toBe(1);
      expect(taskStore.projects[1].task_lists[2].order_index).toBe(2);
    });
  });

  describe('エラーケース', () => {
    it('存在しないプロジェクトIDで移動操作をしても例外が発生しない', () => {
      const project = taskStore.addProject({ name: 'テストプロジェクト', color: '#ff0000' });
      expect(project).toBeTruthy();

      expect(() => {
        taskStore.moveProjectToPosition('non-existent-id', 0);
      }).not.toThrow();

      // プロジェクトの状態は変わらない
      expect(taskStore.projects.length).toBe(1);
      expect(taskStore.projects[0].name).toBe('テストプロジェクト');
    });

    it('存在しないタスクリストIDで移動操作をしても例外が発生しない', () => {
      const project = taskStore.addProject({ name: 'テストプロジェクト', color: '#ff0000' });
      expect(project).toBeTruthy();

      expect(() => {
        taskStore.moveTaskListToProject('non-existent-id', project!.id);
      }).not.toThrow();

      // プロジェクトの状態は変わらない
      expect(taskStore.projects[0].task_lists.length).toBe(0);
    });

    it('範囲外のインデックスで移動しても安全に処理される', () => {
      const project1 = taskStore.addProject({ name: 'プロジェクト1', color: '#ff0000' });
      const project2 = taskStore.addProject({ name: 'プロジェクト2', color: '#00ff00' });

      expect(project1 && project2).toBeTruthy();

      // 範囲外のインデックス（負の値）
      taskStore.moveProjectToPosition(project2!.id, -1);
      expect(taskStore.projects.map((p) => p.name)).toEqual(['プロジェクト1', 'プロジェクト2']);

      // 範囲外のインデックス（配列長より大きい値）
      taskStore.moveProjectToPosition(project2!.id, 10);
      expect(taskStore.projects.map((p) => p.name)).toEqual(['プロジェクト1', 'プロジェクト2']);
    });

    it('同じ位置への移動は状態を変更しない', () => {
      const project1 = taskStore.addProject({ name: 'プロジェクト1', color: '#ff0000' });
      const project2 = taskStore.addProject({ name: 'プロジェクト2', color: '#00ff00' });

      expect(project1 && project2).toBeTruthy();

      const initialProjects = taskStore.projects.map((p) => ({ ...p }));

      // プロジェクト1を現在の位置（0）に移動
      taskStore.moveProjectToPosition(project1!.id, 0);

      expect(taskStore.projects.map((p) => p.name)).toEqual(['プロジェクト1', 'プロジェクト2']);
      // updated_atは変更されない（同じ位置への移動のため）
      expect(taskStore.projects[0].updated_at).toEqual(initialProjects[0].updated_at);
    });
  });

  describe('データ整合性', () => {
    it('移動操作後もタスクデータが保持される', () => {
      const project1 = taskStore.addProject({ name: 'プロジェクト1', color: '#ff0000' });
      const project2 = taskStore.addProject({ name: 'プロジェクト2', color: '#00ff00' });

      expect(project1 && project2).toBeTruthy();

      const list1 = taskStore.addTaskList(project1!.id, { name: 'リスト1' });
      expect(list1).toBeTruthy();

      const task1 = taskStore.addTask(list1!.id, {
        title: 'テストタスク',
        description: 'テスト用のタスク',
        priority: 2,
        status: 'not_started',
        order_index: 0,
        list_id: list1!.id,
        is_archived: false
      });

      expect(task1).toBeTruthy();

      // タスクリストを別プロジェクトに移動
      taskStore.moveTaskListToProject(list1!.id, project2!.id);

      // タスクが保持されているか確認
      const movedList = taskStore.projects[1].task_lists[0];
      expect(movedList.tasks.length).toBe(1);
      expect(movedList.tasks[0].title).toBe('テストタスク');
      expect(movedList.tasks[0].description).toBe('テスト用のタスク');
    });

    it('移動操作後にupdated_atが正しく更新される', () => {
      const project1 = taskStore.addProject({ name: 'プロジェクト1', color: '#ff0000' });
      const project2 = taskStore.addProject({ name: 'プロジェクト2', color: '#00ff00' });

      expect(project1 && project2).toBeTruthy();

      const initialDate = new Date('2023-01-01');
      taskStore.projects[0].updated_at = initialDate;
      taskStore.projects[1].updated_at = initialDate;

      // プロジェクトの並び替え
      taskStore.moveProjectToPosition(project2!.id, 0);

      // updated_atが更新されている
      expect(taskStore.projects[0].updated_at.getTime()).toBeGreaterThan(initialDate.getTime());
      expect(taskStore.projects[1].updated_at.getTime()).toBeGreaterThan(initialDate.getTime());
    });
  });
});
