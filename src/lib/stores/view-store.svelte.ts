import { getTranslationService } from '$lib/stores/locale.svelte';
import { selectionStore } from '$lib/stores/selection-store.svelte';
import { taskStore } from '$lib/stores/tasks.svelte';
import type { TaskWithSubTasks } from '$lib/types/task';

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

export type ViewStoreDependencies = {
  taskStore: Pick<
    typeof taskStore,
    | 'todayTasks'
    | 'overdueTasks'
    | 'allTasks'
    | 'projects'
    | 'selectedProjectId'
    | 'selectedListId'
    | 'isNewTaskMode'
    | 'cancelNewTaskMode'
  >;
  selectionStore: Pick<typeof selectionStore, 'selectTask' | 'selectProject' | 'selectList'>;
  translationService: Pick<ReturnType<typeof getTranslationService>, 'getMessage'>;
};

const defaultDependencies: ViewStoreDependencies = {
  taskStore,
  selectionStore,
  translationService: getTranslationService()
};

function getProjectTasks(deps: ViewStoreDependencies): TaskWithSubTasks[] {
  const { taskStore } = deps;

  if (taskStore.selectedListId) {
    for (const project of taskStore.projects) {
      const list = project.taskLists.find((list) => list.id === taskStore.selectedListId);
      if (list) {
        return list.tasks;
      }
    }
    return [];
  }

  if (taskStore.selectedProjectId) {
    const project = taskStore.projects.find((item) => item.id === taskStore.selectedProjectId);
    if (!project) {
      return [];
    }
    return project.taskLists.flatMap((list) => list.tasks);
  }

  return [];
}

function getTomorrowTasks(deps: ViewStoreDependencies): TaskWithSubTasks[] {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);

  const tomorrowStart = new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate());
  const tomorrowEnd = new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate() + 1);

  return deps.taskStore.allTasks.filter((task) => {
    if (task.status === 'completed' || !task.planEndDate) {
      return false;
    }

    const dueDate = new Date(task.planEndDate);
    return dueDate >= tomorrowStart && dueDate < tomorrowEnd;
  });
}

function getNext3DaysTasks(deps: ViewStoreDependencies): TaskWithSubTasks[] {
  const today = new Date();
  const threeDaysLater = new Date();
  threeDaysLater.setDate(today.getDate() + 3);

  return deps.taskStore.allTasks.filter((task) => {
    if (task.status === 'completed' || !task.planEndDate) {
      return false;
    }

    const dueDate = new Date(task.planEndDate);
    return dueDate > today && dueDate <= threeDaysLater;
  });
}

function getNextWeekTasks(deps: ViewStoreDependencies): TaskWithSubTasks[] {
  const today = new Date();
  const oneWeekLater = new Date();
  oneWeekLater.setDate(today.getDate() + 7);

  return deps.taskStore.allTasks.filter((task) => {
    if (task.status === 'completed' || !task.planEndDate) {
      return false;
    }

    const dueDate = new Date(task.planEndDate);
    return dueDate > today && dueDate <= oneWeekLater;
  });
}

function getThisMonthTasks(deps: ViewStoreDependencies): TaskWithSubTasks[] {
  const today = new Date();
  const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

  return deps.taskStore.allTasks.filter((task) => {
    if (task.status === 'completed' || !task.planEndDate) {
      return false;
    }

    const dueDate = new Date(task.planEndDate);
    return dueDate >= today && dueDate <= endOfMonth;
  });
}

function getSearchResults(
  searchQuery: string,
  deps: ViewStoreDependencies
): TaskWithSubTasks[] {
  if (!searchQuery.trim()) {
    return deps.taskStore.allTasks;
  }

  const trimmedQuery = searchQuery.trim();

  if (trimmedQuery.startsWith('#')) {
    const tagQuery = trimmedQuery.slice(1).toLowerCase();

    if (!tagQuery) {
      return deps.taskStore.allTasks.filter((task) => task.tags.length > 0);
    }

    return deps.taskStore.allTasks.filter((task) =>
      task.tags.some((tag) => tag.name.toLowerCase().includes(tagQuery))
    );
  }

  const query = trimmedQuery.toLowerCase();
  return deps.taskStore.allTasks.filter(
    (task) =>
      task.title.toLowerCase().includes(query) ||
      task.description?.toLowerCase().includes(query) ||
      task.subTasks.some(
        (subTask) =>
          subTask.title.toLowerCase().includes(query) ||
          subTask.description?.toLowerCase().includes(query)
      ) ||
      task.tags.some((tag) => tag.name.toLowerCase().includes(query))
  );
}

function getProjectViewTitle(deps: ViewStoreDependencies): string {
  const { taskStore } = deps;

  if (taskStore.selectedListId) {
    for (const project of taskStore.projects) {
      const list = project.taskLists.find((item) => item.id === taskStore.selectedListId);
      if (list) {
        return `${project.name} > ${list.name}`;
      }
    }
    return 'Task List';
  }

  if (taskStore.selectedProjectId) {
    const project = taskStore.projects.find((item) => item.id === taskStore.selectedProjectId);
    if (!project) {
      return 'Project';
    }
    return project.name;
  }

  return 'Project';
}

export function getTasksForView(
  view: ViewType,
  searchQuery = '',
  deps: ViewStoreDependencies = defaultDependencies
): TaskWithSubTasks[] {
  switch (view) {
    case 'today':
      return deps.taskStore.todayTasks;
    case 'overdue':
      return deps.taskStore.overdueTasks;
    case 'completed':
      return deps.taskStore.allTasks.filter((task) => task.status === 'completed');
    case 'project':
    case 'tasklist':
      return getProjectTasks(deps);
    case 'tomorrow':
      return getTomorrowTasks(deps);
    case 'next3days':
      return getNext3DaysTasks(deps);
    case 'nextweek':
      return getNextWeekTasks(deps);
    case 'thismonth':
      return getThisMonthTasks(deps);
    case 'search':
      return getSearchResults(searchQuery, deps);
    default:
      return deps.taskStore.allTasks;
  }
}

export function getViewTitle(
  view: ViewType,
  searchQuery = '',
  deps: ViewStoreDependencies = defaultDependencies
): string {
  const { translationService } = deps;

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
    case 'tasklist':
      return getProjectViewTitle(deps);
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

export function shouldShowAddButton(view: ViewType): boolean {
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

export function handleViewChange(
  view: ViewType,
  deps: ViewStoreDependencies = defaultDependencies
): boolean {
  const { taskStore, selectionStore } = deps;

  if (taskStore.isNewTaskMode) {
    return false;
  }

  selectionStore.selectTask(null);

  if (view !== 'project' && view !== 'tasklist') {
    selectionStore.selectProject(null);
    selectionStore.selectList(null);
  }

  return true;
}

export function forceViewChange(
  view: ViewType,
  deps: ViewStoreDependencies = defaultDependencies
): void {
  const { taskStore, selectionStore } = deps;

  if (taskStore.isNewTaskMode) {
    taskStore.cancelNewTaskMode();
  }

  selectionStore.selectTask(null);

  if (view !== 'project' && view !== 'tasklist') {
    selectionStore.selectProject(null);
    selectionStore.selectList(null);
  }
}

export class ViewStore {
  #deps: ViewStoreDependencies;

  constructor(deps: ViewStoreDependencies = defaultDependencies) {
    this.#deps = deps;
  }

  currentView = $state<ViewType>('all');
  searchQuery = $state('');

  get tasks() {
    return getTasksForView(this.currentView, this.searchQuery, this.#deps);
  }

  get viewTitle() {
    return getViewTitle(this.currentView, this.searchQuery, this.#deps);
  }

  get showAddButton() {
    return shouldShowAddButton(this.currentView);
  }

  changeView(view: ViewType) {
    if (!handleViewChange(view, this.#deps)) {
      return;
    }

    this.currentView = view;

    if (view !== 'search') {
      this.searchQuery = '';
    }
  }

  performSearch(query: string) {
    this.searchQuery = query;
    this.currentView = 'search';
  }
}

export const viewStore = new ViewStore();
