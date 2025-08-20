import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { TaskWithSubTasks } from '$lib/types/task';
import type { RecurrenceRule } from '$lib/types/datetime-calendar';

// 日付・時刻管理のモック
const mockDateTimeStore = {
  currentTimezone: 'Asia/Tokyo',
  dateFormat: 'YYYY-MM-DD',
  timeFormat: 'HH:mm',
  dateTimeFormat: 'YYYY-MM-DD HH:mm',
  locale: 'ja',

  formatDate: vi.fn((date: Date, format?: string) => {
    const formatStr = format || mockDateTimeStore.dateFormat;

    // 簡単な日付フォーマット処理
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    switch (formatStr) {
      case 'YYYY-MM-DD':
        return `${year}-${month}-${day}`;
      case 'DD/MM/YYYY':
        return `${day}/${month}/${year}`;
      case 'MM/DD/YYYY':
        return `${month}/${day}/${year}`;
      default:
        return `${year}-${month}-${day}`;
    }
  }),

  formatTime: vi.fn((date: Date, format?: string) => {
    const formatStr = format || mockDateTimeStore.timeFormat;
    const hours = date.getHours();
    const minutes = String(date.getMinutes()).padStart(2, '0');

    switch (formatStr) {
      case 'HH:mm':
        return `${String(hours).padStart(2, '0')}:${minutes}`;
      case 'hh:mm A': {
        const hour12 = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
        const ampm = hours >= 12 ? 'PM' : 'AM';
        return `${String(hour12).padStart(2, '0')}:${minutes} ${ampm}`;
      }
      default:
        return `${String(hours).padStart(2, '0')}:${minutes}`;
    }
  }),

  formatDateTime: vi.fn((date: Date) => {
    const dateStr = mockDateTimeStore.formatDate(date);
    const timeStr = mockDateTimeStore.formatTime(date);
    return `${dateStr} ${timeStr}`;
  }),

  parseDate: vi.fn((dateString: string) => {
    // 簡単な日付パース処理
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? null : date;
  }),

  setTimezone: vi.fn((timezone: string) => {
    mockDateTimeStore.currentTimezone = timezone;
    return timezone;
  }),

  updateDateFormat: vi.fn((format: string) => {
    mockDateTimeStore.dateFormat = format;
    return format;
  }),

  updateTimeFormat: vi.fn((format: string) => {
    mockDateTimeStore.timeFormat = format;
    return format;
  })
};

// タスク日付管理のモック
const mockTaskDateStore = {
  tasks: [] as TaskWithSubTasks[],

  setTaskDate: vi.fn(
    (
      taskId: string,
      dateData: {
        start_date?: Date;
        end_date?: Date;
        is_range_date?: boolean;
      }
    ) => {
      const taskIndex = mockTaskDateStore.tasks.findIndex((t) => t.id === taskId);
      if (taskIndex >= 0) {
        mockTaskDateStore.tasks[taskIndex] = {
          ...mockTaskDateStore.tasks[taskIndex],
          ...dateData,
          updated_at: new Date()
        };
        return mockTaskDateStore.tasks[taskIndex];
      }
      return null;
    }
  ),

  getTasksForDate: vi.fn((date: Date) => {
    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);
    const nextDay = new Date(targetDate);
    nextDay.setDate(nextDay.getDate() + 1);

    return mockTaskDateStore.tasks.filter((task) => {
      if (!task.end_date) return false;

      const taskDate = new Date(task.end_date);
      return taskDate >= targetDate && taskDate < nextDay;
    });
  }),

  getTasksInRange: vi.fn((startDate: Date, endDate: Date) => {
    return mockTaskDateStore.tasks.filter((task) => {
      if (!task.end_date) return false;

      const taskDate = new Date(task.end_date);
      return taskDate >= startDate && taskDate <= endDate;
    });
  }),

  getOverdueTasks: vi.fn(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    return mockTaskDateStore.tasks.filter((task) => {
      if (!task.end_date || task.status === 'completed') return false;

      const taskDate = new Date(task.end_date);
      return taskDate < now;
    });
  })
};

// 繰り返しタスクのモック
const mockRecurrenceService = {
  generateRecurrenceDates: vi.fn((baseDate: Date, rule: RecurrenceRule, limit: number = 10) => {
    const dates: Date[] = [];
    const currentDate = new Date(baseDate);

    for (let i = 0; i < limit; i++) {
      dates.push(new Date(currentDate));

      switch (rule.unit) {
        case 'day':
          currentDate.setDate(currentDate.getDate() + rule.interval);
          break;
        case 'week':
          currentDate.setDate(currentDate.getDate() + rule.interval * 7);
          break;
        case 'month':
          currentDate.setMonth(currentDate.getMonth() + rule.interval);
          break;
        case 'year':
          currentDate.setFullYear(currentDate.getFullYear() + rule.interval);
          break;
      }

      // 終了日チェック
      if (rule.end_date && currentDate > rule.end_date) {
        break;
      }
    }

    return dates;
  }),

  calculateNextOccurrence: vi.fn((lastDate: Date, rule: RecurrenceRule) => {
    const nextDate = new Date(lastDate);

    switch (rule.unit) {
      case 'day':
        nextDate.setDate(nextDate.getDate() + rule.interval);
        break;
      case 'week':
        nextDate.setDate(nextDate.getDate() + rule.interval * 7);
        break;
      case 'month':
        nextDate.setMonth(nextDate.getMonth() + rule.interval);
        break;
      case 'year':
        nextDate.setFullYear(nextDate.getFullYear() + rule.interval);
        break;
    }

    return nextDate;
  }),

  validateRecurrenceRule: vi.fn((rule: RecurrenceRule) => {
    const errors: string[] = [];

    if (!rule.unit || !['day', 'week', 'month', 'year'].includes(rule.unit)) {
      errors.push('有効な繰り返し単位を選択してください');
    }

    if (!rule.interval || rule.interval < 1) {
      errors.push('繰り返し間隔は1以上である必要があります');
    }

    if (rule.max_occurrences && rule.max_occurrences < 1) {
      errors.push('最大実行回数は1以上である必要があります');
    }

    if (rule.end_date && rule.end_date <= new Date()) {
      errors.push('終了日は未来の日付である必要があります');
    }

    return { isValid: errors.length === 0, errors };
  })
};

// カレンダービューのモック
const mockCalendarStore = {
  currentDate: new Date(),
  selectedDate: null as Date | null,
  viewMode: 'month' as 'month' | 'week' | 'day',

  setCurrentDate: vi.fn((date: Date) => {
    mockCalendarStore.currentDate = new Date(date);
    return mockCalendarStore.currentDate;
  }),

  selectDate: vi.fn((date: Date) => {
    mockCalendarStore.selectedDate = new Date(date);
    return mockCalendarStore.selectedDate;
  }),

  setViewMode: vi.fn((mode: 'month' | 'week' | 'day') => {
    mockCalendarStore.viewMode = mode;
    return mode;
  }),

  navigateToToday: vi.fn(() => {
    const today = new Date();
    mockCalendarStore.currentDate = today;
    mockCalendarStore.selectedDate = today;
    return today;
  }),

  navigateMonth: vi.fn((direction: 1 | -1) => {
    const newDate = new Date(mockCalendarStore.currentDate);
    newDate.setMonth(newDate.getMonth() + direction);
    mockCalendarStore.currentDate = newDate;
    return newDate;
  }),

  navigateWeek: vi.fn((direction: 1 | -1) => {
    const newDate = new Date(mockCalendarStore.currentDate);
    newDate.setDate(newDate.getDate() + direction * 7);
    mockCalendarStore.currentDate = newDate;
    return newDate;
  })
};

describe('日付・時刻管理結合テスト', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // 初期状態にリセット
    mockDateTimeStore.currentTimezone = 'Asia/Tokyo';
    mockDateTimeStore.dateFormat = 'YYYY-MM-DD';
    mockDateTimeStore.timeFormat = 'HH:mm';
    mockDateTimeStore.locale = 'ja';

    mockTaskDateStore.tasks = [
      {
        id: 'task-1',
        title: '今日のタスク',
        list_id: 'list-1',
        status: 'not_started',
        priority: 1,
        end_date: new Date('2024-01-15T09:00:00'),
        created_at: new Date(),
        updated_at: new Date(),
        sub_tasks: [],
        tags: [],
        order_index: 0,
        is_archived: false
      },
      {
        id: 'task-2',
        title: '期限切れタスク',
        list_id: 'list-1',
        status: 'not_started',
        priority: 2,
        end_date: new Date('2024-01-10T15:30:00'),
        created_at: new Date(),
        updated_at: new Date(),
        sub_tasks: [],
        tags: [],
        order_index: 1,
        is_archived: false
      },
      {
        id: 'task-3',
        title: '範囲指定タスク',
        list_id: 'list-1',
        status: 'in_progress',
        priority: 3,
        start_date: new Date('2024-01-12T10:00:00'),
        end_date: new Date('2024-01-18T17:00:00'),
        is_range_date: true,
        created_at: new Date(),
        updated_at: new Date(),
        sub_tasks: [],
        tags: [],
        order_index: 2,
        is_archived: false
      }
    ];

    mockCalendarStore.currentDate = new Date('2024-01-15');
    mockCalendarStore.selectedDate = null;
    mockCalendarStore.viewMode = 'month';
  });

  it('日付フォーマットの設定と表示が正しく動作する', () => {
    const testDate = new Date('2024-01-15T09:30:00');

    // デフォルトフォーマット（YYYY-MM-DD）
    const defaultFormat = mockDateTimeStore.formatDate(testDate);
    expect(mockDateTimeStore.formatDate).toHaveBeenCalledWith(testDate);
    expect(defaultFormat).toBe('2024-01-15');

    // フォーマットを変更
    mockDateTimeStore.updateDateFormat('DD/MM/YYYY');
    const europeanFormat = mockDateTimeStore.formatDate(testDate, 'DD/MM/YYYY');
    expect(europeanFormat).toBe('15/01/2024');

    // アメリカ式フォーマット
    const americanFormat = mockDateTimeStore.formatDate(testDate, 'MM/DD/YYYY');
    expect(americanFormat).toBe('01/15/2024');
  });

  it('時刻フォーマットの設定と表示が正しく動作する', () => {
    const testDate = new Date('2024-01-15T14:30:00');

    // 24時間形式（デフォルト）
    const format24h = mockDateTimeStore.formatTime(testDate);
    expect(mockDateTimeStore.formatTime).toHaveBeenCalledWith(testDate);
    expect(format24h).toBe('14:30');

    // 12時間形式（AM/PM）
    mockDateTimeStore.updateTimeFormat('hh:mm A');
    const format12h = mockDateTimeStore.formatTime(testDate, 'hh:mm A');
    expect(format12h).toBe('02:30 PM');

    // 午前のテスト
    const morningDate = new Date('2024-01-15T09:15:00');
    const morningFormat = mockDateTimeStore.formatTime(morningDate, 'hh:mm A');
    expect(morningFormat).toBe('09:15 AM');
  });

  it('日付時刻の組み合わせフォーマットが正しく動作する', () => {
    const testDate = new Date('2024-01-15T14:30:00');

    const dateTimeStr = mockDateTimeStore.formatDateTime(testDate);
    expect(mockDateTimeStore.formatDateTime).toHaveBeenCalledWith(testDate);
    expect(dateTimeStr).toBe('2024-01-15 14:30');
  });

  it('タスクの日付設定が正しく動作する', () => {
    // 単一日付の設定
    const singleDateResult = mockTaskDateStore.setTaskDate('task-1', {
      end_date: new Date('2024-01-20T10:00:00'),
      is_range_date: false
    });

    expect(mockTaskDateStore.setTaskDate).toHaveBeenCalledWith('task-1', {
      end_date: new Date('2024-01-20T10:00:00'),
      is_range_date: false
    });
    expect(singleDateResult?.end_date).toEqual(new Date('2024-01-20T10:00:00'));
    expect(singleDateResult?.is_range_date).toBe(false);

    // 範囲日付の設定
    const rangeDateResult = mockTaskDateStore.setTaskDate('task-2', {
      start_date: new Date('2024-01-22T09:00:00'),
      end_date: new Date('2024-01-25T17:00:00'),
      is_range_date: true
    });

    expect(rangeDateResult?.start_date).toEqual(new Date('2024-01-22T09:00:00'));
    expect(rangeDateResult?.end_date).toEqual(new Date('2024-01-25T17:00:00'));
    expect(rangeDateResult?.is_range_date).toBe(true);
  });

  it('特定日付のタスク取得が正しく動作する', () => {
    // 2024-01-15のタスクを取得
    const tasksForDate = mockTaskDateStore.getTasksForDate(new Date('2024-01-15'));

    expect(mockTaskDateStore.getTasksForDate).toHaveBeenCalledWith(new Date('2024-01-15'));
    expect(tasksForDate).toHaveLength(1);
    expect(tasksForDate[0].title).toBe('今日のタスク');

    // タスクがない日付
    const noTasks = mockTaskDateStore.getTasksForDate(new Date('2024-01-16'));
    expect(noTasks).toHaveLength(0);
  });

  it('日付範囲でのタスク取得が正しく動作する', () => {
    const startDate = new Date('2024-01-12');
    const endDate = new Date('2024-01-18');

    const tasksInRange = mockTaskDateStore.getTasksInRange(startDate, endDate);

    expect(mockTaskDateStore.getTasksInRange).toHaveBeenCalledWith(startDate, endDate);
    expect(tasksInRange).toHaveLength(1); // '今日のタスク'のみ（'範囲指定タスク'の終了日は18日なので範囲外）
    expect(tasksInRange.map((t) => t.title)).toContain('今日のタスク');
  });

  it('期限切れタスクの取得が正しく動作する', () => {
    // 現在日時を2024-01-15と仮定
    vi.setSystemTime(new Date('2024-01-15T12:00:00'));

    const overdueTasks = mockTaskDateStore.getOverdueTasks();

    expect(mockTaskDateStore.getOverdueTasks).toHaveBeenCalled();
    expect(overdueTasks).toHaveLength(1);
    expect(overdueTasks[0].title).toBe('期限切れタスク');
    expect(overdueTasks[0].end_date).toEqual(new Date('2024-01-10T15:30:00'));

    vi.useRealTimers();
  });

  it('繰り返しタスクの日付生成が正しく動作する', () => {
    const baseDate = new Date('2024-01-15');

    // 毎日繰り返し
    const dailyRule: RecurrenceRule = {
      unit: 'day',
      interval: 1,
      max_occurrences: 5
    };

    const dailyDates = mockRecurrenceService.generateRecurrenceDates(baseDate, dailyRule, 5);

    expect(mockRecurrenceService.generateRecurrenceDates).toHaveBeenCalledWith(
      baseDate,
      dailyRule,
      5
    );
    expect(dailyDates).toHaveLength(5);
    expect(dailyDates[0]).toEqual(new Date('2024-01-15'));
    expect(dailyDates[1]).toEqual(new Date('2024-01-16'));
    expect(dailyDates[4]).toEqual(new Date('2024-01-19'));

    // 毎週繰り返し
    const weeklyRule: RecurrenceRule = {
      unit: 'week',
      interval: 1,
      max_occurrences: 3
    };

    const weeklyDates = mockRecurrenceService.generateRecurrenceDates(baseDate, weeklyRule, 3);
    expect(weeklyDates).toHaveLength(3);
    expect(weeklyDates[1]).toEqual(new Date('2024-01-22')); // 1週間後
  });

  it('繰り返しルールのバリデーションが正しく動作する', () => {
    // 有効なルール（未来の日付を使用）
    const futureDate = new Date();
    futureDate.setFullYear(futureDate.getFullYear() + 1);

    const validRule: RecurrenceRule = {
      unit: 'week',
      interval: 2,
      max_occurrences: 10,
      end_date: futureDate
    };

    const validResult = mockRecurrenceService.validateRecurrenceRule(validRule);
    expect(mockRecurrenceService.validateRecurrenceRule).toHaveBeenCalledWith(validRule);
    expect(validResult.isValid).toBe(true);
    expect(validResult.errors).toHaveLength(0);

    // 無効なルール
    const invalidRule: RecurrenceRule = {
      unit: 'invalid' as 'day',
      interval: 0,
      max_occurrences: -1,
      end_date: new Date('2020-01-01') // 過去の日付
    };

    const invalidResult = mockRecurrenceService.validateRecurrenceRule(invalidRule);
    expect(invalidResult.isValid).toBe(false);
    expect(invalidResult.errors.length).toBeGreaterThan(0);
    expect(invalidResult.errors).toContain('有効な繰り返し単位を選択してください');
    expect(invalidResult.errors).toContain('繰り返し間隔は1以上である必要があります');
  });

  it('カレンダービューの操作が正しく動作する', () => {
    // 現在日付の設定
    const newDate = new Date('2024-02-01');
    const currentResult = mockCalendarStore.setCurrentDate(newDate);

    expect(mockCalendarStore.setCurrentDate).toHaveBeenCalledWith(newDate);
    expect(currentResult).toEqual(newDate);
    expect(mockCalendarStore.currentDate).toEqual(newDate);

    // 日付選択
    const selectedDate = new Date('2024-02-15');
    const selectResult = mockCalendarStore.selectDate(selectedDate);

    expect(mockCalendarStore.selectDate).toHaveBeenCalledWith(selectedDate);
    expect(selectResult).toEqual(selectedDate);
    expect(mockCalendarStore.selectedDate).toEqual(selectedDate);

    // ビューモード変更
    const viewResult = mockCalendarStore.setViewMode('week');
    expect(mockCalendarStore.setViewMode).toHaveBeenCalledWith('week');
    expect(viewResult).toBe('week');
    expect(mockCalendarStore.viewMode).toBe('week');
  });

  it('カレンダーナビゲーションが正しく動作する', () => {
    // 初期日付設定
    mockCalendarStore.setCurrentDate(new Date('2024-01-15'));

    // 来月へ
    const nextMonth = mockCalendarStore.navigateMonth(1);
    expect(mockCalendarStore.navigateMonth).toHaveBeenCalledWith(1);
    expect(nextMonth.getMonth()).toBe(1); // 2月（0-indexed）

    // 前月へ
    const prevMonth = mockCalendarStore.navigateMonth(-1);
    expect(prevMonth.getMonth()).toBe(0); // 1月

    // 来週へ
    const nextWeek = mockCalendarStore.navigateWeek(1);
    expect(mockCalendarStore.navigateWeek).toHaveBeenCalledWith(1);
    expect(nextWeek.getDate()).toBe(22); // 7日後

    // 今日へ
    const today = mockCalendarStore.navigateToToday();
    expect(mockCalendarStore.navigateToToday).toHaveBeenCalled();
    expect(mockCalendarStore.currentDate).toEqual(today);
    expect(mockCalendarStore.selectedDate).toEqual(today);
  });

  it('タイムゾーン設定と日付表示の連携が正しく動作する', () => {
    // タイムゾーン変更
    const newTimezone = mockDateTimeStore.setTimezone('America/New_York');

    expect(mockDateTimeStore.setTimezone).toHaveBeenCalledWith('America/New_York');
    expect(newTimezone).toBe('America/New_York');
    expect(mockDateTimeStore.currentTimezone).toBe('America/New_York');

    // 日付フォーマットは変わらず動作することを確認
    const testDate = new Date('2024-01-15T14:30:00');
    const formattedDate = mockDateTimeStore.formatDate(testDate);
    expect(formattedDate).toBe('2024-01-15');
  });

  it('日付の解析機能が正しく動作する', () => {
    // 有効な日付文字列
    const validDateStr = '2024-01-15';
    const parsedDate = mockDateTimeStore.parseDate(validDateStr);

    expect(mockDateTimeStore.parseDate).toHaveBeenCalledWith(validDateStr);
    expect(parsedDate).toBeInstanceOf(Date);
    expect(parsedDate?.getFullYear()).toBe(2024);
    expect(parsedDate?.getMonth()).toBe(0); // 0-indexed
    expect(parsedDate?.getDate()).toBe(15);

    // 無効な日付文字列
    const invalidDateStr = 'invalid-date';
    const invalidParsed = mockDateTimeStore.parseDate(invalidDateStr);
    expect(invalidParsed).toBe(null);
  });

  it('繰り返しタスクの次回実行日計算が正しく動作する', () => {
    const lastDate = new Date('2024-01-15');

    // 毎日繰り返し
    const dailyRule: RecurrenceRule = { unit: 'day', interval: 1 };
    const nextDaily = mockRecurrenceService.calculateNextOccurrence(lastDate, dailyRule);

    expect(mockRecurrenceService.calculateNextOccurrence).toHaveBeenCalledWith(lastDate, dailyRule);
    expect(nextDaily).toEqual(new Date('2024-01-16'));

    // 毎月繰り返し
    const monthlyRule: RecurrenceRule = { unit: 'month', interval: 1 };
    const nextMonthly = mockRecurrenceService.calculateNextOccurrence(lastDate, monthlyRule);
    expect(nextMonthly).toEqual(new Date('2024-02-15'));

    // 毎年繰り返し
    const yearlyRule: RecurrenceRule = { unit: 'year', interval: 1 };
    const nextYearly = mockRecurrenceService.calculateNextOccurrence(lastDate, yearlyRule);
    expect(nextYearly).toEqual(new Date('2025-01-15'));
  });

  it('日付設定とビュー反映の統合が正しく動作する', () => {
    // タスクの日付を今日に設定
    const today = new Date('2024-01-15');
    mockTaskDateStore.setTaskDate('task-2', {
      end_date: today,
      is_range_date: false
    });

    // カレンダーで今日を選択
    mockCalendarStore.selectDate(today);

    // 今日のタスクを取得
    const todayTasks = mockTaskDateStore.getTasksForDate(today);

    expect(todayTasks).toHaveLength(2); // 元の'今日のタスク'と移動した'期限切れタスク'
    expect(todayTasks.map((t) => t.title)).toContain('今日のタスク');
    expect(todayTasks.map((t) => t.title)).toContain('期限切れタスク');
    expect(mockCalendarStore.selectedDate).toEqual(today);
  });

  it('複雑な日付条件での統合処理が正しく動作する', () => {
    // 複数の日付条件を組み合わせた検索
    const complexDateFilter = (conditions: {
      dateRange?: { start: Date; end: Date };
      includeOverdue?: boolean;
      excludeCompleted?: boolean;
      hasDateOnly?: boolean;
    }) => {
      let results = mockTaskDateStore.tasks;

      // 日付範囲フィルター
      if (conditions.dateRange) {
        results = results.filter((task) => {
          if (!task.end_date) return false;
          return (
            task.end_date >= conditions.dateRange!.start &&
            task.end_date <= conditions.dateRange!.end
          );
        });
      }

      // 期限切れを含むかどうか
      if (conditions.includeOverdue === false) {
        const now = new Date();
        results = results.filter((task) => {
          if (!task.end_date) return true;
          return task.end_date >= now || task.status === 'completed';
        });
      }

      // 完了済みタスクを除外
      if (conditions.excludeCompleted) {
        results = results.filter((task) => task.status !== 'completed');
      }

      // 期限が設定されているタスクのみ
      if (conditions.hasDateOnly) {
        results = results.filter((task) => task.end_date !== undefined);
      }

      return results;
    };

    // 今週の未完了タスクで期限があるもの
    const thisWeekTasks = complexDateFilter({
      dateRange: {
        start: new Date('2024-01-14'),
        end: new Date('2024-01-20')
      },
      excludeCompleted: true,
      hasDateOnly: true
    });

    expect(thisWeekTasks).toHaveLength(2); // '今日のタスク'と'範囲指定タスク'
    expect(thisWeekTasks.every((task) => task.status !== 'completed')).toBe(true);
    expect(thisWeekTasks.every((task) => task.end_date !== undefined)).toBe(true);
  });
});
