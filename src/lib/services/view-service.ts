import { taskStore } from '$lib/stores/tasks.svelte';
import type { TaskWithSubTasks } from '$lib/types/task';
import { getTranslationService } from '$lib/stores/locale.svelte';

const translationService = getTranslationService();

export type ViewType =
  | 'all'
  | 'today'
  | 'overdue'
  | 'completed'
  | 'project'
  | 'tasklist'
  | 'tomorrow'
  | 'next3days'
  | 'nextweek'
  | 'thismonth'
  | 'search';

export class ViewService {
  static getTasksForView(view: ViewType, searchQuery: string = ''): TaskWithSubTasks[] {
    switch (view) {
      case 'today':
        return taskStore.todayTasks;
      case 'overdue':
        return taskStore.overdueTasks;
      case 'completed':
        return taskStore.allTasks.filter((task) => task.status === 'completed');
      case 'project':
        return this.getProjectTasks();
      case 'tasklist':
        return this.getProjectTasks();
      case 'tomorrow':
        return this.getTomorrowTasks();
      case 'next3days':
        return this.getNext3DaysTasks();
      case 'nextweek':
        return this.getNextWeekTasks();
      case 'thismonth':
        return this.getThisMonthTasks();
      case 'search':
        return this.getSearchResults(searchQuery);
      default:
        return taskStore.allTasks;
    }
  }

  static getViewTitle(view: ViewType, searchQuery: string = ''): string {
    // Reactive messages
    const allTasks = translationService.getMessage('all_tasks');
    const today = translationService.getMessage('today');
    const overdue = translationService.getMessage('overdue');
    const completed = translationService.getMessage('completed');
    const tomorrow = translationService.getMessage('tomorrow');
    const next3Days = translationService.getMessage('next_3_days');
    const nextWeek = translationService.getMessage('next_week');
    const thisMonth = translationService.getMessage('this_month');

    switch (view) {
      case 'today':
        return today();
      case 'overdue':
        return overdue();
      case 'completed':
        return completed();
      case 'project':
        return this.getProjectViewTitle();
      case 'tasklist':
        return this.getProjectViewTitle();
      case 'tomorrow':
        return tomorrow();
      case 'next3days':
        return next3Days();
      case 'nextweek':
        return nextWeek();
      case 'thismonth':
        return thisMonth();
      case 'search':
        return searchQuery ? `Search: "${searchQuery}"` : allTasks();
      default:
        return allTasks();
    }
  }

  static shouldShowAddButton(view: ViewType): boolean {
    return (
      view === 'all' ||
      view === 'project' ||
      view === 'tasklist' ||
      view === 'tomorrow' ||
      view === 'next3days' ||
      view === 'nextweek' ||
      view === 'thismonth'
    );
  }

  static handleViewChange(view: ViewType): boolean {
    // Check if we need confirmation for new task mode
    if (taskStore.isNewTaskMode) {
      return false; // Indicate that view change needs confirmation
    }

    // Clear task selection when changing views
    taskStore.selectTask(null);

    // Clear project/list selection for non-project views
    if (view !== 'project' && view !== 'tasklist') {
      taskStore.selectProject(null);
      taskStore.selectList(null);
    }

    return true; // View change completed
  }

  static forceViewChange(view: ViewType): void {
    // Cancel new task mode and force view change
    if (taskStore.isNewTaskMode) {
      taskStore.cancelNewTaskMode();
    }

    // Clear task selection when changing views
    taskStore.selectTask(null);

    // Clear project/list selection for non-project views
    if (view !== 'project' && view !== 'tasklist') {
      taskStore.selectProject(null);
      taskStore.selectList(null);
    }
  }

  private static getProjectTasks(): TaskWithSubTasks[] {
    // If a specific list is selected, show only tasks from that list
    if (taskStore.selectedListId) {
      for (const project of taskStore.projects) {
        const list = project.task_lists.find((l) => l.id === taskStore.selectedListId);
        if (list) {
          return list.tasks;
        }
      }
      return [];
    }

    // If a project is selected, show all tasks from that project
    if (taskStore.selectedProjectId) {
      const project = taskStore.projects.find((p) => p.id === taskStore.selectedProjectId);
      if (!project) {
        return [];
      }
      return project.task_lists.flatMap((l) => l.tasks);
    }

    return [];
  }

  private static getProjectViewTitle(): string {
    // If a specific list is selected, show "プロジェクト名 > タスクリスト名"
    if (taskStore.selectedListId) {
      for (const project of taskStore.projects) {
        const list = project.task_lists.find((l) => l.id === taskStore.selectedListId);
        if (list) {
          return `${project.name} > ${list.name}`;
        }
      }
      return 'Task List';
    }

    // If a project is selected, show the project name
    if (taskStore.selectedProjectId) {
      const project = taskStore.projects.find((p) => p.id === taskStore.selectedProjectId);
      if (!project) {
        return 'Project';
      }
      return project.name;
    }

    return 'Project';
  }

  private static getTomorrowTasks(): TaskWithSubTasks[] {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStart = new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate());
    const tomorrowEnd = new Date(
      tomorrow.getFullYear(),
      tomorrow.getMonth(),
      tomorrow.getDate() + 1
    );

    return taskStore.allTasks.filter((task) => {
      if (task.status === 'completed' || !task.end_date) return false;

      const dueDate = new Date(task.end_date);
      return dueDate >= tomorrowStart && dueDate < tomorrowEnd;
    });
  }

  private static getNext3DaysTasks(): TaskWithSubTasks[] {
    const today = new Date();
    const threeDaysLater = new Date();
    threeDaysLater.setDate(today.getDate() + 3);

    return taskStore.allTasks.filter((task) => {
      if (task.status === 'completed' || !task.end_date) return false;

      const dueDate = new Date(task.end_date);
      return dueDate > today && dueDate <= threeDaysLater;
    });
  }

  private static getNextWeekTasks(): TaskWithSubTasks[] {
    const today = new Date();
    const oneWeekLater = new Date();
    oneWeekLater.setDate(today.getDate() + 7);

    return taskStore.allTasks.filter((task) => {
      if (task.status === 'completed' || !task.end_date) return false;

      const dueDate = new Date(task.end_date);
      return dueDate > today && dueDate <= oneWeekLater;
    });
  }

  private static getThisMonthTasks(): TaskWithSubTasks[] {
    const today = new Date();
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    return taskStore.allTasks.filter((task) => {
      if (task.status === 'completed' || !task.end_date) return false;

      const dueDate = new Date(task.end_date);
      return dueDate >= today && dueDate <= endOfMonth;
    });
  }

  private static getSearchResults(searchQuery: string): TaskWithSubTasks[] {
    if (!searchQuery.trim()) {
      // 空の検索クエリの場合は全タスクを返す
      return taskStore.allTasks;
    }

    const trimmedQuery = searchQuery.trim();

    // Tag search with # prefix
    if (trimmedQuery.startsWith('#')) {
      const tagQuery = trimmedQuery.slice(1).toLowerCase();
      if (!tagQuery) {
        // Show all tasks with any tags if just "#" is entered
        return taskStore.allTasks.filter((task) => task.tags.length > 0);
      }

      return taskStore.allTasks.filter((task) =>
        task.tags.some((tag) => tag.name.toLowerCase().includes(tagQuery))
      );
    }

    // Regular search (all content including tags)
    const query = trimmedQuery.toLowerCase();
    return taskStore.allTasks.filter(
      (task) =>
        task.title.toLowerCase().includes(query) ||
        task.description?.toLowerCase().includes(query) ||
        task.sub_tasks.some(
          (subTask) =>
            subTask.title.toLowerCase().includes(query) ||
            subTask.description?.toLowerCase().includes(query)
        ) ||
        task.tags.some((tag) => tag.name.toLowerCase().includes(query))
    );
  }
}
