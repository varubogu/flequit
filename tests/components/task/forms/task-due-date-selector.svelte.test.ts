import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render } from '@testing-library/svelte';
import TaskDueDateSelector from '$lib/components/task/forms/task-due-date-selector.svelte';
import type { TaskWithSubTasks } from '$lib/types/task';

describe('TaskDueDateSelector Component', () => {
  const mockTask: TaskWithSubTasks = {
    id: 'task-1',
    projectId: 'project-1',
    title: 'Test Task',
    description: 'Test description',
    status: 'in_progress',
    priority: 2,
    assignedUserIds: [],
    tagIds: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    listId: 'list-1',
    orderIndex: 0,
    planStartDate: undefined,
    planEndDate: new Date('2024-01-15'),
    isRangeDate: false,
    subTasks: [],
    tags: [],
    isArchived: false
  };

  const mockFormData = {
    title: 'Test Task',
    description: 'Test description',
    plan_start_date: undefined,
    plan_end_date: new Date('2024-01-15'),
    is_range_date: false,
    priority: 2
  };

  let onDueDateClick: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    onDueDateClick = vi.fn();
    vi.clearAllMocks();
  });

  const renderComponent = (isSubTask: boolean) =>
    render(TaskDueDateSelector, {
      currentItem: mockTask,
      isSubTask,
      formData: mockFormData,
      onDueDateClick
    });

  it('renders due date label', () => {
    const { getByText } = renderComponent(false);
    expect(getByText('due_date')).toBeInTheDocument();
  });

  it('shows optional badge for subtasks', () => {
    const { getByText } = renderComponent(true);
    expect(getByText('optional')).toBeInTheDocument();
  });

  it('omits optional badge for main tasks', () => {
    const { queryByText } = renderComponent(false);
    expect(queryByText('optional')).toBeNull();
  });

  it('emits click event via handleDueDateClick', async () => {
    const { getByRole } = renderComponent(false);
    await fireEvent.click(getByRole('button'));
    expect(onDueDateClick).toHaveBeenCalled();
  });
});
