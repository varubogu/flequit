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
});
