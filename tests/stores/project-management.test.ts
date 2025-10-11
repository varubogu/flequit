import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { TaskStore } from '$lib/stores/tasks.svelte';
import { selectionStore } from '$lib/stores/selection-store.svelte';
import { projectStore } from '$lib/stores/project-store.svelte';
import { taskListStore } from '$lib/stores/task-list-store.svelte';

describe.sequential('Project Management', () => {
  let taskStore: TaskStore;

  beforeEach(() => {
    selectionStore.reset();
    projectStore.reset();
    taskStore = new TaskStore();
  });

  afterEach(() => {
    selectionStore.reset();
    projectStore.reset();
  });

  describe('プロジェクト操作', () => {
    it('プロジェクトを追加できる', async () => {
      const projectData = {
        name: 'テストプロジェクト',
        description: 'テスト用のプロジェクト',
        color: '#ff0000'
      };

      const project = await projectStore.addProject(projectData);

      expect(project).toBeTruthy();
      expect(project?.name).toBe('テストプロジェクト');
      expect(project?.color).toBe('#ff0000');
      expect(taskStore.projects).toHaveLength(1);
    });

    it('プロジェクトを更新できる', async () => {
      const project = await projectStore.addProject({ name: '元の名前', color: '#ff0000' });

      if (project) {
        await projectStore.updateProject(project.id, {
          name: '更新された名前',
          color: '#00ff00'
        });

        const updatedProject = taskStore.projects.find((p) => p.id === project.id);
        expect(updatedProject?.name).toBe('更新された名前');
        expect(updatedProject?.color).toBe('#00ff00');
      }
    });

    it('プロジェクトを削除できる', async () => {
      const project = await projectStore.addProject({ name: 'テストプロジェクト' });

      if (project) {
        await projectStore.deleteProject(project.id);
        expect(taskStore.projects).toHaveLength(0);
      }
    });
  });

  describe('タスクリスト操作', () => {
    it('タスクリストを追加できる', async () => {
      const project = await projectStore.addProject({ name: 'テストプロジェクト' });

      if (project) {
        const taskList = await taskListStore.addTaskList(project.id, {
          name: 'テストタスクリスト',
          description: 'テスト用のタスクリスト'
        });

        expect(taskList).toBeTruthy();
        expect(taskList?.name).toBe('テストタスクリスト');

        // プロジェクトを再取得してリアクティブ更新を確認
        const updatedProject = taskStore.projects.find((p) => p.id === project.id);
        expect(updatedProject?.taskLists).toHaveLength(1);
      }
    });

    it('タスクリストを更新できる', async () => {
      const project = await projectStore.addProject({ name: 'テストプロジェクト' });

      if (project) {
        const taskList = await taskListStore.addTaskList(project.id, { name: '元の名前' });

        if (taskList) {
          await taskListStore.updateTaskList(taskList.id, { name: '更新された名前' });

          // プロジェクトを再取得してリアクティブ更新を確認
          const updatedProject = taskStore.projects.find((p) => p.id === project.id);
          const updatedTaskList = updatedProject?.taskLists.find((tl) => tl.id === taskList.id);
          expect(updatedTaskList?.name).toBe('更新された名前');
        }
      }
    });

    it('タスクリストを削除できる', async () => {
      const project = await projectStore.addProject({ name: 'テストプロジェクト' });

      if (project) {
        const taskList = await taskListStore.addTaskList(project.id, { name: 'テストタスクリスト' });

        if (taskList) {
          await taskListStore.deleteTaskList(taskList.id);

          // プロジェクトを再取得してリアクティブ更新を確認
          const updatedProject = taskStore.projects.find((p) => p.id === project.id);
          expect(updatedProject?.taskLists).toHaveLength(0);
        }
      }
    });
  });

  describe('選択状態の管理', () => {
    it('削除されたプロジェクトが選択されている場合、選択状態がクリアされる', async () => {
      const project = await projectStore.addProject({ name: 'テストプロジェクト' });

      if (project) {
        selectionStore.selectProject(project.id);
        expect(taskStore.selectedProjectId).toBe(project.id);

        await projectStore.deleteProject(project.id);
        expect(taskStore.selectedProjectId).toBeNull();
      }
    });

    it('削除されたタスクリストが選択されている場合、選択状態がクリアされる', async () => {
      const project = await projectStore.addProject({ name: 'テストプロジェクト' });

      if (project) {
        const taskList = await taskListStore.addTaskList(project.id, { name: 'テストタスクリスト' });

        if (taskList) {
          selectionStore.selectList(taskList.id);
          expect(taskStore.selectedListId).toBe(taskList.id);

          await taskListStore.deleteTaskList(taskList.id);
          expect(taskStore.selectedListId).toBeNull();
        }
      }
    });
  });
});
