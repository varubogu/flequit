import type { ProjectTree } from '$lib/types/task';

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
      order_index: 0,
      is_archived: false,
      created_at: new Date(),
      updated_at: new Date(),
      task_lists: [
        {
          id: 'list-1',
          project_id: 'project-1',
          name: 'Daily Tasks',
          description: 'Tasks for today',
          color: '#10b981',
          order_index: 0,
          is_archived: false,
          created_at: new Date(),
          updated_at: new Date(),
          tasks: [
            {
              id: 'task-1',
              list_id: 'list-1',
              title: 'Review morning emails',
              description: 'Check and respond to important emails',
              status: 'not_started',
              priority: 1,
              end_date: today,
              order_index: 0,
              is_archived: false,
              created_at: new Date(),
              updated_at: new Date(),
              sub_tasks: [
                {
                  id: 'subtask-1',
                  task_id: 'task-1',
                  title: 'Check work inbox',
                  description: 'Review all unread emails in work account',
                  status: 'not_started',
                  priority: 2,
                  start_date: new Date(today.getTime() + 60 * 60 * 1000), // 1 hour from now
                  end_date: new Date(today.getTime() + 3 * 60 * 60 * 1000), // 3 hours from now
                  // end_date is already set above
                  recurrence_rule: 'FREQ=DAILY',
                  order_index: 0,
                  tags: [],
                  created_at: new Date(),
                  updated_at: new Date()
                },
                {
                  id: 'subtask-2', 
                  task_id: 'task-1',
                  title: 'Reply to urgent messages',
                  status: 'not_started',
                  order_index: 1,
                  tags: [],
                  created_at: new Date(),
                  updated_at: new Date()
                }
              ],
              tags: [
                {
                  id: 'tag-1',
                  name: 'work',
                  color: '#f59e0b',
                  created_at: new Date(),
                  updated_at: new Date()
                }
              ]
            },
            {
              id: 'task-2',
              list_id: 'list-1', 
              title: 'Buy groceries',
              description: 'Get ingredients for dinner tonight',
              status: 'not_started',
              priority: 2,
              end_date: today,
              order_index: 1,
              is_archived: false,
              created_at: new Date(),
              updated_at: new Date(),
              sub_tasks: [],
              tags: [
                {
                  id: 'tag-2',
                  name: 'personal',
                  color: '#8b5cf6',
                  created_at: new Date(),
                  updated_at: new Date()
                }
              ]
            },
            {
              id: 'task-3',
              list_id: 'list-1',
              title: 'Overdue task example',
              description: 'This task was due yesterday',
              status: 'not_started',
              priority: 3,
              end_date: yesterday,
              order_index: 2,
              is_archived: false,
              created_at: new Date(),
              updated_at: new Date(),
              sub_tasks: [],
              tags: []
            }
          ]
        },
        {
          id: 'list-2',
          project_id: 'project-1',
          name: 'This Week',
          description: 'Tasks for this week',
          order_index: 1,
          is_archived: false,
          created_at: new Date(),
          updated_at: new Date(),
          tasks: [
            {
              id: 'task-4',
              list_id: 'list-2',
              title: 'Plan weekend trip',
              description: 'Research destinations and book accommodation',
              status: 'in_progress',
              priority: 1,
              end_date: new Date(today.getTime() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
              order_index: 0,
              is_archived: false,
              created_at: new Date(),
              updated_at: new Date(),
              sub_tasks: [],
              tags: [
                {
                  id: 'tag-3',
                  name: 'travel',
                  color: '#06b6d4',
                  created_at: new Date(),
                  updated_at: new Date()
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
      order_index: 1,
      is_archived: false,
      created_at: new Date(),
      updated_at: new Date(),
      task_lists: [
        {
          id: 'list-3',
          project_id: 'project-2',
          name: 'Sprint Tasks',
          description: 'Current sprint backlog',
          order_index: 0,
          is_archived: false,
          created_at: new Date(),
          updated_at: new Date(),
          tasks: [
            {
              id: 'task-5',
              list_id: 'list-3',
              title: 'Complete user authentication feature',
              description: 'Implement login, signup, and password reset functionality',
              status: 'in_progress',
              priority: 1,
              end_date: tomorrow,
              order_index: 0,
              is_archived: false,
              created_at: new Date(),
              updated_at: new Date(),
              sub_tasks: [
                {
                  id: 'subtask-3',
                  task_id: 'task-5',
                  title: 'Design login UI',
                  description: 'Create wireframes and mockups for login interface',
                  status: 'completed',
                  priority: 2,
                  end_date: yesterday,
                  order_index: 0,
                  tags: [],
                  created_at: new Date(),
                  updated_at: new Date()
                },
                {
                  id: 'subtask-4',
                  task_id: 'task-5', 
                  title: 'Implement backend API',
                  description: 'Create REST endpoints for authentication',
                  status: 'in_progress',
                  priority: 1,
                  end_date: today,
                  order_index: 1,
                  tags: [],
                  created_at: new Date(),
                  updated_at: new Date()
                },
                {
                  id: 'subtask-5',
                  task_id: 'task-5',
                  title: 'Write unit tests',
                  description: 'Create comprehensive test coverage for auth flow',
                  status: 'not_started',
                  priority: 2,
                  end_date: tomorrow,
                  order_index: 2,
                  tags: [],
                  created_at: new Date(),
                  updated_at: new Date()
                }
              ],
              tags: [
                {
                  id: 'tag-4',
                  name: 'development',
                  color: '#10b981',
                  created_at: new Date(),
                  updated_at: new Date()
                },
                {
                  id: 'tag-5',
                  name: 'high-priority',
                  color: '#ef4444',
                  created_at: new Date(),
                  updated_at: new Date()
                }
              ]
            }
          ]
        }
      ]
    }
  ];
}