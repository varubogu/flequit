import { getTranslationService } from '$lib/stores/locale.svelte';
import { selectionStore } from '$lib/stores/selection-store.svelte';
import { taskStore } from '$lib/stores/tasks.svelte';
import { taskInteractions } from '$lib/services/ui/task';
import type { ViewStoreDependencies } from './types';

const translationService = getTranslationService();

export const defaultViewDependencies: ViewStoreDependencies = {
  taskStore,
  taskInteractions,
  selectionStore,
  translationService
};

export function resolveViewDependencies(deps?: ViewStoreDependencies): ViewStoreDependencies {
  return deps ?? defaultViewDependencies;
}
