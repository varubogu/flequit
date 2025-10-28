import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/svelte';
import TaskDescriptionEditor from '$lib/components/task/editors/task-description-editor.svelte';
import type { TaskWithSubTasks } from '$lib/types/task';

const makeTask = (): TaskWithSubTasks => ({
	id: 'task-1',
	projectId: 'project-1',
	listId: 'list-1',
	title: 'Test Task',
	description: 'Test description',
	status: 'in_progress',
	priority: 2,
	assignedUserIds: [],
	tagIds: [],
	orderIndex: 0,
	planStartDate: undefined,
	planEndDate: new Date('2024-01-15'),
	isRangeDate: false,
	createdAt: new Date('2024-01-01T00:00:00Z'),
	updatedAt: new Date('2024-01-01T00:00:00Z'),
	isArchived: false,
	subTasks: [],
	tags: []
});

const renderComponent = (
	overrideProps: Partial<{
		isSubTask: boolean;
		description?: string;
		isNewTaskMode?: boolean;
		customProps?: Record<string, unknown>;
	}> = {}
) => {
	const onDescriptionChange = vi.fn();
	const task = makeTask();
	const formData = {
		title: task.title,
		description: overrideProps.description ?? task.description ?? '',
		plan_start_date: task.planStartDate,
		plan_end_date: task.planEndDate,
		is_range_date: task.isRangeDate ?? false,
		priority: task.priority
	};

	const result = render(TaskDescriptionEditor, {
		currentItem: task,
		isSubTask: overrideProps.isSubTask ?? false,
		isNewTaskMode: overrideProps.isNewTaskMode ?? false,
		formData,
		onDescriptionChange,
		...(overrideProps.customProps ?? {})
	});

	return { result, onDescriptionChange };
};

describe('TaskDescriptionEditor', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('renders current description', () => {
		const { result } = renderComponent();
	const textarea = result.getByRole('textbox') as HTMLTextAreaElement;
		expect(textarea).toHaveValue('Test description');
	});

	it('adds optional badge for subtasks', () => {
		const { result } = renderComponent({ isSubTask: true });
		const label = result.getByText(/description/i);
		expect(label).toHaveTextContent('optional');
	});

	it('omits optional badge for main tasks', () => {
		const { result } = renderComponent({ isSubTask: false });
		expect(result.queryByText(/optional/i)).toBeNull();
	});

	it('emits change event when user types', async () => {
		const { result, onDescriptionChange } = renderComponent();
		const textarea = result.getByRole('textbox') as HTMLTextAreaElement;
		await fireEvent.input(textarea, { target: { value: 'Updated text' } });
		expect(onDescriptionChange).toHaveBeenCalledWith('Updated text');
	});

	it('uses task placeholder when description empty for main task', () => {
		const { result } = renderComponent({ description: '', isSubTask: false });
		const textarea = result.getByRole('textbox') as HTMLTextAreaElement;
		expect(textarea.placeholder).toBe('task_description');
	});

	it('uses subtask placeholder when description empty for subtask', () => {
		const { result } = renderComponent({ description: '', isSubTask: true });
		const textarea = result.getByRole('textbox') as HTMLTextAreaElement;
		expect(textarea.placeholder).toBe('sub_task_description_optional');
	});
});
