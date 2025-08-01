import { test, expect, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/svelte';
import DueDate from '$lib/components/datetime/due-date.svelte';
import type { TaskBase } from '$lib/types/task';

const createMockTask = (overrides: Partial<TaskBase> = {}): TaskBase => ({
  status: 'not_started',
  ...overrides
});

test('DueDate: renders formatted date when task has end_date', async () => {
  const mockClick = vi.fn();
  const testDate = new Date('2024-01-15');

  const task = createMockTask({
    end_date: testDate,
    status: 'not_started'
  });

  const { getByRole } = render(DueDate, {
    props: {
      task,
      handleDueDateClick: mockClick
    }
  });

  const button = getByRole('button');
  expect(button).toBeTruthy();
  // The exact text depends on formatDate implementation, but should contain date info
  expect(button.textContent).toBeTruthy();
  expect(button.title).toBe('Click to change due date');
});

test("DueDate: renders 'Add date' when task has no end_date", async () => {
  const mockClick = vi.fn();

  const task = createMockTask({
    end_date: undefined
  });

  const { getByText, getByRole } = render(DueDate, {
    props: {
      task,
      handleDueDateClick: mockClick
    }
  });

  const button = getByRole('button');
  expect(getByText('+ Add date')).toBeTruthy();
  expect(button.title).toBe('Click to set due date');
});

test('DueDate: calls handleDueDateClick when clicked', async () => {
  const mockClick = vi.fn();
  const testDate = new Date('2024-01-15');

  const task = createMockTask({
    end_date: testDate
  });

  const { getByRole } = render(DueDate, {
    props: {
      task,
      handleDueDateClick: mockClick
    }
  });

  const button = getByRole('button');
  await fireEvent.click(button);

  expect(mockClick).toHaveBeenCalledTimes(1);
  expect(mockClick).toHaveBeenCalledWith(expect.any(MouseEvent));
});

test("DueDate: calls handleDueDateClick when 'Add date' button is clicked", async () => {
  const mockClick = vi.fn();

  const task = createMockTask({
    end_date: undefined
  });

  const { getByRole } = render(DueDate, {
    props: {
      task,
      handleDueDateClick: mockClick
    }
  });

  const button = getByRole('button');
  await fireEvent.click(button);

  expect(mockClick).toHaveBeenCalledTimes(1);
  expect(mockClick).toHaveBeenCalledWith(expect.any(MouseEvent));
});

test('DueDate: applies correct CSS classes for overdue tasks', async () => {
  const mockClick = vi.fn();
  const pastDate = new Date();
  pastDate.setDate(pastDate.getDate() - 1); // Yesterday

  const task = createMockTask({
    end_date: pastDate,
    status: 'not_started'
  });

  const { getByRole } = render(DueDate, {
    props: {
      task,
      handleDueDateClick: mockClick
    }
  });

  const button = getByRole('button');
  // getDueDateClass should return overdue styling for past dates
  expect(button.className).toContain('text-red-600');
});

test("DueDate: applies correct CSS classes for today's tasks", async () => {
  const mockClick = vi.fn();
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const task = createMockTask({
    end_date: today,
    status: 'not_started'
  });

  const { getByRole } = render(DueDate, {
    props: {
      task,
      handleDueDateClick: mockClick
    }
  });

  const button = getByRole('button');
  // getDueDateClass should return today styling
  expect(button.className).toContain('text-orange-300');
});

test("DueDate: applies muted styling for 'Add date' button", async () => {
  const mockClick = vi.fn();

  const task = createMockTask({
    end_date: undefined
  });

  const { getByRole } = render(DueDate, {
    props: {
      task,
      handleDueDateClick: mockClick
    }
  });

  const button = getByRole('button');
  expect(button.className).toContain('text-muted-foreground');
});
