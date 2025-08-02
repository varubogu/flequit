import { describe, test, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import TaskDetailTags from '$lib/components/task/task-detail-tags.svelte';
import type { TaskWithSubTasks } from '$lib/types/task';

// Mock the task store
vi.mock('$lib/stores/tasks.svelte', () => ({
  taskStore: {
    addTagToTask: vi.fn(),
    removeTagFromTask: vi.fn(),
    addTagToNewTask: vi.fn(),
    removeTagFromNewTask: vi.fn()
  }
}));

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

  test('should render tags section with TagInput component', () => {
    render(TaskDetailTags, {
      task: mockTaskWithTags,
      subTask: null
    });

    expect(screen.getByText('Tags')).toBeInTheDocument();
    expect(screen.getByText('Urgent')).toBeInTheDocument();
    expect(screen.getByText('Work')).toBeInTheDocument();
    expect(screen.getByText('Personal')).toBeInTheDocument();
  });

  test('should render tags section even when no tags exist', () => {
    render(TaskDetailTags, {
      task: mockTaskWithoutTags,
      subTask: null
    });

    // The component always renders the "Tags" heading and TagInput
    expect(screen.getByText('Tags')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Add tags...')).toBeInTheDocument();
  });

  test('should render TagInput with correct props', () => {
    render(TaskDetailTags, {
      task: mockTaskWithTags,
      subTask: null
    });

    // Check that the TagInput is rendered with placeholder
    const tagInput = screen.getByPlaceholderText('Add tags...');
    expect(tagInput).toBeInTheDocument();
  });

  test('should render tags with correct styling in TagInput', () => {
    render(TaskDetailTags, {
      task: mockTaskWithTags,
      subTask: null
    });

    // Check that tags are displayed within TagInput component
    expect(screen.getByText('Urgent')).toBeInTheDocument();
    expect(screen.getByText('Work')).toBeInTheDocument();
    expect(screen.getByText('Personal')).toBeInTheDocument();

    // Verify tags are displayed correctly
    const urgentTag = screen.getByText('Urgent');
    expect(urgentTag).toBeInTheDocument();
  });

  test('should handle new task mode correctly', () => {
    render(TaskDetailTags, {
      task: mockTaskWithTags,
      subTask: null,
      isNewTaskMode: true
    });

    expect(screen.getByText('Tags')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Add tags...')).toBeInTheDocument();
  });

  test('should render with single tag', () => {
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
      task: taskWithSingleTag,
      subTask: null
    });

    expect(screen.getByText('Tags')).toBeInTheDocument();
    expect(screen.getByText('Single Tag')).toBeInTheDocument();
  });
});
