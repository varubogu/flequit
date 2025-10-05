import { describe, test, expect, beforeEach } from 'vitest';
import { ProjectTreeTraverser } from '../../src/lib/utils/project-tree-traverser';
import type { ProjectTree } from '../../src/lib/types/project';
import type { TaskWithSubTasks } from '../../src/lib/types/task';
import type { Tag } from '../../src/lib/types/tag';

describe('ProjectTreeTraverser', () => {
  let projects: ProjectTree[];

  beforeEach(() => {
    // テスト用のプロジェクトツリーを準備
    projects = [
      {
        id: 'project-1',
        name: 'Project 1',
        description: 'Test project 1',
        color: '#ff0000',
        orderIndex: 0,
        isArchived: false,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
        taskLists: [
          {
            id: 'list-1',
            projectId: 'project-1',
            name: 'List 1',
            description: 'Test list 1',
            color: '#00ff00',
            orderIndex: 0,
            isArchived: false,
            createdAt: new Date('2024-01-01'),
            updatedAt: new Date('2024-01-01'),
            tasks: [
              {
                id: 'task-1',
                projectId: 'project-1',
                listId: 'list-1',
                title: 'Task 1',
                description: 'Test task 1',
                status: 'not_started',
                priority: 1,
                orderIndex: 0,
                isArchived: false,
                assignedUserIds: [],
                tagIds: [],
                createdAt: new Date('2024-01-01'),
                updatedAt: new Date('2024-01-01'),
                subTasks: [
                  {
                    id: 'subtask-1',
                    taskId: 'task-1',
                    title: 'SubTask 1',
                    status: 'not_started',
                    orderIndex: 0,
                    createdAt: new Date('2024-01-01'),
                    updatedAt: new Date('2024-01-01'),
                    tags: [],
                    completed: false,
                    assignedUserIds: []
                  }
                ],
                tags: [
                  { id: 'tag-1', name: 'Important', color: '#ff0000', createdAt: new Date('2024-01-01'), updatedAt: new Date('2024-01-01') }
                ]
              },
              {
                id: 'task-2',
                projectId: 'project-1',
                listId: 'list-1',
                title: 'Task 2',
                status: 'completed',
                priority: 2,
                orderIndex: 1,
                isArchived: false,
                assignedUserIds: [],
                tagIds: [],
                createdAt: new Date('2024-01-02'),
                updatedAt: new Date('2024-01-02'),
                subTasks: [],
                tags: [
                  { id: 'tag-1', name: 'Important', color: '#ff0000', createdAt: new Date('2024-01-01'), updatedAt: new Date('2024-01-01') }
                ]
              }
            ]
          },
          {
            id: 'list-2',
            projectId: 'project-1',
            name: 'List 2',
            orderIndex: 1,
            isArchived: false,
            createdAt: new Date('2024-01-01'),
            updatedAt: new Date('2024-01-01'),
            tasks: []
          }
        ]
      },
      {
        id: 'project-2',
        name: 'Project 2',
        orderIndex: 1,
        isArchived: false,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
        taskLists: []
      }
    ];
  });

  describe('findTask', () => {
    test('should find task by ID', () => {
      const task = ProjectTreeTraverser.findTask(projects, 'task-1');
      expect(task).not.toBeNull();
      expect(task?.id).toBe('task-1');
      expect(task?.title).toBe('Task 1');
    });

    test('should return null for non-existent task', () => {
      const task = ProjectTreeTraverser.findTask(projects, 'non-existent');
      expect(task).toBeNull();
    });

    test('should find task in different list', () => {
      const task = ProjectTreeTraverser.findTask(projects, 'task-2');
      expect(task).not.toBeNull();
      expect(task?.id).toBe('task-2');
    });
  });

  describe('findTaskList', () => {
    test('should find task list by ID', () => {
      const list = ProjectTreeTraverser.findTaskList(projects, 'list-1');
      expect(list).not.toBeNull();
      expect(list?.id).toBe('list-1');
      expect(list?.name).toBe('List 1');
    });

    test('should return null for non-existent list', () => {
      const list = ProjectTreeTraverser.findTaskList(projects, 'non-existent');
      expect(list).toBeNull();
    });

    test('should find empty list', () => {
      const list = ProjectTreeTraverser.findTaskList(projects, 'list-2');
      expect(list).not.toBeNull();
      expect(list?.tasks).toHaveLength(0);
    });
  });

  describe('findProject', () => {
    test('should find project by ID', () => {
      const project = ProjectTreeTraverser.findProject(projects, 'project-1');
      expect(project).not.toBeNull();
      expect(project?.id).toBe('project-1');
      expect(project?.name).toBe('Project 1');
    });

    test('should return null for non-existent project', () => {
      const project = ProjectTreeTraverser.findProject(projects, 'non-existent');
      expect(project).toBeNull();
    });
  });

  describe('findSubTask', () => {
    test('should find subtask by ID', () => {
      const subTask = ProjectTreeTraverser.findSubTask(projects, 'subtask-1');
      expect(subTask).not.toBeNull();
      expect(subTask?.id).toBe('subtask-1');
      expect(subTask?.title).toBe('SubTask 1');
    });

    test('should return null for non-existent subtask', () => {
      const subTask = ProjectTreeTraverser.findSubTask(projects, 'non-existent');
      expect(subTask).toBeNull();
    });
  });

  describe('findTaskContext', () => {
    test('should find task context', () => {
      const context = ProjectTreeTraverser.findTaskContext(projects, 'task-1');
      expect(context).not.toBeNull();
      expect(context?.project.id).toBe('project-1');
      expect(context?.taskList.id).toBe('list-1');
    });

    test('should return null for non-existent task', () => {
      const context = ProjectTreeTraverser.findTaskContext(projects, 'non-existent');
      expect(context).toBeNull();
    });
  });

  describe('getProjectIdByTaskId', () => {
    test('should get project ID by task ID', () => {
      const projectId = ProjectTreeTraverser.getProjectIdByTaskId(projects, 'task-1');
      expect(projectId).toBe('project-1');
    });

    test('should return null for non-existent task', () => {
      const projectId = ProjectTreeTraverser.getProjectIdByTaskId(projects, 'non-existent');
      expect(projectId).toBeNull();
    });
  });

  describe('getProjectIdByTagId', () => {
    test('should get project ID by tag ID', () => {
      const projectId = ProjectTreeTraverser.getProjectIdByTagId(projects, 'tag-1');
      expect(projectId).toBe('project-1');
    });

    test('should return null for non-existent tag', () => {
      const projectId = ProjectTreeTraverser.getProjectIdByTagId(projects, 'non-existent');
      expect(projectId).toBeNull();
    });

    test('should find tag in subtask', () => {
      // サブタスクにタグを追加
      projects[0].taskLists[0].tasks[0].subTasks[0].tags = [
        { id: 'tag-2', name: 'SubTask Tag', color: '#0000ff', createdAt: new Date('2024-01-01'), updatedAt: new Date('2024-01-01') }
      ];

      const projectId = ProjectTreeTraverser.getProjectIdByTagId(projects, 'tag-2');
      expect(projectId).toBe('project-1');
    });
  });

  describe('updateTask', () => {
    test('should update task using updater function', () => {
      const success = ProjectTreeTraverser.updateTask(projects, 'task-1', (task) => {
        task.title = 'Updated Task';
        task.status = 'in_progress';
      });

      expect(success).toBe(true);
      const task = ProjectTreeTraverser.findTask(projects, 'task-1');
      expect(task?.title).toBe('Updated Task');
      expect(task?.status).toBe('in_progress');
    });

    test('should return false for non-existent task', () => {
      const success = ProjectTreeTraverser.updateTask(projects, 'non-existent', (task) => {
        task.title = 'Updated';
      });

      expect(success).toBe(false);
    });
  });

  describe('deleteTask', () => {
    test('should delete task', () => {
      const success = ProjectTreeTraverser.deleteTask(projects, 'task-1');
      expect(success).toBe(true);

      const task = ProjectTreeTraverser.findTask(projects, 'task-1');
      expect(task).toBeNull();

      // list-1にはtask-2のみが残る
      const list = ProjectTreeTraverser.findTaskList(projects, 'list-1');
      expect(list?.tasks).toHaveLength(1);
      expect(list?.tasks[0].id).toBe('task-2');
    });

    test('should return false for non-existent task', () => {
      const success = ProjectTreeTraverser.deleteTask(projects, 'non-existent');
      expect(success).toBe(false);
    });
  });

  describe('removeTagFromAllTasks', () => {
    test('should remove tag from all tasks', () => {
      ProjectTreeTraverser.removeTagFromAllTasks(projects, 'tag-1');

      const task1 = ProjectTreeTraverser.findTask(projects, 'task-1');
      const task2 = ProjectTreeTraverser.findTask(projects, 'task-2');

      expect(task1?.tags).toHaveLength(0);
      expect(task2?.tags).toHaveLength(0);
    });

    test('should remove tag from subtasks', () => {
      // サブタスクにタグを追加
      projects[0].taskLists[0].tasks[0].subTasks[0].tags = [
        { id: 'tag-1', name: 'Important', color: '#ff0000', createdAt: new Date('2024-01-01'), updatedAt: new Date('2024-01-01') }
      ];

      ProjectTreeTraverser.removeTagFromAllTasks(projects, 'tag-1');

      const task = ProjectTreeTraverser.findTask(projects, 'task-1');
      expect(task?.subTasks[0].tags).toHaveLength(0);
    });

    test('should handle non-existent tag gracefully', () => {
      ProjectTreeTraverser.removeTagFromAllTasks(projects, 'non-existent');

      const task1 = ProjectTreeTraverser.findTask(projects, 'task-1');
      expect(task1?.tags).toHaveLength(1); // 変更なし
    });
  });

  describe('updateTagInAllTasks', () => {
    test('should update tag in all tasks', () => {
      const updatedTag: Tag = {
        id: 'tag-1',
        name: 'Very Important',
        color: '#ff00ff',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01')
      };

      ProjectTreeTraverser.updateTagInAllTasks(projects, updatedTag);

      const task1 = ProjectTreeTraverser.findTask(projects, 'task-1');
      const task2 = ProjectTreeTraverser.findTask(projects, 'task-2');

      expect(task1?.tags[0].name).toBe('Very Important');
      expect(task1?.tags[0].color).toBe('#ff00ff');
      expect(task2?.tags[0].name).toBe('Very Important');
    });

    test('should update tag in subtasks', () => {
      // サブタスクにタグを追加
      projects[0].taskLists[0].tasks[0].subTasks[0].tags = [
        { id: 'tag-1', name: 'Important', color: '#ff0000', createdAt: new Date('2024-01-01'), updatedAt: new Date('2024-01-01') }
      ];

      const updatedTag: Tag = {
        id: 'tag-1',
        name: 'Updated',
        color: '#000000',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01')
      };

      ProjectTreeTraverser.updateTagInAllTasks(projects, updatedTag);

      const task = ProjectTreeTraverser.findTask(projects, 'task-1');
      expect(task?.subTasks[0].tags?.[0].name).toBe('Updated');
    });

    test('should handle non-existent tag gracefully', () => {
      const updatedTag: Tag = {
        id: 'non-existent',
        name: 'New Tag',
        color: '#000000',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01')
      };

      ProjectTreeTraverser.updateTagInAllTasks(projects, updatedTag);

      const task1 = ProjectTreeTraverser.findTask(projects, 'task-1');
      expect(task1?.tags).toHaveLength(1); // 変更なし
      expect(task1?.tags[0].name).toBe('Important'); // 元のまま
    });
  });

  describe('getTaskCountByTag', () => {
    test('should count tasks with specific tag', () => {
      const count = ProjectTreeTraverser.getTaskCountByTag(projects, 'Important');
      expect(count).toBe(2); // task-1とtask-2
    });

    test('should return 0 for non-existent tag', () => {
      const count = ProjectTreeTraverser.getTaskCountByTag(projects, 'Non-existent');
      expect(count).toBe(0);
    });

    test('should be case-insensitive', () => {
      const count = ProjectTreeTraverser.getTaskCountByTag(projects, 'IMPORTANT');
      expect(count).toBe(2);
    });
  });

  describe('getAllTasks', () => {
    test('should get all tasks from all projects', () => {
      const allTasks = ProjectTreeTraverser.getAllTasks(projects);
      expect(allTasks).toHaveLength(2); // task-1とtask-2
    });

    test('should return empty array for empty projects', () => {
      const allTasks = ProjectTreeTraverser.getAllTasks([]);
      expect(allTasks).toHaveLength(0);
    });

    test('should include tasks from all lists', () => {
      // list-2にタスクを追加
      projects[0].taskLists[1].tasks.push({
        id: 'task-3',
        projectId: 'project-1',
        listId: 'list-2',
        title: 'Task 3',
        status: 'not_started',
        priority: 0,
        orderIndex: 0,
        isArchived: false,
        assignedUserIds: [],
        tagIds: [],
        createdAt: new Date('2024-01-03'),
        updatedAt: new Date('2024-01-03'),
        subTasks: [],
        tags: []
      });

      const allTasks = ProjectTreeTraverser.getAllTasks(projects);
      expect(allTasks).toHaveLength(3);
    });
  });

  describe('edge cases', () => {
    test('should handle empty projects array', () => {
      const task = ProjectTreeTraverser.findTask([], 'task-1');
      expect(task).toBeNull();
    });

    test('should handle projects with no task lists', () => {
      const task = ProjectTreeTraverser.findTask([projects[1]], 'task-1');
      expect(task).toBeNull();
    });

    test('should handle task lists with no tasks', () => {
      const emptyProjects: ProjectTree[] = [
        {
          id: 'empty-project',
          name: 'Empty',
          orderIndex: 0,
          isArchived: false,
          createdAt: new Date(),
          updatedAt: new Date(),
          taskLists: [
            {
              id: 'empty-list',
              projectId: 'empty-project',
              name: 'Empty List',
              orderIndex: 0,
              isArchived: false,
              createdAt: new Date(),
              updatedAt: new Date(),
              tasks: []
            }
          ]
        }
      ];

      const task = ProjectTreeTraverser.findTask(emptyProjects, 'task-1');
      expect(task).toBeNull();

      const allTasks = ProjectTreeTraverser.getAllTasks(emptyProjects);
      expect(allTasks).toHaveLength(0);
    });
  });
});
