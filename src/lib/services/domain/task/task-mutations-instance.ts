import { taskStore } from '$lib/stores/tasks.svelte';
import { taskCoreStore } from '$lib/stores/task-core-store.svelte';
import { taskListStore } from '$lib/stores/task-list-store.svelte';
import { tagStore } from '$lib/stores/tags.svelte';
import { TaggingService } from '$lib/services/domain/tagging';
import { errorHandler } from '$lib/stores/error-handler.svelte';
import { TaskService } from './task-crud';
import { TaskMutations } from './task-mutations';
import { TaskRecurrenceService } from '../task-recurrence';

let _taskMutations: TaskMutations | undefined;

function createTaskMutations(): TaskMutations {
	return new TaskMutations({
		taskStore,
		taskCoreStore,
		taskListStore,
		tagStore,
		taggingService: TaggingService,
		errorHandler,
		taskService: TaskService,
		recurrenceService: new TaskRecurrenceService()
	});
}

export function getTaskMutations(): TaskMutations {
	if (!_taskMutations) {
		_taskMutations = createTaskMutations();
	}
	return _taskMutations;
}

export const taskMutations = new Proxy({} as TaskMutations, {
	get(_target, prop) {
		const mutations = getTaskMutations();
		const value = mutations[prop as keyof TaskMutations];
		return typeof value === 'function' ? value.bind(mutations) : value;
	},
	set(_target, prop, value) {
		const mutations = getTaskMutations();
		(mutations as any)[prop] = value;
		return true;
	}
});
