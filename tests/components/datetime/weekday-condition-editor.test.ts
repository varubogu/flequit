import { render, screen, fireEvent } from '@testing-library/svelte';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import WeekdayConditionEditor from '$lib/components/datetime/weekday-condition-editor.svelte';
import type { WeekdayCondition } from '$lib/types/task';

// Paraglideランタイムをモック
vi.mock('$paraglide/runtime', () => ({
  getLocale: vi.fn(() => 'ja'),
  setLocale: vi.fn()
}));

// メッセージファイルをモック
vi.mock('$paraglide/messages.js', () => ({
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
  non_holiday: () => '非祝日'
}));

// ロケールストアをモック
vi.mock('$lib/stores/locale.svelte', () => ({
  reactiveMessage: (fn: () => string) => fn
}));

describe('WeekdayConditionEditor', () => {
  const mockCondition: WeekdayCondition = {
    id: 'test-id',
    if_weekday: 'monday',
    then_direction: 'next',
    then_target: 'weekday'
  };

  const mockOnUpdate = vi.fn();
  const mockOnRemove = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('日本語で正しい順序で表示される', () => {
    render(WeekdayConditionEditor, {
      props: {
        condition: mockCondition,
        onUpdate: mockOnUpdate,
        onRemove: mockOnRemove
      }
    });

    // 日本語の順序: [条件]なら[方向]の[対象]にずらす
    const container = screen.getByRole('button', { name: /remove condition/i }).parentElement;
    expect(container).toBeTruthy();

    // "なら"、"の"、"にずらす"のテキストが存在することを確認
    expect(screen.getByText('なら')).toBeTruthy();
    expect(screen.getByText('の')).toBeTruthy();
    expect(screen.getByText('にずらす')).toBeTruthy();
  });

  it('英語で正しい順序で表示される', async () => {
    // 言語を英語に設定
    const { getLocale } = await import('$paraglide/runtime');
    vi.mocked(getLocale).mockReturnValue('en');

    render(WeekdayConditionEditor, {
      props: {
        condition: mockCondition,
        onUpdate: mockOnUpdate,
        onRemove: mockOnRemove
      }
    });

    // 英語の順序: If [条件], move to [方向] [対象]
    expect(screen.getByText('If')).toBeTruthy();
    expect(screen.getByText(', move to')).toBeTruthy();
  });

  it('条件変更時にonUpdateが呼ばれる', async () => {
    render(WeekdayConditionEditor, {
      props: {
        condition: mockCondition,
        onUpdate: mockOnUpdate,
        onRemove: mockOnRemove
      }
    });

    // 最初のDayTargetSelectorを見つけてクリックしてoptionを選択
    const selects = screen.getAllByRole('combobox');
    const conditionSelect = selects[0];

    // selectの値を変更
    fireEvent.change(conditionSelect, { target: { value: 'tuesday' } });

    expect(mockOnUpdate).toHaveBeenCalledWith({ if_weekday: 'tuesday' });
  });

  it('方向変更時にonUpdateが呼ばれる', () => {
    render(WeekdayConditionEditor, {
      props: {
        condition: mockCondition,
        onUpdate: mockOnUpdate,
        onRemove: mockOnRemove
      }
    });

    // 方向のselectを見つける
    const selects = screen.getAllByRole('combobox');
    const directionSelect = selects.find(select => {
      const options = select.querySelectorAll('option');
      return Array.from(options).some(option => option.textContent === '前' || option.textContent === '後');
    });

    expect(directionSelect).toBeTruthy();

    fireEvent.change(directionSelect!, { target: { value: 'previous' } });

    expect(mockOnUpdate).toHaveBeenCalledWith({ then_direction: 'previous' });
  });

  it('削除ボタンクリック時にonRemoveが呼ばれる', () => {
    render(WeekdayConditionEditor, {
      props: {
        condition: mockCondition,
        onUpdate: mockOnUpdate,
        onRemove: mockOnRemove
      }
    });

    const removeButton = screen.getByRole('button', { name: /remove condition/i });
    fireEvent.click(removeButton);

    expect(mockOnRemove).toHaveBeenCalled();
  });

  it('特定曜日が選択された場合に正しく処理される', () => {
    render(WeekdayConditionEditor, {
      props: {
        condition: {
          ...mockCondition,
          then_target: 'specific_weekday',
          then_weekday: 'friday'
        },
        onUpdate: mockOnUpdate,
        onRemove: mockOnRemove
      }
    });

    // 対象のDayTargetSelectorを見つけてクリック
    const selects = screen.getAllByRole('combobox');
    const targetSelect = selects[selects.length - 1]; // 最後のselect（対象用）

    fireEvent.change(targetSelect, { target: { value: 'saturday' } });

    expect(mockOnUpdate).toHaveBeenCalledWith({
      then_target: 'specific_weekday',
      then_weekday: 'saturday'
    });
  });
});
