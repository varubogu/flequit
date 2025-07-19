export interface Task {
  id: string;
  sub_task_id?: string;
  list_id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: number;
  start_date?: Date;
  end_date?: Date;
  due_date?: Date;
  recurrence_rule?: string;
  order_index: number;
  is_archived: boolean;
  created_at: Date;
  updated_at: Date;
}

export type TaskStatus = 'not_started' | 'in_progress' | 'waiting' | 'completed' | 'cancelled';

export interface TaskList {
  id: string;
  project_id: string;
  name: string;
  description?: string;
  color?: string;
  order_index: number;
  is_archived: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  color?: string;
  order_index: number;
  is_archived: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface SubTask {
  id: string;
  task_id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority?: number;
  start_date?: Date;
  end_date?: Date;
  due_date?: Date;
  recurrence_rule?: string;
  order_index: number;
  created_at: Date;
  updated_at: Date;
}

export interface Tag {
  id: string;
  name: string;
  color?: string;
  created_at: Date;
  updated_at: Date;
}

// View models for UI components
export interface TaskWithSubTasks extends Task {
  sub_tasks: SubTask[];
  tags: Tag[];
}

export interface ProjectWithLists extends Project {
  task_lists: TaskList[];
}

export interface TaskListWithTasks extends TaskList {
  tasks: TaskWithSubTasks[];
}

export interface ProjectTree extends Project {
  task_lists: TaskListWithTasks[];
}