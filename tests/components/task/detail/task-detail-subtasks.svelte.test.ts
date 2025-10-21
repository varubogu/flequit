import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render } from '@testing-library/svelte';
import TaskDetailSubTasks from '$lib/components/task/detail/task-detail-subtasks.svelte';
import type { TaskWithSubTasks } from '$lib/types/task';

const buildTask = (): TaskWithSubTasks => ({
	id: 'task-1',
	title: 'Test Task',
	description: '',
	status: 'not_started',
	priority: 1,
	createdAt: new Date('2024-01-01T00:00:00Z'),
	updatedAt: new Date('2024-01-01T00:00:00Z'),
	listId: 'list-1',
	orderIndex: 0,
	planStartDate: undefined,
	planEndDate: undefined,
	isRangeDate: false,
	tags: [],
	isArchived: false,
	projectId: 'project-1',
	assignedUserIds: [],
	tagIds: [],
	subTasks: [
		{
			id: 'subtask-1',
			title: 'SubTask 1',
			status: 'not_started',
			taskId: 'task-1',
			orderIndex: 0,
			completed: false,
			assignedUserIds: [],
			createdAt: new Date('2024-01-01T00:00:00Z'),
			updatedAt: new Date('2024-01-01T00:00:00Z'),
			planStartDate: undefined,
			planEndDate: new Date('2024-01-15T00:00:00Z'),
			isRangeDate: false,
			tags: []
		},
		{
			id: 'subtask-2',
			title: 'SubTask 2',
			status: 'completed',
			taskId: 'task-1',
			orderIndex: 1,
			completed: true,
			assignedUserIds: [],
			createdAt: new Date('2024-01-01T00:00:00Z'),
			updatedAt: new Date('2024-01-01T00:00:00Z'),
			planStartDate: undefined,
			planEndDate: undefined,
			isRangeDate: false,
			tags: []
		}
	]
});

const renderComponent = (props?: Partial<Parameters<typeof TaskDetailSubTasks>[0]>) => {
	const defaultProps = {
		task: buildTask(),
		selectedSubTaskId: null,
		onSubTaskClick: vi.fn(),
		onSubTaskToggle: vi.fn(),
		onAddSubTask: vi.fn(),
		showSubTaskAddForm: false,
		onSubTaskAdded: vi.fn(),
		onSubTaskAddCancel: vi.fn()
	};
	const merged = { ...defaultProps, ...(props ?? {}) };
	return {
		...merged,
		result: render(TaskDetailSubTasks, merged)
	};
};

describe('TaskDetailSubTasks', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('renders header and subtasks', () => {
		const { result } = renderComponent();
		expect(result.getByText('sub_tasks')).toBeInTheDocument();
		expect(result.getByText('SubTask 1')).toBeInTheDocument();
		expect(result.getByText('SubTask 2')).toBeInTheDocument();
	});

	it('shows add button when handler provided', async () => {
		const onAddSubTask = vi.fn();
		const { result } = renderComponent({ onAddSubTask });
		const addButton = result.getByTestId('add-subtask');
		await fireEvent.click(addButton);
		expect(onAddSubTask).toHaveBeenCalled();
	});

	it('marks selected subtask', () => {
		const { result } = renderComponent({ selectedSubTaskId: 'subtask-1' });
		const selected = result.getByText('SubTask 1').closest('button');
		expect(selected).toHaveClass('bg-primary/10');
	});

	it('invokes onSubTaskClick when subtask clicked', async () => {
		const onSubTaskClick = vi.fn();
		const { result } = renderComponent({ onSubTaskClick });
		await fireEvent.click(result.getByText('SubTask 1'));
		expect(onSubTaskClick).toHaveBeenCalledWith('subtask-1');
	});

	it('invokes onSubTaskToggle without triggering click handler', async () => {
		const onSubTaskToggle = vi.fn();
		const onSubTaskClick = vi.fn();
		const { result } = renderComponent({ onSubTaskToggle, onSubTaskClick });
		const toggleButtons = result.getAllByLabelText('toggle_subtask_completion');
		await fireEvent.click(toggleButtons[0]);
		expect(onSubTaskToggle).toHaveBeenCalledWith('subtask-1');
		expect(onSubTaskClick).not.toHaveBeenCalled();
	});

	it('shows completion visuals for completed subtasks', () => {
		const { result } = renderComponent();
		const toggles = result.getAllByLabelText('toggle_subtask_completion');
		expect(toggles[1]).toHaveTextContent('✅');
		expect(result.getByText('SubTask 2')).toHaveClass('line-through');
	});

	it('renders due date indicator when planEndDate exists', () => {
		const { result } = renderComponent();
		const dueDateButton = result
			.getAllByRole('button')
			.find((btn) => btn !== null && btn.textContent && btn.textContent.includes('/'));
		expect(dueDateButton).toBeDefined();
	});

	it('renders add form when requested', () => {
		const { result } = renderComponent({ showSubTaskAddForm: true });
		expect(result.getByPlaceholderText('sub_task_title')).toBeInTheDocument();
	});

	it('submits new subtask via form', async () => {
		const onSubTaskAdded = vi.fn();
		const { result } = renderComponent({ showSubTaskAddForm: true, onSubTaskAdded });
		const input = result.getByPlaceholderText('sub_task_title');
		const saveButton = result.getAllByTitle('add_subtask')[1];
		await fireEvent.input(input, { target: { value: 'New Subtask' } });
		await fireEvent.click(saveButton);
		expect(onSubTaskAdded).toHaveBeenCalledWith('New Subtask');
	});

	it('renders zero state when no subtasks present', () => {
		const taskWithoutSubtasks = { ...buildTask(), subTasks: [] };
		const { result } = renderComponent({ task: taskWithoutSubtasks });
		expect(result.getByText('0 subtasks')).toBeInTheDocument();
	});
});
