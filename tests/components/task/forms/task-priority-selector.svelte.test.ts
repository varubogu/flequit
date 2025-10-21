import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render } from '@testing-library/svelte';
import TaskPrioritySelector from '$lib/components/task/forms/task-priority-selector.svelte';

describe('TaskPrioritySelector Component', () => {
  const mockFormData = {
    title: 'Test Task',
    description: 'Test description',
    plan_start_date: undefined,
    plan_end_date: new Date('2024-01-15'),
    is_range_date: false,
    priority: 2
  };

  let onPriorityChange: ReturnType<typeof vi.fn>;
  let onFormChange: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    onPriorityChange = vi.fn();
    onFormChange = vi.fn();
    vi.clearAllMocks();
  });

  const renderComponent = (isSubTask: boolean) =>
    render(TaskPrioritySelector, {
      isSubTask,
      formData: mockFormData,
      onPriorityChange,
      onFormChange
    });

  it('renders selector with current value', () => {
    const { getByLabelText } = renderComponent(false);
    const select = getByLabelText('priority');
    expect(select).toHaveValue('2');
  });

  it('shows optional badge for subtasks', () => {
    const { getByText } = renderComponent(true);
    expect(getByText('optional')).toBeInTheDocument();
  });

	it('shows not_set option for subtasks only', () => {
		const { getByText, unmount } = renderComponent(true);
		expect(getByText('not_set')).toBeInTheDocument();
		unmount();

		const { queryByText } = renderComponent(false);
		expect(queryByText('not_set')).toBeNull();
	});

  it('renders priority options', () => {
    const { getByText } = renderComponent(false);
    expect(getByText('high_priority')).toBeInTheDocument();
    expect(getByText('medium_priority')).toBeInTheDocument();
    expect(getByText('low_priority')).toBeInTheDocument();
    expect(getByText('lowest_priority')).toBeInTheDocument();
  });

  it('emits onPriorityChange and onFormChange when selection changes', async () => {
    const { getByLabelText } = renderComponent(false);
    const select = getByLabelText('priority');
    await fireEvent.change(select, { target: { value: '1' } });
    expect(onPriorityChange).toHaveBeenCalledWith(1);
    expect(onFormChange).toHaveBeenCalled();
  });
});
