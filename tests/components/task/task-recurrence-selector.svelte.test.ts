import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import TaskRecurrenceSelector from '$lib/components/task/task-recurrence-selector.svelte';
import type { RecurrenceRule, DayOfWeek, WeekOfMonth } from '$lib/types/task';
import { setTranslationService } from '$lib/stores/locale.svelte';
import { createUnitTestTranslationService, unitTestTranslations } from '../../unit-translation-mock';

describe('TaskRecurrenceSelector', () => {
  const defaultProps = {
    recurrenceRule: null,
    onEdit: vi.fn(),
    disabled: false
  };

  beforeEach(() => {
    vi.clearAllMocks();
    setTranslationService(createUnitTestTranslationService());
  });

  it('コンポーネントが正しくマウントされる', () => {
    const { container } = render(TaskRecurrenceSelector, { props: defaultProps });
    expect(container).toBeTruthy();
  });

  it('繰り返し設定がない場合のデフォルト表示', () => {
    render(TaskRecurrenceSelector, { props: defaultProps });

    expect(screen.getByRole('button')).toBeInTheDocument();
    expect(screen.getByText(unitTestTranslations.no_recurrence)).toBeInTheDocument();
  });

  it('無効化状態でボタンが操作できない', () => {
    render(TaskRecurrenceSelector, {
      props: {
        ...defaultProps,
        disabled: true
      }
    });

    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
  });

  it('編集ボタンをクリックするとonEditが呼ばれる', async () => {
    const onEdit = vi.fn();
    render(TaskRecurrenceSelector, {
      props: {
        ...defaultProps,
        onEdit
      }
    });

    const button = screen.getByRole('button');
    await fireEvent.click(button);

    expect(onEdit).toHaveBeenCalledTimes(1);
  });

  it('日単位の繰り返し設定が表示される', () => {
    const recurrenceRule: RecurrenceRule = {
      unit: 'day',
      interval: 1
    };

    render(TaskRecurrenceSelector, {
      props: {
        ...defaultProps,
        recurrenceRule
      }
    });

    expect(screen.getByText('Every 1 day')).toBeInTheDocument();
  });

  it('週単位の繰り返し設定が表示される', () => {
    const recurrenceRule: RecurrenceRule = {
      unit: 'week',
      interval: 2
    };

    render(TaskRecurrenceSelector, {
      props: {
        ...defaultProps,
        recurrenceRule
      }
    });

    expect(screen.getByText('Every 2 weeks')).toBeInTheDocument();
  });

  it('週単位で曜日指定がある場合の表示', () => {
    const recurrenceRule: RecurrenceRule = {
      unit: 'week',
      interval: 1,
      days_of_week: ['monday', 'wednesday', 'friday'] as DayOfWeek[]
    };

    render(TaskRecurrenceSelector, {
      props: {
        ...defaultProps,
        recurrenceRule
      }
    });

    expect(screen.getByText('Every 1 week on Mon, Wed, Fri')).toBeInTheDocument();
  });

  it('月単位で特定日指定がある場合の表示', () => {
    const recurrenceRule: RecurrenceRule = {
      unit: 'month',
      interval: 1,
      details: {
        specific_date: 15
      }
    };

    render(TaskRecurrenceSelector, {
      props: {
        ...defaultProps,
        recurrenceRule
      }
    });

    expect(screen.getByText('Every 1 month (15th)')).toBeInTheDocument();
  });

  it('月単位で第n曜日指定がある場合の表示', () => {
    const recurrenceRule: RecurrenceRule = {
      unit: 'month',
      interval: 1,
      details: {
        week_of_period: 'first' as WeekOfMonth,
        weekday_of_week: 'monday' as DayOfWeek
      }
    };

    render(TaskRecurrenceSelector, {
      props: {
        ...defaultProps,
        recurrenceRule
      }
    });

    expect(screen.getByText('Every 1 month (first Monday)')).toBeInTheDocument();
  });

  it('終了日が設定されている場合の表示', () => {
    const endDate = new Date('2024-12-31');
    const recurrenceRule: RecurrenceRule = {
      unit: 'day',
      interval: 1,
      end_date: endDate
    };

    render(TaskRecurrenceSelector, {
      props: {
        ...defaultProps,
        recurrenceRule
      }
    });

    expect(screen.getByText('Every 1 day until 12/31/2024')).toBeInTheDocument();
  });

  it('最大繰り返し回数が設定されている場合の表示', () => {
    const recurrenceRule: RecurrenceRule = {
      unit: 'day',
      interval: 1,
      max_occurrences: 10
    };

    render(TaskRecurrenceSelector, {
      props: {
        ...defaultProps,
        recurrenceRule
      }
    });

    expect(screen.getByText('Every 1 day for 10 times')).toBeInTheDocument();
  });

  it('複数間隔での複数形表示', () => {
    const recurrenceRule: RecurrenceRule = {
      unit: 'day',
      interval: 3
    };

    render(TaskRecurrenceSelector, {
      props: {
        ...defaultProps,
        recurrenceRule
      }
    });

    expect(screen.getByText('Every 3 days')).toBeInTheDocument();
  });

  it('年単位の繰り返し設定が表示される', () => {
    const recurrenceRule: RecurrenceRule = {
      unit: 'year',
      interval: 1
    };

    render(TaskRecurrenceSelector, {
      props: {
        ...defaultProps,
        recurrenceRule
      }
    });

    expect(screen.getByText('Every 1 year')).toBeInTheDocument();
  });

  it('四半期単位の繰り返し設定が表示される', () => {
    const recurrenceRule: RecurrenceRule = {
      unit: 'quarter',
      interval: 2
    };

    render(TaskRecurrenceSelector, {
      props: {
        ...defaultProps,
        recurrenceRule
      }
    });

    expect(screen.getByText('Every 2 quarters')).toBeInTheDocument();
  });

  it('半年単位の繰り返し設定が表示される', () => {
    const recurrenceRule: RecurrenceRule = {
      unit: 'half_year',
      interval: 1
    };

    render(TaskRecurrenceSelector, {
      props: {
        ...defaultProps,
        recurrenceRule
      }
    });

    expect(screen.getByText('Every 1 half year')).toBeInTheDocument();
  });

  it('時間単位の繰り返し設定が表示される', () => {
    const recurrenceRule: RecurrenceRule = {
      unit: 'hour',
      interval: 6
    };

    render(TaskRecurrenceSelector, {
      props: {
        ...defaultProps,
        recurrenceRule
      }
    });

    expect(screen.getByText('Every 6 hours')).toBeInTheDocument();
  });

  it('分単位の繰り返し設定が表示される', () => {
    const recurrenceRule: RecurrenceRule = {
      unit: 'minute',
      interval: 30
    };

    render(TaskRecurrenceSelector, {
      props: {
        ...defaultProps,
        recurrenceRule
      }
    });

    expect(screen.getByText('Every 30 minutes')).toBeInTheDocument();
  });

  it('繰り返し設定があるときとないときでアイコンが変わる', () => {
    // 設定なしの場合
    const { rerender } = render(TaskRecurrenceSelector, { props: defaultProps });

    let svgElement = document.querySelector('svg');
    expect(svgElement).toBeInTheDocument();

    // 設定ありの場合
    const recurrenceRule: RecurrenceRule = {
      unit: 'day',
      interval: 1
    };

    rerender({
      ...defaultProps,
      recurrenceRule
    });

    svgElement = document.querySelector('svg');
    expect(svgElement).toBeInTheDocument();
  });

  it('必要なpropsが正しく設定される', () => {
    const props = {
      recurrenceRule: {
        unit: 'day' as const,
        interval: 1
      },
      onEdit: vi.fn(),
      disabled: false
    };

    const { container } = render(TaskRecurrenceSelector, { props });

    expect(container).toBeTruthy();
    expect(props.onEdit).toBeInstanceOf(Function);
  });

  it('ボタンのスタイルクラスが正しく適用される', () => {
    render(TaskRecurrenceSelector, { props: defaultProps });

    const button = screen.getByRole('button');
    expect(button).toHaveClass('flex', 'items-center', 'gap-1');
  });

  it('テキストが切り詰められるクラスが適用される', () => {
    render(TaskRecurrenceSelector, { props: defaultProps });

    const span = document.querySelector('span.truncate');
    expect(span).toBeInTheDocument();
  });
});
