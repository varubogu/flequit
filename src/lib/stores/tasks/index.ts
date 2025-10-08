import { taskStoreDependencies } from './task-store-dependencies';
import { TaskFacadeStore } from './task-store.svelte';

export const taskStore = new TaskFacadeStore(taskStoreDependencies);

export type TaskStore = TaskFacadeStore;
