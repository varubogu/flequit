import { describe, it, expect, beforeEach } from 'vitest';
import { getTasksForView } from '$lib/services/ui/view/view-queries';
import type { TaskWithSubTasks } from '$lib/types/task';
import type { ViewStoreDependencies } from '$lib/services/ui/view/types';
import * as viewDependencies from '$lib/services/ui/view/view-dependencies';

describe('ViewQueries', () => {
	const today = new Date('2024-01-15T12:00:00Z');
	const yesterday = new Date('2024-01-14T12:00:00Z');
	const tomorrow = new Date('2024-01-16T12:00:00Z');
	const threeDaysLater = new Date('2024-01-18T12:00:00Z');
	const oneWeekLater = new Date('2024-01-22T12:00:00Z');
	const endOfMonth = new Date('2024-01-31T23:59:59Z');

	let mockTasks: TaskWithSubTasks[];
	let mockDeps: ViewStoreDependencies;

	beforeEach(() => {
		// Mock current date
		vi.useFakeTimers();
		vi.setSystemTime(today);

		mockTasks = [
			{
				id: 'task-1',
				title: 'Overdue Task',
				description: 'This is overdue',
				status: 'pending',
				planEndDate: yesterday,
				tags: [],
				subTasks: [],
				sortOrder: 0
			} as TaskWithSubTasks,
			{
				id: 'task-2',
				title: 'Today Task',
				description: 'Due today',
				status: 'pending',
				planEndDate: today,
				tags: [{ id: 't1', name: 'urgent', color: '#ff0000' }],
				subTasks: [],
				sortOrder: 1
			} as TaskWithSubTasks,
			{
				id: 'task-3',
				title: 'Tomorrow Task',
				description: '',
				status: 'pending',
				planEndDate: tomorrow,
				tags: [],
				subTasks: [],
				sortOrder: 2
			} as TaskWithSubTasks,
			{
				id: 'task-4',
				title: 'Three Days Task',
				description: '',
				status: 'pending',
				planEndDate: threeDaysLater,
				tags: [{ id: 't2', name: 'work', color: '#0000ff' }],
				subTasks: [],
				sortOrder: 3
			} as TaskWithSubTasks,
			{
				id: 'task-5',
				title: 'Next Week Task',
				description: '',
				status: 'pending',
				planEndDate: oneWeekLater,
				tags: [],
				subTasks: [],
				sortOrder: 4
			} as TaskWithSubTasks,
			{
				id: 'task-6',
				title: 'End of Month Task',
				description: '',
				status: 'pending',
				planEndDate: endOfMonth,
				tags: [],
				subTasks: [],
				sortOrder: 5
			} as TaskWithSubTasks,
			{
				id: 'task-7',
				title: 'Completed Task',
				description: 'Already done',
				status: 'completed',
				planEndDate: yesterday,
				tags: [],
				subTasks: [],
				sortOrder: 6
			} as TaskWithSubTasks,
			{
				id: 'task-8',
				title: 'No Due Date',
				description: '',
				status: 'pending',
				planEndDate: undefined,
				tags: [],
				subTasks: [
					{
						id: 'sub-1',
						title: 'SubTask with keyword',
						description: 'Contains urgent info',
						status: 'pending',
						sortOrder: 0
					}
				],
				sortOrder: 7
			} as TaskWithSubTasks
		];

		mockDeps = {
			taskStore: {
				allTasks: mockTasks,
				todayTasks: [mockTasks[1]],
				overdueTasks: [mockTasks[0]],
				selectedProjectId: null,
				selectedListId: null,
				projects: []
			}
		} as ViewStoreDependencies;
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	describe('getTasksForView - basic views', () => {
		it('should return all tasks for "all" view', () => {
			const result = getTasksForView('all', '', mockDeps);
			expect(result).toHaveLength(8);
		});

		it('should return today tasks', () => {
			const result = getTasksForView('today', '', mockDeps);
			expect(result).toHaveLength(1);
			expect(result[0].id).toBe('task-2');
		});

		it('should return overdue tasks', () => {
			const result = getTasksForView('overdue', '', mockDeps);
			expect(result).toHaveLength(1);
			expect(result[0].id).toBe('task-1');
		});

		it('should return completed tasks', () => {
			const result = getTasksForView('completed', '', mockDeps);
			expect(result).toHaveLength(1);
			expect(result[0].id).toBe('task-7');
			expect(result[0].status).toBe('completed');
		});
	});

	describe('getTasksForView - date range views', () => {
		it('should return tomorrow tasks', () => {
			const result = getTasksForView('tomorrow', '', mockDeps);
			expect(result).toHaveLength(1);
			expect(result[0].id).toBe('task-3');
		});

		it('should return next 3 days tasks', () => {
			const result = getTasksForView('next3days', '', mockDeps);
			expect(result.length).toBeGreaterThanOrEqual(1);
			// Should include tomorrow and three days later
			const ids = result.map((t) => t.id);
			expect(ids).toContain('task-3'); // tomorrow
		});

		it('should return next week tasks', () => {
			const result = getTasksForView('nextweek', '', mockDeps);
			// Should include tasks within a week
			expect(result.length).toBeGreaterThanOrEqual(2);
		});

		it('should return this month tasks', () => {
			const result = getTasksForView('thismonth', '', mockDeps);
			// Should include all future tasks in January
			expect(result.length).toBeGreaterThanOrEqual(4);
		});

		it('should exclude tasks scheduled for next month', () => {
			const nextMonthTask = {
				...mockTasks[0],
				id: 'task-next-month',
				title: 'Next Month Task',
				planEndDate: new Date('2024-02-02T00:00:00Z')
			} as TaskWithSubTasks;
			const depsWithFutureTask: ViewStoreDependencies = {
				taskStore: {
					...mockDeps.taskStore,
					allTasks: [...mockDeps.taskStore.allTasks, nextMonthTask]
				}
			} as ViewStoreDependencies;

			const result = getTasksForView('thismonth', '', depsWithFutureTask);

			const ids = result.map((task) => task.id);
			expect(ids).not.toContain('task-next-month');
		});

		it('should exclude completed tasks from date range views', () => {
			const tomorrowTasks = getTasksForView('tomorrow', '', mockDeps);
			const completedIds = tomorrowTasks.filter((t) => t.status === 'completed').map((t) => t.id);
			expect(completedIds).toHaveLength(0);
		});

		it('should exclude tasks without due date from date range views', () => {
			const next3DaysTasks = getTasksForView('next3days', '', mockDeps);
			const noDueDateIds = next3DaysTasks.filter((t) => !t.planEndDate).map((t) => t.id);
			expect(noDueDateIds).toHaveLength(0);
		});
	});

	describe('getTasksForView - project/tasklist views', () => {
		it('should return tasks for selected project', () => {
			const projectTasks = [mockTasks[0], mockTasks[1]];
			const depsWithProject: ViewStoreDependencies = {
				taskStore: {
					...mockDeps.taskStore,
					selectedProjectId: 'project-1',
					projects: [
						{
							id: 'project-1',
							name: 'Project 1',
							taskLists: [
								{
									id: 'list-1',
									name: 'List 1',
									tasks: projectTasks
								}
							]
						}
					]
				}
			} as ViewStoreDependencies;

			const result = getTasksForView('project', '', depsWithProject);
			expect(result).toHaveLength(2);
		});

		it('should return tasks for selected list', () => {
			const listTasks = [mockTasks[2]];
			const depsWithList: ViewStoreDependencies = {
				taskStore: {
					...mockDeps.taskStore,
					selectedListId: 'list-2',
					projects: [
						{
							id: 'project-1',
							name: 'Project 1',
							taskLists: [
								{
									id: 'list-2',
									name: 'List 2',
									tasks: listTasks
								}
							]
						}
					]
				}
			} as ViewStoreDependencies;

			const result = getTasksForView('tasklist', '', depsWithList);
			expect(result).toHaveLength(1);
			expect(result[0].id).toBe('task-3');
		});

		it('should return empty array if project not found', () => {
			const depsWithProject: ViewStoreDependencies = {
				taskStore: {
					...mockDeps.taskStore,
					selectedProjectId: 'non-existent',
					projects: []
				}
			} as ViewStoreDependencies;

			const result = getTasksForView('project', '', depsWithProject);
			expect(result).toHaveLength(0);
		});

		it('should prioritize selected list when both project and list are set', () => {
			const listTasks = [mockTasks[4]];
			const depsWithBoth: ViewStoreDependencies = {
				taskStore: {
					...mockDeps.taskStore,
					selectedProjectId: 'project-1',
					selectedListId: 'list-99',
					projects: [
						{
							id: 'project-1',
							name: 'Project 1',
							taskLists: [
								{ id: 'list-1', name: 'List 1', tasks: [mockTasks[0]] },
								{ id: 'list-99', name: 'List 99', tasks: listTasks }
							]
						}
					]
				}
			} as ViewStoreDependencies;

			const result = getTasksForView('project', '', depsWithBoth);

			expect(result).toHaveLength(1);
			expect(result[0].id).toBe('task-5');
		});
	});

	describe('getTasksForView - search', () => {
		it('should return all tasks for empty search query', () => {
			const result = getTasksForView('search', '', mockDeps);
			expect(result).toHaveLength(8);
		});

		it('should search by title', () => {
			const result = getTasksForView('search', 'overdue', mockDeps);
			expect(result).toHaveLength(1);
			expect(result[0].title).toContain('Overdue');
		});

		it('should search by description', () => {
			const result = getTasksForView('search', 'already done', mockDeps);
			expect(result).toHaveLength(1);
			expect(result[0].id).toBe('task-7');
		});

		it('should search by tag name', () => {
			const result = getTasksForView('search', 'urgent', mockDeps);
			expect(result.length).toBeGreaterThanOrEqual(1);
			const hasUrgentTag = result.some((t) => t.tags.some((tag) => tag.name === 'urgent'));
			expect(hasUrgentTag).toBe(true);
		});

		it('should search in subtasks', () => {
			const result = getTasksForView('search', 'subtask', mockDeps);
			expect(result.length).toBeGreaterThanOrEqual(1);
			expect(result[0].id).toBe('task-8');
		});

		it('should filter by tag when query starts with #', () => {
			const result = getTasksForView('search', '#urgent', mockDeps);
			expect(result.length).toBeGreaterThanOrEqual(1);
			const allHaveTag = result.every((t) => t.tags.some((tag) => tag.name.includes('urgent')));
			expect(allHaveTag).toBe(true);
		});

		it('should return tasks with any tag when query is just #', () => {
			const result = getTasksForView('search', '#', mockDeps);
			const allHaveTags = result.every((t) => t.tags.length > 0);
			expect(allHaveTags).toBe(true);
		});

		it('should be case insensitive', () => {
			const result = getTasksForView('search', 'OVERDUE', mockDeps);
			expect(result).toHaveLength(1);
			expect(result[0].title).toContain('Overdue');
		});

		it('should trim search query', () => {
			const result = getTasksForView('search', '  overdue  ', mockDeps);
			expect(result).toHaveLength(1);
		});

		it('should trim whitespace for tag queries', () => {
			const result = getTasksForView('search', '  #urgent  ', mockDeps);
			expect(result.length).toBeGreaterThanOrEqual(1);
			const allHaveTag = result.every((task) => task.tags.some((tag) => tag.name.includes('urgent')));
			expect(allHaveTag).toBe(true);
		});
	});

	describe('edge cases', () => {
		it('should handle empty task list', () => {
			const emptyDeps: ViewStoreDependencies = {
				taskStore: {
					allTasks: [],
					todayTasks: [],
					overdueTasks: [],
					selectedProjectId: null,
					selectedListId: null,
					projects: []
				}
			} as ViewStoreDependencies;

			const result = getTasksForView('all', '', emptyDeps);
			expect(result).toHaveLength(0);
		});

		it('should handle undefined dependencies', () => {
			// Should use resolveViewDependencies internally
			const result = getTasksForView('all', '');
			expect(result).toBeDefined();
			expect(Array.isArray(result)).toBe(true);
		});

		it('should resolve dependencies via resolveViewDependencies when deps omitted', () => {
			const resolverSpy = vi
				.spyOn(viewDependencies, 'resolveViewDependencies')
				.mockReturnValue({
					taskStore: {
						allTasks: [],
						todayTasks: [mockTasks[1]],
						overdueTasks: []
					}
				} as ViewStoreDependencies);

			const result = getTasksForView('today');

			expect(resolverSpy).toHaveBeenCalled();
			expect(result).toEqual([mockTasks[1]]);
			resolverSpy.mockRestore();
		});
	});
});
