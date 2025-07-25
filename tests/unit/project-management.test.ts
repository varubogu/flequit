import { describe, it, expect, beforeEach } from 'vitest';
import { TaskStore } from '$lib/stores/tasks.svelte';

describe('Project Management', () => {
  let taskStore: TaskStore;

  beforeEach(() => {
    taskStore = new TaskStore();
  });

  describe('プロジェクト操作', () => {
    it('プロジェクトを追加できる', () => {
      const projectData = {
        name: 'テストプロジェクト',
        description: 'テスト用のプロジェクト',
        color: '#ff0000'
      };

      const project = taskStore.addProject(projectData);

      expect(project).toBeTruthy();
      expect(project?.name).toBe('テストプロジェクト');
      expect(project?.color).toBe('#ff0000');
      expect(taskStore.projects).toHaveLength(1);
    });

    it('プロジェクトを更新できる', () => {
      const project = taskStore.addProject({ name: '元の名前', color: '#ff0000' });
      
      if (project) {
        taskStore.updateProject(project.id, { 
          name: '更新された名前', 
          color: '#00ff00' 
        });

        const updatedProject = taskStore.projects.find(p => p.id === project.id);
        expect(updatedProject?.name).toBe('更新された名前');
        expect(updatedProject?.color).toBe('#00ff00');
      }
    });

    it('プロジェクトを削除できる', () => {
      const project = taskStore.addProject({ name: 'テストプロジェクト' });
      
      if (project) {
        taskStore.deleteProject(project.id);
        expect(taskStore.projects).toHaveLength(0);
      }
    });
  });

  describe('タスクリスト操作', () => {
    it('タスクリストを追加できる', () => {
      const project = taskStore.addProject({ name: 'テストプロジェクト' });
      
      if (project) {
        const taskList = taskStore.addTaskList(project.id, {
          name: 'テストタスクリスト',
          description: 'テスト用のタスクリスト'
        });

        expect(taskList).toBeTruthy();
        expect(taskList?.name).toBe('テストタスクリスト');
        
        // プロジェクトを再取得してリアクティブ更新を確認
        const updatedProject = taskStore.projects.find(p => p.id === project.id);
        expect(updatedProject?.task_lists).toHaveLength(1);
      }
    });

    it('タスクリストを更新できる', () => {
      const project = taskStore.addProject({ name: 'テストプロジェクト' });
      
      if (project) {
        const taskList = taskStore.addTaskList(project.id, { name: '元の名前' });
        
        if (taskList) {
          taskStore.updateTaskList(taskList.id, { name: '更新された名前' });

          // プロジェクトを再取得してリアクティブ更新を確認
          const updatedProject = taskStore.projects.find(p => p.id === project.id);
          const updatedTaskList = updatedProject?.task_lists.find(tl => tl.id === taskList.id);
          expect(updatedTaskList?.name).toBe('更新された名前');
        }
      }
    });

    it('タスクリストを削除できる', () => {
      const project = taskStore.addProject({ name: 'テストプロジェクト' });
      
      if (project) {
        const taskList = taskStore.addTaskList(project.id, { name: 'テストタスクリスト' });
        
        if (taskList) {
          taskStore.deleteTaskList(taskList.id);
          
          // プロジェクトを再取得してリアクティブ更新を確認
          const updatedProject = taskStore.projects.find(p => p.id === project.id);
          expect(updatedProject?.task_lists).toHaveLength(0);
        }
      }
    });
  });

  describe('選択状態の管理', () => {
    it('削除されたプロジェクトが選択されている場合、選択状態がクリアされる', () => {
      const project = taskStore.addProject({ name: 'テストプロジェクト' });
      
      if (project) {
        taskStore.selectProject(project.id);
        expect(taskStore.selectedProjectId).toBe(project.id);

        taskStore.deleteProject(project.id);
        expect(taskStore.selectedProjectId).toBeNull();
      }
    });

    it('削除されたタスクリストが選択されている場合、選択状態がクリアされる', () => {
      const project = taskStore.addProject({ name: 'テストプロジェクト' });
      
      if (project) {
        const taskList = taskStore.addTaskList(project.id, { name: 'テストタスクリスト' });
        
        if (taskList) {
          taskStore.selectList(taskList.id);
          expect(taskStore.selectedListId).toBe(taskList.id);

          taskStore.deleteTaskList(taskList.id);
          expect(taskStore.selectedListId).toBeNull();
        }
      }
    });
  });
});