import { describe, test, expect } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import TaskDetailEmptyState from '$lib/components/task/task-detail-empty-state.svelte';

describe('TaskDetailEmptyState Component', () => {
  test('should render empty state message', () => {
    render(TaskDetailEmptyState);

    expect(screen.getByText('No task selected')).toBeInTheDocument();
    expect(screen.getByText('Select a task or sub-task from the list to view its details')).toBeInTheDocument();
  });

  test('should render emoji icon', () => {
    render(TaskDetailEmptyState);

    expect(screen.getByText('📝')).toBeInTheDocument();
  });

  test('should have correct styling classes', () => {
    const { container } = render(TaskDetailEmptyState);

    expect(container.querySelector('.flex-1.flex.items-center.justify-center')).toBeInTheDocument();
    expect(container.querySelector('.text-center.text-muted-foreground')).toBeInTheDocument();
    expect(container.querySelector('.text-6xl.mb-4')).toBeInTheDocument();
    expect(container.querySelector('.text-xl.font-semibold.mb-2')).toBeInTheDocument();
  });

  test('should be accessible', () => {
    render(TaskDetailEmptyState);

    // Check that the heading is properly marked up
    const heading = screen.getByRole('heading', { level: 2 });
    expect(heading).toHaveTextContent('No task selected');
  });

  test('should have consistent layout structure', () => {
    const { container } = render(TaskDetailEmptyState);

    const mainContainer = container.firstChild;
    expect(mainContainer).toHaveClass('flex-1', 'flex', 'items-center', 'justify-center');

    const contentContainer = container.querySelector('.text-center.text-muted-foreground');
    expect(contentContainer).toBeInTheDocument();
  });
});