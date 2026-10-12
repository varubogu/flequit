import { describe, test, expect, beforeEach } from 'vitest';
import { ProjectStore } from '../../src/lib/stores/project-store.svelte';
import { selectionStore } from '../../src/lib/stores/selection-store.svelte';
import type { ProjectTree } from '$lib/types/project';

describe('ProjectStore', () => {
  let store: ProjectStore;

  const createMockProject = (
    id: string = 'project-1',
    name: string = 'Test Project'
  ): ProjectTree => ({
    id,
    name,
    description: 'Test Description',
    color: '#FF0000',
    orderIndex: 0,
    isArchived: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    taskLists: [],
    allTags: []
  });

  beforeEach(() => {
    selectionStore.reset();
    store = new ProjectStore(selectionStore);
  });

  describe('initialization', () => {
    test('should initialize with empty projects', () => {
      expect(store.projects).toEqual([]);
    });

    test('should have no selected project initially', () => {
      expect(store.selectedProject).toBeNull();
    });
  });

  describe('loadProjects', () => {
    test('should load projects without triggering save', () => {
      const projects = [createMockProject()];
      store.loadProjects(projects);
      expect(store.projects).toEqual(projects);
    });

    test('should load multiple projects', () => {
      const projects = [
        createMockProject('p1', 'Project 1'),
        createMockProject('p2', 'Project 2'),
        createMockProject('p3', 'Project 3')
      ];
      store.loadProjects(projects);
      expect(store.projects).toHaveLength(3);
    });
  });

  describe('setProjects', () => {
    test('should set projects array', async () => {
      const projects = [createMockProject()];
      await store.setProjects(projects);
      expect(store.projects).toEqual(projects);
    });
  });

  describe('selectedProject', () => {
    test('should return selected project when ID is set', () => {
      const project = createMockProject();
      store.loadProjects([project]);
      selectionStore.selectProject(project.id);

      expect(store.selectedProject).toEqual(project);
    });

    test('should return null when no project is selected', () => {
      const project = createMockProject();
      store.loadProjects([project]);

      expect(store.selectedProject).toBeNull();
    });

    test('should return null when selected project does not exist', () => {
      const project = createMockProject();
      store.loadProjects([project]);
      selectionStore.selectProject('non-existent-id');

      expect(store.selectedProject).toBeNull();
    });
  });

  describe('getProjectById', () => {
    test('should return project by ID', () => {
      const project = createMockProject();
      store.loadProjects([project]);

      const found = store.getProjectById(project.id);
      expect(found).toEqual(project);
    });

    test('should return null for non-existent ID', () => {
      const project = createMockProject();
      store.loadProjects([project]);

      const found = store.getProjectById('non-existent');
      expect(found).toBeNull();
    });
  });

  describe('moveProjectToPosition', () => {
    test('should move project to specified position', async () => {
      const projects = [
        createMockProject('p1', 'Project 1'),
        createMockProject('p2', 'Project 2'),
        createMockProject('p3', 'Project 3')
      ];
      store.loadProjects(projects);

      await store.moveProjectToPosition('p3', 0);

      expect(store.projects[0].id).toBe('p3');
      expect(store.projects[1].id).toBe('p1');
      expect(store.projects[2].id).toBe('p2');
    });

    test('should update order indices correctly', async () => {
      const projects = [
        createMockProject('p1', 'Project 1'),
        createMockProject('p2', 'Project 2'),
        createMockProject('p3', 'Project 3')
      ];
      store.loadProjects(projects);

      await store.moveProjectToPosition('p1', 2);

      expect(store.projects[0].orderIndex).toBe(0);
      expect(store.projects[1].orderIndex).toBe(1);
      expect(store.projects[2].orderIndex).toBe(2);
    });
  });

  describe('reorderProjects', () => {
    test('should reorder projects from one index to another', async () => {
      const projects = [
        createMockProject('p1', 'Project 1'),
        createMockProject('p2', 'Project 2'),
        createMockProject('p3', 'Project 3')
      ];
      store.loadProjects(projects);

      await store.reorderProjects(0, 2);

      expect(store.projects[0].id).toBe('p2');
      expect(store.projects[1].id).toBe('p3');
      expect(store.projects[2].id).toBe('p1');
    });

    test('should handle moving to same position', async () => {
      const projects = [createMockProject('p1', 'Project 1'), createMockProject('p2', 'Project 2')];
      store.loadProjects(projects);

      await store.reorderProjects(0, 0);

      expect(store.projects[0].id).toBe('p1');
      expect(store.projects[1].id).toBe('p2');
    });
  });

  describe('reset', () => {
    test('should clear all projects', () => {
      const projects = [createMockProject()];
      store.loadProjects(projects);

      store.reset();

      expect(store.projects).toEqual([]);
    });
  });

  describe('store mutations', () => {
    test('fills missing project fields and keeps explicit ones', () => {
      const createdAt = new Date('2020-01-01T00:00:00Z');
      const updatedAt = new Date('2020-02-01T00:00:00Z');
      const kept = store.addProjectToStore({
        id: 'kept',
        name: 'Kept',
        orderIndex: 4,
        createdAt,
        updatedAt,
        taskLists: [{ id: 'list-1' }],
        allTags: [{ id: 'tag-1' }]
      } as unknown as ProjectTree);
      const filled = store.addProjectToStore({ id: 'filled', name: 'Filled' } as ProjectTree);

      expect(kept.orderIndex).toBe(4);
      expect(kept.createdAt).toBe(createdAt);
      expect(kept.updatedAt).toBe(updatedAt);
      expect(kept.taskLists).toHaveLength(1);
      expect(kept.allTags).toHaveLength(1);
      expect(filled.orderIndex).toBe(1);
      expect(filled.taskLists).toEqual([]);
      expect(filled.allTags).toEqual([]);
      expect(filled.createdAt).toBeInstanceOf(Date);
      expect(filled.updatedAt).toBeInstanceOf(Date);
    });

    test('updates an existing project and returns null when the id is missing', async () => {
      expect(store.updateProjectInStore('missing', { name: 'Nope' })).toBeNull();
      expect(await store.updateProject('missing', { name: 'Nope' })).toBeNull();

      store.loadProjects([createMockProject('p1', 'Original')]);
      const stamped = new Date('2021-03-03T00:00:00Z');
      const moved = store.updateProjectInStore('p1', {
        name: 'Moved',
        orderIndex: 9,
        updatedAt: stamped
      });
      expect(moved?.orderIndex).toBe(9);
      expect(moved?.updatedAt).toBe(stamped);

      const renamed = await store.updateProject('p1', { name: 'Renamed' });
      expect(renamed?.name).toBe('Renamed');
      expect(renamed?.orderIndex).toBe(9);
      expect(renamed?.color).toBe('#FF0000');
    });

    test('removes a project and clears selection only when that project is selected', () => {
      expect(store.removeProjectFromStore('missing')).toBe(false);

      store.loadProjects([createMockProject('p1'), createMockProject('p2', 'Second')]);
      selectionStore.selectProject('p2');
      selectionStore.selectTask('task-2');
      expect(store.removeProjectFromStore('p1')).toBe(true);
      expect(selectionStore.selectedProjectId).toBe('p2');
      expect(selectionStore.selectedTaskId).toBe('task-2');

      expect(store.removeProjectFromStore('p2')).toBe(true);
      expect(store.projects).toEqual([]);
      expect(selectionStore.selectedProjectId).toBeNull();
      expect(selectionStore.selectedTaskId).toBeNull();
    });

    test('rejects reorders and moves that do not change position', () => {
      store.loadProjects([createMockProject('p1'), createMockProject('p2', 'Second')]);

      expect(store.reorderProjectsInStore(-1, 0)).toEqual([]);
      expect(store.reorderProjectsInStore(0, 9)).toEqual([]);
      expect(store.reorderProjectsInStore(0, 0)).toEqual([]);
      expect(store.moveProjectToPositionInStore('missing', 1)).toEqual([]);
      expect(store.moveProjectToPositionInStore('p1', 0)).toEqual([]);
      expect(store.projects.map((project) => project.id)).toEqual(['p1', 'p2']);
    });
  });
});
