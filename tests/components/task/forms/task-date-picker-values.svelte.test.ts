import { flushSync } from 'svelte';
import { describe, expect, test } from 'vitest';
import { render } from '@testing-library/svelte';
import TaskDatePicker from '$lib/components/task/forms/task-date-picker.svelte';
import type { TaskWithSubTasks } from '$lib/types/task';
import type { SubTask } from '$lib/types/sub-task';

function subtask(overrides: Partial<SubTask> = {}): SubTask {
  return {
    id: 'sub-1',
    taskId: 'task-1',
    title: 'Child',
    status: 'not_started',
    orderIndex: 0,
    completed: false,
    assignedUserIds: [],
    tags: [],
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-02T00:00:00Z'),
    ...overrides
  };
}

function task(overrides: Partial<TaskWithSubTasks> = {}): TaskWithSubTasks {
  return {
    id: 'task-1',
    projectId: 'project-1',
    listId: 'list-1',
    title: 'Parent',
    status: 'not_started',
    priority: 0,
    orderIndex: 0,
    isArchived: false,
    assignedUserIds: [],
    tagIds: [],
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-02T00:00:00Z'),
    planEndDate: new Date('2024-05-10T00:00:00Z'),
    planStartDate: new Date('2024-05-01T00:00:00Z'),
    isRangeDate: true,
    subTasks: [
      subtask({
        planEndDate: new Date('2024-05-12T00:00:00Z'),
        planStartDate: new Date('2024-05-11T00:00:00Z'),
        isRangeDate: true
      })
    ],
    tags: [],
    ...overrides
  };
}

function clickOn(element: HTMLElement) {
  const event = new MouseEvent('click', { bubbles: true, clientX: 20, clientY: 30 });
  Object.defineProperty(event, 'target', { configurable: true, value: element });
  return event;
}

describe('TaskDatePicker values', () => {
  test('opens the subtask picker from the clicked element and keeps the main picker closed', () => {
    const button = document.createElement('button');
    document.body.appendChild(button);
    const { component } = render(TaskDatePicker, { props: { task: task() } });
    expect(component.getShowDatePicker()).toBe(false);

    component.handleSubTaskDueDateClick(clickOn(button), subtask());
    flushSync();

    expect(component.getShowDatePicker()).toBe(false);
    expect(component.getDatePickerPosition()).toEqual({ x: 0, y: 0 });
    button.remove();
  });

  test('opens an undated subtask picker without using the main task dates', () => {
    const button = document.createElement('button');
    document.body.appendChild(button);
    const undated = task({
      planEndDate: undefined,
      planStartDate: undefined,
      isRangeDate: false,
      subTasks: [subtask({ id: 'sub-plain' })]
    });
    const { component } = render(TaskDatePicker, { props: { task: undated } });

    component.handleSubTaskDueDateClick(clickOn(button), subtask({ id: 'sub-plain' }));
    flushSync();

    expect(component.getShowDatePicker()).toBe(false);
    button.remove();
  });
});
