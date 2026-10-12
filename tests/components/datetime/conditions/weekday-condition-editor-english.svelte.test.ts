import { fireEvent, render, screen } from '@testing-library/svelte';
import { describe, expect, it, vi } from 'vitest';
import WeekdayConditionEditor from '$lib/components/datetime/conditions/weekday-condition-editor.svelte';
import type { WeekdayCondition } from '$lib/types/datetime-calendar';

const baseCondition: WeekdayCondition = {
  ifWeekday: 'monday',
  thenDirection: 'previous',
  thenTarget: 'weekday'
};

function selects(container: HTMLElement) {
  return [...container.querySelectorAll('select')] as HTMLSelectElement[];
}

describe('WeekdayConditionEditor in English', () => {
  it('moves a weekday condition to a specific weekday or another target', async () => {
    const onUpdate = vi.fn();
    const onRemove = vi.fn();
    const view = render(WeekdayConditionEditor, {
      props: { condition: baseCondition, onUpdate, onRemove }
    });

    expect(screen.getByText('If')).toBeInTheDocument();
    expect(screen.getByText(', move to')).toBeInTheDocument();
    const [conditionSelect, directionSelect, targetSelect] = selects(view.container);
    expect(directionSelect.value).toBe('previous');

    await fireEvent.change(conditionSelect, { target: { value: 'friday' } });
    expect(onUpdate).toHaveBeenCalledWith({ ifWeekday: 'friday' });

    await fireEvent.change(directionSelect, { target: { value: 'next' } });
    expect(onUpdate).toHaveBeenCalledWith({ thenDirection: 'next' });

    await fireEvent.change(targetSelect, { target: { value: 'monday' } });
    expect(onUpdate).toHaveBeenCalledWith({
      thenTarget: 'specific_weekday',
      thenWeekday: 'monday'
    });

    await fireEvent.change(targetSelect, { target: { value: 'holiday' } });
    expect(onUpdate).toHaveBeenCalledWith({
      thenTarget: 'holiday',
      thenWeekday: undefined
    });

    await fireEvent.click(screen.getByRole('button', { name: 'Remove condition' }));
    expect(onRemove).toHaveBeenCalledOnce();
  });

  it('shows a specific weekday when one is stored and the target otherwise', () => {
    const view = render(WeekdayConditionEditor, {
      props: {
        condition: {
          ...baseCondition,
          thenTarget: 'specific_weekday',
          thenWeekday: 'friday'
        },
        onUpdate: vi.fn(),
        onRemove: vi.fn()
      }
    });
    expect(selects(view.container)[2].value).toBe('friday');

    view.rerender({
      condition: { ...baseCondition, thenTarget: 'specific_weekday' },
      onUpdate: vi.fn(),
      onRemove: vi.fn()
    });
    expect(selects(view.container)[2].value).toBe('');
  });
});
