import { describe, it, expect, beforeEach, vi } from 'vitest';
import { projectStore } from '$lib/stores/project-store.svelte';
import { taskCoreStore } from '$lib/stores/task-core-store.svelte';
import { TaskListStore } from '$lib/stores/task-list-store.svelte';
import { selectionStore } from '$lib/stores/selection-store.svelte';
import type { ProjectTree } from '$lib/types/project';

// Mock the backends service to avoid Web backends not implemented warnings
vi.mock('$lib/infrastructure/backends/index', () => ({
  getBackendService: () =>
    Promise.resolve({
      project: {
        create: vi.fn().mockResolvedValue(true),
        update: vi.fn().mockResolvedValue(true),
        delete: vi.fn().mockResolvedValue(true),
        get: vi.fn().mockResolvedValue(null),
        search: vi.fn().mockResolvedValue([])
      },
      tasklist: {
        create: vi.fn().mockResolvedValue(true),
        update: vi.fn().mockResolvedValue(true),
        delete: vi.fn().mockResolvedValue(true),
        get: vi.fn().mockResolvedValue(null),
        search: vi.fn().mockResolvedValue([])
      },
      task: {
        create: vi.fn().mockResolvedValue(true),
        update: vi.fn().mockResolvedValue(true),
        delete: vi.fn().mockResolvedValue(true),
        get: vi.fn().mockResolvedValue(null),
        search: vi.fn().mockResolvedValue([])
      },
      subtask: {
        create: vi.fn().mockResolvedValue(true),
        update: vi.fn().mockResolvedValue(true),
        delete: vi.fn().mockResolvedValue(true),
        get: vi.fn().mockResolvedValue(null),
        search: vi.fn().mockResolvedValue([])
      },
      tag: {
        create: vi.fn().mockResolvedValue(true),
        update: vi.fn().mockResolvedValue(true),
        delete: vi.fn().mockResolvedValue(true),
        get: vi.fn().mockResolvedValue(null),
        search: vi.fn().mockResolvedValue([])
      },
      setting: {
        getAll: vi.fn().mockResolvedValue({}),
        get: vi.fn().mockResolvedValue(null),
        set: vi.fn().mockResolvedValue(true),
        delete: vi.fn().mockResolvedValue(true)
      },
      account: {
        create: vi.fn().mockResolvedValue(true),
        update: vi.fn().mockResolvedValue(true),
        delete: vi.fn().mockResolvedValue(true),
        get: vi.fn().mockResolvedValue(null),
        search: vi.fn().mockResolvedValue([])
      },
      autoFetch: {
        start: vi.fn(),
        stop: vi.fn(),
        isRunning: vi.fn().mockReturnValue(false)
      },
      initialization: {
        loadProjectData: vi.fn().mockResolvedValue([]),
        initializeAll: vi.fn().mockResolvedValue(true)
      }
    })
}));

describe('ドラッグ&ドロップワークフロー統合テスト', () => {
  let taskListStore: TaskListStore;

  beforeEach(() => {
    // 専用ストア側でプロジェクト状態と選択状態をリセット
    projectStore.reset();
    selectionStore.reset();
    taskCoreStore.setProjects([]);
    taskListStore = new TaskListStore(projectStore, selectionStore);
  });

  describe('プロジェクトの並び替え', () => {
    it('プロジェクトの順序を正しく変更できる', async () => {
      // テストデータを設定
      addProject('プロジェクト1', '#ff0000');
      addProject('プロジェクト2', '#00ff00');
      const project3 = addProject('プロジェクト3', '#0000ff');

      // 初期順序を確認
      expect(projectStore.projects.map((p) => p.name)).toEqual([
        'プロジェクト1',
        'プロジェクト2',
        'プロジェクト3'
      ]);

      // プロジェクト3を先頭に移動
      projectStore.moveProjectToPositionInStore(project3.id, 0);

      expect(projectStore.projects.map((p) => p.name)).toEqual([
        'プロジェクト3',
        'プロジェクト1',
        'プロジェクト2'
      ]);

      // order_indexが正しく設定されているか確認
      expect(projectStore.projects[0].orderIndex).toBe(0);
      expect(projectStore.projects[1].orderIndex).toBe(1);
      expect(projectStore.projects[2].orderIndex).toBe(2);
    });

    it('複数回の並び替えが正しく動作する', async () => {
      const project1 = addProject('A', '#ff0000');
      const project2 = addProject('B', '#00ff00');
      const project3 = addProject('C', '#0000ff');
      const project4 = addProject('D', '#ffff00');

      expect(project1 && project2 && project3 && project4).toBeTruthy();

      // B を最後に移動
      projectStore.moveProjectToPositionInStore(project2.id, 3);
      expect(projectStore.projects.map((p) => p.name)).toEqual(['A', 'C', 'D', 'B']);

      // D を先頭に移動
      projectStore.moveProjectToPositionInStore(project4.id, 0);
      expect(projectStore.projects.map((p) => p.name)).toEqual(['D', 'A', 'C', 'B']);

      // C を A の前に移動
      projectStore.moveProjectToPositionInStore(project3.id, 1);
      expect(projectStore.projects.map((p) => p.name)).toEqual(['D', 'C', 'A', 'B']);
    });
  });

  describe('タスクリストの並び替え', () => {
    it('同一プロジェクト内でタスクリストを並び替えできる', async () => {
      const project = addProject('テストプロジェクト', '#ff0000');

      const list1 = await taskListStore.addTaskList(project.id, { name: 'リスト1' });
      const list2 = await taskListStore.addTaskList(project.id, { name: 'リスト2' });
      const list3 = await taskListStore.addTaskList(project.id, { name: 'リスト3' });

      expect(list1 && list2 && list3).toBeTruthy();

      // 初期順序を確認
      expect(projectStore.projects[0].taskLists.map((l) => l.name)).toEqual([
        'リスト1',
        'リスト2',
        'リスト3'
      ]);

      // リスト3を先頭に移動
      if (!list1 || !list2 || !list3) throw new Error('タスクリストの作成に失敗しました');

      await taskListStore.moveTaskListToPosition(list3.id, project.id, 0);

      expect(projectStore.projects[0].taskLists.map((l) => l.name)).toEqual([
        'リスト3',
        'リスト1',
        'リスト2'
      ]);

      // order_indexが正しく設定されているか確認
      expect(projectStore.projects[0].taskLists[0].orderIndex).toBe(0);
      expect(projectStore.projects[0].taskLists[1].orderIndex).toBe(1);
      expect(projectStore.projects[0].taskLists[2].orderIndex).toBe(2);
    });

    it('タスクリストを別プロジェクトに移動できる', async () => {
      const project1 = addProject('プロジェクト1', '#ff0000');
      const project2 = addProject('プロジェクト2', '#00ff00');

      expect(project1 && project2).toBeTruthy();

      const list1 = await taskListStore.addTaskList(project1.id, { name: 'リスト1' });
      const list2 = await taskListStore.addTaskList(project1.id, { name: 'リスト2' });
      const list3 = await taskListStore.addTaskList(project2.id, { name: 'リスト3' });

      if (!list1 || !list2 || !list3) throw new Error('タスクリストの作成に失敗しました');

      // 初期状態を確認
      expect(projectStore.projects[0].taskLists.map((l) => l.name)).toEqual(['リスト1', 'リスト2']);
      expect(projectStore.projects[1].taskLists.map((l) => l.name)).toEqual(['リスト3']);

      // リスト2をプロジェクト2に移動
      await taskListStore.moveTaskListToProject(list2.id, project2.id);

      expect(projectStore.projects[0].taskLists.map((l) => l.name)).toEqual(['リスト1']);
      expect(projectStore.projects[1].taskLists.map((l) => l.name)).toEqual(['リスト3', 'リスト2']);

      // プロジェクトIDが正しく更新されているか確認
      const movedList = projectStore.projects[1].taskLists.find((l) => l.name === 'リスト2');
      expect(movedList?.projectId).toBe(project2.id);
    });

    it('タスクリストを別プロジェクトの指定位置に移動できる', async () => {
      const project1 = addProject('プロジェクト1', '#ff0000');
      const project2 = addProject('プロジェクト2', '#00ff00');

      expect(project1 && project2).toBeTruthy();

      const listA = await taskListStore.addTaskList(project1.id, { name: 'リストA' });
      const listB = await taskListStore.addTaskList(project2.id, { name: 'リストB' });
      const listC = await taskListStore.addTaskList(project2.id, { name: 'リストC' });

      if (!listA || !listB || !listC) throw new Error('タスクリストの作成に失敗しました');

      // 初期状態
      expect(projectStore.projects[0].taskLists.map((l) => l.name)).toEqual(['リストA']);
      expect(projectStore.projects[1].taskLists.map((l) => l.name)).toEqual(['リストB', 'リストC']);

      // リストAをプロジェクト2の先頭（リストBの前）に移動
      await taskListStore.moveTaskListToPosition(listA.id, project2.id, 0);

      expect(projectStore.projects[0].taskLists.map((l) => l.name)).toEqual([]);
      expect(projectStore.projects[1].taskLists.map((l) => l.name)).toEqual([
        'リストA',
        'リストB',
        'リストC'
      ]);

      // order_indexが正しく設定されているか確認
      expect(projectStore.projects[1].taskLists[0].orderIndex).toBe(0);
      expect(projectStore.projects[1].taskLists[1].orderIndex).toBe(1);
      expect(projectStore.projects[1].taskLists[2].orderIndex).toBe(2);
    });
  });

  describe('エラーケース', () => {
    it('存在しないプロジェクトIDで移動操作をしても例外が発生しない', async () => {
      addProject('テストプロジェクト', '#ff0000');

      projectStore.moveProjectToPositionInStore('non-existent-id', 0);

      // プロジェクトの状態は変わらない
      expect(projectStore.projects.length).toBe(1);
      expect(projectStore.projects[0].name).toBe('テストプロジェクト');
    });

    it('存在しないタスクリストIDで移動操作をしても例外が発生しない', async () => {
      const project = addProject('テストプロジェクト', '#ff0000');

      await expect(
        taskListStore.moveTaskListToProject('non-existent-id', project.id)
      ).resolves.toBeUndefined();

      // プロジェクトの状態は変わらない
      expect(projectStore.projects[0].taskLists?.length ?? 0).toBe(0);
    });

    it('範囲外のインデックスで移動しても安全に処理される', async () => {
      const project1 = addProject('プロジェクト1', '#ff0000');
      const project2 = addProject('プロジェクト2', '#00ff00');

      expect(project1 && project2).toBeTruthy();

      // 範囲外のインデックス（負の値）
      projectStore.moveProjectToPositionInStore(project2.id, -1);
      expect(projectStore.projects.map((p) => p.name)).toEqual(['プロジェクト1', 'プロジェクト2']);

      // 範囲外のインデックス（配列長より大きい値）
      projectStore.moveProjectToPositionInStore(project2.id, 10);
      expect(projectStore.projects.map((p) => p.name)).toEqual(['プロジェクト1', 'プロジェクト2']);
    });

    it('同じ位置への移動は状態を変更しない', async () => {
      const project1 = addProject('プロジェクト1', '#ff0000');
      const project2 = addProject('プロジェクト2', '#00ff00');

      expect(project1 && project2).toBeTruthy();

      const initialProjects = projectStore.projects.map((p) => ({ ...p }));

      // プロジェクト1を現在の位置（0）に移動
      projectStore.moveProjectToPositionInStore(project1.id, 0);

      expect(projectStore.projects.map((p) => p.name)).toEqual(['プロジェクト1', 'プロジェクト2']);
      // updated_atは変更されない（同じ位置への移動のため）
      expect(projectStore.projects[0].updatedAt).toEqual(initialProjects[0].updatedAt);
    });
  });

  describe('データ整合性', () => {
    it('移動操作後もタスクデータが保持される', async () => {
      const project1 = addProject('プロジェクト1', '#ff0000');
      const project2 = addProject('プロジェクト2', '#00ff00');

      expect(project1 && project2).toBeTruthy();

      const list1 = await taskListStore.addTaskList(project1.id, { name: 'リスト1' });
      if (!list1) throw new Error('タスクリストの作成に失敗しました');

      taskCoreStore.setProjects(projectStore.projects);

      const task1 = await taskCoreStore.addTask(list1.id, {
        title: 'テストタスク',
        description: 'テスト用のタスク',
        priority: 2,
        status: 'not_started',
        orderIndex: 0,
        listId: list1.id,
        isArchived: false,
        projectId: project1.id,
        assignedUserIds: [],
        tagIds: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      expect(task1).toBeTruthy();

      // タスクリストを別プロジェクトに移動
      await taskListStore.moveTaskListToProject(list1.id, project2.id);

      // タスクが保持されているか確認
      const movedList = projectStore.projects[1].taskLists[0];
      expect(movedList.tasks.length).toBe(1);
      expect(movedList.tasks[0].title).toBe('テストタスク');
      expect(movedList.tasks[0].description).toBe('テスト用のタスク');
    });

    it('移動操作後にupdated_atが正しく更新される', async () => {
      const project1 = addProject('プロジェクト1', '#ff0000');
      const project2 = addProject('プロジェクト2', '#00ff00');

      expect(project1 && project2).toBeTruthy();

      const initialDate = new Date('2023-01-01');
      projectStore.projects[0].updatedAt = initialDate;
      projectStore.projects[1].updatedAt = initialDate;

      // プロジェクトの並び替え
      projectStore.moveProjectToPositionInStore(project2.id, 0);

      // updated_atが更新されている
      expect(projectStore.projects[0].updatedAt.getTime()).toBeGreaterThan(initialDate.getTime());
      expect(projectStore.projects[1].updatedAt.getTime()).toBeGreaterThan(initialDate.getTime());
    });
  });
});
function addProject(name: string, color = '#3b82f6'): ProjectTree {
  return projectStore.addProjectToStore({
    id: `project-${Math.random().toString(36).slice(2)}`,
    name,
    color,
    description: undefined,
    orderIndex: projectStore.projects.length,
    isArchived: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    taskLists: [],
    allTags: []
  });
}
