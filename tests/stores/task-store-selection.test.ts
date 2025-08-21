import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { TaskStore } from '$lib/stores/tasks.svelte';
import type { ProjectTree } from '$lib/types/project';

describe('TaskStore - Selection Management', () => {
  let taskStore: TaskStore;

  // Mock data
  const mockProjects: ProjectTree[] = [
    {
      id: 'project-1',
      name: 'Project 1',
      description: 'Test project',
      color: '#3b82f6',
      order_index: 0,
      is_archived: false,
      created_at: new Date(),
      updated_at: new Date(),
      task_lists: [
        {
          id: 'list-1',
          project_id: 'project-1',
          name: 'List 1',
          description: 'Test list',
          color: '#ef4444',
          order_index: 0,
          is_archived: false,
          created_at: new Date(),
          updated_at: new Date(),
          tasks: [
            {
              id: 'task-1',
              project_id: 'proj-1',
              list_id: 'list-1',
              title: 'Test Task',
              description: 'Test description',
              status: 'not_started',
              priority: 1,
              assigned_user_ids: [],
              tag_ids: [],
              order_index: 0,
              is_archived: false,
              created_at: new Date(),
              updated_at: new Date(),
              sub_tasks: [
                {
                  id: 'subtask-1',
                  task_id: 'task-1',
                  title: 'Test SubTask',
                  description: 'Test subdescription',
                  status: 'not_started',
                  order_index: 0,
                  created_at: new Date(),
                  updated_at: new Date(),
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
    taskStore = new TaskStore();
    taskStore.setProjects(mockProjects);
  });

  afterEach(() => {
    taskStore.setProjects([]);
  });

  describe('Project Selection', () => {
    it('should set selected project ID', () => {
      taskStore.selectProject('project-1');

      expect(taskStore.selectedProjectId).toBe('project-1');
    });

    it('should clear selected project ID when null passed', () => {
      taskStore.selectProject('project-1');
      taskStore.selectProject(null);

      expect(taskStore.selectedProjectId).toBeNull();
    });

    it('should clear list selection when project selected', () => {
      taskStore.selectList('list-1');
      expect(taskStore.selectedListId).toBe('list-1');

      taskStore.selectProject('project-1');

      expect(taskStore.selectedProjectId).toBe('project-1');
      expect(taskStore.selectedListId).toBeNull();
    });
  });

  describe('List Selection', () => {
    it('should set selected list ID', () => {
      taskStore.selectList('list-1');

      expect(taskStore.selectedListId).toBe('list-1');
    });

    it('should clear selected list ID when null passed', () => {
      taskStore.selectList('list-1');
      taskStore.selectList(null);

      expect(taskStore.selectedListId).toBeNull();
    });

    it('should clear project selection when list selected', () => {
      taskStore.selectProject('project-1');
      expect(taskStore.selectedProjectId).toBe('project-1');

      taskStore.selectList('list-1');

      expect(taskStore.selectedListId).toBe('list-1');
      expect(taskStore.selectedProjectId).toBeNull();
    });
  });

  describe('Task Selection', () => {
    it('should set selected task ID', () => {
      taskStore.selectTask('task-1');

      expect(taskStore.selectedTaskId).toBe('task-1');
    });

    it('should clear selected task ID when null passed', () => {
      taskStore.selectTask('task-1');
      taskStore.selectTask(null);

      expect(taskStore.selectedTaskId).toBeNull();
    });

    it('should clear subtask selection when task selected', () => {
      taskStore.selectSubTask('subtask-1');
      expect(taskStore.selectedSubTaskId).toBe('subtask-1');

      taskStore.selectTask('task-1');

      expect(taskStore.selectedTaskId).toBe('task-1');
      expect(taskStore.selectedSubTaskId).toBeNull();
    });
  });

  describe('SubTask Selection', () => {
    it('should set selected subtask ID', () => {
      taskStore.selectSubTask('subtask-1');

      expect(taskStore.selectedSubTaskId).toBe('subtask-1');
    });

    it('should clear selected subtask ID when null passed', () => {
      taskStore.selectSubTask('subtask-1');
      taskStore.selectSubTask(null);

      expect(taskStore.selectedSubTaskId).toBeNull();
    });

    it('should clear task selection when subtask selected', () => {
      taskStore.selectTask('task-1');
      expect(taskStore.selectedTaskId).toBe('task-1');

      taskStore.selectSubTask('subtask-1');

      expect(taskStore.selectedSubTaskId).toBe('subtask-1');
      expect(taskStore.selectedTaskId).toBeNull();
    });
  });

  describe('Mutual Exclusivity', () => {
    it('should ensure only one of project or list is selected', () => {
      // Start with project selected
      taskStore.selectProject('project-1');
      expect(taskStore.selectedProjectId).toBe('project-1');
      expect(taskStore.selectedListId).toBeNull();

      // Select list should clear project
      taskStore.selectList('list-1');
      expect(taskStore.selectedListId).toBe('list-1');
      expect(taskStore.selectedProjectId).toBeNull();

      // Select project should clear list
      taskStore.selectProject('project-1');
      expect(taskStore.selectedProjectId).toBe('project-1');
      expect(taskStore.selectedListId).toBeNull();
    });

    it('should ensure only one of task or subtask is selected', () => {
      // Start with task selected
      taskStore.selectTask('task-1');
      expect(taskStore.selectedTaskId).toBe('task-1');
      expect(taskStore.selectedSubTaskId).toBeNull();

      // Select subtask should clear task
      taskStore.selectSubTask('subtask-1');
      expect(taskStore.selectedSubTaskId).toBe('subtask-1');
      expect(taskStore.selectedTaskId).toBeNull();

      // Select task should clear subtask
      taskStore.selectTask('task-1');
      expect(taskStore.selectedTaskId).toBe('task-1');
      expect(taskStore.selectedSubTaskId).toBeNull();
    });
  });

  describe('Selection State Retrieval', () => {
    it('should return selected task object', () => {
      taskStore.selectTask('task-1');

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
      taskStore.selectSubTask('subtask-1');

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
      taskStore.selectProject('project-1');
      taskStore.selectList('list-1');
      taskStore.selectProject('project-1');
      taskStore.selectTask('task-1');
      taskStore.selectSubTask('subtask-1');

      // Final state should be subtask selected
      expect(taskStore.selectedSubTaskId).toBe('subtask-1');
      expect(taskStore.selectedTaskId).toBeNull();
      expect(taskStore.selectedProjectId).toBe('project-1');
      expect(taskStore.selectedListId).toBeNull();
    });

    it('should maintain independence between project/list and task/subtask selections', () => {
      // Select project and task
      taskStore.selectProject('project-1');
      taskStore.selectTask('task-1');

      expect(taskStore.selectedProjectId).toBe('project-1');
      expect(taskStore.selectedTaskId).toBe('task-1');

      // Select list should not affect task selection
      taskStore.selectList('list-1');

      expect(taskStore.selectedListId).toBe('list-1');
      expect(taskStore.selectedProjectId).toBeNull();
      expect(taskStore.selectedTaskId).toBe('task-1'); // Should remain

      // Select subtask should clear task but not affect list
      taskStore.selectSubTask('subtask-1');

      expect(taskStore.selectedListId).toBe('list-1'); // Should remain
      expect(taskStore.selectedSubTaskId).toBe('subtask-1');
      expect(taskStore.selectedTaskId).toBeNull();
    });
  });
});
