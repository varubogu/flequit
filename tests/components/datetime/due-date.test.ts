import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render } from '@testing-library/svelte';
import DueDate from '$lib/components/datetime/date-inputs/due-date.svelte';
import type { TaskBase } from '$lib/types/task';

const createTask = (overrides: Partial<TaskBase> = {}): TaskBase => ({
  status: 'not_started',
  planEndDate: undefined,
  ...overrides
});

describe('DueDate', () => {
  let handleDueDateClick: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    handleDueDateClick = vi.fn();
    vi.clearAllMocks();
  });

  it('renders formatted date when planEndDate provided', () => {
    const task = createTask({ planEndDate: new Date('2024-01-15T00:00:00Z') });
    const { getByRole } = render(DueDate, { task, handleDueDateClick });
    const button = getByRole('button');
    expect(button.textContent).not.toEqual('');
  });

  it('renders add_date text when no planEndDate', () => {
    const task = createTask();
    const { getByRole, getByText } = render(DueDate, { task, handleDueDateClick });
    const button = getByRole('button');
    expect(getByText('+ add_date')).toBeInTheDocument();
    expect(button.className).toContain('text-muted-foreground');
  });

  it('invokes handleDueDateClick when button clicked', async () => {
    const task = createTask({ planEndDate: new Date('2024-01-15T00:00:00Z') });
    const { getByRole } = render(DueDate, { task, handleDueDateClick });
    await fireEvent.click(getByRole('button'));
    expect(handleDueDateClick).toHaveBeenCalled();
  });

  it('applies overdue styling for past dates', () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const task = createTask({ planEndDate: yesterday });
    const { getByRole } = render(DueDate, { task, handleDueDateClick });
    expect(getByRole('button').className).toContain('text-red');
  });
});
