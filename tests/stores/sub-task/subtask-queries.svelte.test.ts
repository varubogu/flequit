import { describe, it, expect, beforeEach } from 'vitest';
import { SubTaskQueries } from '$lib/stores/sub-task/subtask-queries.svelte';
import type { IProjectStore, ISelectionStore } from '$lib/types/store-interfaces';
import type { ProjectTree } from '$lib/types/project';
import type { SubTask } from '$lib/types/sub-task';

const createSubTask = (overrides: Partial<SubTask>): SubTask => ({
	id: overrides.id ?? 'subtask-1',
	taskId: overrides.taskId ?? 'task-1',
	title: overrides.title ?? 'SubTask',
	description: overrides.description,
	status: overrides.status ?? 'not_started',
	priority: overrides.priority,
	planStartDate: overrides.planStartDate,
	planEndDate: overrides.planEndDate,
	doStartDate: overrides.doStartDate,
	doEndDate: overrides.doEndDate,
	isRangeDate: overrides.isRangeDate,
	recurrenceRule: overrides.recurrenceRule,
	orderIndex: overrides.orderIndex ?? 0,
	completed: overrides.completed ?? false,
	assignedUserIds: overrides.assignedUserIds ?? [],
	tagIds: overrides.tagIds,
	tags: overrides.tags,
	createdAt: overrides.createdAt ?? new Date(),
	updatedAt: overrides.updatedAt ?? new Date()
});

const createMockProjects = (): IProjectStore => {
	const subTasks: SubTask[] = [
		createSubTask({ id: 'subtask-1', title: 'SubTask 1', orderIndex: 0 }),
		createSubTask({ id: 'subtask-2', title: 'SubTask 2', orderIndex: 1 })
	];

	const projects: ProjectTree[] = [
		{
			id: 'project-1',
			name: 'Project 1',
			description: '',
			color: '#000000',
			orderIndex: 0,
			isArchived: false,
			createdAt: new Date(),
			updatedAt: new Date(),
			taskLists: [
				{
					id: 'list-1',
					projectId: 'project-1',
					name: 'List 1',
					description: '',
					orderIndex: 0,
					isArchived: false,
					createdAt: new Date(),
					updatedAt: new Date(),
					tasks: [
						{
							id: 'task-1',
							projectId: 'project-1',
							listId: 'list-1',
							title: 'Task 1',
							description: '',
							status: 'not_started',
							priority: 0,
							orderIndex: 0,
							isArchived: false,
							assignedUserIds: [],
							tagIds: [],
							createdAt: new Date(),
							updatedAt: new Date(),
							subTasks,
							tags: []
						}
					]
				}
			],
			allTags: []
		}
	];

	const projectStore: IProjectStore = {
		projects,
		selectedProject: null,
		addProjectToStore: () => projects[0],
		updateProjectInStore: () => null,
		removeProjectFromStore: () => false,
		reorderProjectsInStore: () => projects,
		moveProjectToPositionInStore: () => projects,
		getProjectById: () => projects[0],
		loadProjects: () => {},
		setProjects: () => {},
		reset: () => {}
	};

	return projectStore;
};

const createMockSelection = (): ISelectionStore => {
	const selection: ISelectionStore = {
		selectedProjectId: null,
		selectedListId: null,
		selectedTaskId: null,
		selectedSubTaskId: null,
		pendingTaskSelection: null,
		pendingSubTaskSelection: null,
		selectProject(projectId) {
			this.selectedProjectId = projectId;
		},
		selectList(listId) {
			this.selectedListId = listId;
		},
		selectTask(taskId) {
			this.selectedTaskId = taskId;
		},
		selectSubTask(subTaskId) {
			this.selectedSubTaskId = subTaskId;
		},
		clearPendingSelections() {
			this.pendingTaskSelection = null;
			this.pendingSubTaskSelection = null;
		},
		reset() {
			this.selectedProjectId = null;
			this.selectedListId = null;
			this.selectedTaskId = null;
			this.selectedSubTaskId = null;
			this.clearPendingSelections();
		}
	};
	return selection;
};

describe('SubTaskQueries', () => {
	let mockProjects: IProjectStore;
	let mockSelection: ISelectionStore;
	let queries: SubTaskQueries;

	beforeEach(() => {
		mockProjects = createMockProjects();
		mockSelection = createMockSelection();
		queries = new SubTaskQueries(mockProjects, mockSelection);
	});

	describe('selectedSubTask', () => {
		it('選択中のサブタスクを取得できる', () => {
			mockSelection.selectedSubTaskId = 'subtask-1';

			const subTask = queries.selectedSubTask;

			expect(subTask).not.toBeNull();
			expect(subTask?.id).toBe('subtask-1');
			expect(subTask?.title).toBe('SubTask 1');
		});

		it('選択がない場合はnullを返す', () => {
			mockSelection.selectedSubTaskId = null;

			const subTask = queries.selectedSubTask;

			expect(subTask).toBeNull();
		});

		it('存在しないIDの場合はnullを返す', () => {
			mockSelection.selectedSubTaskId = 'non-existent';

			const subTask = queries.selectedSubTask;

			expect(subTask).toBeNull();
		});
	});

	describe('getTaskIdBySubTaskId', () => {
		it('サブタスクIDから親タスクIDを取得できる', () => {
			const taskId = queries.getTaskIdBySubTaskId('subtask-1');

			expect(taskId).toBe('task-1');
		});

		it('存在しないサブタスクIDの場合はnullを返す', () => {
			const taskId = queries.getTaskIdBySubTaskId('non-existent');

			expect(taskId).toBeNull();
		});
	});

	describe('getProjectIdBySubTaskId', () => {
		it('サブタスクIDからプロジェクトIDを取得できる', () => {
			const projectId = queries.getProjectIdBySubTaskId('subtask-1');

			expect(projectId).toBe('project-1');
		});

		it('存在しないサブタスクIDの場合はnullを返す', () => {
			const projectId = queries.getProjectIdBySubTaskId('non-existent');

			expect(projectId).toBeNull();
		});
	});
});
