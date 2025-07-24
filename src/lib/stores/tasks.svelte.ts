import type { Task, TaskList, Project, ProjectTree, TaskWithSubTasks, SubTask, Tag } from '$lib/types/task';
import { tagStore } from './tags.svelte';

// Global state using Svelte 5 runes
export class TaskStore {
  projects = $state<ProjectTree[]>([]);
  selectedTaskId = $state<string | null>(null);
  selectedSubTaskId = $state<string | null>(null);
  selectedProjectId = $state<string | null>(null);
  selectedListId = $state<string | null>(null);
  isNewTaskMode = $state<boolean>(false);
  newTaskData = $state<TaskWithSubTasks | null>(null);
  pendingTaskSelection = $state<string | null>(null);
  pendingSubTaskSelection = $state<string | null>(null);
  
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
  
  get selectedSubTask(): SubTask | null {
    if (!this.selectedSubTaskId) return null;
    
    for (const project of this.projects) {
      for (const list of project.task_lists) {
        for (const task of list.tasks) {
          const subTask = task.sub_tasks.find(st => st.id === this.selectedSubTaskId);
          if (subTask) return subTask;
        }
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
      if (!task.end_date) return false;
      const dueDate = new Date(task.end_date);
      return dueDate >= today && dueDate < tomorrow;
    });
  }
  
  get overdueTasks(): TaskWithSubTasks[] {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return this.allTasks.filter(task => {
      if (!task.end_date || task.status === 'completed') return false;
      const dueDate = new Date(task.end_date);
      return dueDate < today;
    });
  }
  
  // Actions
  setProjects(projects: ProjectTree[]) {
    this.projects = projects;
  }
  
  selectTask(taskId: string | null) {
    this.selectedTaskId = taskId;
    this.selectedSubTaskId = null; // Clear subtask selection when selecting a task
  }
  
  selectSubTask(subTaskId: string | null) {
    this.selectedSubTaskId = subTaskId;
    this.selectedTaskId = null; // Clear task selection when selecting a subtask
  }
  
  selectProject(projectId: string | null) {
    this.selectedProjectId = projectId;
    this.selectedListId = null; // Clear list selection when selecting a project
  }
  
  selectList(listId: string | null) {
    this.selectedListId = listId;
    this.selectedProjectId = null; // Clear project selection when selecting a list
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
  
  updateSubTask(subTaskId: string, updates: Partial<SubTask>) {
    for (const project of this.projects) {
      for (const list of project.task_lists) {
        for (const task of list.tasks) {
          const subTaskIndex = task.sub_tasks.findIndex(st => st.id === subTaskId);
          if (subTaskIndex !== -1) {
            task.sub_tasks[subTaskIndex] = {
              ...task.sub_tasks[subTaskIndex],
              ...updates,
              updated_at: new Date()
            };
            return;
          }
        }
      }
    }
  }
  
  deleteSubTask(subTaskId: string) {
    for (const project of this.projects) {
      for (const list of project.task_lists) {
        for (const task of list.tasks) {
          const subTaskIndex = task.sub_tasks.findIndex(st => st.id === subTaskId);
          if (subTaskIndex !== -1) {
            task.sub_tasks.splice(subTaskIndex, 1);
            if (this.selectedSubTaskId === subTaskId) {
              this.selectedSubTaskId = null;
            }
            return;
          }
        }
      }
    }
  }
  
  // New task mode methods
  startNewTaskMode(listId: string) {
    this.isNewTaskMode = true;
    this.selectedTaskId = null;
    this.selectedSubTaskId = null;
    this.newTaskData = {
      id: 'new-task',
      title: '',
      description: '',
      status: 'not_started',
      priority: 0,
      list_id: listId,
      order_index: 0,
      is_archived: false,
      created_at: new Date(),
      updated_at: new Date(),
      sub_tasks: [],
      tags: []
    };
  }
  
  cancelNewTaskMode() {
    this.isNewTaskMode = false;
    this.newTaskData = null;
    this.pendingTaskSelection = null;
    this.pendingSubTaskSelection = null;
  }
  
  saveNewTask(): string | null {
    if (!this.newTaskData || !this.newTaskData.list_id || !this.newTaskData.title?.trim()) {
      return null;
    }
    
    const taskData = this.newTaskData as Task;
    const newTask = this.addTask(taskData.list_id, taskData);
    
    if (newTask) {
      this.isNewTaskMode = false;
      this.newTaskData = null;
      this.pendingTaskSelection = null;
      this.pendingSubTaskSelection = null;
      this.selectedTaskId = newTask.id;
      return newTask.id;
    }
    
    return null;
  }
  
  clearPendingSelections() {
    this.pendingTaskSelection = null;
    this.pendingSubTaskSelection = null;
  }
  
  updateNewTaskData(updates: Partial<TaskWithSubTasks>) {
    if (this.newTaskData) {
      this.newTaskData = { ...this.newTaskData, ...updates };
    }
  }
  
  // Tag management methods
  addTagToTask(taskId: string, tagName: string) {
    const tag = tagStore.getOrCreateTag(tagName);
    if (!tag) return;
    
    for (const project of this.projects) {
      for (const list of project.task_lists) {
        const task = list.tasks.find(t => t.id === taskId);
        if (task) {
          // Check if tag already exists on this task
          if (!task.tags.some(t => t.id === tag.id)) {
            task.tags.push(tag);
            task.updated_at = new Date();
          }
          return;
        }
      }
    }
  }
  
  removeTagFromTask(taskId: string, tagId: string) {
    for (const project of this.projects) {
      for (const list of project.task_lists) {
        const task = list.tasks.find(t => t.id === taskId);
        if (task) {
          const tagIndex = task.tags.findIndex(t => t.id === tagId);
          if (tagIndex !== -1) {
            task.tags.splice(tagIndex, 1);
            task.updated_at = new Date();
          }
          return;
        }
      }
    }
  }
  
  addTagToNewTask(tagName: string) {
    if (this.newTaskData) {
      const tag = tagStore.getOrCreateTag(tagName);
      if (!tag) return;
      
      // Check if tag already exists on this task
      if (!this.newTaskData.tags.some(t => t.id === tag.id)) {
        this.newTaskData.tags.push(tag);
      }
    }
  }
  
  removeTagFromNewTask(tagId: string) {
    if (this.newTaskData) {
      const tagIndex = this.newTaskData.tags.findIndex(t => t.id === tagId);
      if (tagIndex !== -1) {
        this.newTaskData.tags.splice(tagIndex, 1);
      }
    }
  }

  addTagToSubTask(subTaskId: string, tagName: string) {
    const tag = tagStore.getOrCreateTag(tagName);
    if (!tag) return;
    
    for (const project of this.projects) {
      for (const list of project.task_lists) {
        for (const task of list.tasks) {
          const subTask = task.sub_tasks.find(st => st.id === subTaskId);
          if (subTask) {
            // Check if tag already exists on this subtask
            if (!subTask.tags.some(t => t.id === tag.id)) {
              subTask.tags.push(tag);
              subTask.updated_at = new Date();
            }
            return;
          }
        }
      }
    }
  }
  
  removeTagFromSubTask(subTaskId: string, tagId: string) {
    for (const project of this.projects) {
      for (const list of project.task_lists) {
        for (const task of list.tasks) {
          const subTask = task.sub_tasks.find(st => st.id === subTaskId);
          if (subTask) {
            const tagIndex = subTask.tags.findIndex(t => t.id === tagId);
            if (tagIndex !== -1) {
              subTask.tags.splice(tagIndex, 1);
              subTask.updated_at = new Date();
            }
            return;
          }
        }
      }
    }
  }
}

// Create global store instance
export const taskStore = new TaskStore();