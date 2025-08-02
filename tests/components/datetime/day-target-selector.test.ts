import { render, screen, fireEvent } from '@testing-library/svelte';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import DayTargetSelector from '$lib/components/datetime/day-target-selector.svelte';
// TODO: 将来の型チェック実装で使用予定
// import type { DayOfWeek, AdjustmentTarget } from '$lib/types/task';

// ロケールストアをモック
vi.mock('$lib/stores/locale.svelte', () => {
  const messages = {
    monday: '月曜日',
    tuesday: '火曜日',
    wednesday: '水曜日',
    thursday: '木曜日',
    friday: '金曜日',
    saturday: '土曜日',
    sunday: '日曜日',
    weekday: '平日',
    weekend: '休日',
    holiday: '祝日',
    non_holiday: '非祝日',
    weekend_only: '週末のみ',
    non_weekend: '平日のみ',
    weekend_holiday: '週末または祝日',
    non_weekend_holiday: '平日または祝日'
  };
  
  return {
    reactiveMessage: <T extends (...args: unknown[]) => string>(fn: T): T => {
      return ((...args: unknown[]) => {
        const result = fn(...args);
        return messages[result as keyof typeof messages] || result;
      }) as T;
    },
    getTranslationService: () => ({
      getMessage: (key: string) => () => messages[key as keyof typeof messages] || key,
      getCurrentLocale: () => 'ja',
      setLocale: () => {},
      reactiveMessage: <T extends (...args: unknown[]) => string>(fn: T): T => {
        return ((...args: unknown[]) => {
          const result = fn(...args);
          return messages[result as keyof typeof messages] || result;
        }) as T;
      }
    })
  };
});

describe('DayTargetSelector', () => {
  const mockOnChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('正しい曜日オプションが表示される', () => {
    render(DayTargetSelector, {
      props: {
        value: 'monday',
        onchange: mockOnChange
      }
    });

    const select = screen.getByRole('combobox');
    expect(select).toBeTruthy();

    // すべての曜日オプションが存在することを確認
    const options = select.querySelectorAll('option');
    const optionTexts = Array.from(options).map((opt) => opt.textContent);

    expect(optionTexts).toContain('月曜日');
    expect(optionTexts).toContain('火曜日');
    expect(optionTexts).toContain('水曜日');
    expect(optionTexts).toContain('木曜日');
    expect(optionTexts).toContain('金曜日');
    expect(optionTexts).toContain('土曜日');
    expect(optionTexts).toContain('日曜日');
  });

  it('正しい特別オプションが表示される', () => {
    render(DayTargetSelector, {
      props: {
        value: 'weekday',
        onchange: mockOnChange
      }
    });

    const select = screen.getByRole('combobox');
    const options = select.querySelectorAll('option');
    const optionTexts = Array.from(options).map((opt) => opt.textContent);

    expect(optionTexts).toContain('平日');
    expect(optionTexts).toContain('休日');
    expect(optionTexts).toContain('祝日');
    expect(optionTexts).toContain('非祝日');
  });

  it('選択された値が正しく表示される', () => {
    render(DayTargetSelector, {
      props: {
        value: 'friday',
        onchange: mockOnChange
      }
    });

    const select = screen.getByRole('combobox') as HTMLSelectElement;
    expect(select.value).toBe('friday');
  });

  it('値変更時にonchangeが呼ばれる', () => {
    render(DayTargetSelector, {
      props: {
        value: 'monday',
        onchange: mockOnChange
      }
    });

    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: 'weekend' } });

    expect(mockOnChange).toHaveBeenCalledWith('weekend');
  });

  it('平日が選択された場合に正しく処理される', () => {
    render(DayTargetSelector, {
      props: {
        value: 'weekday',
        onchange: mockOnChange
      }
    });

    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: 'holiday' } });

    expect(mockOnChange).toHaveBeenCalledWith('holiday');
  });

  it('特定曜日選択時に正しく処理される', () => {
    render(DayTargetSelector, {
      props: {
        value: 'sunday',
        onchange: mockOnChange
      }
    });

    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: 'wednesday' } });

    expect(mockOnChange).toHaveBeenCalledWith('wednesday');
  });

  it('無効な値でもエラーが発生しない', () => {
    render(DayTargetSelector, {
      props: {
        value: 'invalid_value' as unknown,
        onchange: mockOnChange
      }
    });

    const select = screen.getByRole('combobox') as HTMLSelectElement;
    // selectは無効な値の場合空文字になることを確認
    expect(select.value).toBe('');
  });
});
