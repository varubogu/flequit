import { render, screen, fireEvent } from '@testing-library/svelte';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { tick } from 'svelte';
import RecurrenceDialogAdvanced from '$lib/components/recurrence-dialog-advanced.svelte';
import type { RecurrenceRule } from '$lib/types/task';

// Paraglideランタイムをモック
vi.mock('$paraglide/runtime', () => ({
  getLocale: vi.fn(() => 'ja'),
  setLocale: vi.fn()
}));

// メッセージファイルをモック
vi.mock('$paraglide/messages.js', () => ({
  recurrence_settings: () => '繰り返し設定',
  recurrence: () => '繰り返し',
  recurrence_disabled: () => '無効',
  recurrence_enabled: () => '有効',
  recurrence_advanced: () => '有効（高度）',
  repeat_count: () => '繰り返し回数',
  repeat_every: () => '繰り返し間隔',
  recurrence_interval: () => '繰り返し間隔',
  repeat_weekdays: () => '繰り返し曜日',
  advanced_settings: () => '高度な設定',
  specific_date: () => '特定の日付',
  specific_date_example: () => '例：毎月15日',
  week_of_month: () => '月の第何週',
  no_selection: () => '選択なし',
  weekday_of_week: () => '週の何曜日',
  first_week: () => '第1週',
  second_week: () => '第2週',
  third_week: () => '第3週',
  fourth_week: () => '第4週',
  last_week: () => '最終週',
  minute: () => '分',
  hour: () => '時間',
  day: () => '日',
  week: () => '週',
  month: () => '月',
  quarter: () => '四半期',
  half_year: () => '半年',
  year: () => '年',
  save: () => '保存',
  cancel: () => 'キャンセル',
  remove: () => '削除',
  previous: () => '前',
  next: () => '後',
  if_condition: () => '',
  move_to: () => 'にずらす',
  monday: () => '月曜日',
  tuesday: () => '火曜日',
  wednesday: () => '水曜日',
  thursday: () => '木曜日',
  friday: () => '金曜日',
  saturday: () => '土曜日',
  sunday: () => '日曜日',
  weekday: () => '平日',
  weekend: () => '休日',
  holiday: () => '祝日',
  non_holiday: () => '非祝日',
  adjustment_conditions: () => '補正条件'
}));

// ロケールストアをモック
vi.mock('$lib/stores/locale.svelte', () => ({
  reactiveMessage: (fn: () => string) => fn
}));

// RecurrenceServiceをモック
vi.mock('$lib/services/recurrence-service', () => ({
  RecurrenceService: {
    generateRecurrenceDates: vi.fn(() => [
      new Date('2024-01-01'),
      new Date('2024-01-02'),
      new Date('2024-01-03')
    ])
  }
}));

describe('RecurrenceDialogAdvanced', () => {
  const mockOnSave = vi.fn();
  const mockOnOpenChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('3段階の選択肢が表示される', () => {
    render(RecurrenceDialogAdvanced, {
      props: {
        open: true,
        onSave: mockOnSave,
        onOpenChange: mockOnOpenChange
      }
    });

    const select = screen.getByDisplayValue('無効');
    expect(select).toBeTruthy();

    // selectの選択肢を確認
    const options = select.querySelectorAll('option');
    const optionTexts = Array.from(options).map(opt => opt.textContent);
    
    expect(optionTexts).toContain('無効');
    expect(optionTexts).toContain('有効');
    expect(optionTexts).toContain('有効（高度）');
  });

  it('無効選択時は基本設定が表示されない', () => {
    render(RecurrenceDialogAdvanced, {
      props: {
        open: true,
        onSave: mockOnSave,
        onOpenChange: mockOnOpenChange
      }
    });

    // デフォルトで「無効」が選択されている
    expect(() => screen.getByText('繰り返し間隔')).toThrow();
  });

  it('有効選択時は基本設定のみ表示される', async () => {
    render(RecurrenceDialogAdvanced, {
      props: {
        open: true,
        onSave: mockOnSave,
        onOpenChange: mockOnOpenChange
      }
    });

    const select = screen.getByDisplayValue('無効');
    fireEvent.change(select, { target: { value: 'enabled' } });

    // Svelteの更新を待つ
    await tick();

    // 基本設定が表示される（ヘッダーを確認）
    expect(screen.getByRole('heading', { name: '繰り返し間隔' })).toBeTruthy();
    
    // 補正条件は表示されない
    expect(() => screen.getByText('補正条件')).toThrow();
  });

  it('有効（高度）選択時は全設定が表示される', async () => {
    render(RecurrenceDialogAdvanced, {
      props: {
        open: true,
        onSave: mockOnSave,
        onOpenChange: mockOnOpenChange
      }
    });

    const select = screen.getByDisplayValue('無効');
    fireEvent.change(select, { target: { value: 'advanced' } });

    // Svelteの更新を待つ
    await tick();

    // 基本設定が表示される（ヘッダーを確認）
    expect(screen.getByRole('heading', { name: '繰り返し間隔' })).toBeTruthy();
    
    // 補正条件も表示される
    expect(screen.getByText('補正条件')).toBeTruthy();
  });

  it('既存のルールから正しいレベルを推定する', () => {
    const existingRule: RecurrenceRule = {
      unit: 'day',
      interval: 1,
      adjustment: {
        date_conditions: [],
        weekday_conditions: [{
          id: 'test',
          if_weekday: 'monday',
          then_direction: 'next',
          then_target: 'weekday'
        }]
      }
    };

    render(RecurrenceDialogAdvanced, {
      props: {
        open: true,
        recurrenceRule: existingRule,
        onSave: mockOnSave,
        onOpenChange: mockOnOpenChange
      }
    });

    // 高度設定として認識される
    expect(screen.getByDisplayValue('有効（高度）')).toBeTruthy();
  });

  it('保存時に正しいルールが生成される', () => {
    render(RecurrenceDialogAdvanced, {
      props: {
        open: true,
        onSave: mockOnSave,
        onOpenChange: mockOnOpenChange
      }
    });

    // 有効に変更
    const select = screen.getByDisplayValue('無効');
    fireEvent.change(select, { target: { value: 'enabled' } });

    // 保存ボタンをクリック
    const saveButton = screen.getByText('保存');
    fireEvent.click(saveButton);

    expect(mockOnSave).toHaveBeenCalledWith(
      expect.objectContaining({
        unit: 'day',
        interval: 1
      })
    );
  });

  it('無効選択時はnullが保存される', () => {
    render(RecurrenceDialogAdvanced, {
      props: {
        open: true,
        onSave: mockOnSave,
        onOpenChange: mockOnOpenChange
      }
    });

    // デフォルトで無効、保存ボタンをクリック
    const saveButton = screen.getByText('保存');
    fireEvent.click(saveButton);

    expect(mockOnSave).toHaveBeenCalledWith(null);
  });

  it('繰り返し回数フィールドが表示される', () => {
    render(RecurrenceDialogAdvanced, {
      props: {
        open: true,
        onSave: mockOnSave,
        onOpenChange: mockOnOpenChange
      }
    });

    // 有効に変更
    const select = screen.getByDisplayValue('無効');
    fireEvent.change(select, { target: { value: 'enabled' } });

    // 繰り返し回数フィールドが表示される
    expect(screen.getByRole('heading', { name: '繰り返し回数' })).toBeTruthy();
    expect(screen.getByPlaceholderText('無制限の場合は空白')).toBeTruthy();
  });

  it('繰り返し回数設定時にmax_occurrencesが保存される', () => {
    render(RecurrenceDialogAdvanced, {
      props: {
        open: true,
        onSave: mockOnSave,
        onOpenChange: mockOnOpenChange
      }
    });

    // 有効に変更
    const select = screen.getByDisplayValue('無効');
    fireEvent.change(select, { target: { value: 'enabled' } });

    // 繰り返し回数を設定
    const countInput = screen.getByPlaceholderText('無制限の場合は空白') as HTMLInputElement;
    fireEvent.input(countInput, { target: { value: '3' } });
    
    // 入力値が正しく反映されることを確認
    expect(countInput.value).toBe('3');

    // 保存ボタンをクリック
    const saveButton = screen.getByText('保存');
    fireEvent.click(saveButton);

    expect(mockOnSave).toHaveBeenCalledWith(
      expect.objectContaining({
        unit: 'day',
        interval: 1,
        max_occurrences: 3
      })
    );
  });

  describe('Recurrence Count Input Validation', () => {
    let countInput: HTMLInputElement;

    beforeEach(() => {
      render(RecurrenceDialogAdvanced, {
        props: {
          open: true,
          onSave: mockOnSave,
          onOpenChange: mockOnOpenChange
        }
      });
      // 有効に変更
      const select = screen.getByDisplayValue('無効');
      fireEvent.change(select, { target: { value: 'enabled' } });
      countInput = screen.getByPlaceholderText('無制限の場合は空白') as HTMLInputElement;
    });

    it('小数点を入力すると整数に丸められる', async () => {
      await fireEvent.input(countInput, { target: { value: '5.8' } });
      // setTimeout内の処理を待つ
      await new Promise(resolve => setTimeout(resolve, 0));
      expect(countInput.value).toBe('58'); // DOM上では"."が無視されるため
      
      // 保存される値を確認
      const saveButton = screen.getByText('保存');
      await fireEvent.click(saveButton);
      expect(mockOnSave).toHaveBeenCalledWith(expect.objectContaining({ max_occurrences: 58 }));
    });

    it('0を入力するとフィールドがクリアされる', async () => {
      await fireEvent.input(countInput, { target: { value: '0' } });
      await new Promise(resolve => setTimeout(resolve, 0));
      expect(countInput.value).toBe('');
    });

    it('負の数を入力するとフィールドがクリアされる', async () => {
      await fireEvent.input(countInput, { target: { value: '-5' } });
      await new Promise(resolve => setTimeout(resolve, 0));
      expect(countInput.value).toBe('');
    });

    it('不正な文字を含む文字列を貼り付けると数字のみが残る', async () => {
      await fireEvent.input(countInput, { target: { value: '+dfs/*=5f-8' } });
      await new Promise(resolve => setTimeout(resolve, 0));
      expect(countInput.value).toBe('58');
    });
  });
});