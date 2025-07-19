import { taskStore } from '$lib/stores/tasks.svelte';
import type { TaskWithSubTasks } from '$lib/types/task';

export type ViewType = 'all' | 'today' | 'overdue' | 'completed' | 'project' | 'tomorrow' | 'next3days' | 'nextweek' | 'thismonth';

export class ViewService {
  static getTasksForView(view: ViewType): TaskWithSubTasks[] {
    switch (view) {
      case 'today':
        return taskStore.todayTasks;
      case 'overdue':
        return taskStore.overdueTasks;
      case 'completed':
        return taskStore.allTasks.filter(task => task.status === 'completed');
      case 'project':
        return this.getProjectTasks();
      case 'tomorrow':
        return this.getTomorrowTasks();
      case 'next3days':
        return this.getNext3DaysTasks();
      case 'nextweek':
        return this.getNextWeekTasks();
      case 'thismonth':
        return this.getThisMonthTasks();
      default:
        return taskStore.allTasks;
    }
  }
  
  static getViewTitle(view: ViewType): string {
    switch (view) {
      case 'today':
        return 'Today';
      case 'overdue':
        return 'Overdue';
      case 'completed':
        return 'Completed';
      case 'project':
        return this.getProjectViewTitle();
      case 'tomorrow':
        return 'Tomorrow';
      case 'next3days':
        return 'Next 3 Days';
      case 'nextweek':
        return 'Next Week';
      case 'thismonth':
        return 'This Month';
      default:
        return 'All Tasks';
    }
  }
  
  static shouldShowAddButton(view: ViewType): boolean {
    return view === 'all' || view === 'project' || view === 'tomorrow' || view === 'next3days' || view === 'nextweek' || view === 'thismonth';
  }
  
  static handleViewChange(view: ViewType): void {
    // Clear task selection when changing views
    taskStore.selectTask(null);
    
    // Clear project/list selection for non-project views
    if (view !== 'project') {
      taskStore.selectProject(null);
      taskStore.selectList(null);
    }
  }
  
  private static getProjectTasks(): TaskWithSubTasks[] {
    if (!taskStore.selectedProjectId) {
      return [];
    }
    
    const project = taskStore.projects.find(p => p.id === taskStore.selectedProjectId);
    if (!project) {
      return [];
    }
    
    if (taskStore.selectedListId) {
      const list = project.task_lists.find(l => l.id === taskStore.selectedListId);
      return list ? list.tasks : [];
    }
    
    return project.task_lists.flatMap(l => l.tasks);
  }
  
  private static getProjectViewTitle(): string {
    if (!taskStore.selectedProjectId) {
      return 'Project';
    }
    
    const project = taskStore.projects.find(p => p.id === taskStore.selectedProjectId);
    if (!project) {
      return 'Project';
    }
    
    if (taskStore.selectedListId) {
      const list = project.task_lists.find(l => l.id === taskStore.selectedListId);
      return list ? list.name : project.name;
    }
    
    return project.name;
  }

  private static getTomorrowTasks(): TaskWithSubTasks[] {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStart = new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate());
    const tomorrowEnd = new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate() + 1);
    
    return taskStore.allTasks.filter(task => {
      if (task.status === 'completed' || !task.due_date) return false;
      
      const dueDate = new Date(task.due_date);
      return dueDate >= tomorrowStart && dueDate < tomorrowEnd;
    });
  }

  private static getNext3DaysTasks(): TaskWithSubTasks[] {
    const today = new Date();
    const threeDaysLater = new Date();
    threeDaysLater.setDate(today.getDate() + 3);
    
    return taskStore.allTasks.filter(task => {
      if (task.status === 'completed' || !task.due_date) return false;
      
      const dueDate = new Date(task.due_date);
      return dueDate > today && dueDate <= threeDaysLater;
    });
  }

  private static getNextWeekTasks(): TaskWithSubTasks[] {
    const today = new Date();
    const oneWeekLater = new Date();
    oneWeekLater.setDate(today.getDate() + 7);
    
    return taskStore.allTasks.filter(task => {
      if (task.status === 'completed' || !task.due_date) return false;
      
      const dueDate = new Date(task.due_date);
      return dueDate > today && dueDate <= oneWeekLater;
    });
  }

  private static getThisMonthTasks(): TaskWithSubTasks[] {
    const today = new Date();
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    
    return taskStore.allTasks.filter(task => {
      if (task.status === 'completed' || !task.due_date) return false;
      
      const dueDate = new Date(task.due_date);
      return dueDate >= today && dueDate <= endOfMonth;
    });
  }
}