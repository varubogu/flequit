import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ViewService } from '$lib/services/ui/view';
import { taskStore } from '$lib/stores/tasks.svelte';
import { selectionStore } from '$lib/stores/selection-store.svelte';
import type { ProjectTree } from '$lib/types/project';

describe('ViewService - TaskList Filtering', () => {
  // Mock data
  const mockProjects: ProjectTree[] = [
    {
      id: 'project-1',
      name: 'Project 1',
      description: 'Test project 1',
      color: '#3b82f6',
      orderIndex: 0,
      isArchived: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      taskLists: [
        {
          id: 'list-1',
          projectId: 'project-1',
          name: 'List 1',
          description: 'Test list 1',
          color: '#ef4444',
          orderIndex: 0,
          isArchived: false,
          createdAt: new Date(),
          updatedAt: new Date(),
          tasks: [
            {
              id: 'task-1',
              projectId: 'project-1',
              listId: 'list-1',
              title: 'Task 1 in List 1',
              description: 'Test task 1',
              status: 'not_started',
              priority: 1,
              orderIndex: 0,
              isArchived: false,
              assignedUserIds: [],
              tagIds: [],
              createdAt: new Date(),
              updatedAt: new Date(),
              subTasks: [],
              tags: []
            },
            {
              id: 'task-2',
              projectId: 'project-1',
              listId: 'list-1',
              title: 'Task 2 in List 1',
              description: 'Test task 2',
              status: 'in_progress',
              priority: 2,
              orderIndex: 1,
              isArchived: false,
              assignedUserIds: [],
              tagIds: [],
              createdAt: new Date(),
              updatedAt: new Date(),
              subTasks: [],
              tags: []
            }
          ]
        },
        {
          id: 'list-2',
          projectId: 'project-1',
          name: 'List 2',
          description: 'Test list 2',
          color: '#10b981',
          orderIndex: 1,
          isArchived: false,
          createdAt: new Date(),
          updatedAt: new Date(),
          tasks: [
            {
              id: 'task-3',
              projectId: 'project-1',
              listId: 'list-2',
              title: 'Task 3 in List 2',
              description: 'Test task 3',
              status: 'completed',
              priority: 1,
              orderIndex: 0,
              isArchived: false,
              assignedUserIds: [],
              tagIds: [],
              createdAt: new Date(),
              updatedAt: new Date(),
              subTasks: [],
              tags: []
            }
          ]
        }
      ]
    },
    {
      id: 'project-2',
      name: 'Project 2',
      description: 'Test project 2',
      color: '#8b5cf6',
      orderIndex: 1,
      isArchived: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      taskLists: [
        {
          id: 'list-3',
          projectId: 'project-2',
          name: 'List 3',
          description: 'Test list 3',
          color: '#f59e0b',
          orderIndex: 0,
          isArchived: false,
          createdAt: new Date(),
          updatedAt: new Date(),
          tasks: [
            {
              id: 'task-4',
              projectId: 'project-2',
              listId: 'list-3',
              title: 'Task 4 in List 3',
              description: 'Test task 4',
              status: 'not_started',
              priority: 3,
              orderIndex: 0,
              isArchived: false,
              assignedUserIds: [],
              tagIds: [],
              createdAt: new Date(),
              updatedAt: new Date(),
              subTasks: [],
              tags: []
            }
          ]
        }
      ]
    }
  ];

  beforeEach(() => {
    taskStore.setProjects(mockProjects);
    selectionStore.selectProject(null);
    selectionStore.selectList(null);
  });

  afterEach(() => {
    taskStore.setProjects([]);
    selectionStore.selectProject(null);
    selectionStore.selectList(null);
  });

  describe('Project Selection', () => {
    it('should return all tasks from selected project', () => {
      selectionStore.selectProject('project-1');

      const tasks = ViewService.getTasksForView('project');

      expect(tasks).toHaveLength(3);
      expect(tasks.map((t) => t.id)).toEqual(['task-1', 'task-2', 'task-3']);
    });

    it('should return empty array when project not found', () => {
      selectionStore.selectProject('non-existent-project');

      const tasks = ViewService.getTasksForView('project');

      expect(tasks).toHaveLength(0);
    });

    it('should return empty array when no project selected', () => {
      const tasks = ViewService.getTasksForView('project');

      expect(tasks).toHaveLength(0);
    });
  });

  describe('TaskList Selection', () => {
    it('should return tasks only from selected list', () => {
      selectionStore.selectList('list-1');

      const tasks = ViewService.getTasksForView('tasklist');

      expect(tasks).toHaveLength(2);
      expect(tasks.map((t) => t.id)).toEqual(['task-1', 'task-2']);
    });

    it('should return tasks from different project list', () => {
      selectionStore.selectList('list-3');

      const tasks = ViewService.getTasksForView('tasklist');

      expect(tasks).toHaveLength(1);
      expect(tasks.map((t) => t.id)).toEqual(['task-4']);
    });

    it('should return empty array when list not found', () => {
      selectionStore.selectList('non-existent-list');

      const tasks = ViewService.getTasksForView('tasklist');

      expect(tasks).toHaveLength(0);
    });

    it('should return empty array when no list selected', () => {
      const tasks = ViewService.getTasksForView('tasklist');

      expect(tasks).toHaveLength(0);
    });
  });

  describe('Mutual Exclusivity', () => {
    it('should clear list selection when project is selected', () => {
      selectionStore.selectList('list-1');
      expect(taskStore.selectedListId).toBe('list-1');

      selectionStore.selectProject('project-2');

      expect(taskStore.selectedProjectId).toBe('project-2');
      expect(taskStore.selectedListId).toBeNull();
    });

    it('should clear project selection when list is selected', () => {
      selectionStore.selectProject('project-1');
      expect(taskStore.selectedProjectId).toBe('project-1');

      selectionStore.selectList('list-3');

      expect(taskStore.selectedListId).toBe('list-3');
      expect(taskStore.selectedProjectId).toBeNull();
    });
  });

  describe('View Titles', () => {
    it('should return project name when project selected', () => {
      selectionStore.selectProject('project-1');

      const title = ViewService.getViewTitle('project');

      expect(title).toBe('Project 1');
    });

    it('should return list name when list selected', () => {
      selectionStore.selectList('list-2');

      const title = ViewService.getViewTitle('tasklist');

      expect(title).toBe('Project 1 > List 2');
    });

    it('should return default when no project selected', () => {
      const title = ViewService.getViewTitle('project');

      expect(title).toBe('Project');
    });

    it('should return default when no list selected', () => {
      const title = ViewService.getViewTitle('tasklist');

      expect(title).toBe('Project');
    });
  });

  describe('Add Button Visibility', () => {
    it('should show add button for project view', () => {
      const shouldShow = ViewService.shouldShowAddButton('project');
      expect(shouldShow).toBe(true);
    });

    it('should show add button for tasklist view', () => {
      const shouldShow = ViewService.shouldShowAddButton('tasklist');
      expect(shouldShow).toBe(true);
    });

    it('should not show add button for completed view', () => {
      const shouldShow = ViewService.shouldShowAddButton('completed');
      expect(shouldShow).toBe(false);
    });
  });

  describe('View Change Handling', () => {
    it('should preserve project selection when changing to project view', () => {
      selectionStore.selectProject('project-1');

      ViewService.handleViewChange('project');

      expect(taskStore.selectedProjectId).toBe('project-1');
      expect(taskStore.selectedListId).toBeNull();
    });

    it('should preserve list selection when changing to tasklist view', () => {
      selectionStore.selectList('list-1');

      ViewService.handleViewChange('tasklist');

      expect(taskStore.selectedListId).toBe('list-1');
      expect(taskStore.selectedProjectId).toBeNull();
    });

    it('should clear project and list selection for other views', () => {
      selectionStore.selectProject('project-1');
      selectionStore.selectList('list-1');

      ViewService.handleViewChange('all');

      expect(taskStore.selectedProjectId).toBeNull();
      expect(taskStore.selectedListId).toBeNull();
    });
  });
});
