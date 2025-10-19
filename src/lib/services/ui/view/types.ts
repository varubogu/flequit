import type { getTranslationService } from '$lib/stores/locale.svelte';
import type { selectionStore } from '$lib/stores/selection-store.svelte';
import type { taskStore } from '$lib/stores/tasks.svelte';
import type { taskInteractions } from '$lib/services/ui/task';

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
  >;
  taskInteractions: Pick<typeof taskInteractions, 'cancelNewTaskMode'>;
  selectionStore: Pick<typeof selectionStore, 'selectTask' | 'selectProject' | 'selectList'>;
  translationService: Pick<ReturnType<typeof getTranslationService>, 'getMessage'>;
};
