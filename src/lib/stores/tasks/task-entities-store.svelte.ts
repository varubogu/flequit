import type { ProjectTree } from '$lib/types/project';
import type { Project } from '$lib/types/project';
import type { TaskList } from '$lib/types/task-list';
import type { TaskWithSubTasks } from '$lib/types/task';
import type { Tag } from '$lib/types/tag';
import type { SubTask } from '$lib/types/sub-task';
import { ProjectTreeTraverser } from '$lib/utils/project-tree-traverser';
import { SvelteDate } from 'svelte/reactivity';

export type TaskEntitiesDependencies = {
	projectStore: {
		projects: ProjectTree[];
		setProjects(projects: ProjectTree[]): void;
		loadProjects(projects: ProjectTree[]): void;
	};
	taskCoreStore: {
		setProjects(projects: ProjectTree[]): void;
		loadProjectsData(projects: ProjectTree[]): void;
	};
};

export class TaskEntitiesStore {
	#deps: TaskEntitiesDependencies;

	constructor(deps: TaskEntitiesDependencies) {
		this.#deps = deps;
	}

	get projects(): ProjectTree[] {
		return this.#deps.projectStore.projects;
	}

	set projects(projects: ProjectTree[]) {
		this.setProjects(projects);
	}

	setProjects(projects: ProjectTree[]): void {
		this.#deps.projectStore.setProjects(projects);
		this.#deps.taskCoreStore.setProjects(this.#deps.projectStore.projects);
	}

	loadProjectsData(projects: ProjectTree[]): void {
		this.#deps.projectStore.loadProjects(projects);
		this.#deps.taskCoreStore.loadProjectsData(this.#deps.projectStore.projects);
	}

	get allTasks(): TaskWithSubTasks[] {
		return ProjectTreeTraverser.getAllTasks(this.projects);
	}

	get todayTasks(): TaskWithSubTasks[] {
		const today = new SvelteDate();
		today.setHours(0, 0, 0, 0);
		const tomorrow = new SvelteDate(today);
		tomorrow.setDate(tomorrow.getDate() + 1);

		return this.allTasks.filter((task) => {
			if (!task.planEndDate) return false;
			const dueDate = new SvelteDate(task.planEndDate);
			return dueDate >= today && dueDate < tomorrow;
		});
	}

	get overdueTasks(): TaskWithSubTasks[] {
		const today = new SvelteDate();
		today.setHours(0, 0, 0, 0);
		return this.allTasks.filter((task) => {
			if (!task.planEndDate || task.status === 'completed') return false;
			const dueDate = new SvelteDate(task.planEndDate);
			return dueDate < today;
		});
	}

	getTaskById(taskId: string): TaskWithSubTasks | null {
		return ProjectTreeTraverser.findTask(this.projects, taskId);
	}

	getTaskProjectAndList(taskId: string): { project: Project; taskList: TaskList } | null {
		return ProjectTreeTraverser.findTaskContext(this.projects, taskId);
	}

	getTaskCountByTag(tagName: string): number {
		return ProjectTreeTraverser.getTaskCountByTag(this.projects, tagName);
	}

	removeTagFromAllTasks(tagId: string): void {
		const now = new SvelteDate();
		const affectedTasks: TaskWithSubTasks[] = [];
		const affectedSubTasks: SubTask[] = [];

		for (const project of this.projects) {
			for (const list of project.taskLists) {
				for (const task of list.tasks) {
					if (task.tags.some((tag) => tag.id === tagId)) {
						affectedTasks.push(task);
					}
					for (const subTask of task.subTasks) {
						if (subTask.tags?.some((tag) => tag.id === tagId)) {
							affectedSubTasks.push(subTask);
						}
					}
				}
			}
		}

		ProjectTreeTraverser.removeTagFromAllTasks(this.projects, tagId);

		affectedTasks.forEach((task) => {
			task.updatedAt = now;
		});
		affectedSubTasks.forEach((subTask) => {
			subTask.updatedAt = now;
		});
	}

	updateTagInAllTasks(updatedTag: Tag): void {
		const now = new SvelteDate();
		const affectedTasks: TaskWithSubTasks[] = [];
		const affectedSubTasks: SubTask[] = [];

		for (const project of this.projects) {
			for (const list of project.taskLists) {
				for (const task of list.tasks) {
					if (task.tags.some((tag) => tag.id === updatedTag.id)) {
						affectedTasks.push(task);
					}
					for (const subTask of task.subTasks) {
						if (subTask.tags?.some((tag) => tag.id === updatedTag.id)) {
							affectedSubTasks.push(subTask);
						}
					}
				}
			}
		}

		ProjectTreeTraverser.updateTagInAllTasks(this.projects, updatedTag);

		affectedTasks.forEach((task) => {
			task.updatedAt = now;
		});
		affectedSubTasks.forEach((subTask) => {
			subTask.updatedAt = now;
		});
	}

	getProjectIdByTaskId(taskId: string): string | null {
		return ProjectTreeTraverser.getProjectIdByTaskId(this.projects, taskId);
	}

	getProjectIdByTagId(tagId: string): string | null {
		return ProjectTreeTraverser.getProjectIdByTagId(this.projects, tagId);
	}
}
