import { describe, test, expect, beforeEach } from 'vitest';
import { TaskListStore } from '../../src/lib/stores/task-list-store.svelte';
import { ProjectStore } from '../../src/lib/stores/project-store.svelte';
import { selectionStore } from '../../src/lib/stores/selection-store.svelte';
import type { ProjectTree } from '$lib/types/project';
import type { TaskListWithTasks } from '$lib/types/task-list';

/**
 * TaskListStore 統合テスト
 *
 * このテストは TaskListStore のファサードとしての統合動作を検証します。
 * 個別のクラス（TaskListQueries, TaskListMutations, TaskListOrdering）の
 * 単体テストは別ファイルで実施しています。
 */
describe('TaskListStore (Integration)', () => {
  let store: TaskListStore;
  let projectStore: ProjectStore;

  const createMockTaskList = (id: string = 'list-1', name: string = 'Test List', projectId: string = 'project-1'): TaskListWithTasks => ({
    id,
    projectId,
    name,
    description: 'Test Description',
    color: '#00FF00',
    orderIndex: 0,
    isArchived: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    tasks: []
  });

  const createMockProject = (id: string = 'project-1', name: string = 'Test Project'): ProjectTree => ({
    id,
    name,
    description: 'Test Description',
    color: '#FF0000',
    orderIndex: 0,
    isArchived: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    taskLists: [
      createMockTaskList('list-1', 'List 1', id),
      createMockTaskList('list-2', 'List 2', id)
    ],
    allTags: []
  });

  beforeEach(() => {
    selectionStore.reset();
    projectStore = new ProjectStore(selectionStore);
    store = new TaskListStore(projectStore, selectionStore);
  });

  describe('initialization', () => {
    test('should have no selected task list initially', () => {
      expect(store.selectedTaskList).toBeNull();
    });
  });

  describe('selectedTaskList', () => {
    test('should return selected task list when ID is set', () => {
      const project = createMockProject();
      projectStore.loadProjects([project]);
      selectionStore.selectList('list-1');

      const selected = store.selectedTaskList;
      expect(selected).not.toBeNull();
      expect(selected?.id).toBe('list-1');
    });

    test('should return null when no list is selected', () => {
      const project = createMockProject();
      projectStore.loadProjects([project]);

      expect(store.selectedTaskList).toBeNull();
    });

    test('should return null when selected list does not exist', () => {
      const project = createMockProject();
      projectStore.loadProjects([project]);
      selectionStore.selectList('non-existent');

      expect(store.selectedTaskList).toBeNull();
    });
  });

  describe('getProjectIdByListId', () => {
    test('should return project ID for existing list', () => {
      const project = createMockProject();
      projectStore.loadProjects([project]);

      const projectId = store.getProjectIdByListId('list-1');
      expect(projectId).toBe('project-1');
    });

    test('should return null for non-existent list', () => {
      const project = createMockProject();
      projectStore.loadProjects([project]);

      const projectId = store.getProjectIdByListId('non-existent');
      expect(projectId).toBeNull();
    });

    test('should find list across multiple projects', () => {
      const projects = [
        createMockProject('p1', 'Project 1'),
        createMockProject('p2', 'Project 2')
      ];
      projectStore.loadProjects(projects);

      // List-1 is in p1, list-2 is also in p1
      // We need to modify p2 to have different lists
      projects[1].taskLists = [
        createMockTaskList('list-3', 'List 3', 'p2'),
        createMockTaskList('list-4', 'List 4', 'p2')
      ];
      projectStore.loadProjects(projects);

      expect(store.getProjectIdByListId('list-1')).toBe('p1');
      expect(store.getProjectIdByListId('list-3')).toBe('p2');
    });
  });

  describe('moveTaskListToPosition', () => {
    test('should move task list within same project', async () => {
      const project = createMockProject();
      project.taskLists = [
        createMockTaskList('list-1', 'List 1'),
        createMockTaskList('list-2', 'List 2'),
        createMockTaskList('list-3', 'List 3')
      ];
      projectStore.loadProjects([project]);

      await store.moveTaskListToPosition('list-1', project.id, 2);

      expect(projectStore.projects[0].taskLists[0].id).toBe('list-2');
      expect(projectStore.projects[0].taskLists[1].id).toBe('list-3');
      expect(projectStore.projects[0].taskLists[2].id).toBe('list-1');
    });

    test('should update order indices correctly', async () => {
      const project = createMockProject();
      project.taskLists = [
        createMockTaskList('list-1', 'List 1'),
        createMockTaskList('list-2', 'List 2'),
        createMockTaskList('list-3', 'List 3')
      ];
      projectStore.loadProjects([project]);

      await store.moveTaskListToPosition('list-3', project.id, 0);

      const lists = projectStore.projects[0].taskLists;
      expect(lists[0].orderIndex).toBe(0);
      expect(lists[1].orderIndex).toBe(1);
      expect(lists[2].orderIndex).toBe(2);
    });
  });

  describe('reorderTaskLists', () => {
    test('should reorder task lists within project', async () => {
      const project = createMockProject();
      project.taskLists = [
        createMockTaskList('list-1', 'List 1'),
        createMockTaskList('list-2', 'List 2'),
        createMockTaskList('list-3', 'List 3')
      ];
      projectStore.loadProjects([project]);

      await store.reorderTaskLists(project.id, 0, 2);

      const lists = projectStore.projects[0].taskLists;
      expect(lists[0].id).toBe('list-2');
      expect(lists[1].id).toBe('list-3');
      expect(lists[2].id).toBe('list-1');
    });

    test('should handle same position reorder', async () => {
      const project = createMockProject();
      projectStore.loadProjects([project]);

      await store.reorderTaskLists(project.id, 0, 0);

      const lists = projectStore.projects[0].taskLists;
      expect(lists[0].id).toBe('list-1');
      expect(lists[1].id).toBe('list-2');
    });
  });

  describe('moveTaskListToProject', () => {
    test('should move task list to different project', async () => {
      const projects = [
        createMockProject('p1', 'Project 1'),
        createMockProject('p2', 'Project 2')
      ];
      projects[0].taskLists = [
        createMockTaskList('list-1', 'List 1', 'p1'),
        createMockTaskList('list-2', 'List 2', 'p1')
      ];
      projects[1].taskLists = [];
      projectStore.loadProjects(projects);

      await store.moveTaskListToProject('list-1', 'p2');

      expect(projectStore.projects[0].taskLists).toHaveLength(1);
      expect(projectStore.projects[0].taskLists[0].id).toBe('list-2');
      expect(projectStore.projects[1].taskLists).toHaveLength(1);
      expect(projectStore.projects[1].taskLists[0].id).toBe('list-1');
    });

    test('should update projectId of moved list', async () => {
      const projects = [
        createMockProject('p1', 'Project 1'),
        createMockProject('p2', 'Project 2')
      ];
      projects[0].taskLists = [createMockTaskList('list-1', 'List 1', 'p1')];
      projects[1].taskLists = [];
      projectStore.loadProjects(projects);

      await store.moveTaskListToProject('list-1', 'p2');

      const movedList = projectStore.projects[1].taskLists[0];
      expect(movedList.projectId).toBe('p2');
    });

    test('should insert at specified index', async () => {
      const projects = [
        createMockProject('p1', 'Project 1'),
        createMockProject('p2', 'Project 2')
      ];
      projects[0].taskLists = [createMockTaskList('list-1', 'List 1', 'p1')];
      projects[1].taskLists = [
        createMockTaskList('list-2', 'List 2', 'p2'),
        createMockTaskList('list-3', 'List 3', 'p2')
      ];
      projectStore.loadProjects(projects);

      await store.moveTaskListToProject('list-1', 'p2', 1);

      const targetLists = projectStore.projects[1].taskLists;
      expect(targetLists[0].id).toBe('list-2');
      expect(targetLists[1].id).toBe('list-1');
      expect(targetLists[2].id).toBe('list-3');
    });
  });

  describe('reset', () => {
    test('should not affect project store data', () => {
      const project = createMockProject();
      projectStore.loadProjects([project]);

      store.reset();

      // TaskListStore doesn't hold data, so reset() should be no-op
      expect(projectStore.projects).toHaveLength(1);
    });
  });
});
