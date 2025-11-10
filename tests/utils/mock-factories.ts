import type { ProjectTree } from '$lib/types/project';
import type { TaskListWithTasks } from '$lib/types/task-list';
import type { TaskWithSubTasks } from '$lib/types/task';
import type { SubTask } from '$lib/types/sub-task';
import type { Tag } from '$lib/types/tag';
import { ViewsVisibilityStore } from '$lib/stores/views-visibility.svelte';
import type { ViewItem } from '$lib/stores/views-visibility.svelte';

const defaultDate = () => new Date('2024-01-01T00:00:00Z');

export function createMockTaskWithSubTasks(
	overrides: Partial<TaskWithSubTasks> = {}
): TaskWithSubTasks {
	const base: TaskWithSubTasks = {
		id: 'task-1',
		projectId: 'project-1',
		listId: 'list-1',
		title: 'Mock Task',
		description: '',
		status: 'not_started',
		priority: 0,
		planStartDate: undefined,
		planEndDate: undefined,
		doStartDate: undefined,
		doEndDate: undefined,
		isRangeDate: false,
		recurrenceRule: undefined,
		assignedUserIds: [],
		tagIds: [],
		orderIndex: 0,
		isArchived: false,
		createdAt: defaultDate(),
		updatedAt: defaultDate(),
		deleted: false,
		updatedBy: 'system',
		subTasks: [],
		tags: []
	};

	if (overrides.subTasks) {
		base.subTasks = overrides.subTasks as SubTask[];
	}
	if (overrides.tags) {
		base.tags = overrides.tags as Tag[];
	}

	return { ...base, ...overrides };
}

export function createMockTaskListWithTasks(
	overrides: Partial<TaskListWithTasks> = {}
): TaskListWithTasks {
	const base: TaskListWithTasks = {
		id: 'list-1',
		projectId: 'project-1',
		name: 'Mock Task List',
		description: '',
		orderIndex: 0,
		isArchived: false,
		createdAt: defaultDate(),
		updatedAt: defaultDate(),
		deleted: false,
		updatedBy: 'system',
		tasks: []
	};

	if (overrides.tasks) {
		base.tasks = overrides.tasks.map((task) => createMockTaskWithSubTasks(task));
	}

	return { ...base, ...overrides };
}

export function createMockProjectTree(overrides: Partial<ProjectTree> = {}): ProjectTree {
	const base: ProjectTree = {
		id: 'project-1',
		name: 'Mock Project',
		description: '',
		color: '#FF0000',
		orderIndex: 0,
		isArchived: false,
		createdAt: defaultDate(),
		updatedAt: defaultDate(),
		deleted: false,
		updatedBy: 'system',
		taskLists: [],
		allTags: []
	};

	if (overrides.taskLists) {
		base.taskLists = overrides.taskLists.map((taskList) => createMockTaskListWithTasks(taskList));
	}

	if (overrides.allTags) {
		base.allTags = overrides.allTags;
	}

	return { ...base, ...overrides };
}

type ViewsVisibilityStoreOptions = {
	visible?: ViewItem[];
	hidden?: ViewItem[];
	onSetLists?: (visible: ViewItem[], hidden: ViewItem[]) => void;
	onReset?: () => void;
};

export class MockViewsVisibilityStore extends ViewsVisibilityStore {
	constructor(private options: ViewsVisibilityStoreOptions = {}) {
		super();
	}

	override get visibleViews(): ViewItem[] {
		return this.options.visible ?? [];
	}

	override get hiddenViews(): ViewItem[] {
		return this.options.hidden ?? [];
	}

	override setLists(visible: ViewItem[], hidden: ViewItem[]): void {
		this.options.visible = visible;
		this.options.hidden = hidden;
		this.options.onSetLists?.(visible, hidden);
	}

	override resetToDefaults(): void {
		this.options.onReset?.();
	}

	override async init(): Promise<void> {
		// noop for tests
	}
}
