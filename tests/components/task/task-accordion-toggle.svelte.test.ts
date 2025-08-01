import { describe, test, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import TaskAccordionToggle from '$lib/components/task/task-accordion-toggle.svelte';

describe('TaskAccordionToggle Component', () => {
  let onToggle: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    onToggle = vi.fn();
    vi.clearAllMocks();
  });

  test('should render toggle button when hasSubTasks is true', () => {
    render(TaskAccordionToggle, {
      hasSubTasks: true,
      isExpanded: false,
      onToggle
    });

    const toggleButton = screen.getByTitle('Toggle subtasks');
    expect(toggleButton).toBeInTheDocument();
  });

  test('should render empty div when hasSubTasks is false', () => {
    const { container } = render(TaskAccordionToggle, {
      hasSubTasks: false,
      isExpanded: false,
      onToggle
    });

    expect(screen.queryByTitle('Toggle subtasks')).not.toBeInTheDocument();

    const emptyDiv = container.querySelector('.h-8.w-8.min-h-\\[32px\\].min-w-\\[32px\\].mt-1');
    expect(emptyDiv).toBeInTheDocument();
  });

  test('should show chevron down when expanded', () => {
    render(TaskAccordionToggle, {
      hasSubTasks: true,
      isExpanded: true,
      onToggle
    });

    const chevronDown = screen.getByTitle('Toggle subtasks').querySelector('.lucide-chevron-down');
    expect(chevronDown).toBeInTheDocument();
  });

  test('should show chevron right when collapsed', () => {
    render(TaskAccordionToggle, {
      hasSubTasks: true,
      isExpanded: false,
      onToggle
    });

    const chevronRight = screen
      .getByTitle('Toggle subtasks')
      .querySelector('.lucide-chevron-right');
    expect(chevronRight).toBeInTheDocument();
  });

  test('should call onToggle when button is clicked', async () => {
    render(TaskAccordionToggle, {
      hasSubTasks: true,
      isExpanded: false,
      onToggle
    });

    const toggleButton = screen.getByTitle('Toggle subtasks');
    await fireEvent.click(toggleButton);

    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  test('should have correct button styling', () => {
    render(TaskAccordionToggle, {
      hasSubTasks: true,
      isExpanded: false,
      onToggle
    });

    const toggleButton = screen.getByTitle('Toggle subtasks');
    expect(toggleButton).toHaveClass(
      'h-8',
      'w-8',
      'min-h-[32px]',
      'min-w-[32px]',
      'text-muted-foreground',
      'hover:text-foreground',
      'mt-1'
    );
  });

  test('should have correct icon size', () => {
    render(TaskAccordionToggle, {
      hasSubTasks: true,
      isExpanded: false,
      onToggle
    });

    const icon = screen.getByTitle('Toggle subtasks').querySelector('svg');
    expect(icon).toHaveClass('h-4', 'w-4');
  });

  test('should maintain consistent layout dimensions', () => {
    const { container: containerWithSubTasks } = render(TaskAccordionToggle, {
      hasSubTasks: true,
      isExpanded: false,
      onToggle
    });

    const { container: containerWithoutSubTasks } = render(TaskAccordionToggle, {
      hasSubTasks: false,
      isExpanded: false,
      onToggle
    });

    // Both should have the same size container
    const buttonContainer = containerWithSubTasks.querySelector('.h-8.w-8');
    const emptyContainer = containerWithoutSubTasks.querySelector('.h-8.w-8');

    expect(buttonContainer).toBeInTheDocument();
    expect(emptyContainer).toBeInTheDocument();
  });
});
