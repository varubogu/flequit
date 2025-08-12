import { describe, test, expect, beforeEach } from 'vitest';
import { generateSampleData } from '../../src/lib/data/sample-data';
import type { ProjectTree } from "$lib/types/project";

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
      expect(project).toHaveProperty('order_index');
      expect(project).toHaveProperty('is_archived');
      expect(project).toHaveProperty('created_at');
      expect(project).toHaveProperty('updated_at');
      expect(project).toHaveProperty('task_lists');

      expect(typeof project.id).toBe('string');
      expect(typeof project.name).toBe('string');
      expect(typeof project.order_index).toBe('number');
      expect(typeof project.is_archived).toBe('boolean');
      expect(project.created_at).toBeInstanceOf(Date);
      expect(project.updated_at).toBeInstanceOf(Date);
      expect(Array.isArray(project.task_lists)).toBe(true);
    });

    test('should generate task lists with correct structure', () => {
      const taskList = sampleData[0].task_lists[0];

      expect(taskList).toHaveProperty('id');
      expect(taskList).toHaveProperty('project_id');
      expect(taskList).toHaveProperty('name');
      expect(taskList).toHaveProperty('order_index');
      expect(taskList).toHaveProperty('is_archived');
      expect(taskList).toHaveProperty('created_at');
      expect(taskList).toHaveProperty('updated_at');
      expect(taskList).toHaveProperty('tasks');

      expect(typeof taskList.id).toBe('string');
      expect(typeof taskList.project_id).toBe('string');
      expect(typeof taskList.name).toBe('string');
      expect(typeof taskList.order_index).toBe('number');
      expect(typeof taskList.is_archived).toBe('boolean');
      expect(taskList.created_at).toBeInstanceOf(Date);
      expect(taskList.updated_at).toBeInstanceOf(Date);
      expect(Array.isArray(taskList.tasks)).toBe(true);
    });

    test('should generate tasks with correct structure', () => {
      const task = sampleData[0].task_lists[0].tasks[0];

      expect(task).toHaveProperty('id');
      expect(task).toHaveProperty('list_id');
      expect(task).toHaveProperty('title');
      expect(task).toHaveProperty('status');
      expect(task).toHaveProperty('priority');
      expect(task).toHaveProperty('order_index');
      expect(task).toHaveProperty('is_archived');
      expect(task).toHaveProperty('created_at');
      expect(task).toHaveProperty('updated_at');
      expect(task).toHaveProperty('sub_tasks');
      expect(task).toHaveProperty('tags');

      expect(typeof task.id).toBe('string');
      expect(typeof task.list_id).toBe('string');
      expect(typeof task.title).toBe('string');
      expect(['not_started', 'in_progress', 'waiting', 'completed', 'cancelled']).toContain(
        task.status
      );
      expect(typeof task.priority).toBe('number');
      expect(typeof task.order_index).toBe('number');
      expect(typeof task.is_archived).toBe('boolean');
      expect(task.created_at).toBeInstanceOf(Date);
      expect(task.updated_at).toBeInstanceOf(Date);
      expect(Array.isArray(task.sub_tasks)).toBe(true);
      expect(Array.isArray(task.tags)).toBe(true);
    });

    test('should generate subtasks with correct structure', () => {
      // Find a task with subtasks
      let subtask = null;
      for (const project of sampleData) {
        for (const list of project.task_lists) {
          for (const task of list.tasks) {
            if (task.sub_tasks.length > 0) {
              subtask = task.sub_tasks[0];
              break;
            }
          }
        }
      }

      expect(subtask).not.toBeNull();

      if (subtask) {
        expect(subtask).toHaveProperty('id');
        expect(subtask).toHaveProperty('task_id');
        expect(subtask).toHaveProperty('title');
        expect(subtask).toHaveProperty('status');
        expect(subtask).toHaveProperty('order_index');
        expect(subtask).toHaveProperty('created_at');
        expect(subtask).toHaveProperty('updated_at');

        expect(typeof subtask.id).toBe('string');
        expect(typeof subtask.task_id).toBe('string');
        expect(typeof subtask.title).toBe('string');
        expect(['not_started', 'in_progress', 'waiting', 'completed', 'cancelled']).toContain(
          subtask.status
        );
        expect(typeof subtask.order_index).toBe('number');
        expect(subtask.created_at).toBeInstanceOf(Date);
        expect(subtask.updated_at).toBeInstanceOf(Date);
      }
    });

    test('should generate tags with correct structure', () => {
      // Find a task with tags
      let tag = null;
      for (const project of sampleData) {
        for (const list of project.task_lists) {
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
        expect(tag).toHaveProperty('created_at');
        expect(tag).toHaveProperty('updated_at');

        expect(typeof tag.id).toBe('string');
        expect(typeof tag.name).toBe('string');
        expect(typeof tag.color).toBe('string');
        expect(tag.created_at).toBeInstanceOf(Date);
        expect(tag.updated_at).toBeInstanceOf(Date);
      }
    });
  });

  describe('data content validation', () => {
    test('should include personal tasks project', () => {
      const personalProject = sampleData.find((p) => p.name === 'Personal Tasks');

      expect(personalProject).toBeDefined();
      expect(personalProject?.task_lists.length).toBeGreaterThan(0);
    });

    test('should include work project', () => {
      const workProject = sampleData.find((p) => p.name === 'Work Project');

      expect(workProject).toBeDefined();
      expect(workProject?.task_lists.length).toBeGreaterThan(0);
    });

    test('should include tasks with different statuses', () => {
      const allTasks = sampleData.flatMap((p) => p.task_lists.flatMap((l) => l.tasks));

      const statuses = [...new Set(allTasks.map((t) => t.status))];
      expect(statuses.length).toBeGreaterThan(1);
      expect(statuses).toContain('not_started');
    });

    test('should include overdue tasks', () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const allTasks = sampleData.flatMap((p) => p.task_lists.flatMap((l) => l.tasks));

      const overdueTasks = allTasks.filter((task) => {
        if (!task.end_date || task.status === 'completed') return false;
        const dueDate = new Date(task.end_date);
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

      const allTasks = sampleData.flatMap((p) => p.task_lists.flatMap((l) => l.tasks));

      const todayTasks = allTasks.filter((task) => {
        if (!task.end_date) return false;
        const dueDate = new Date(task.end_date);
        dueDate.setHours(0, 0, 0, 0);
        return dueDate >= today && dueDate < tomorrow;
      });

      expect(todayTasks.length).toBeGreaterThan(0);
    });
  });

  describe('data relationships', () => {
    test('should have correct project-list relationships', () => {
      for (const project of sampleData) {
        for (const list of project.task_lists) {
          expect(list.project_id).toBe(project.id);
        }
      }
    });

    test('should have correct list-task relationships', () => {
      for (const project of sampleData) {
        for (const list of project.task_lists) {
          for (const task of list.tasks) {
            expect(task.list_id).toBe(list.id);
          }
        }
      }
    });

    test('should have correct task-subtask relationships', () => {
      for (const project of sampleData) {
        for (const list of project.task_lists) {
          for (const task of list.tasks) {
            for (const subtask of task.sub_tasks) {
              expect(subtask.task_id).toBe(task.id);
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
      const listIds = sampleData.flatMap((p) => p.task_lists.map((l) => l.id));
      const uniqueListIds = [...new Set(listIds)];

      expect(uniqueListIds.length).toBe(listIds.length);
    });

    test('should have unique IDs across tasks', () => {
      const taskIds = sampleData.flatMap((p) =>
        p.task_lists.flatMap((l) => l.tasks.map((t) => t.id))
      );
      const uniqueTaskIds = [...new Set(taskIds)];

      expect(uniqueTaskIds.length).toBe(taskIds.length);
    });

    test('should have unique IDs across subtasks', () => {
      const subtaskIds = sampleData.flatMap((p) =>
        p.task_lists.flatMap((l) => l.tasks.flatMap((t) => t.sub_tasks.map((st) => st.id)))
      );
      const uniqueSubtaskIds = [...new Set(subtaskIds)];

      expect(uniqueSubtaskIds.length).toBe(subtaskIds.length);
    });

    test('should have proper order indices', () => {
      for (const project of sampleData) {
        expect(project.order_index).toBeGreaterThanOrEqual(0);

        for (const list of project.task_lists) {
          expect(list.order_index).toBeGreaterThanOrEqual(0);

          for (const task of list.tasks) {
            expect(task.order_index).toBeGreaterThanOrEqual(0);

            for (const subtask of task.sub_tasks) {
              expect(subtask.order_index).toBeGreaterThanOrEqual(0);
            }
          }
        }
      }
    });
  });
});
