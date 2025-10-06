import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { TaskStore } from '$lib/stores/tasks.svelte';
import { selectionStore } from '$lib/stores/selection-store.svelte';
import type { ProjectTree } from '$lib/types/project';

describe.sequential('TaskStore - Selection Management', () => {
  let taskStore: TaskStore;

  // Mock data
  const mockProjects: ProjectTree[] = [
    {
      id: 'project-1',
      name: 'Project 1',
      description: 'Test project',
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
          description: 'Test list',
          color: '#ef4444',
          orderIndex: 0,
          isArchived: false,
          createdAt: new Date(),
          updatedAt: new Date(),
          tasks: [
            {
              id: 'task-1',
              projectId: 'proj-1',
              listId: 'list-1',
              title: 'Test Task',
              description: 'Test description',
              status: 'not_started',
              priority: 1,
              assignedUserIds: [],
              tagIds: [],
              orderIndex: 0,
              isArchived: false,
              createdAt: new Date(),
              updatedAt: new Date(),
              subTasks: [
                {
                  id: 'subtask-1',
                  taskId: 'task-1',
                  title: 'Test SubTask',
                  description: 'Test subdescription',
                  status: 'not_started',
                  orderIndex: 0,
                  completed: false,
                  assignedUserIds: [],
                  createdAt: new Date(),
                  updatedAt: new Date(),
                  tags: []
                }
              ],
              tags: []
            }
          ]
        }
      ]
    }
  ];

  beforeEach(() => {
    selectionStore.reset();
    taskStore = new TaskStore();
    taskStore.setProjects(mockProjects);
  });

  afterEach(() => {
    taskStore.setProjects([]);
    selectionStore.reset();
  });

  describe('Project Selection', () => {
    it('should set selected project ID', () => {
      selectionStore.selectProject('project-1');

      expect(taskStore.selectedProjectId).toBe('project-1');
    });

    it('should clear selected project ID when null passed', () => {
      selectionStore.selectProject('project-1');
      selectionStore.selectProject(null);

      expect(taskStore.selectedProjectId).toBeNull();
    });

    it('should clear list selection when project selected', () => {
      selectionStore.selectList('list-1');
      expect(taskStore.selectedListId).toBe('list-1');

      selectionStore.selectProject('project-1');

      expect(taskStore.selectedProjectId).toBe('project-1');
      expect(taskStore.selectedListId).toBeNull();
    });
  });

  describe('List Selection', () => {
    it('should set selected list ID', () => {
      selectionStore.selectList('list-1');

      expect(taskStore.selectedListId).toBe('list-1');
    });

    it('should clear selected list ID when null passed', () => {
      selectionStore.selectList('list-1');
      selectionStore.selectList(null);

      expect(taskStore.selectedListId).toBeNull();
    });

    it('should clear project selection when list selected', () => {
      selectionStore.selectProject('project-1');
      expect(taskStore.selectedProjectId).toBe('project-1');

      selectionStore.selectList('list-1');

      expect(taskStore.selectedListId).toBe('list-1');
      expect(taskStore.selectedProjectId).toBeNull();
    });
  });

  describe('Task Selection', () => {
    it('should set selected task ID', () => {
      selectionStore.selectTask('task-1');

      expect(taskStore.selectedTaskId).toBe('task-1');
    });

    it('should clear selected task ID when null passed', () => {
      selectionStore.selectTask('task-1');
      selectionStore.selectTask(null);

      expect(taskStore.selectedTaskId).toBeNull();
    });

    it('should clear subtask selection when task selected', () => {
      selectionStore.selectSubTask('subtask-1');
      expect(taskStore.selectedSubTaskId).toBe('subtask-1');

      selectionStore.selectTask('task-1');

      expect(taskStore.selectedTaskId).toBe('task-1');
      expect(taskStore.selectedSubTaskId).toBeNull();
    });
  });

  describe('SubTask Selection', () => {
    it('should set selected subtask ID', () => {
      selectionStore.selectSubTask('subtask-1');

      expect(taskStore.selectedSubTaskId).toBe('subtask-1');
    });

    it('should clear selected subtask ID when null passed', () => {
      selectionStore.selectSubTask('subtask-1');
      selectionStore.selectSubTask(null);

      expect(taskStore.selectedSubTaskId).toBeNull();
    });

    it('should clear task selection when subtask selected', () => {
      selectionStore.selectTask('task-1');
      expect(taskStore.selectedTaskId).toBe('task-1');

      selectionStore.selectSubTask('subtask-1');

      expect(taskStore.selectedSubTaskId).toBe('subtask-1');
      expect(taskStore.selectedTaskId).toBeNull();
    });
  });

  describe('Mutual Exclusivity', () => {
    it('should ensure only one of project or list is selected', () => {
      // Start with project selected
      selectionStore.selectProject('project-1');
      expect(taskStore.selectedProjectId).toBe('project-1');
      expect(taskStore.selectedListId).toBeNull();

      // Select list should clear project
      selectionStore.selectList('list-1');
      expect(taskStore.selectedListId).toBe('list-1');
      expect(taskStore.selectedProjectId).toBeNull();

      // Select project should clear list
      selectionStore.selectProject('project-1');
      expect(taskStore.selectedProjectId).toBe('project-1');
      expect(taskStore.selectedListId).toBeNull();
    });

    it('should ensure only one of task or subtask is selected', () => {
      // Start with task selected
      selectionStore.selectTask('task-1');
      expect(taskStore.selectedTaskId).toBe('task-1');
      expect(taskStore.selectedSubTaskId).toBeNull();

      // Select subtask should clear task
      selectionStore.selectSubTask('subtask-1');
      expect(taskStore.selectedSubTaskId).toBe('subtask-1');
      expect(taskStore.selectedTaskId).toBeNull();

      // Select task should clear subtask
      selectionStore.selectTask('task-1');
      expect(taskStore.selectedTaskId).toBe('task-1');
      expect(taskStore.selectedSubTaskId).toBeNull();
    });
  });

  describe('Selection State Retrieval', () => {
    it('should return selected task object', () => {
      selectionStore.selectTask('task-1');

      const selectedTask = taskStore.selectedTask;

      expect(selectedTask).toBeDefined();
      expect(selectedTask?.id).toBe('task-1');
      expect(selectedTask?.title).toBe('Test Task');
    });

    it('should return null when no task selected', () => {
      const selectedTask = taskStore.selectedTask;

      expect(selectedTask).toBeNull();
    });

    it('should return selected subtask object', () => {
      selectionStore.selectSubTask('subtask-1');

      const selectedSubTask = taskStore.selectedSubTask;

      expect(selectedSubTask).toBeDefined();
      expect(selectedSubTask?.id).toBe('subtask-1');
      expect(selectedSubTask?.title).toBe('Test SubTask');
    });

    it('should return null when no subtask selected', () => {
      const selectedSubTask = taskStore.selectedSubTask;

      expect(selectedSubTask).toBeNull();
    });
  });

  describe('Complex Selection Scenarios', () => {
    it('should handle rapid selection changes correctly', () => {
      // Rapidly change selections
      selectionStore.selectProject('project-1');
      selectionStore.selectList('list-1');
      selectionStore.selectProject('project-1');
      selectionStore.selectTask('task-1');
      selectionStore.selectSubTask('subtask-1');

      // Final state should be subtask selected
      expect(taskStore.selectedSubTaskId).toBe('subtask-1');
      expect(taskStore.selectedTaskId).toBeNull();
      expect(taskStore.selectedProjectId).toBe('project-1');
      expect(taskStore.selectedListId).toBeNull();
    });

    it('should maintain independence between project/list and task/subtask selections', () => {
      // Select project and task
      selectionStore.selectProject('project-1');
      selectionStore.selectTask('task-1');

      expect(taskStore.selectedProjectId).toBe('project-1');
      expect(taskStore.selectedTaskId).toBe('task-1');

      // Select list should not affect task selection
      selectionStore.selectList('list-1');

      expect(taskStore.selectedListId).toBe('list-1');
      expect(taskStore.selectedProjectId).toBeNull();
      expect(taskStore.selectedTaskId).toBe('task-1'); // Should remain

      // Select subtask should clear task but not affect list
      selectionStore.selectSubTask('subtask-1');

      expect(taskStore.selectedListId).toBe('list-1'); // Should remain
      expect(taskStore.selectedSubTaskId).toBe('subtask-1');
      expect(taskStore.selectedTaskId).toBeNull();
    });
  });
});
