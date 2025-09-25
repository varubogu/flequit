import { describe, test, expect, beforeEach } from 'vitest';
import { generateSampleData } from '../../src/lib/data/sample-data';
import type { ProjectTree } from '$lib/types/project';

describe('sample-data', () => {
  let sampleData: ProjectTree[];

  beforeEach(() => {
    sampleData = generateSampleData();
  });

  describe('generateSampleData', () => {
    test('should return an array of projects', () => {
      expect(Array.isArray(sampleData)).toBe(true);
      expect(sampleData.length).toBeGreaterThan(0);
    });

    test('should generate projects with correct structure', () => {
      const project = sampleData[0];

      expect(project).toHaveProperty('id');
      expect(project).toHaveProperty('name');
      expect(project).toHaveProperty('description');
      expect(project).toHaveProperty('color');
      expect(project).toHaveProperty('orderIndex');
      expect(project).toHaveProperty('isArchived');
      expect(project).toHaveProperty('createdAt');
      expect(project).toHaveProperty('updatedAt');
      expect(project).toHaveProperty('taskLists');

      expect(typeof project.id).toBe('string');
      expect(typeof project.name).toBe('string');
      expect(typeof project.orderIndex).toBe('number');
      expect(typeof project.isArchived).toBe('boolean');
      expect(project.createdAt).toBeInstanceOf(Date);
      expect(project.updatedAt).toBeInstanceOf(Date);
      expect(Array.isArray(project.taskLists)).toBe(true);
    });

    test('should generate task lists with correct structure', () => {
      const taskList = sampleData[0].taskLists[0];

      expect(taskList).toHaveProperty('id');
      expect(taskList).toHaveProperty('projectId');
      expect(taskList).toHaveProperty('name');
      expect(taskList).toHaveProperty('orderIndex');
      expect(taskList).toHaveProperty('isArchived');
      expect(taskList).toHaveProperty('createdAt');
      expect(taskList).toHaveProperty('updatedAt');
      expect(taskList).toHaveProperty('tasks');

      expect(typeof taskList.id).toBe('string');
      expect(typeof taskList.projectId).toBe('string');
      expect(typeof taskList.name).toBe('string');
      expect(typeof taskList.orderIndex).toBe('number');
      expect(typeof taskList.isArchived).toBe('boolean');
      expect(taskList.createdAt).toBeInstanceOf(Date);
      expect(taskList.updatedAt).toBeInstanceOf(Date);
      expect(Array.isArray(taskList.tasks)).toBe(true);
    });

    test('should generate tasks with correct structure', () => {
      const task = sampleData[0].taskLists[0].tasks[0];

      expect(task).toHaveProperty('id');
      expect(task).toHaveProperty('listId');
      expect(task).toHaveProperty('title');
      expect(task).toHaveProperty('status');
      expect(task).toHaveProperty('priority');
      expect(task).toHaveProperty('orderIndex');
      expect(task).toHaveProperty('isArchived');
      expect(task).toHaveProperty('createdAt');
      expect(task).toHaveProperty('updatedAt');
      expect(task).toHaveProperty('subTasks');
      expect(task).toHaveProperty('tags');

      expect(typeof task.id).toBe('string');
      expect(typeof task.listId).toBe('string');
      expect(typeof task.title).toBe('string');
      expect(['not_started', 'in_progress', 'waiting', 'completed', 'cancelled']).toContain(
        task.status
      );
      expect(typeof task.priority).toBe('number');
      expect(typeof task.orderIndex).toBe('number');
      expect(typeof task.isArchived).toBe('boolean');
      expect(task.createdAt).toBeInstanceOf(Date);
      expect(task.updatedAt).toBeInstanceOf(Date);
      expect(Array.isArray(task.subTasks)).toBe(true);
      expect(Array.isArray(task.tags)).toBe(true);
    });

    test('should generate subtasks with correct structure', () => {
      // Find a task with subtasks
      let subtask = null;
      for (const project of sampleData) {
        for (const list of project.taskLists) {
          for (const task of list.tasks) {
            if (task.subTasks.length > 0) {
              subtask = task.subTasks[0];
              break;
            }
          }
        }
      }

      expect(subtask).not.toBeNull();

      if (subtask) {
        expect(subtask).toHaveProperty('id');
        expect(subtask).toHaveProperty('taskId');
        expect(subtask).toHaveProperty('title');
        expect(subtask).toHaveProperty('status');
        expect(subtask).toHaveProperty('orderIndex');
        expect(subtask).toHaveProperty('createdAt');
        expect(subtask).toHaveProperty('updatedAt');

        expect(typeof subtask.id).toBe('string');
        expect(typeof subtask.taskId).toBe('string');
        expect(typeof subtask.title).toBe('string');
        expect(['not_started', 'in_progress', 'waiting', 'completed', 'cancelled']).toContain(
          subtask.status
        );
        expect(typeof subtask.orderIndex).toBe('number');
        expect(subtask.createdAt).toBeInstanceOf(Date);
        expect(subtask.updatedAt).toBeInstanceOf(Date);
      }
    });

    test('should generate tags with correct structure', () => {
      // Find a task with tags
      let tag = null;
      for (const project of sampleData) {
        for (const list of project.taskLists) {
          for (const task of list.tasks) {
            if (task.tags.length > 0) {
              tag = task.tags[0];
              break;
            }
          }
        }
      }

      expect(tag).not.toBeNull();

      if (tag) {
        expect(tag).toHaveProperty('id');
        expect(tag).toHaveProperty('name');
        expect(tag).toHaveProperty('color');
        expect(tag).toHaveProperty('createdAt');
        expect(tag).toHaveProperty('updatedAt');

        expect(typeof tag.id).toBe('string');
        expect(typeof tag.name).toBe('string');
        expect(typeof tag.color).toBe('string');
        expect(tag.createdAt).toBeInstanceOf(Date);
        expect(tag.updatedAt).toBeInstanceOf(Date);
      }
    });
  });

  describe('data content validation', () => {
    test('should include personal tasks project', () => {
      const personalProject = sampleData.find((p) => p.name === 'Personal Tasks');

      expect(personalProject).toBeDefined();
      expect(personalProject?.taskLists.length).toBeGreaterThan(0);
    });

    test('should include work project', () => {
      const workProject = sampleData.find((p) => p.name === 'Work Project');

      expect(workProject).toBeDefined();
      expect(workProject?.taskLists.length).toBeGreaterThan(0);
    });

    test('should include tasks with different statuses', () => {
      const allTasks = sampleData.flatMap((p) => p.taskLists.flatMap((l) => l.tasks));

      const statuses = [...new Set(allTasks.map((t) => t.status))];
      expect(statuses.length).toBeGreaterThan(1);
      expect(statuses).toContain('not_started');
    });

    test('should include overdue tasks', () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const allTasks = sampleData.flatMap((p) => p.taskLists.flatMap((l) => l.tasks));

      const overdueTasks = allTasks.filter((task) => {
        if (!task.planEndDate || task.status === 'completed') return false;
        const dueDate = new Date(task.planEndDate);
        dueDate.setHours(0, 0, 0, 0);
        return dueDate < today;
      });

      expect(overdueTasks.length).toBeGreaterThan(0);
    });

    test('should include today tasks', () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const allTasks = sampleData.flatMap((p) => p.taskLists.flatMap((l) => l.tasks));

      const todayTasks = allTasks.filter((task) => {
        if (!task.planEndDate) return false;
        const dueDate = new Date(task.planEndDate);
        dueDate.setHours(0, 0, 0, 0);
        return dueDate >= today && dueDate < tomorrow;
      });

      expect(todayTasks.length).toBeGreaterThan(0);
    });
  });

  describe('data relationships', () => {
    test('should have correct project-list relationships', () => {
      for (const project of sampleData) {
        for (const list of project.taskLists) {
          expect(list.projectId).toBe(project.id);
        }
      }
    });

    test('should have correct list-task relationships', () => {
      for (const project of sampleData) {
        for (const list of project.taskLists) {
          for (const task of list.tasks) {
            expect(task.listId).toBe(list.id);
          }
        }
      }
    });

    test('should have correct task-subtask relationships', () => {
      for (const project of sampleData) {
        for (const list of project.taskLists) {
          for (const task of list.tasks) {
            for (const subtask of task.subTasks) {
              expect(subtask.taskId).toBe(task.id);
            }
          }
        }
      }
    });
  });

  describe('data consistency', () => {
    test('should have unique IDs across projects', () => {
      const projectIds = sampleData.map((p) => p.id);
      const uniqueProjectIds = [...new Set(projectIds)];

      expect(uniqueProjectIds.length).toBe(projectIds.length);
    });

    test('should have unique IDs across task lists', () => {
      const listIds = sampleData.flatMap((p) => p.taskLists.map((l) => l.id));
      const uniqueListIds = [...new Set(listIds)];

      expect(uniqueListIds.length).toBe(listIds.length);
    });

    test('should have unique IDs across tasks', () => {
      const taskIds = sampleData.flatMap((p) =>
        p.taskLists.flatMap((l) => l.tasks.map((t) => t.id))
      );
      const uniqueTaskIds = [...new Set(taskIds)];

      expect(uniqueTaskIds.length).toBe(taskIds.length);
    });

    test('should have unique IDs across subtasks', () => {
      const subtaskIds = sampleData.flatMap((p) =>
        p.taskLists.flatMap((l) => l.tasks.flatMap((t) => t.subTasks.map((st) => st.id)))
      );
      const uniqueSubtaskIds = [...new Set(subtaskIds)];

      expect(uniqueSubtaskIds.length).toBe(subtaskIds.length);
    });

    test('should have proper order indices', () => {
      for (const project of sampleData) {
        expect(project.orderIndex).toBeGreaterThanOrEqual(0);

        for (const list of project.taskLists) {
          expect(list.orderIndex).toBeGreaterThanOrEqual(0);

          for (const task of list.tasks) {
            expect(task.orderIndex).toBeGreaterThanOrEqual(0);

            for (const subtask of task.subTasks) {
              expect(subtask.orderIndex).toBeGreaterThanOrEqual(0);
            }
          }
        }
      }
    });
  });
});
