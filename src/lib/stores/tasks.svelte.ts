import type { Task, ProjectTree, TaskWithSubTasks, SubTask, Tag, TaskList, TaskListWithTasks, Project } from '$lib/types/task';
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
  
  getTaskById(taskId: string): TaskWithSubTasks | null {
    for (const project of this.projects) {
      for (const list of project.task_lists) {
        const task = list.tasks.find(t => t.id === taskId);
        if (task) return task;
      }
    }
    return null;
  }
  
  getTaskProjectAndList(taskId: string): { project: Project; taskList: TaskList } | null {
    for (const project of this.projects) {
      for (const list of project.task_lists) {
        const task = list.tasks.find(t => t.id === taskId);
        if (task) {
          return { project, taskList: list };
        }
      }
    }
    return null;
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
    
    // Extract and register all tags from sample data to tag store
    const allTags = new Map<string, Tag>();
    
    projects.forEach(project => {
      project.task_lists.forEach(list => {
        list.tasks.forEach(task => {
          task.tags.forEach(tag => {
            allTags.set(tag.id, tag);
          });
        });
      });
    });
    
    // Register tags in tag store with their original IDs
    allTags.forEach(tag => {
      tagStore.addTagWithId(tag);
    });
    
    // Add initial bookmarks for common tags
    const workTag = tagStore.tags.find(tag => tag.name === 'work');
    const personalTag = tagStore.tags.find(tag => tag.name === 'personal');
    
    if (workTag && !tagStore.isBookmarked(workTag.id)) {
      tagStore.addBookmark(workTag.id);
    }
    if (personalTag && !tagStore.isBookmarked(personalTag.id)) {
      tagStore.addBookmark(personalTag.id);
    }
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
  
  createRecurringTask(taskData: Partial<Task>): TaskWithSubTasks | null {
    if (!taskData.list_id) return null;
    
    const newTask: TaskWithSubTasks = {
      id: crypto.randomUUID(),
      sub_task_id: taskData.sub_task_id,
      list_id: taskData.list_id,
      title: taskData.title || '',
      description: taskData.description,
      status: taskData.status || 'not_started',
      priority: taskData.priority || 0,
      start_date: taskData.start_date,
      end_date: taskData.end_date,
      is_range_date: taskData.is_range_date || false,
      recurrence_rule: taskData.recurrence_rule,
      order_index: taskData.order_index || 0,
      is_archived: taskData.is_archived || false,
      created_at: new Date(),
      updated_at: new Date(),
      sub_tasks: [],
      tags: []
    };
    
    for (const project of this.projects) {
      const list = project.task_lists.find(l => l.id === taskData.list_id);
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
          // Check if tag already exists on this task (by name, not ID)
          if (!task.tags.some(t => t.name.toLowerCase() === tag.name.toLowerCase())) {
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
      
      // Check if tag already exists on this task (by name, not ID)
      if (!this.newTaskData.tags.some(t => t.name.toLowerCase() === tag.name.toLowerCase())) {
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
            // Check if tag already exists on this subtask (by name, not ID)
            if (!subTask.tags.some(t => t.name.toLowerCase() === tag.name.toLowerCase())) {
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
  
  // Get task count for a specific tag
  getTaskCountByTag(tagName: string): number {
    let count = 0;
    
    for (const project of this.projects) {
      for (const list of project.task_lists) {
        for (const task of list.tasks) {
          if (task.tags.some(tag => tag.name.toLowerCase() === tagName.toLowerCase())) {
            count++;
          }
        }
      }
    }
    
    return count;
  }

  // Remove tag from all tasks and subtasks by tag ID
  removeTagFromAllTasks(tagId: string) {
    for (const project of this.projects) {
      for (const list of project.task_lists) {
        for (const task of list.tasks) {
          // Remove from main task
          const taskTagIndex = task.tags.findIndex(t => t.id === tagId);
          if (taskTagIndex !== -1) {
            task.tags.splice(taskTagIndex, 1);
            task.updated_at = new Date();
          }

          // Remove from all subtasks
          for (const subTask of task.sub_tasks) {
            const subTaskTagIndex = subTask.tags.findIndex(t => t.id === tagId);
            if (subTaskTagIndex !== -1) {
              subTask.tags.splice(subTaskTagIndex, 1);
              subTask.updated_at = new Date();
            }
          }
        }
      }
    }
  }

  // Update tag in all tasks and subtasks when tag is modified
  updateTagInAllTasks(updatedTag: Tag) {
    for (const project of this.projects) {
      for (const list of project.task_lists) {
        for (const task of list.tasks) {
          // Update in main task
          const taskTagIndex = task.tags.findIndex(t => t.id === updatedTag.id);
          if (taskTagIndex !== -1) {
            task.tags[taskTagIndex] = { ...updatedTag };
            task.updated_at = new Date();
          }
          
          // Update in subtasks
          for (const subTask of task.sub_tasks) {
            const subTaskTagIndex = subTask.tags.findIndex(t => t.id === updatedTag.id);
            if (subTaskTagIndex !== -1) {
              subTask.tags[subTaskTagIndex] = { ...updatedTag };
              subTask.updated_at = new Date();
            }
          }
        }
      }
    }
    
    // Update in new task data if present
    if (this.newTaskData) {
      const newTaskTagIndex = this.newTaskData.tags.findIndex(t => t.id === updatedTag.id);
      if (newTaskTagIndex !== -1) {
        this.newTaskData.tags[newTaskTagIndex] = { ...updatedTag };
      }
    }
  }

  // Project management methods
  addProject(projectData: { name: string; description?: string; color?: string }): ProjectTree | null {
    const newProject: ProjectTree = {
      id: crypto.randomUUID(),
      name: projectData.name.trim(),
      description: projectData.description || '',
      color: projectData.color || '#3b82f6',
      order_index: this.projects.length,
      is_archived: false,
      created_at: new Date(),
      updated_at: new Date(),
      task_lists: []
    };

    this.projects.push(newProject);
    return newProject;
  }

  updateProject(projectId: string, updates: Partial<Project>) {
    const projectIndex = this.projects.findIndex(p => p.id === projectId);
    if (projectIndex !== -1) {
      this.projects[projectIndex] = {
        ...this.projects[projectIndex],
        ...updates,
        updated_at: new Date()
      };
    }
  }

  deleteProject(projectId: string) {
    const projectIndex = this.projects.findIndex(p => p.id === projectId);
    if (projectIndex !== -1) {
      this.projects.splice(projectIndex, 1);
      
      // Clear selections if deleted project was selected
      if (this.selectedProjectId === projectId) {
        this.selectedProjectId = null;
      }
    }
  }

  // Task list management methods
  addTaskList(projectId: string, taskListData: { name: string; description?: string; color?: string }): TaskListWithTasks | null {
    const project = this.projects.find(p => p.id === projectId);
    if (!project) return null;

    const newTaskList: TaskListWithTasks = {
      id: crypto.randomUUID(),
      project_id: projectId,
      name: taskListData.name.trim(),
      description: taskListData.description || '',
      color: taskListData.color,
      order_index: project.task_lists.length,
      is_archived: false,
      created_at: new Date(),
      updated_at: new Date(),
      tasks: []
    };

    project.task_lists.push(newTaskList);
    project.updated_at = new Date();
    return newTaskList;
  }

  updateTaskList(taskListId: string, updates: Partial<TaskList>) {
    for (const project of this.projects) {
      const taskListIndex = project.task_lists.findIndex(tl => tl.id === taskListId);
      if (taskListIndex !== -1) {
        project.task_lists[taskListIndex] = {
          ...project.task_lists[taskListIndex],
          ...updates,
          updated_at: new Date()
        };
        project.updated_at = new Date();
        return;
      }
    }
  }

  deleteTaskList(taskListId: string) {
    for (const project of this.projects) {
      const taskListIndex = project.task_lists.findIndex(tl => tl.id === taskListId);
      if (taskListIndex !== -1) {
        project.task_lists.splice(taskListIndex, 1);
        project.updated_at = new Date();
        
        // Clear selections if deleted task list was selected
        if (this.selectedListId === taskListId) {
          this.selectedListId = null;
        }
        return;
      }
    }
  }

  moveTaskToList(taskId: string, newTaskListId: string) {
    // タスクを現在の位置から探して削除
    let taskToMove: TaskWithSubTasks | null = null;
    
    for (const project of this.projects) {
      for (const taskList of project.task_lists) {
        const taskIndex = taskList.tasks.findIndex(t => t.id === taskId);
        if (taskIndex !== -1) {
          taskToMove = taskList.tasks[taskIndex];
          taskList.tasks.splice(taskIndex, 1);
          taskList.updated_at = new Date();
          break;
        }
      }
      if (taskToMove) break;
    }

    if (!taskToMove) return;

    // 新しいタスクリストに追加
    for (const project of this.projects) {
      const targetTaskList = project.task_lists.find(tl => tl.id === newTaskListId);
      if (targetTaskList) {
        targetTaskList.tasks.push(taskToMove);
        targetTaskList.updated_at = new Date();
        project.updated_at = new Date();
        return;
      }
    }
  }
}

// Create global store instance
export const taskStore = new TaskStore();