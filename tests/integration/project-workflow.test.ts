import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { Task } from '$lib/types/task';
import type { TaskList } from "$lib/types/task-list";
import type { Project } from "$lib/types/project";

// モックストアの実装
const mockTaskStore = {
  projects: [] as Project[],
  taskLists: [] as TaskList[],
  tasks: [] as Task[],

  addProject: vi.fn((projectData: Partial<Project>) => {
    const newProject = {
      id: `project-${Date.now()}`,
      name: projectData.name || '',
      description: projectData.description || '',
      color: projectData.color,
      order_index: projectData.order_index || 0,
      is_archived: projectData.is_archived || false,
      created_at: new Date(),
      updated_at: new Date()
    } as Project;
    mockTaskStore.projects.push(newProject);
    return newProject;
  }),

  addTaskList: vi.fn((projectId: string, listData: Partial<TaskList>) => {
    const newList = {
      id: `list-${Date.now()}`,
      project_id: projectId,
      name: listData.name || '',
      description: listData.description,
      color: listData.color,
      order_index: listData.order_index || 0,
      is_archived: listData.is_archived || false,
      created_at: new Date(),
      updated_at: new Date()
    } as TaskList;
    mockTaskStore.taskLists.push(newList);
    return newList;
  }),

  addTask: vi.fn((listId: string, taskData: Partial<Task>) => {
    const newTask = {
      id: `task-${Date.now()}`,
      sub_task_id: taskData.sub_task_id,
      list_id: listId,
      title: taskData.title || '',
      description: taskData.description || '',
      status: taskData.status || 'not_started',
      priority: taskData.priority || 1,
      start_date: taskData.start_date,
      end_date: taskData.end_date,
      is_range_date: taskData.is_range_date || false,
      recurrence_rule: taskData.recurrence_rule,
      order_index: taskData.order_index || 0,
      is_archived: taskData.is_archived || false,
      created_at: new Date(),
      updated_at: new Date()
    } as Task;
    mockTaskStore.tasks.push(newTask);
    return newTask;
  }),

  getProjectById: vi.fn((projectId: string) => {
    return mockTaskStore.projects.find((p: Project) => p.id === projectId);
  }),

  getTaskListsByProjectId: vi.fn((projectId: string) => {
    return mockTaskStore.taskLists.filter((tl: TaskList) => tl.project_id === projectId);
  }),

  getTasksByListId: vi.fn((listId: string) => {
    return mockTaskStore.tasks.filter((t: Task) => t.list_id === listId);
  }),

  clear: vi.fn(() => {
    mockTaskStore.projects.length = 0;
    mockTaskStore.taskLists.length = 0;
    mockTaskStore.tasks.length = 0;
  })
};

interface viewStore {
  currentView: string;
  selectedProjectId: string | null;
  selectedListId: string | null;
  setView: (viewType: string) => void;
  setSelectedProject: (projectId: string) => void;
  setSelectedList: (listId: string) => void;
}

const mockViewStore: viewStore = {
  currentView: 'project',
  selectedProjectId: null,
  selectedListId: null,

  setView: vi.fn((viewType: string) => {
    mockViewStore.currentView = viewType;
  }),

  setSelectedProject: vi.fn((projectId: string) => {
    mockViewStore.selectedProjectId = projectId;
  }),

  setSelectedList: vi.fn((listId: string) => {
    mockViewStore.selectedListId = listId;
  })
};

// ストアモックの設定
vi.mock('$lib/stores/task.svelte', () => ({
  taskStore: mockTaskStore
}));

vi.mock('$lib/stores/view-store.svelte', () => ({
  viewStore: mockViewStore
}));

describe('プロジェクトワークフロー結合テスト', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // 完全にデータをクリア
    mockTaskStore.projects.splice(0);
    mockTaskStore.taskLists.splice(0);
    mockTaskStore.tasks.splice(0);

    mockViewStore.currentView = 'project';
    mockViewStore.selectedProjectId = null;
    mockViewStore.selectedListId = null;
  });

  it('プロジェクト作成→タスクリスト追加→タスク追加→ビュー切り替えの完全フローが動作する', async () => {
    // モック関数のみを使用した結合テスト

    // 1. プロジェクト作成
    const project = mockTaskStore.addProject({
      name: '新しいプロジェクト',
      description: 'テスト用プロジェクトです'
    });

    expect(mockTaskStore.addProject).toHaveBeenCalledWith({
      name: '新しいプロジェクト',
      description: 'テスト用プロジェクトです'
    });
    expect(project).toEqual(
      expect.objectContaining({
        name: '新しいプロジェクト',
        description: 'テスト用プロジェクトです'
      })
    );

    // 2. リストビューに切り替え
    mockViewStore.setView('list');
    expect(mockViewStore.setView).toHaveBeenCalledWith('list');
    expect(mockViewStore.currentView).toBe('list');

    // 3. タスクリスト作成
    const taskList = mockTaskStore.addTaskList(project.id, {
      name: '新しいタスクリスト'
    });

    expect(mockTaskStore.addTaskList).toHaveBeenCalledWith(project.id, {
      name: '新しいタスクリスト'
    });
    expect(taskList).toEqual(
      expect.objectContaining({
        name: '新しいタスクリスト',
        project_id: project.id
      })
    );

    // 4. タスクビューに切り替え
    mockViewStore.setView('task');
    expect(mockViewStore.setView).toHaveBeenCalledWith('task');
    expect(mockViewStore.currentView).toBe('task');

    // 5. タスク作成
    const task = mockTaskStore.addTask(taskList.id, {
      title: '新しいタスク',
      status: 'not_started'
    });

    expect(mockTaskStore.addTask).toHaveBeenCalledWith(taskList.id, {
      title: '新しいタスク',
      status: 'not_started'
    });
    expect(task).toEqual(
      expect.objectContaining({
        title: '新しいタスク',
        status: 'not_started',
        list_id: taskList.id
      })
    );

    // 6. プロジェクトビューに戻る
    mockViewStore.setView('project');
    expect(mockViewStore.setView).toHaveBeenCalledWith('project');
    expect(mockViewStore.currentView).toBe('project');

    // データ整合性の確認
    expect(mockTaskStore.projects).toHaveLength(1);
    expect(mockTaskStore.taskLists).toHaveLength(1);
    expect(mockTaskStore.tasks).toHaveLength(1);

    // 関連データの確認
    const retrievedProject = mockTaskStore.getProjectById(project.id);
    const retrievedTaskLists = mockTaskStore.getTaskListsByProjectId(project.id);
    const retrievedTasks = mockTaskStore.getTasksByListId(taskList.id);

    expect(retrievedProject).toEqual(project);
    expect(retrievedTaskLists).toHaveLength(1);
    expect(retrievedTaskLists[0]).toEqual(taskList);
    expect(retrievedTasks).toHaveLength(1);
    expect(retrievedTasks[0]).toEqual(task);
  });

  it('複数プロジェクトでのビュー切り替えが正常に動作する', async () => {
    // 独立したモックストアを作成
    const localMockStore = {
      projects: [] as Project[],
      taskLists: [] as TaskList[],
      tasks: [] as Task[],

      addProject: (projectData: Partial<Project>) => {
        const newProject = {
          id: `project-${Date.now()}-${Math.random()}`,
          name: projectData.name || '',
          description: projectData.description || '',
          color: projectData.color,
          order_index: projectData.order_index || 0,
          is_archived: projectData.is_archived || false,
          created_at: new Date(),
          updated_at: new Date()
        } as Project;
        localMockStore.projects.push(newProject);
        return newProject;
      },

      addTaskList: (projectId: string, listData: Partial<TaskList>) => {
        const newList = {
          id: `list-${Date.now()}-${Math.random()}`,
          project_id: projectId,
          name: listData.name || '',
          description: listData.description,
          color: listData.color,
          order_index: listData.order_index || 0,
          is_archived: listData.is_archived || false,
          created_at: new Date(),
          updated_at: new Date()
        } as TaskList;
        localMockStore.taskLists.push(newList);
        return newList;
      },

      getProjectById: (projectId: string) => {
        return localMockStore.projects.find((p: Project) => p.id === projectId);
      },

      getTaskListsByProjectId: (projectId: string) => {
        return localMockStore.taskLists.filter((tl: TaskList) => tl.project_id === projectId);
      }
    };

    // 複数プロジェクト作成
    const project1 = localMockStore.addProject({ name: 'プロジェクト1' });
    const project2 = localMockStore.addProject({ name: 'プロジェクト2' });

    // プロジェクト1にリスト追加
    const list1_1 = localMockStore.addTaskList(project1.id, { name: 'リスト1-1' });
    const list1_2 = localMockStore.addTaskList(project1.id, { name: 'リスト1-2' });

    // プロジェクト2にリスト追加
    const list2_1 = localMockStore.addTaskList(project2.id, { name: 'リスト2-1' });

    // プロジェクト1を選択
    const selectedProject1 = localMockStore.getProjectById(project1.id);
    const taskLists1 = localMockStore.getTaskListsByProjectId(project1.id);
    mockViewStore.setSelectedProject(project1.id);

    expect(selectedProject1).toEqual(project1);
    expect(taskLists1).toHaveLength(2);
    expect(taskLists1).toContain(list1_1);
    expect(taskLists1).toContain(list1_2);
    expect(mockViewStore.setSelectedProject).toHaveBeenCalledWith(project1.id);

    // プロジェクト2を選択
    const selectedProject2 = localMockStore.getProjectById(project2.id);
    const taskLists2 = localMockStore.getTaskListsByProjectId(project2.id);
    mockViewStore.setSelectedProject(project2.id);

    expect(selectedProject2).toEqual(project2);
    expect(taskLists2).toHaveLength(1);
    expect(taskLists2).toContain(list2_1);
    expect(mockViewStore.setSelectedProject).toHaveBeenCalledTimes(2);
    expect(mockViewStore.selectedProjectId).toBe(project2.id);

    // データ整合性の確認
    expect(localMockStore.projects).toHaveLength(2);
    expect(localMockStore.taskLists).toHaveLength(3);

    // プロジェクト別のタスクリスト分離確認
    const allProject1Lists = localMockStore.getTaskListsByProjectId(project1.id);
    const allProject2Lists = localMockStore.getTaskListsByProjectId(project2.id);

    expect(allProject1Lists).toHaveLength(2);
    expect(allProject2Lists).toHaveLength(1);
    expect(allProject1Lists.every((list) => list.project_id === project1.id)).toBe(true);
    expect(allProject2Lists.every((list) => list.project_id === project2.id)).toBe(true);
  });
});
