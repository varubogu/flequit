import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render } from '@testing-library/svelte';
import TaskStatusSelector from '$lib/components/task/forms/task-status-selector.svelte';
import type { TaskWithSubTasks } from '$lib/types/task';

const makeTask = (): TaskWithSubTasks => ({
  id: 'task-1',
  projectId: 'project-1',
  listId: 'list-1',
  title: 'Test Task',
  description: 'Sample',
  status: 'in_progress',
  priority: 1,
  assignedUserIds: [],
  tagIds: [],
  orderIndex: 0,
  planStartDate: undefined,
  planEndDate: undefined,
  isRangeDate: false,
  isArchived: false,
  createdAt: new Date('2024-01-01T00:00:00Z'),
  updatedAt: new Date('2024-01-01T00:00:00Z'),
  subTasks: [],
  tags: []
});

describe('TaskStatusSelector', () => {
  let onStatusChange: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    onStatusChange = vi.fn();
    vi.clearAllMocks();
  });

  it('renders status select with current value', () => {
    const { getByLabelText } = render(TaskStatusSelector, {
      currentItem: makeTask(),
      onStatusChange
    });
    const select = getByLabelText('status');
    expect(select).toHaveValue('in_progress');
  });

  it('includes translation-backed options', () => {
    const { getByRole } = render(TaskStatusSelector, {
      currentItem: makeTask(),
      onStatusChange
    });
    const options = Array.from(getByRole('combobox').querySelectorAll('option')).map(
      (option) => option.textContent
    );
    expect(options).toEqual(['not_started', 'in_progress', 'waiting', 'completed', 'cancelled']);
  });

  it('emits onStatusChange when selection changes', async () => {
    const { getByLabelText } = render(TaskStatusSelector, {
      currentItem: makeTask(),
      onStatusChange
    });
    const select = getByLabelText('status');
    await fireEvent.change(select, { target: { value: 'completed' } });
    expect(onStatusChange).toHaveBeenCalled();
  });
});
