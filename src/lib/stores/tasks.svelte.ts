import type { Task, TaskList, Project, ProjectTree, TaskWithSubTasks } from '$lib/types/task';

// Global state using Svelte 5 runes
export class TaskStore {
  projects = $state<ProjectTree[]>([]);
  selectedTaskId = $state<string | null>(null);
  selectedProjectId = $state<string | null>(null);
  selectedListId = $state<string | null>(null);
  
  // Computed values
  get selectedTask(): TaskWithSubTasks | null {
    if (!this.selectedTaskId) return null;
    
    for (const project of this.projects) {
      for (const list of project.task_lists) {
        const task = list.tasks.find(t => t.id === this.selectedTaskId);
        if (task) return task;
      }
    }
    return null;
  }
  
  get allTasks(): TaskWithSubTasks[] {
    return this.projects.flatMap(project => 
      project.task_lists.flatMap(list => list.tasks)
    );
  }
  
  get todayTasks(): TaskWithSubTasks[] {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    return this.allTasks.filter(task => {
      if (!task.due_date) return false;
      const dueDate = new Date(task.due_date);
      return dueDate >= today && dueDate < tomorrow;
    });
  }
  
  get overdueTasks(): TaskWithSubTasks[] {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return this.allTasks.filter(task => {
      if (!task.due_date || task.status === 'completed') return false;
      const dueDate = new Date(task.due_date);
      return dueDate < today;
    });
  }
  
  // Actions
  setProjects(projects: ProjectTree[]) {
    this.projects = projects;
  }
  
  selectTask(taskId: string | null) {
    this.selectedTaskId = taskId;
  }
  
  selectProject(projectId: string | null) {
    this.selectedProjectId = projectId;
  }
  
  selectList(listId: string | null) {
    this.selectedListId = listId;
  }
  
  updateTask(taskId: string, updates: Partial<Task>) {
    for (const project of this.projects) {
      for (const list of project.task_lists) {
        const taskIndex = list.tasks.findIndex(t => t.id === taskId);
        if (taskIndex !== -1) {
          list.tasks[taskIndex] = { 
            ...list.tasks[taskIndex], 
            ...updates,
            updated_at: new Date()
          };
          return;
        }
      }
    }
  }
  
  toggleTaskStatus(taskId: string) {
    const task = this.allTasks.find(t => t.id === taskId);
    if (!task) return;
    
    const newStatus = task.status === 'completed' ? 'not_started' : 'completed';
    this.updateTask(taskId, { status: newStatus });
  }
  
  addTask(listId: string, task: Omit<Task, 'id' | 'created_at' | 'updated_at'>) {
    const newTask: TaskWithSubTasks = {
      ...task,
      id: crypto.randomUUID(),
      created_at: new Date(),
      updated_at: new Date(),
      sub_tasks: [],
      tags: []
    };
    
    for (const project of this.projects) {
      const list = project.task_lists.find(l => l.id === listId);
      if (list) {
        list.tasks.push(newTask);
        return newTask;
      }
    }
    return null;
  }
  
  deleteTask(taskId: string) {
    for (const project of this.projects) {
      for (const list of project.task_lists) {
        const taskIndex = list.tasks.findIndex(t => t.id === taskId);
        if (taskIndex !== -1) {
          list.tasks.splice(taskIndex, 1);
          if (this.selectedTaskId === taskId) {
            this.selectedTaskId = null;
          }
          return;
        }
      }
    }
  }
}

// Create global store instance
export const taskStore = new TaskStore();