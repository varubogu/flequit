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
    render(TaskDetailTags, {
      task: mockTaskWithoutTags
    });

    expect(screen.queryByText('Tags')).not.toBeInTheDocument();
  });

  test('should apply correct styling to tags', () => {
    render(TaskDetailTags, {
      task: mockTaskWithTags
    });

    const urgentTag = screen.getByText('Urgent');
    expect(urgentTag).toHaveClass('px-3', 'py-1', 'rounded-full', 'text-sm', 'border');
    
    const urgentStyle = urgentTag.getAttribute('style') || '';
    expect(urgentStyle).toMatch(/border-color:\s*(#ff0000|rgb\(255,\s*0,\s*0\))/);
    expect(urgentStyle).toMatch(/color:\s*(#ff0000|rgb\(255,\s*0,\s*0\))/);

    const workTag = screen.getByText('Work');
    const workStyle = workTag.getAttribute('style') || '';
    expect(workStyle).toMatch(/border-color:\s*(#0000ff|rgb\(0,\s*0,\s*255\))/);
    expect(workStyle).toMatch(/color:\s*(#0000ff|rgb\(0,\s*0,\s*255\))/);

    const personalTag = screen.getByText('Personal');
    const personalStyle = personalTag.getAttribute('style') || '';
    expect(personalStyle).toMatch(/border-color:\s*(#00ff00|rgb\(0,\s*255,\s*0\))/);
    expect(personalStyle).toMatch(/color:\s*(#00ff00|rgb\(0,\s*255,\s*0\))/);
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

    // Check that style attribute contains the color
    expect(redTag.getAttribute('style')).toContain('color: red');
    expect(redTag.getAttribute('style')).toContain('border-color: red');

    expect(blueTag.getAttribute('style')).toContain('color: blue');
    expect(blueTag.getAttribute('style')).toContain('border-color: blue');
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