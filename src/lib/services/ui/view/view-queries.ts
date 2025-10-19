import type { TaskWithSubTasks } from '$lib/types/task';
import type { ViewStoreDependencies, ViewType } from './types';
import { resolveViewDependencies } from './view-dependencies';

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

export function getTasksForView(
  view: ViewType,
  searchQuery = '',
  deps?: ViewStoreDependencies
): TaskWithSubTasks[] {
  const resolvedDeps = resolveViewDependencies(deps);

  switch (view) {
    case 'today':
      return resolvedDeps.taskStore.todayTasks;
    case 'overdue':
      return resolvedDeps.taskStore.overdueTasks;
    case 'completed':
      return resolvedDeps.taskStore.allTasks.filter((task) => task.status === 'completed');
    case 'project':
    case 'tasklist':
      return getProjectTasks(resolvedDeps);
    case 'tomorrow':
      return getTomorrowTasks(resolvedDeps);
    case 'next3days':
      return getNext3DaysTasks(resolvedDeps);
    case 'nextweek':
      return getNextWeekTasks(resolvedDeps);
    case 'thismonth':
      return getThisMonthTasks(resolvedDeps);
    case 'search':
      return getSearchResults(searchQuery, resolvedDeps);
    default:
      return resolvedDeps.taskStore.allTasks;
  }
}
