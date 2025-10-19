import { taskStore } from '$lib/stores/tasks.svelte';
import { tagStore } from '$lib/stores/tags.svelte';
import { taskMutations } from '$lib/services/domain/task/task-mutations-instance';
import { TaskInteractionsService } from './task-interactions';

let _taskInteractions: TaskInteractionsService | undefined;

function createTaskInteractions(): TaskInteractionsService {
	return new TaskInteractionsService({
		entities: taskStore.entities,
		selection: taskStore.selection,
		draft: taskStore.draft,
		taskMutations,
		tagStore
	});
}

export function getTaskInteractions(): TaskInteractionsService {
	if (!_taskInteractions) {
		_taskInteractions = createTaskInteractions();
	}
	return _taskInteractions;
}

export const taskInteractions = new Proxy({} as TaskInteractionsService, {
	get(_target, prop) {
		const interactions = getTaskInteractions();
		const value = interactions[prop as keyof TaskInteractionsService];
		return typeof value === 'function' ? value.bind(interactions) : value;
	}
});

export type { TaskInteractionsService } from './task-interactions';
