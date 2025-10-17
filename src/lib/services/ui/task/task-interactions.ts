import type { TaskWithSubTasks } from '$lib/types/task';
import type { Tag } from '$lib/types/tag';
import { SvelteDate } from 'svelte/reactivity';
import { TaskEntitiesStore } from '$lib/stores/tasks/task-entities-store.svelte';
import { TaskSelectionStore } from '$lib/stores/tasks/task-selection-store.svelte';
import { TaskDraftStore } from '$lib/stores/tasks/task-draft-store.svelte';

export type TaskInteractionsDependencies = {
	entities: TaskEntitiesStore;
	selection: TaskSelectionStore;
	draft: TaskDraftStore;
	taskMutations: {
		addTask(listId: string, taskData: Partial<TaskWithSubTasks>): Promise<TaskWithSubTasks | null>;
	};
	tagStore: {
		getOrCreateTagWithProject(tagName: string, projectId: string): Promise<Tag | null>;
	};
};

export class TaskInteractionsService {
	#deps: TaskInteractionsDependencies;
	#tagUpdatedHandler?: (event: Event) => void;

	constructor(deps: TaskInteractionsDependencies) {
		this.#deps = deps;
		if (typeof window !== 'undefined') {
			this.#tagUpdatedHandler = (event: Event) => {
				const customEvent = event as CustomEvent<Tag>;
				if (customEvent.detail) {
					this.updateTagInAllTasks(customEvent.detail);
				}
			};
			window.addEventListener('tag-updated', this.#tagUpdatedHandler);
		}
	}

	dispose(): void {
		if (typeof window !== 'undefined' && this.#tagUpdatedHandler) {
			window.removeEventListener('tag-updated', this.#tagUpdatedHandler);
		}
	}

	startNewTaskMode(listId: string): void {
		this.#deps.selection.selectedTaskId = null;
		this.#deps.selection.selectedSubTaskId = null;
		this.#deps.draft.start(listId);
	}

	cancelNewTaskMode(): void {
		this.#deps.draft.cancel();
		this.#deps.selection.clearPendingSelections();
	}

	async saveNewTask(): Promise<string | null> {
		const draft = this.#deps.draft.newTaskDraft;
		if (!draft || !draft.listId || !draft.title?.trim()) {
			return null;
		}

		const newTask = await this.#deps.taskMutations.addTask(draft.listId, draft);
		if (!newTask) {
			return null;
		}

		this.#deps.draft.cancel();
		this.#deps.selection.selectedTaskId = newTask.id;
		return newTask.id;
	}

	updateNewTaskData(updates: Partial<TaskWithSubTasks>): void {
		this.#deps.draft.updateDraft(updates);
	}

	async addTagToNewTask(tagName: string): Promise<void> {
		const draft = this.#deps.draft.newTaskDraft;
		if (!draft) return;

		const trimmed = tagName.trim();
		if (!trimmed) return;

		const projectId = draft.projectId ?? this.#deps.selection.selectedProjectId;
		if (!projectId) return;

		const tag = await this.#deps.tagStore.getOrCreateTagWithProject(trimmed, projectId);
		if (!tag) return;

		if (!draft.tags.some((existing) => existing.name.toLowerCase() === tag.name.toLowerCase())) {
			draft.tags.push(tag);
		}
	}

	removeTagFromNewTask(tagId: string): void {
		const draft = this.#deps.draft.newTaskDraft;
		if (!draft) return;
		const index = draft.tags.findIndex((tag) => tag.id === tagId);
		if (index !== -1) {
			draft.tags.splice(index, 1);
		}
	}

	attachTagToTask(taskId: string, tag: Tag): void {
		const task = this.#deps.entities.getTaskById(taskId);
		if (!task) return;
		if (
			task.tags.some(
				(existing) => existing.id === tag.id || existing.name.toLowerCase() === tag.name.toLowerCase()
			)
		) {
			return;
		}
		task.tags.push(tag);
		task.updatedAt = new SvelteDate();
	}

	detachTagFromTask(taskId: string, tagId: string): Tag | null {
		const task = this.#deps.entities.getTaskById(taskId);
		if (!task) return null;
		const index = task.tags.findIndex((tag) => tag.id === tagId);
		if (index === -1) return null;
		const [removed] = task.tags.splice(index, 1);
		task.updatedAt = new SvelteDate();
		return removed ?? null;
	}

	removeTagFromAllTasks(tagId: string): void {
		this.#deps.entities.removeTagFromAllTasks(tagId);
		const draft = this.#deps.draft.newTaskDraft;
		if (draft) {
			const index = draft.tags.findIndex((tag) => tag.id === tagId);
			if (index !== -1) {
				draft.tags.splice(index, 1);
			}
		}
	}

	updateTagInAllTasks(updatedTag: Tag): void {
		this.#deps.entities.updateTagInAllTasks(updatedTag);
		const draft = this.#deps.draft.newTaskDraft;
		if (draft) {
			const index = draft.tags.findIndex((tag) => tag.id === updatedTag.id);
			if (index !== -1) {
				draft.tags[index] = { ...updatedTag };
			}
		}
	}

	clearPendingSelections(): void {
		this.#deps.selection.clearPendingSelections();
	}
}
