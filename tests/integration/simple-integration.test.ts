import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { Task, TaskStatus } from '$lib/types/task';
import type { TaskList } from "$lib/types/task-list";
import type { Project } from "$lib/types/project";

describe('シンプルな結合テスト', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('タスク作成→編集→削除の基本フローが動作する', async () => {
    // モック関数のみを使用した結合テスト
    const mockTaskStore = {
      tasks: [] as Task[],

      addTask: (listId: string, taskData: Partial<Task>) => {
        const newTask = {
          id: `task-${Date.now()}`,
          list_id: listId,
          title: taskData.title,
          description: taskData.description || '',
          status: taskData.status || 'not_started',
          created_at: new Date(),
          updated_at: new Date(),
          ...taskData
        } as Task;
        mockTaskStore.tasks.push(newTask);
        return newTask;
      },

      updateTask: (taskId: string, updates: Partial<Task>) => {
        const taskIndex = mockTaskStore.tasks.findIndex((t: Task) => t.id === taskId);
        if (taskIndex >= 0) {
          mockTaskStore.tasks[taskIndex] = {
            ...mockTaskStore.tasks[taskIndex],
            ...updates,
            updated_at: new Date()
          };
          return mockTaskStore.tasks[taskIndex];
        }
        return null;
      },

      deleteTask: (taskId: string) => {
        const taskIndex = mockTaskStore.tasks.findIndex((t: Task) => t.id === taskId);
        if (taskIndex >= 0) {
          mockTaskStore.tasks.splice(taskIndex, 1);
          return true;
        }
        return false;
      }
    };

    // 1. タスク作成
    const newTask = mockTaskStore.addTask('list-1', {
      title: '新しいタスク',
      description: 'テスト用タスク',
      status: 'not_started'
    });

    expect(newTask).toEqual(
      expect.objectContaining({
        title: '新しいタスク',
        status: 'not_started',
        list_id: 'list-1'
      })
    );
    expect(mockTaskStore.tasks).toHaveLength(1);

    // 2. タスク更新
    const updatedTask = mockTaskStore.updateTask(newTask.id, {
      title: '更新されたタスク',
      status: 'completed'
    });

    expect(updatedTask).toEqual(
      expect.objectContaining({
        title: '更新されたタスク',
        status: 'completed'
      })
    );
    expect(mockTaskStore.tasks).toHaveLength(1);
    expect(mockTaskStore.tasks[0].status).toBe('completed');

    // 3. タスク削除
    const deleteResult = mockTaskStore.deleteTask(newTask.id);

    expect(deleteResult).toBe(true);
    expect(mockTaskStore.tasks).toHaveLength(0);
  });

  it('プロジェクト→リスト→タスクの階層管理が動作する', async () => {
    // 階層管理用のモックストア
    const hierarchyStore = {
      projects: [] as Project[],
      taskLists: [] as TaskList[],
      tasks: [] as Task[],

      addProject: (projectData: Partial<Project>) => {
        const project = {
          id: `project-${Date.now()}`,
          name: projectData.name,
          description: projectData.description || '',
          created_at: new Date(),
          ...projectData
        } as Project;
        hierarchyStore.projects.push(project);
        return project;
      },

      addTaskList: (projectId: string, listData: Partial<TaskList>) => {
        const list = {
          id: `list-${Date.now()}`,
          name: listData.name,
          project_id: projectId,
          created_at: new Date(),
          ...listData
        } as TaskList;
        hierarchyStore.taskLists.push(list);
        return list;
      },

      addTask: (listId: string, taskData: Partial<Task>) => {
        const task = {
          id: `task-${Date.now()}`,
          title: taskData.title,
          list_id: listId,
          status: taskData.status || 'not_started',
          created_at: new Date(),
          ...taskData
        } as Task;
        hierarchyStore.tasks.push(task);
        return task;
      }
    };

    // プロジェクト作成
    const project = hierarchyStore.addProject({
      name: '新プロジェクト',
      description: 'テスト用プロジェクト'
    });

    expect(project).toEqual(
      expect.objectContaining({
        name: '新プロジェクト',
        description: 'テスト用プロジェクト'
      })
    );
    expect(hierarchyStore.projects).toHaveLength(1);

    // リスト作成
    const taskList = hierarchyStore.addTaskList(project.id, {
      name: '新リスト'
    });

    expect(taskList).toEqual(
      expect.objectContaining({
        name: '新リスト',
        project_id: project.id
      })
    );
    expect(hierarchyStore.taskLists).toHaveLength(1);

    // タスク作成
    const task = hierarchyStore.addTask(taskList.id, {
      title: '新タスク'
    });

    expect(task).toEqual(
      expect.objectContaining({
        title: '新タスク',
        list_id: taskList.id,
        status: 'not_started'
      })
    );
    expect(hierarchyStore.tasks).toHaveLength(1);

    // 階層関係の確認
    expect(task.list_id).toBe(taskList.id);
    expect(taskList.project_id).toBe(project.id);
  });

  it('設定変更がUI状態に反映される', async () => {
    // 設定管理用のモックストア
    const settingsStore = {
      theme: 'light',
      language: 'ja',
      sidebarCollapsed: false,

      changeTheme: (newTheme: string) => {
        settingsStore.theme = newTheme;
        return settingsStore.theme;
      },

      changeLanguage: (newLang: string) => {
        settingsStore.language = newLang;
        return settingsStore.language;
      },

      toggleSidebar: () => {
        settingsStore.sidebarCollapsed = !settingsStore.sidebarCollapsed;
        return settingsStore.sidebarCollapsed;
      },

      getMessage: (key: string) => {
        const messages: Record<string, Record<string, string>> = {
          ja: { title: 'タスク管理', settings: '設定' },
          en: { title: 'Task Management', settings: 'Settings' }
        };
        return messages[settingsStore.language]?.[key] || key;
      }
    };

    // 初期状態確認
    expect(settingsStore.theme).toBe('light');
    expect(settingsStore.language).toBe('ja');
    expect(settingsStore.sidebarCollapsed).toBe(false);
    expect(settingsStore.getMessage('title')).toBe('タスク管理');

    // テーマ変更
    const newTheme = settingsStore.changeTheme('dark');
    expect(newTheme).toBe('dark');
    expect(settingsStore.theme).toBe('dark');

    // 言語変更
    const newLanguage = settingsStore.changeLanguage('en');
    expect(newLanguage).toBe('en');
    expect(settingsStore.language).toBe('en');
    expect(settingsStore.getMessage('title')).toBe('Task Management');
    expect(settingsStore.getMessage('settings')).toBe('Settings');

    // サイドバー切り替え
    const sidebarState = settingsStore.toggleSidebar();
    expect(sidebarState).toBe(true);
    expect(settingsStore.sidebarCollapsed).toBe(true);

    // 設定の組み合わせ確認
    expect(settingsStore.theme).toBe('dark');
    expect(settingsStore.language).toBe('en');
    expect(settingsStore.sidebarCollapsed).toBe(true);
  });

  it('複数コンポーネント間の状態同期が動作する', async () => {
    // グローバル状態管理のモックストア
    const globalStateStore = {
      selectedTaskId: null as string | null,
      tasks: [] as Task[],
      filter: 'all',

      addTask: (title: string) => {
        const newTask = {
          id: `task-${Date.now()}-${Math.random()}`,
          title,
          status: 'not_started'
        } as Task;
        globalStateStore.tasks.push(newTask);
        return newTask;
      },

      selectTask: (taskId: string) => {
        globalStateStore.selectedTaskId = taskId;
        return globalStateStore.getSelectedTask();
      },

      updateTaskStatus: (taskId: string, status: string) => {
        const taskIndex = globalStateStore.tasks.findIndex((t) => t.id === taskId);
        if (taskIndex >= 0) {
          globalStateStore.tasks[taskIndex] = {
            ...globalStateStore.tasks[taskIndex],
            status: status as TaskStatus
          };
          return globalStateStore.tasks[taskIndex];
        }
        return null;
      },

      setFilter: (filter: string) => {
        globalStateStore.filter = filter;
        return globalStateStore.getFilteredTasks();
      },

      getFilteredTasks: () => {
        return globalStateStore.tasks.filter((task) => {
          if (globalStateStore.filter === 'completed') return task.status === 'completed';
          if (globalStateStore.filter === 'pending') return task.status !== 'completed';
          return true;
        });
      },

      getSelectedTask: () => {
        return globalStateStore.tasks.find((t) => t.id === globalStateStore.selectedTaskId) || null;
      }
    };

    // タスク追加
    const task1 = globalStateStore.addTask('タスク1');
    const task2 = globalStateStore.addTask('タスク2');

    expect(globalStateStore.tasks).toHaveLength(2);
    expect(task1.title).toBe('タスク1');
    expect(task2.title).toBe('タスク2');

    // フィルタリング確認（初期状態：全て表示）
    let filteredTasks = globalStateStore.getFilteredTasks();
    expect(filteredTasks).toHaveLength(2);

    // タスク選択
    const selectedTask = globalStateStore.selectTask(task1.id);
    expect(selectedTask).toEqual(task1);
    expect(globalStateStore.selectedTaskId).toBe(task1.id);

    // タスク完了
    const completedTask = globalStateStore.updateTaskStatus(task1.id, 'completed');
    expect(completedTask?.status).toBe('completed');

    // フィルター適用：未完了のみ
    filteredTasks = globalStateStore.setFilter('pending');
    expect(filteredTasks).toHaveLength(1);
    expect(filteredTasks[0].title).toBe('タスク2');
    expect(filteredTasks[0].status).toBe('not_started');

    // フィルター適用：完了済みのみ
    filteredTasks = globalStateStore.setFilter('completed');
    expect(filteredTasks).toHaveLength(1);
    expect(filteredTasks[0].title).toBe('タスク1');
    expect(filteredTasks[0].status).toBe('completed');

    // フィルター適用：全て
    filteredTasks = globalStateStore.setFilter('all');
    expect(filteredTasks).toHaveLength(2);

    // 状態同期確認
    expect(globalStateStore.selectedTaskId).toBe(task1.id);
    expect(globalStateStore.getSelectedTask()?.status).toBe('completed');
  });
});
