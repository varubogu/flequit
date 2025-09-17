import type { ProjectTree } from '$lib/types/project';

export function generateSampleData(): ProjectTree[] {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  return [
    {
      id: 'project-1',
      name: 'Personal Tasks',
      description: 'Personal todo items and tasks',
      color: '#3b82f6',
      orderIndex: 0,
      isArchived: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      allTags: [
        {
          id: 'tag-1',
          name: 'urgent',
          color: '#ef4444',
          orderIndex: 0,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: 'tag-2',
          name: 'work',
          color: '#3b82f6',
          orderIndex: 1,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ],
      taskLists: [
        {
          id: 'list-1',
          projectId: 'project-1',
          name: 'Daily Tasks',
          description: 'Tasks for today',
          color: '#10b981',
          orderIndex: 0,
          isArchived: false,
          createdAt: new Date(),
          updatedAt: new Date(),
          tasks: [
            {
              id: 'task-1',
              projectId: 'project-1',
              listId: 'list-1',
              title: 'Review morning emails',
              description: 'Check and respond to important emails',
              status: 'not_started',
              priority: 1,
              planEndDate: today,
              assignedUserIds: [],
              tagIds: ['tag-1'],
              orderIndex: 0,
              isArchived: false,
              createdAt: new Date(),
              updatedAt: new Date(),
              subTasks: [
                {
                  id: 'subtask-1',
                  taskId: 'task-1',
                  title: 'Check work inbox',
                  description: 'Review all unread emails in work account',
                  status: 'not_started',
                  priority: 2,
                  planStartDate: new Date(today.getTime() + 60 * 60 * 1000), // 1 hour from now
                  planEndDate: new Date(today.getTime() + 3 * 60 * 60 * 1000), // 3 hours from now
                  // plan_end_date is already set above
                  recurrenceRule: {
                    unit: 'day',
                    interval: 1
                  },
                  orderIndex: 0,
                  completed: false,
                  assignedUserIds: [],
                  tagIds: [],
                  createdAt: new Date(),
                  updatedAt: new Date()
                },
                {
                  id: 'subtask-2',
                  taskId: 'task-1',
                  title: 'Reply to urgent messages',
                  status: 'not_started',
                  orderIndex: 1,
                  completed: false,
                  assignedUserIds: [],
                  tagIds: [],
                  createdAt: new Date(),
                  updatedAt: new Date()
                }
              ],
              tags: [
                {
                  id: 'tag-1',
                  name: 'work',
                  color: '#f59e0b',
                  createdAt: new Date(),
                  updatedAt: new Date()
                }
              ]
            },
            {
              id: 'task-2',
              projectId: 'project-1',
              listId: 'list-1',
              title: 'Buy groceries',
              description: 'Get ingredients for dinner tonight',
              status: 'not_started',
              priority: 2,
              planEndDate: today,
              assignedUserIds: [],
              tagIds: ['tag-2'],
              orderIndex: 1,
              isArchived: false,
              createdAt: new Date(),
              updatedAt: new Date(),
              subTasks: [],
              tags: [
                {
                  id: 'tag-2',
                  name: 'personal',
                  color: '#8b5cf6',
                  createdAt: new Date(),
                  updatedAt: new Date()
                }
              ]
            },
            {
              id: 'task-3',
              projectId: 'project-1',
              listId: 'list-1',
              title: 'Overdue task example',
              description: 'This task was due yesterday',
              status: 'not_started',
              priority: 3,
              planEndDate: yesterday,
              assignedUserIds: [],
              tagIds: [],
              orderIndex: 2,
              isArchived: false,
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
          name: 'This Week',
          description: 'Tasks for this week',
          orderIndex: 1,
          isArchived: false,
          createdAt: new Date(),
          updatedAt: new Date(),
          tasks: [
            {
              id: 'task-4',
              projectId: 'project-1',
              listId: 'list-2',
              title: 'Plan weekend trip',
              description: 'Research destinations and book accommodation',
              status: 'in_progress',
              priority: 1,
              planEndDate: new Date(today.getTime() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
              assignedUserIds: [],
              tagIds: [],
              orderIndex: 0,
              isArchived: false,
              createdAt: new Date(),
              updatedAt: new Date(),
              subTasks: [],
              tags: [
                {
                  id: 'tag-3',
                  name: 'travel',
                  color: '#06b6d4',
                  createdAt: new Date(),
                  updatedAt: new Date()
                }
              ]
            }
          ]
        }
      ]
    },
    {
      id: 'project-2',
      name: 'Work Project',
      description: 'Tasks related to work projects',
      color: '#ef4444',
      orderIndex: 1,
      isArchived: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      allTags: [
        {
          id: 'tag-3',
          name: 'development',
          color: '#10b981',
          orderIndex: 0,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: 'tag-4',
          name: 'high-priority',
          color: '#f59e0b',
          orderIndex: 1,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ],
      taskLists: [
        {
          id: 'list-3',
          projectId: 'project-2',
          name: 'Sprint Tasks',
          description: 'Current sprint backlog',
          orderIndex: 0,
          isArchived: false,
          createdAt: new Date(),
          updatedAt: new Date(),
          tasks: [
            {
              id: 'task-5',
              projectId: 'project-2',
              listId: 'list-3',
              title: 'Complete user authentication feature',
              description: 'Implement login, signup, and password reset functionality',
              status: 'in_progress',
              priority: 1,
              planEndDate: tomorrow,
              assignedUserIds: [],
              tagIds: [],
              orderIndex: 0,
              isArchived: false,
              createdAt: new Date(),
              updatedAt: new Date(),
              subTasks: [
                {
                  id: 'subtask-3',
                  taskId: 'task-5',
                  title: 'Design login UI',
                  description: 'Create wireframes and mockups for login interface',
                  status: 'completed',
                  priority: 2,
                  planEndDate: yesterday,
                  orderIndex: 0,
                  completed: false,
                  assignedUserIds: [],
                  tagIds: [],
                  createdAt: new Date(),
                  updatedAt: new Date()
                },
                {
                  id: 'subtask-4',
                  taskId: 'task-5',
                  title: 'Implement backend API',
                  description: 'Create REST endpoints for authentication',
                  status: 'in_progress',
                  priority: 1,
                  planEndDate: today,
                  orderIndex: 1,
                  completed: false,
                  assignedUserIds: [],
                  tagIds: [],
                  createdAt: new Date(),
                  updatedAt: new Date()
                },
                {
                  id: 'subtask-5',
                  taskId: 'task-5',
                  title: 'Write unit tests',
                  description: 'Create comprehensive test coverage for auth flow',
                  status: 'not_started',
                  priority: 2,
                  planEndDate: tomorrow,
                  orderIndex: 2,
                  completed: false,
                  assignedUserIds: [],
                  tagIds: [],
                  createdAt: new Date(),
                  updatedAt: new Date()
                }
              ],
              tags: [
                {
                  id: 'tag-4',
                  name: 'development',
                  color: '#10b981',
                  createdAt: new Date(),
                  updatedAt: new Date()
                },
                {
                  id: 'tag-5',
                  name: 'high-priority',
                  color: '#ef4444',
                  createdAt: new Date(),
                  updatedAt: new Date()
                }
              ]
            }
          ]
        }
      ]
    }
  ];
}
