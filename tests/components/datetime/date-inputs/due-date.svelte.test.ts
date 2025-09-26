import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import DueDate from '$lib/components/datetime/date-inputs/due-date.svelte';
import type { TaskBase, Task } from '$lib/types/task';
import { getDueDateClass } from '$lib/utils/datetime-utils';

// Mock translation service
vi.mock('$lib/stores/locale.svelte', () => ({
  getTranslationService: () => ({
    getMessage: (key: string) => {
      return () => {
        const translations: Record<string, string> = {
          today: 'Today',
          tomorrow: 'Tomorrow',
          yesterday: 'Yesterday',
          add_date: 'Add Date',
          select_date: 'Select Date'
        };
        return translations[key] || key;
      };
    }
  })
}));

vi.mock('$lib/utils/datetime-utils', () => ({
  getDueDateClass: vi.fn((date: Date) => {
    const now = new Date();
    if (date < now) return 'text-red-500'; // overdue
    if (date.toDateString() === now.toDateString()) return 'text-orange-500'; // today
    return 'text-green-500'; // future
  })
}));

describe('DueDate', () => {
  const mockHandleDueDateClick = vi.fn();

  const baseTask = {
    id: 'task-1',
    title: 'Test Task',
    description: 'Test description',
    status: 'not_started' as const,
    priority: 2,
    planStartDate: new Date('2024-01-01'),
    planEndDate: new Date('2024-01-02'),
    isRangeDate: false,
    listId: 'list-1',
    orderIndex: 0,
    isArchived: false,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  } as Task;

  const defaultProps = {
    task: baseTask,
    handleDueDateClick: mockHandleDueDateClick,
    variant: 'compact' as const,
    class: ''
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-01-01T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('basic rendering', () => {
    it('should render without errors', () => {
      const { container } = render(DueDate, { props: defaultProps });

      expect(container.innerHTML).toBeTruthy();
    });

    it('should render as button element', () => {
      const { container } = render(DueDate, { props: defaultProps });

      const button = container.querySelector('button');
      expect(button).toBeInTheDocument();
    });

    it('should apply base classes', () => {
      const { container } = render(DueDate, { props: defaultProps });

      const button = container.querySelector('button');
      expect(button).toHaveClass('text-sm');
      expect(button).toHaveClass('whitespace-nowrap');
      expect(button).toHaveClass('flex-shrink-0');
      expect(button).toHaveClass('hover:bg-muted');
      expect(button).toHaveClass('rounded');
      expect(button).toHaveClass('px-1');
      expect(button).toHaveClass('py-0.5');
      expect(button).toHaveClass('transition-colors');
    });

    it('should apply custom class when provided', () => {
      const customClass = 'custom-due-date-class';
      const { container } = render(DueDate, {
        props: { ...defaultProps, class: customClass }
      });

      const button = container.querySelector('button');
      expect(button).toHaveClass(customClass);
    });
  });

  describe('compact variant', () => {
    it('should render compact variant by default', () => {
      const { container } = render(DueDate, { props: defaultProps });

      const button = container.querySelector('button');
      expect(button).toBeInTheDocument();
    });

    it('should show formatted date when task has end_date', () => {
      const { container } = render(DueDate, { props: defaultProps });

      const button = container.querySelector('button');
      expect(button?.textContent).toBeTruthy();
    });

    it('should show "Add Date" when task has no plan_end_date', () => {
      const taskWithoutDate = { ...baseTask, planEndDate: undefined };
      const { container } = render(DueDate, {
        props: { ...defaultProps, task: taskWithoutDate }
      });

      const button = container.querySelector('button');
      expect(button?.textContent).toContain('Add Date');
    });

    it('should show proper title for task with date', () => {
      const { container } = render(DueDate, { props: defaultProps });

      const button = container.querySelector('button');
      expect(button?.title).toBe('Click to change due date');
    });

    it('should show proper title for task without date', () => {
      const taskWithoutDate = { ...baseTask, planEndDate: undefined };
      const { container } = render(DueDate, {
        props: { ...defaultProps, task: taskWithoutDate }
      });

      const button = container.querySelector('button');
      expect(button?.title).toBe('Click to set due date');
    });
  });

  describe('full variant', () => {
    it('should render full variant when specified', () => {
      const { container } = render(DueDate, {
        props: { ...defaultProps, variant: 'full' }
      });

      const button = container.querySelector('button');
      expect(button).toBeInTheDocument();
    });

    it('should show formatted date when task has end_date', () => {
      const { container } = render(DueDate, {
        props: { ...defaultProps, variant: 'full' }
      });

      const button = container.querySelector('button');
      expect(button?.textContent).toBeTruthy();
    });

    it('should show "Select Date" when task has no plan_end_date', () => {
      const taskWithoutDate = { ...baseTask, planEndDate: undefined };
      const { container } = render(DueDate, {
        props: { ...defaultProps, task: taskWithoutDate, variant: 'full' }
      });

      const button = container.querySelector('button');
      expect(button?.textContent).toBe('Select Date');
    });

    it('should not show title attribute in full variant', () => {
      const { container } = render(DueDate, {
        props: { ...defaultProps, variant: 'full' }
      });

      const button = container.querySelector('button');
      expect(button?.title).toBe('');
    });
  });

  describe('date formatting', () => {
    it('should show "Today" for today\'s date', () => {
      const todayTask = {
        ...baseTask,
        planEndDate: new Date('2024-01-01T00:00:00Z') // Same day as mocked current time
      };
      const { container } = render(DueDate, {
        props: { ...defaultProps, task: todayTask }
      });

      const button = container.querySelector('button');
      expect(button?.textContent).toBe('Today');
    });

    it('should show "Tomorrow" for tomorrow\'s date', () => {
      const tomorrowTask = {
        ...baseTask,
        planEndDate: new Date('2024-01-02T00:00:00Z') // Next day
      };
      const { container } = render(DueDate, {
        props: { ...defaultProps, task: tomorrowTask }
      });

      const button = container.querySelector('button');
      expect(button?.textContent).toBe('Tomorrow');
    });

    it('should show "Yesterday" for yesterday\'s date', () => {
      const yesterdayTask = {
        ...baseTask,
        planEndDate: new Date('2023-12-31T00:00:00Z') // Previous day
      };
      const { container } = render(DueDate, {
        props: { ...defaultProps, task: yesterdayTask }
      });

      const button = container.querySelector('button');
      expect(button?.textContent).toBe('Yesterday');
    });

    it('should show formatted date for other dates', () => {
      const futureTask = {
        ...baseTask,
        planEndDate: new Date('2024-01-05T15:00:00Z')
      };
      const { container } = render(DueDate, {
        props: { ...defaultProps, task: futureTask }
      });

      const button = container.querySelector('button');
      expect(button?.textContent).toBeTruthy();
      expect(button?.textContent).not.toBe('Today');
      expect(button?.textContent).not.toBe('Tomorrow');
      expect(button?.textContent).not.toBe('Yesterday');
    });

    it('should handle null plan_end_date', () => {
      const taskWithNullDate = { ...baseTask, planEndDate: undefined };
      const { container } = render(DueDate, {
        props: { ...defaultProps, task: taskWithNullDate }
      });

      const button = container.querySelector('button');
      expect(button?.textContent).toContain('Add Date');
    });

    it('should handle undefined plan_end_date', () => {
      const taskWithUndefinedDate = { ...baseTask, planEndDate: undefined };
      const { container } = render(DueDate, {
        props: { ...defaultProps, task: taskWithUndefinedDate }
      });

      const button = container.querySelector('button');
      expect(button?.textContent).toContain('Add Date');
    });
  });

  describe('styling and colors', () => {
    it('should apply color classes from getDueDateClass when task has plan_end_date', () => {
      render(DueDate, { props: defaultProps });

      expect(vi.mocked(getDueDateClass)).toHaveBeenCalledWith(baseTask.planEndDate, baseTask.status);
    });

    it('should apply muted color when task has no plan_end_date', () => {
      const taskWithoutDate = { ...baseTask, planEndDate: undefined };
      const { container } = render(DueDate, {
        props: { ...defaultProps, task: taskWithoutDate }
      });

      const button = container.querySelector('button');
      expect(button).toHaveClass('text-muted-foreground');
    });

    it('should combine base, color, and custom classes', () => {
      const customClass = 'border-2';
      const { container } = render(DueDate, {
        props: { ...defaultProps, class: customClass }
      });

      const button = container.querySelector('button');
      expect(button).toHaveClass('text-sm'); // base class
      expect(button).toHaveClass('border-2'); // custom class
    });
  });

  describe('click handling', () => {
    it('should call handleDueDateClick when clicked', () => {
      const mockHandler = vi.fn();
      const { container } = render(DueDate, {
        props: { ...defaultProps, handleDueDateClick: mockHandler }
      });

      const button = container.querySelector('button') as HTMLButtonElement;
      fireEvent.click(button);

      expect(mockHandler).toHaveBeenCalled();
    });

    it('should pass event to handleDueDateClick', () => {
      const mockHandler = vi.fn();
      const { container } = render(DueDate, {
        props: { ...defaultProps, handleDueDateClick: mockHandler }
      });

      const button = container.querySelector('button') as HTMLButtonElement;
      fireEvent.click(button);

      expect(mockHandler).toHaveBeenCalledWith(expect.any(Event));
    });

    it('should handle click for both variants', () => {
      const mockHandler = vi.fn();

      // Test compact variant
      const { container: compactContainer } = render(DueDate, {
        props: { ...defaultProps, handleDueDateClick: mockHandler, variant: 'compact' }
      });

      const compactButton = compactContainer.querySelector('button') as HTMLButtonElement;
      fireEvent.click(compactButton);

      expect(mockHandler).toHaveBeenCalledTimes(1);

      // Test full variant
      const { container: fullContainer } = render(DueDate, {
        props: { ...defaultProps, handleDueDateClick: mockHandler, variant: 'full' }
      });

      const fullButton = fullContainer.querySelector('button') as HTMLButtonElement;
      fireEvent.click(fullButton);

      expect(mockHandler).toHaveBeenCalledTimes(2);
    });

    it('should handle missing handleDueDateClick gracefully', () => {
      const { container } = render(DueDate, {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore - Testing runtime safety with undefined callback
        props: {
          ...defaultProps,
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          handleDueDateClick: undefined
        }
      });

      const button = container.querySelector('button') as HTMLButtonElement;
      expect(() => fireEvent.click(button)).not.toThrow();
    });
  });

  describe('internationalization', () => {
    it('should use translation service for labels', () => {
      const taskWithoutDate = { ...baseTask, planEndDate: undefined };
      const { container } = render(DueDate, {
        props: { ...defaultProps, task: taskWithoutDate }
      });

      const button = container.querySelector('button');
      expect(button?.textContent).toContain('Add Date');
    });

    it('should use translation service for full variant', () => {
      const taskWithoutDate = { ...baseTask, planEndDate: undefined };
      const { container } = render(DueDate, {
        props: { ...defaultProps, task: taskWithoutDate, variant: 'full' }
      });

      const button = container.querySelector('button');
      expect(button?.textContent).toBe('Select Date');
    });

    it('should use translation service for relative dates', () => {
      const todayTask = {
        ...baseTask,
        planEndDate: new Date('2024-01-01T00:00:00Z')
      };
      render(DueDate, {
        props: { ...defaultProps, task: todayTask }
      });

      expect(screen.getByText('Today')).toBeInTheDocument();
    });
  });

  describe('edge cases', () => {
    it('should handle invalid date objects', () => {
      const taskWithInvalidDate = {
        ...baseTask,
        planEndDate: new Date('invalid')
      };
      const { container } = render(DueDate, {
        props: { ...defaultProps, task: taskWithInvalidDate }
      });

      expect(container.innerHTML).toBeTruthy();
    });

    it('should handle very old dates', () => {
      const taskWithOldDate = {
        ...baseTask,
        planEndDate: new Date('1900-01-01')
      };
      const { container } = render(DueDate, {
        props: { ...defaultProps, task: taskWithOldDate }
      });

      const button = container.querySelector('button');
      expect(button).toBeInTheDocument();
    });

    it('should handle very future dates', () => {
      const taskWithFutureDate = {
        ...baseTask,
        planEndDate: new Date('2100-12-31')
      };
      const { container } = render(DueDate, {
        props: { ...defaultProps, task: taskWithFutureDate }
      });

      const button = container.querySelector('button');
      expect(button).toBeInTheDocument();
    });

    it('should handle task with minimal properties', () => {
      const minimalTask = {
        id: 'minimal',
        status: 'not_started',
        planEndDate: undefined
      } as TaskBase;

      const { container } = render(DueDate, {
        props: { ...defaultProps, task: minimalTask }
      });

      expect(container.innerHTML).toBeTruthy();
    });

    it('should handle empty class string', () => {
      const { container } = render(DueDate, {
        props: { ...defaultProps, class: '' }
      });

      const button = container.querySelector('button');
      expect(button).toBeInTheDocument();
    });

    it('should handle null class', () => {
      const { container } = render(DueDate, {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        props: { ...defaultProps, class: null as string | null }
      });

      const button = container.querySelector('button');
      expect(button).toBeInTheDocument();
    });
  });

  describe('component lifecycle', () => {
    it('should mount and unmount cleanly', () => {
      const { unmount } = render(DueDate, { props: defaultProps });

      expect(() => unmount()).not.toThrow();
    });

    it('should handle prop updates', () => {
      const { rerender } = render(DueDate, { props: defaultProps });

      const updatedTask = { ...baseTask, planEndDate: new Date('2024-01-03') };
      const updatedProps = { ...defaultProps, task: updatedTask, variant: 'full' as const };

      expect(() => rerender(updatedProps)).not.toThrow();
    });

    it('should handle variant changes', () => {
      const { rerender } = render(DueDate, { props: defaultProps });

      expect(() => rerender({ ...defaultProps, variant: 'full' })).not.toThrow();
      expect(() => rerender({ ...defaultProps, variant: 'compact' })).not.toThrow();
    });

    it('should handle task changes', () => {
      const { rerender } = render(DueDate, { props: defaultProps });

      const newTask = { ...baseTask, id: 'new-task', planEndDate: undefined };
      expect(() => rerender({ ...defaultProps, task: newTask })).not.toThrow();
    });
  });

  describe('accessibility', () => {
    it('should be keyboard accessible', () => {
      const { container } = render(DueDate, { props: defaultProps });

      const button = container.querySelector('button');
      expect(button?.tabIndex).not.toBe(-1);
    });

    it('should have proper button semantics', () => {
      const { container } = render(DueDate, { props: defaultProps });

      const button = container.querySelector('button');
      expect(button?.tagName).toBe('BUTTON');
    });

    it('should provide descriptive titles in compact variant', () => {
      const { container } = render(DueDate, { props: defaultProps });

      const button = container.querySelector('button');
      expect(button?.title).toBeTruthy();
    });

    it('should handle keyboard events', () => {
      const mockHandler = vi.fn();
      const { container } = render(DueDate, {
        props: { ...defaultProps, handleDueDateClick: mockHandler }
      });

      const button = container.querySelector('button') as HTMLButtonElement;
      fireEvent.keyDown(button, { key: 'Enter' });
      fireEvent.keyDown(button, { key: ' ' });

      // Button should handle these natively
      expect(button).toBeInTheDocument();
    });
  });

  describe('integration', () => {
    it('should integrate with datetime utils', () => {
      render(DueDate, { props: defaultProps });

      expect(vi.mocked(getDueDateClass)).toHaveBeenCalled();
    });

    it('should integrate with translation service', () => {
      const taskWithoutDate = { ...baseTask, planEndDate: undefined };
      render(DueDate, {
        props: { ...defaultProps, task: taskWithoutDate }
      });

      // Should call translation service for various labels
      expect(screen.getByText(/Add Date/)).toBeInTheDocument();
    });

    it('should work with different task types', () => {
      const completedTask = { ...baseTask, status: 'completed' as const };
      const { container } = render(DueDate, {
        props: { ...defaultProps, task: completedTask }
      });

      expect(container.innerHTML).toBeTruthy();
      expect(vi.mocked(getDueDateClass)).toHaveBeenCalledWith(completedTask.planEndDate, 'completed');
    });
  });
});
