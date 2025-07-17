import { taskStore } from '$lib/stores/tasks.svelte';
import type { TaskWithSubTasks } from '$lib/types/task';

export type ViewType = 'all' | 'today' | 'overdue' | 'completed' | 'project';

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
      default:
        return 'All Tasks';
    }
  }
  
  static shouldShowAddButton(view: ViewType): boolean {
    return view === 'all' || view === 'project';
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
}