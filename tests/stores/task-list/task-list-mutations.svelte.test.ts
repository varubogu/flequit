import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { TaskListMutations } from '$lib/stores/task-list/task-list-mutations.svelte';
import { TaskListQueries } from '$lib/stores/task-list/task-list-queries.svelte';
import type { IProjectStore, ISelectionStore } from '$lib/types/store-interfaces';
import type { TaskListWithTasks } from '$lib/types/task-list';
import type { ProjectTree } from '$lib/types/project';
import { createMockProjectTree, createMockTaskListWithTasks } from '../../utils/mock-factories';

// TaskListService のモック
vi.mock('$lib/services/domain/task-list', () => ({
  TaskListService: {
    createTaskListWithTasks: vi.fn(),
    updateTaskList: vi.fn(),
    deleteTaskList: vi.fn()
  }
}));

const createMockProjectStore = (): IProjectStore => {
  const project = createMockProjectTree({
    id: 'project-1',
    name: 'Project 1',
    description: 'Description 1',
    color: '#FF0000',
    taskLists: [
      createMockTaskListWithTasks({
        id: 'list-1',
        name: 'List 1',
        description: 'Description 1',
        orderIndex: 0
      }),
      createMockTaskListWithTasks({
        id: 'list-2',
        name: 'List 2',
        description: 'Description 2',
        orderIndex: 1
      })
    ]
  });

  const store: IProjectStore = {
    projects: [project],
    get selectedProject() {
      return null;
    },
    addProjectToStore: vi.fn(),
    updateProjectInStore: vi.fn(),
    removeProjectFromStore: vi.fn(),
    reorderProjectsInStore: vi.fn(),
    moveProjectToPositionInStore: vi.fn(),
    getProjectById: vi.fn((id: string) => store.projects.find((p) => p.id === id) ?? null),
    loadProjects: vi.fn(),
    setProjects: vi.fn((projects: ProjectTree[]) => {
      store.projects = projects;
    }),
    reset: vi.fn()
  };

  return store;
};

const createMockSelectionStore = (): ISelectionStore => {
  const selection: ISelectionStore = {
    selectedProjectId: null,
    selectedListId: null,
    selectedTaskId: null,
    selectedSubTaskId: null,
    pendingTaskSelection: null,
    pendingSubTaskSelection: null,
    selectProject: vi.fn((projectId: string | null) => {
      selection.selectedProjectId = projectId;
      if (projectId !== null) {
        selection.selectedListId = null;
      }
    }),
    selectList: vi.fn((listId: string | null) => {
      selection.selectedListId = listId;
      if (listId !== null) {
        selection.selectedProjectId = null;
      }
    }),
    selectTask: vi.fn((taskId: string | null) => {
      selection.selectedTaskId = taskId;
      if (taskId !== null) {
        selection.selectedSubTaskId = null;
      }
    }),
    selectSubTask: vi.fn((subTaskId: string | null) => {
      selection.selectedSubTaskId = subTaskId;
      if (subTaskId !== null) {
        selection.selectedTaskId = null;
      }
    }),
    clearPendingSelections: vi.fn(() => {
      selection.pendingTaskSelection = null;
      selection.pendingSubTaskSelection = null;
    }),
    reset: vi.fn(() => {
      selection.selectedProjectId = null;
      selection.selectedListId = null;
      selection.selectedTaskId = null;
      selection.selectedSubTaskId = null;
      selection.pendingTaskSelection = null;
      selection.pendingSubTaskSelection = null;
    })
  };

  return selection;
};

describe('TaskListMutations', () => {
  let projectStore: IProjectStore;
  let selectionStore: ISelectionStore;
  let queries: TaskListQueries;
  let mutations: TaskListMutations;
  let mockCreateTaskList: ReturnType<typeof vi.fn>;
  let mockUpdateTaskList: ReturnType<typeof vi.fn>;
  let mockDeleteTaskList: ReturnType<typeof vi.fn>;
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(async () => {
    vi.clearAllMocks();
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    projectStore = createMockProjectStore();
    selectionStore = createMockSelectionStore();
    queries = new TaskListQueries(projectStore, selectionStore);
    mutations = new TaskListMutations(projectStore, selectionStore, queries);

    const { TaskListService } = await import('$lib/services/domain/task-list');
    mockCreateTaskList = vi.mocked(TaskListService.createTaskListWithTasks);
    mockUpdateTaskList = vi.mocked(TaskListService.updateTaskList);
    mockDeleteTaskList = vi.mocked(TaskListService.deleteTaskList);
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  describe('addTaskList', () => {
    it('新しいタスクリストを追加する', async () => {
      const newTaskList: TaskListWithTasks = createMockTaskListWithTasks({
        id: 'list-3',
        projectId: 'project-1',
        name: 'New List',
        description: 'New Description',
        orderIndex: 2
      });

      mockCreateTaskList.mockResolvedValue(newTaskList);

      const result = await mutations.addTaskList('project-1', {
        name: 'New List',
        description: 'New Description'
      });

      expect(mockCreateTaskList).toHaveBeenCalledWith('project-1', {
        name: 'New List',
        description: 'New Description',
        order_index: 2
      });
      expect(result).toEqual(newTaskList);
      expect(projectStore.projects[0].taskLists).toHaveLength(3);
      expect(projectStore.projects[0].taskLists[2]).toEqual(newTaskList);
    });

    it('プロジェクトが存在しない場合でもエラーにならない', async () => {
      const newTaskList: TaskListWithTasks = createMockTaskListWithTasks({
        id: 'list-3',
        projectId: 'non-existent',
        name: 'New List',
        description: '',
        orderIndex: 0
      });

      mockCreateTaskList.mockResolvedValue(newTaskList);

      const result = await mutations.addTaskList('non-existent', {
        name: 'New List'
      });

      expect(result).toEqual(newTaskList);
    });

    it('taskListsが未定義のプロジェクトに追加できる', async () => {
      const newProject: ProjectTree = createMockProjectTree({
        id: 'project-2',
        name: 'Project 2',
        description: '',
        color: '#000000',
        orderIndex: 1,
        taskLists: undefined as unknown as TaskListWithTasks[]
      });
      projectStore.projects.push(newProject);

      const newTaskList: TaskListWithTasks = createMockTaskListWithTasks({
        id: 'list-3',
        projectId: 'project-2',
        name: 'New List',
        description: '',
        orderIndex: 0
      });

      mockCreateTaskList.mockResolvedValue(newTaskList);

      const result = await mutations.addTaskList('project-2', {
        name: 'New List'
      });

      expect(result).toEqual(newTaskList);
      expect(projectStore.projects[1].taskLists).toEqual([newTaskList]);
    });

    it('サービスエラー時にnullを返す', async () => {
      const error = new Error('Create failed');
      mockCreateTaskList.mockRejectedValue(error);

      const result = await mutations.addTaskList('project-1', {
        name: 'New List'
      });

      expect(result).toBeNull();
      expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to create task list:', error);
    });

    it('order_indexが正しく設定される', async () => {
      const newTaskList: TaskListWithTasks = createMockTaskListWithTasks({
        id: 'list-3',
        projectId: 'project-1',
        name: 'New List',
        description: '',
        orderIndex: 2,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      mockCreateTaskList.mockResolvedValue(newTaskList);

      await mutations.addTaskList('project-1', { name: 'New List' });

      expect(mockCreateTaskList).toHaveBeenCalledWith('project-1', {
        name: 'New List',
        order_index: 2 // 既存のリストが2つあるので order_index は 2
      });
    });
  });

  describe('updateTaskList', () => {
    it('タスクリストを更新する', async () => {
      const updatedTaskList: TaskListWithTasks = createMockTaskListWithTasks({
        id: 'list-1',
        projectId: 'project-1',
        name: 'Updated List',
        description: 'Updated Description',
        orderIndex: 0,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date()
      });

      mockUpdateTaskList.mockResolvedValue(updatedTaskList);

      const result = await mutations.updateTaskList('list-1', {
        name: 'Updated List',
        description: 'Updated Description'
      });

      expect(mockUpdateTaskList).toHaveBeenCalledWith('project-1', 'list-1', {
        name: 'Updated List',
        description: 'Updated Description'
      });
      expect(result).not.toBeNull();
      expect(result?.name).toBe('Updated List');
      expect(projectStore.projects[0].taskLists[0].name).toBe('Updated List');
    });

    it('存在しないタスクリストの更新はエラーになる', async () => {
      const result = await mutations.updateTaskList('non-existent', {
        name: 'Updated List'
      });

      expect(mockUpdateTaskList).not.toHaveBeenCalled();
      expect(result).toBeNull();
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to update task list:',
        expect.objectContaining({
          message: expect.stringContaining('に対応するプロジェクトが見つかりません')
        })
      );
    });

    it('サービスエラー時にnullを返す', async () => {
      const error = new Error('Update failed');
      mockUpdateTaskList.mockRejectedValue(error);

      const result = await mutations.updateTaskList('list-1', {
        name: 'Updated List'
      });

      expect(result).toBeNull();
      expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to update task list:', error);
    });

    it('サービスがnullを返した場合にnullを返す', async () => {
      mockUpdateTaskList.mockResolvedValue(null);

      const result = await mutations.updateTaskList('list-1', {
        name: 'Updated List'
      });

      expect(result).toBeNull();
    });

    it('部分的な更新が可能', async () => {
      const updatedTaskList: TaskListWithTasks = createMockTaskListWithTasks({
        id: 'list-1',
        projectId: 'project-1',
        name: 'Updated List',
        description: 'Description 1',
        orderIndex: 0,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date()
      });

      mockUpdateTaskList.mockResolvedValue(updatedTaskList);

      const result = await mutations.updateTaskList('list-1', {
        name: 'Updated List'
      });

      expect(mockUpdateTaskList).toHaveBeenCalledWith('project-1', 'list-1', {
        name: 'Updated List'
      });
      expect(result?.name).toBe('Updated List');
    });
  });

  describe('deleteTaskList', () => {
    it('タスクリストを削除する', async () => {
      mockDeleteTaskList.mockResolvedValue(true);

      const result = await mutations.deleteTaskList('list-1');

      expect(mockDeleteTaskList).toHaveBeenCalledWith('project-1', 'list-1');
      expect(result).toBe(true);
      expect(projectStore.projects[0].taskLists).toHaveLength(1);
      expect(projectStore.projects[0].taskLists[0].id).toBe('list-2');
    });

    it('削除されたタスクリストが選択されていた場合は選択をクリア', async () => {
      selectionStore.selectedListId = 'list-1';
      mockDeleteTaskList.mockResolvedValue(true);

      await mutations.deleteTaskList('list-1');

      expect(selectionStore.selectList).toHaveBeenCalledWith(null);
      expect(selectionStore.selectTask).toHaveBeenCalledWith(null);
      expect(selectionStore.selectSubTask).toHaveBeenCalledWith(null);
    });

    it('削除されたタスクリストが選択されていない場合は選択をクリアしない', async () => {
      selectionStore.selectedListId = 'list-2';
      mockDeleteTaskList.mockResolvedValue(true);

      await mutations.deleteTaskList('list-1');

      expect(selectionStore.selectList).not.toHaveBeenCalled();
    });

    it('存在しないタスクリストの削除はエラーになる', async () => {
      const result = await mutations.deleteTaskList('non-existent');

      expect(mockDeleteTaskList).not.toHaveBeenCalled();
      expect(result).toBe(false);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to delete task list:',
        expect.objectContaining({
          message: expect.stringContaining('に対応するプロジェクトが見つかりません')
        })
      );
    });

    it('サービスエラー時にfalseを返す', async () => {
      const error = new Error('Delete failed');
      mockDeleteTaskList.mockRejectedValue(error);

      const result = await mutations.deleteTaskList('list-1');

      expect(result).toBe(false);
      expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to delete task list:', error);
    });

    it('サービスがfalseを返した場合に削除されない', async () => {
      mockDeleteTaskList.mockResolvedValue(false);

      const result = await mutations.deleteTaskList('list-1');

      expect(result).toBe(false);
      expect(projectStore.projects[0].taskLists).toHaveLength(2);
    });
  });
});
