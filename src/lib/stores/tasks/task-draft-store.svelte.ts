import type { TaskWithSubTasks } from '$lib/types/task';
import { SvelteDate } from 'svelte/reactivity';

export type TaskDraftDependencies = {
	taskListStore: {
		getProjectIdByListId(listId: string): string | null;
	};
	selection: {
		selectedProjectId: string | null;
	};
};

export class TaskDraftStore {
	#deps: TaskDraftDependencies;

	isNewTaskMode = $state<boolean>(false);
	newTaskDraft = $state<TaskWithSubTasks | null>(null);

	constructor(deps: TaskDraftDependencies) {
		this.#deps = deps;
	}

	start(listId: string): void {
		this.isNewTaskMode = true;
		const projectId =
			this.#deps.taskListStore.getProjectIdByListId(listId) ?? this.#deps.selection.selectedProjectId;
		if (!projectId) {
			console.error('Failed to determine project for list:', listId);
			this.cancel();
			return;
		}

		this.newTaskDraft = {
			id: 'new-task',
			projectId,
			listId,
			title: '',
			description: '',
			status: 'not_started',
			priority: 0,
			orderIndex: 0,
			isArchived: false,
			assignedUserIds: [],
			tagIds: [],
			createdAt: new SvelteDate(),
			updatedAt: new SvelteDate(),
			deleted: false,
			updatedBy: 'system',
			subTasks: [],
			tags: []
		} as TaskWithSubTasks;
	}

	cancel(): void {
		this.isNewTaskMode = false;
		this.newTaskDraft = null;
	}

	updateDraft(updates: Partial<TaskWithSubTasks>): void {
		if (!this.newTaskDraft) return;
		this.newTaskDraft = { ...this.newTaskDraft, ...updates };
	}
}
