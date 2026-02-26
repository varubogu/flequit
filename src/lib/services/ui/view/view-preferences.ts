import type { ViewStoreDependencies, ViewType } from './types';
import { resolveViewDependencies } from './view-dependencies';

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

export function getViewTitle(
  view: ViewType,
  searchQuery = '',
  deps?: ViewStoreDependencies
): string {
  const resolvedDeps = resolveViewDependencies(deps);
  const { translationService } = resolvedDeps;

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
      return getProjectViewTitle(resolvedDeps);
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

export function handleViewChange(view: ViewType, deps?: ViewStoreDependencies): boolean {
  const resolvedDeps = resolveViewDependencies(deps);
  const { taskStore, selectionStore } = resolvedDeps;

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

export function forceViewChange(view: ViewType, deps?: ViewStoreDependencies): void {
  const resolvedDeps = resolveViewDependencies(deps);
  const { taskStore, selectionStore, taskInteractions } = resolvedDeps;

  if (taskStore.isNewTaskMode) {
    taskInteractions.cancelNewTaskMode();
  }

  selectionStore.selectTask(null);

  if (view !== 'project' && view !== 'tasklist') {
    selectionStore.selectProject(null);
    selectionStore.selectList(null);
  }
}
