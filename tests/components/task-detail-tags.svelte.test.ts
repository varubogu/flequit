import { describe, test, expect } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import TaskDetailTags from '../../src/lib/components/task-detail-tags.svelte';
import type { TaskWithSubTasks } from '../../src/lib/types/task';

describe('TaskDetailTags Component', () => {
  const mockTaskWithTags: TaskWithSubTasks = {
    id: 'task-1',
    title: 'Test Task',
    description: '',
    status: 'not_started',
    priority: 2,
    created_at: new Date(),
    updated_at: new Date(),
    list_id: 'list-1',
    order_index: 0,
    end_date: undefined,
    start_date: undefined,
    is_range_date: false,
    sub_tasks: [],
    is_archived: false,
    tags: [
      {
        id: 'tag-1',
        name: 'Urgent',
        color: '#ff0000',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: 'tag-2',
        name: 'Work',
        color: '#0000ff',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: 'tag-3',
        name: 'Personal',
        color: '#00ff00',
        created_at: new Date(),
        updated_at: new Date()
      }
    ]
  };

  const mockTaskWithoutTags: TaskWithSubTasks = {
    ...mockTaskWithTags,
    tags: []
  };

  test('should render tags when they exist', () => {
    render(TaskDetailTags, {
      task: mockTaskWithTags
    });

    expect(screen.getByText('Tags')).toBeInTheDocument();
    expect(screen.getByText('Urgent')).toBeInTheDocument();
    expect(screen.getByText('Work')).toBeInTheDocument();
    expect(screen.getByText('Personal')).toBeInTheDocument();
  });

  test('should not render when no tags exist', () => {
    const { container } = render(TaskDetailTags, {
      task: mockTaskWithoutTags
    });

    expect(container.firstChild).toBeNull();
  });

  test('should apply correct styling to tags', () => {
    render(TaskDetailTags, {
      task: mockTaskWithTags
    });

    const urgentTag = screen.getByText('Urgent');
    expect(urgentTag).toHaveClass('px-3', 'py-1', 'rounded-full', 'text-sm', 'border');
    expect(urgentTag).toHaveStyle({
      'border-color': '#ff0000',
      'color': '#ff0000'
    });

    const workTag = screen.getByText('Work');
    expect(workTag).toHaveStyle({
      'border-color': '#0000ff',
      'color': '#0000ff'
    });

    const personalTag = screen.getByText('Personal');
    expect(personalTag).toHaveStyle({
      'border-color': '#00ff00',
      'color': '#00ff00'
    });
  });

  test('should render tags in flex wrap layout', () => {
    const { container } = render(TaskDetailTags, {
      task: mockTaskWithTags
    });

    const tagsContainer = container.querySelector('.flex.flex-wrap.gap-2');
    expect(tagsContainer).toBeInTheDocument();
  });

  test('should handle tags with different colors correctly', () => {
    const taskWithDifferentColors: TaskWithSubTasks = {
      ...mockTaskWithTags,
      tags: [
        {
          id: 'tag-1',
          name: 'Red Tag',
          color: 'red',
          created_at: new Date(),
          updated_at: new Date()
        },
        {
          id: 'tag-2',
          name: 'Blue Tag',
          color: 'blue',
          created_at: new Date(),
          updated_at: new Date()
        }
      ]
    };

    render(TaskDetailTags, {
      task: taskWithDifferentColors
    });

    const redTag = screen.getByText('Red Tag');
    const blueTag = screen.getByText('Blue Tag');

    expect(redTag).toHaveStyle({
      'border-color': 'red',
      'color': 'red'
    });

    expect(blueTag).toHaveStyle({
      'border-color': 'blue',
      'color': 'blue'
    });
  });

  test('should handle single tag', () => {
    const taskWithSingleTag: TaskWithSubTasks = {
      ...mockTaskWithTags,
      tags: [
        {
          id: 'tag-1',
          name: 'Single Tag',
          color: '#purple',
          created_at: new Date(),
          updated_at: new Date()
        }
      ]
    };

    render(TaskDetailTags, {
      task: taskWithSingleTag
    });

    expect(screen.getByText('Tags')).toBeInTheDocument();
    expect(screen.getByText('Single Tag')).toBeInTheDocument();
  });
});