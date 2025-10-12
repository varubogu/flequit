import { projectStore } from '../project-store.svelte';
import { taskCoreStore } from '../task-core-store.svelte';
import { TaskSelectionStore } from './task-selection-store.svelte';
import { TaskNewModeStore } from './task-new-mode-store.svelte';
import { tagStore } from '../tags.svelte';
import type { TaskStoreDependencies } from './task-store.svelte';

// Create singleton instances
const taskSelectionStore = new TaskSelectionStore(projectStore);
const taskNewModeStore = new TaskNewModeStore();

export const taskStoreDependencies: TaskStoreDependencies = {
  projectStore,
  taskCoreStore,
  selection: taskSelectionStore,
  newMode: taskNewModeStore,
  tagStore
};
