import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TaskEntitiesStore } from '$lib/stores/tasks/task-entities-store.svelte';
import { TaskSelectionStore } from '$lib/stores/tasks/task-selection-store.svelte';
import { TaskDraftStore } from '$lib/stores/tasks/task-draft-store.svelte';
import type { ProjectTree } from '$lib/types/project';
import type { TaskWithSubTasks } from '$lib/types/task';
import type { SubTask } from '$lib/types/sub-task';
import type { Tag } from '$lib/types/tag';

function createTag(overrides: Partial<Tag> = {}): Tag {
	const now = new Date();
	return {
		id: overrides.id ?? 'tag-1',
		name: overrides.name ?? 'Urgent',
		color: overrides.color,
		orderIndex: overrides.orderIndex,
		createdAt: overrides.createdAt ?? now,
		updatedAt: overrides.updatedAt ?? now
	};
}

function createSubTask(overrides: Partial<SubTask> = {}): SubTask {
	const now = new Date();
	return {
		id: overrides.id ?? 'sub-1',
		taskId: overrides.taskId ?? 'task-1',
		title: overrides.title ?? 'SubTask',
		description: overrides.description,
		status: overrides.status ?? 'not_started',
		orderIndex: overrides.orderIndex ?? 0,
		completed: overrides.completed ?? false,
		assignedUserIds: overrides.assignedUserIds ?? [],
		createdAt: overrides.createdAt ?? now,
		updatedAt: overrides.updatedAt ?? now,
		tags: overrides.tags ?? []
	};
}

function createTask(overrides: Partial<TaskWithSubTasks> = {}): TaskWithSubTasks {
	const now = new Date();
	return {
		id: overrides.id ?? 'task-1',
		projectId: overrides.projectId ?? 'project-1',
		listId: overrides.listId ?? 'list-1',
		title: overrides.title ?? 'Task',
		description: overrides.description ?? '',
		status: overrides.status ?? 'not_started',
		priority: overrides.priority ?? 0,
		planStartDate: overrides.planStartDate,
		planEndDate: overrides.planEndDate,
		isRangeDate: overrides.isRangeDate ?? false,
		orderIndex: overrides.orderIndex ?? 0,
		isArchived: overrides.isArchived ?? false,
		assignedUserIds: overrides.assignedUserIds ?? [],
		tagIds: overrides.tagIds ?? [],
		createdAt: overrides.createdAt ?? now,
		updatedAt: overrides.updatedAt ?? now,
		subTasks: overrides.subTasks ?? [],
		tags: overrides.tags ?? []
	};
}

function createProjectTree(): ProjectTree[] {
	const now = new Date();
	const tag = createTag();
	const anotherTag = createTag({ id: 'tag-2', name: 'Info' });

	const upcomingTask = createTask({
		id: 'task-1',
		planEndDate: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
		subTasks: [createSubTask({ tags: [tag] })],
		tags: [tag]
	});

	const overdueTask = createTask({
		id: 'task-overdue',
		planEndDate: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1),
		tags: [anotherTag]
	});

	return [
		{
			id: 'project-1',
			name: 'Project 1',
			description: 'Sample project',
			color: '#cccccc',
			orderIndex: 0,
			isArchived: false,
			createdAt: now,
			updatedAt: now,
			taskLists: [
				{
					id: 'list-1',
					projectId: 'project-1',
					name: 'List 1',
					description: '',
					color: '#999999',
					orderIndex: 0,
					isArchived: false,
					createdAt: now,
					updatedAt: now,
					tasks: [upcomingTask, overdueTask]
				}
			]
		}
	];
}

describe('TaskEntitiesStore', () => {
	let projectStoreMock: {
		projects: ProjectTree[];
		setProjects: ReturnType<typeof vi.fn>;
		loadProjects: ReturnType<typeof vi.fn>;
	};
	let taskCoreStoreMock: {
		setProjects: ReturnType<typeof vi.fn>;
		loadProjectsData: ReturnType<typeof vi.fn>;
	};
	let entities: TaskEntitiesStore;

	beforeEach(() => {
		projectStoreMock = {
			projects: [],
			setProjects: vi.fn(function (this: { projects: ProjectTree[] }, projects: ProjectTree[]) {
				this.projects = projects;
			}),
			loadProjects: vi.fn(function (this: { projects: ProjectTree[] }, projects: ProjectTree[]) {
				this.projects = projects;
			})
		};

		taskCoreStoreMock = {
			setProjects: vi.fn(),
			loadProjectsData: vi.fn()
		};

		entities = new TaskEntitiesStore({
			projectStore: projectStoreMock,
			taskCoreStore: taskCoreStoreMock
		});
	});

	it('setProjects updates project and core stores', () => {
		const projects = createProjectTree();
		entities.setProjects(projects);

		expect(projectStoreMock.setProjects).toHaveBeenCalledWith(projects);
		expect(taskCoreStoreMock.setProjects).toHaveBeenCalledWith(projectStoreMock.projects);
		expect(entities.projects).toEqual(projects);
	});

	it('loadProjectsData loads projects and core data', () => {
		const projects = createProjectTree();
		entities.loadProjectsData(projects);

		expect(projectStoreMock.loadProjects).toHaveBeenCalledWith(projects);
		expect(taskCoreStoreMock.loadProjectsData).toHaveBeenCalledWith(projectStoreMock.projects);
	});

	it('todayTasks and overdueTasks compute correctly', () => {
		const projects = createProjectTree();
		entities.setProjects(projects);

		expect(entities.allTasks).toHaveLength(2);
		expect(entities.todayTasks).toHaveLength(1);
		expect(entities.overdueTasks).toHaveLength(1);
	});

	it('removeTagFromAllTasks removes tags from tasks and subtasks', () => {
		const projects = createProjectTree();
		entities.setProjects(projects);

		const taskBefore = entities.getTaskById('task-1')!;
		const subTaskBefore = taskBefore.subTasks[0]!;
		const originalTaskUpdatedAt = taskBefore.updatedAt;
		const originalSubTaskUpdatedAt = subTaskBefore.updatedAt;

		entities.removeTagFromAllTasks('tag-1');

		expect(taskBefore.tags).toHaveLength(0);
		expect(subTaskBefore.tags).toHaveLength(0);
		expect(taskBefore.updatedAt.getTime()).greaterThanOrEqual(originalTaskUpdatedAt.getTime());
		expect(subTaskBefore.updatedAt.getTime()).greaterThanOrEqual(originalSubTaskUpdatedAt.getTime());
	});

	it('updateTagInAllTasks updates matching tags', () => {
		const projects = createProjectTree();
		entities.setProjects(projects);

		const updatedTag = createTag({ id: 'tag-1', name: 'Updated' });
		entities.updateTagInAllTasks(updatedTag);

		const task = entities.getTaskById('task-1')!;
		expect(task.tags[0]?.name).toBe('Updated');
	});

	it('getProjectIdByTagId returns owning project id', () => {
		const projects = createProjectTree();
		entities.setProjects(projects);

		expect(entities.getProjectIdByTagId('tag-1')).toBe('project-1');
	});
});

describe('TaskSelectionStore', () => {
	let selectionState: {
		selectedProjectId: string | null;
		selectedListId: string | null;
		selectedTaskId: string | null;
		selectedSubTaskId: string | null;
		pendingTaskSelection: string | null;
		pendingSubTaskSelection: string | null;
		selectProject(projectId: string | null): void;
		selectList(listId: string | null): void;
		selectTask(taskId: string | null): void;
		selectSubTask(subTaskId: string | null): void;
		clearPendingSelections(): void;
	};
	let entitiesStub: {
		allTasks: TaskWithSubTasks[];
		getTaskById: ReturnType<typeof vi.fn>;
		getTaskProjectAndList: ReturnType<typeof vi.fn>;
		getProjectIdByTaskId: ReturnType<typeof vi.fn>;
	};
	let subTaskStoreStub: { selectedSubTask: SubTask | null };
	let selection: TaskSelectionStore;

	beforeEach(() => {
		const projects = createProjectTree();
		const tasks = projects[0].taskLists[0].tasks;

		selectionState = {
			selectedProjectId: null,
			selectedListId: null,
			selectedTaskId: null,
			selectedSubTaskId: null,
			pendingTaskSelection: null,
			pendingSubTaskSelection: null,
			selectProject(projectId: string | null) {
				this.selectedProjectId = projectId;
				this.selectedListId = null;
			},
			selectList(listId: string | null) {
				this.selectedListId = listId;
				this.selectedProjectId = null;
			},
			selectTask(taskId: string | null) {
				this.selectedTaskId = taskId;
				this.selectedSubTaskId = null;
			},
			selectSubTask(subTaskId: string | null) {
				this.selectedSubTaskId = subTaskId;
				this.selectedTaskId = null;
			},
			clearPendingSelections() {
				this.pendingTaskSelection = null;
				this.pendingSubTaskSelection = null;
			}
		};

		entitiesStub = {
			allTasks: tasks,
			getTaskById: vi.fn((id: string) => tasks.find((task) => task.id === id) ?? null),
			getTaskProjectAndList: vi.fn((id: string) => ({
				project: createProjectTree()[0],
				taskList: createProjectTree()[0].taskLists[0]
			})),
			getProjectIdByTaskId: vi.fn(() => 'project-1')
		};

		subTaskStoreStub = {
			selectedSubTask: tasks[0].subTasks[0] ?? null
		};

		selection = new TaskSelectionStore({
			selectionStore: selectionState,
			entitiesStore: entitiesStub,
			subTaskStore: subTaskStoreStub
		});
	});

	it('selectedTaskId setter delegates to selection store', () => {
		selection.selectedTaskId = 'task-1';

		expect(selectionState.selectedTaskId).toBe('task-1');
		expect(selection.selectedTask?.id).toBe('task-1');
		expect(selection.selectedSubTaskId).toBeNull();
	});

	it('selectedProjectId setter clears list selection', () => {
		selection.selectedListId = 'list-1';
		selection.selectedProjectId = 'project-1';

		expect(selectionState.selectedProjectId).toBe('project-1');
		expect(selectionState.selectedListId).toBeNull();
	});

	it('clearPendingSelections delegates to selection store', () => {
		selection.pendingTaskSelection = 'task-1';
		selection.pendingSubTaskSelection = 'sub-1';

		selection.clearPendingSelections();

		expect(selectionState.pendingTaskSelection).toBeNull();
		expect(selectionState.pendingSubTaskSelection).toBeNull();
	});

	it('getProjectIdByTaskId delegates to entities store', () => {
		const projectId = selection.getProjectIdByTaskId('task-1');

		expect(projectId).toBe('project-1');
		expect(entitiesStub.getProjectIdByTaskId).toHaveBeenCalledWith('task-1');
	});

	it('selectedSubTask reads from sub task store', () => {
		expect(selection.selectedSubTask).toEqual(subTaskStoreStub.selectedSubTask);
	});
});

describe('TaskDraftStore', () => {
	let taskListStoreStub: { getProjectIdByListId: ReturnType<typeof vi.fn> };
	let selectionStub: { selectedProjectId: string | null };
	let draft: TaskDraftStore;

	beforeEach(() => {
		taskListStoreStub = {
			getProjectIdByListId: vi.fn(() => 'project-1')
		};
		selectionStub = {
			selectedProjectId: 'project-1'
		};
		draft = new TaskDraftStore({
			taskListStore: taskListStoreStub,
			selection: selectionStub
		});
	});

	it('start initializes draft with list project', () => {
		draft.start('list-1');

		expect(draft.isNewTaskMode).toBe(true);
		expect(draft.newTaskDraft).not.toBeNull();
		expect(draft.newTaskDraft?.listId).toBe('list-1');
		expect(draft.newTaskDraft?.projectId).toBe('project-1');
	});

	it('start falls back to selected project when list project missing', () => {
		taskListStoreStub.getProjectIdByListId.mockReturnValue(null);
		selectionStub.selectedProjectId = 'project-from-selection';

		draft.start('list-unknown');

		expect(draft.newTaskDraft?.projectId).toBe('project-from-selection');
	});

	it('cancel resets draft state', () => {
		draft.start('list-1');
		draft.cancel();

		expect(draft.isNewTaskMode).toBe(false);
		expect(draft.newTaskDraft).toBeNull();
	});

	it('updateDraft merges updates into current draft', () => {
		draft.start('list-1');
		draft.updateDraft({ title: 'Updated' });

		expect(draft.newTaskDraft?.title).toBe('Updated');
	});
});
