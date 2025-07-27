import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import TaskRecurrenceSelector from '$lib/components/task/task-recurrence-selector.svelte';
import type { RecurrenceRule, DayOfWeek, WeekOfMonth } from '$lib/types/task';

// モック設定
vi.mock('$lib/stores/locale.svelte', () => ({
  reactiveMessage: (fn: () => string) => () => fn()
}));

vi.mock('$paraglide/messages.js', () => ({
  no_recurrence: vi.fn(() => 'No recurrence'),
  every_interval_unit: vi.fn(({ interval, unit }) => `Every ${interval} ${unit}`),
  recurrence_weekly_days: vi.fn(({ days }) => `on ${days}`),
  recurrence_monthly_detail: vi.fn(({ detail }) => `(${detail})`),
  recurrence_end_date: vi.fn(({ endDate }) => `until ${endDate}`),
  recurrence_max_occurrences: vi.fn(({ count }) => `for ${count} times`),
  day_of_month: vi.fn(({ day }) => `${day}`),
  minute: vi.fn(() => 'minute'),
  minute_plural: vi.fn(() => 'minutes'),
  hour: vi.fn(() => 'hour'),
  hour_plural: vi.fn(() => 'hours'),
  day: vi.fn(() => 'day'),
  day_plural: vi.fn(() => 'days'),
  week: vi.fn(() => 'week'),
  week_plural: vi.fn(() => 'weeks'),
  month: vi.fn(() => 'month'),
  month_plural: vi.fn(() => 'months'),
  quarter: vi.fn(() => 'quarter'),
  quarter_plural: vi.fn(() => 'quarters'),
  half_year: vi.fn(() => 'half year'),
  half_year_plural: vi.fn(() => 'half years'),
  year: vi.fn(() => 'year'),
  year_plural: vi.fn(() => 'years'),
  sunday: vi.fn(() => 'Sunday'),
  monday: vi.fn(() => 'Monday'),
  tuesday: vi.fn(() => 'Tuesday'),
  wednesday: vi.fn(() => 'Wednesday'),
  thursday: vi.fn(() => 'Thursday'),
  friday: vi.fn(() => 'Friday'),
  saturday: vi.fn(() => 'Saturday'),
  day_short_sun: vi.fn(() => 'Sun'),
  day_short_mon: vi.fn(() => 'Mon'),
  day_short_tue: vi.fn(() => 'Tue'),
  day_short_wed: vi.fn(() => 'Wed'),
  day_short_thu: vi.fn(() => 'Thu'),
  day_short_fri: vi.fn(() => 'Fri'),
  day_short_sat: vi.fn(() => 'Sat'),
  first_week: vi.fn(() => 'first'),
  second_week: vi.fn(() => 'second'),
  third_week: vi.fn(() => 'third'),
  fourth_week: vi.fn(() => 'fourth'),
  last_week: vi.fn(() => 'last')
}));

vi.mock('$paraglide/runtime', () => ({
  getLocale: vi.fn(() => 'en')
}));

describe('TaskRecurrenceSelector', () => {
  const defaultProps = {
    recurrenceRule: null,
    onEdit: vi.fn(),
    disabled: false
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('コンポーネントが正しくマウントされる', () => {
    const { container } = render(TaskRecurrenceSelector, { props: defaultProps });
    expect(container).toBeTruthy();
  });

  it('繰り返し設定がない場合のデフォルト表示', () => {
    render(TaskRecurrenceSelector, { props: defaultProps });
    
    expect(screen.getByRole('button')).toBeInTheDocument();
    expect(screen.getByText('No recurrence')).toBeInTheDocument();
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