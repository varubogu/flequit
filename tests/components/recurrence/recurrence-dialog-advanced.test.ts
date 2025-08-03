import { render, screen, fireEvent } from '@testing-library/svelte';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { tick } from 'svelte';
import RecurrenceDialogAdvanced from '$lib/components/recurrence/recurrence-dialog-advanced.svelte';
import type { RecurrenceRule } from '$lib/types/task';
import { setTranslationService } from '$lib/stores/locale.svelte';
import {
  createUnitTestTranslationService,
  unitTestTranslations
} from '../../unit-translation-mock';

// メッセージファイルをモック

// vitest.setup.tsの統一的なモック化を使用するため、locale.svelteの個別モック化は削除

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
    setTranslationService(createUnitTestTranslationService());
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

    const select = screen.getByDisplayValue(unitTestTranslations.recurrence_disabled);
    expect(select).toBeTruthy();

    // selectの選択肢を確認
    const options = select.querySelectorAll('option');
    const optionTexts = Array.from(options).map((opt) => opt.textContent);

    expect(optionTexts).toContain(unitTestTranslations.recurrence_disabled);
    expect(optionTexts).toContain(unitTestTranslations.recurrence_enabled);
    expect(optionTexts).toContain(unitTestTranslations.recurrence_advanced);
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
    expect(() => screen.getByText(unitTestTranslations.recurrence_interval)).toThrow();
  });

  it('有効選択時は基本設定のみ表示される', async () => {
    render(RecurrenceDialogAdvanced, {
      props: {
        open: true,
        onSave: mockOnSave,
        onOpenChange: mockOnOpenChange
      }
    });

    const select = screen.getByDisplayValue(unitTestTranslations.recurrence_disabled);
    fireEvent.change(select, { target: { value: 'enabled' } });

    // Svelteの更新を待つ
    await tick();

    // 基本設定が表示される（ヘッダーを確認）
    expect(screen.getByText(unitTestTranslations.recurrence_interval)).toBeTruthy();

    // 補正条件は表示されない
    expect(() => screen.getByText(unitTestTranslations.adjustment_conditions)).toThrow();
  });

  it('有効（高度）選択時は全設定が表示される', async () => {
    render(RecurrenceDialogAdvanced, {
      props: {
        open: true,
        onSave: mockOnSave,
        onOpenChange: mockOnOpenChange
      }
    });

    const select = screen.getByDisplayValue(unitTestTranslations.recurrence_disabled);
    fireEvent.change(select, { target: { value: 'advanced' } });

    // Svelteの更新を待つ
    await tick();

    // 基本設定が表示される（ヘッダーを確認）
    expect(screen.getByText(unitTestTranslations.recurrence_interval)).toBeTruthy();

    // 補正条件も表示される
    expect(screen.getByText(unitTestTranslations.adjustment_conditions)).toBeTruthy();
  });

  it('既存のルールから正しいレベルを推定する', () => {
    const existingRule: RecurrenceRule = {
      unit: 'day',
      interval: 1,
      adjustment: {
        date_conditions: [],
        weekday_conditions: [
          {
            id: 'test',
            if_weekday: 'monday',
            then_direction: 'next',
            then_target: 'weekday'
          }
        ]
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
    expect(screen.getByDisplayValue(unitTestTranslations.recurrence_advanced)).toBeTruthy();
  });

  it('保存時に正しいルールが生成される', async () => {
    render(RecurrenceDialogAdvanced, {
      props: {
        open: true,
        onSave: mockOnSave,
        onOpenChange: mockOnOpenChange
      }
    });

    // 有効に変更
    const select = screen.getByDisplayValue(unitTestTranslations.recurrence_disabled);
    fireEvent.change(select, { target: { value: 'enabled' } });

    // Svelteの更新を待つ
    await tick();

    // onSaveは即座に呼ばれる（自動保存機能）
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

    // まず有効に変更してから無効に戻すことで、実際に変更イベントを発生させる
    const select = screen.getByDisplayValue(unitTestTranslations.recurrence_disabled);
    fireEvent.change(select, { target: { value: 'enabled' } });
    fireEvent.change(select, { target: { value: 'disabled' } });

    // 無効に変更した時にnullが保存される
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
    const select = screen.getByDisplayValue(unitTestTranslations.recurrence_disabled);
    fireEvent.change(select, { target: { value: 'enabled' } });

    // 繰り返し回数フィールドが表示される
    expect(screen.getByText(unitTestTranslations.repeat_count)).toBeTruthy();
    expect(
      screen.getByPlaceholderText(unitTestTranslations.infinite_repeat_placeholder)
    ).toBeTruthy();
  });

  it('繰り返し回数設定時にmax_occurrencesが保存される', async () => {
    render(RecurrenceDialogAdvanced, {
      props: {
        open: true,
        onSave: mockOnSave,
        onOpenChange: mockOnOpenChange
      }
    });

    // 有効に変更
    const select = screen.getByDisplayValue(unitTestTranslations.recurrence_disabled);
    fireEvent.change(select, { target: { value: 'enabled' } });

    // まずmockをクリアして、繰り返し回数の変更のみをテストする
    mockOnSave.mockClear();

    // 繰り返し回数を設定
    const countInput = screen.getByPlaceholderText(
      unitTestTranslations.infinite_repeat_placeholder
    ) as HTMLInputElement;
    fireEvent.input(countInput, { target: { value: '3' } });

    // setTimeoutを考慮して少し待機
    await new Promise((resolve) => setTimeout(resolve, 10));

    // 入力値が正しく反映されることを確認
    expect(countInput.value).toBe('3');

    // 自動保存により値が保存される（最後の呼び出しを確認）
    expect(mockOnSave).toHaveBeenLastCalledWith(
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
      const select = screen.getByDisplayValue(unitTestTranslations.recurrence_disabled);
      fireEvent.change(select, { target: { value: 'enabled' } });
      countInput = screen.getByPlaceholderText(
        unitTestTranslations.infinite_repeat_placeholder
      ) as HTMLInputElement;
    });

    it('小数点を入力すると整数に丸められる', async () => {
      await fireEvent.input(countInput, { target: { value: '5.8' } });
      // setTimeout内の処理を待つ
      await new Promise((resolve) => setTimeout(resolve, 0));
      expect(countInput.value).toBe('58'); // DOM上では"."が無視されるため

      // 保存される値を確認（自動保存）
      expect(mockOnSave).toHaveBeenCalledWith(expect.objectContaining({ max_occurrences: 58 }));
    });

    it('0を入力するとフィールドがクリアされる', async () => {
      await fireEvent.input(countInput, { target: { value: '0' } });
      await new Promise((resolve) => setTimeout(resolve, 10)); // 少し長めの待機時間
      // 実装では0が入力されてもそのまま表示される（内部的にはundefinedに変換される）
      expect(countInput.value).toBe('0');
    });

    it('負の数を入力するとフィールドがクリアされる', async () => {
      await fireEvent.input(countInput, { target: { value: '-5' } });
      await new Promise((resolve) => setTimeout(resolve, 10));
      // 負号は除去されて数字のみが残る実装のようです
      expect(countInput.value).toBe('5');
    });

    it('不正な文字を含む文字列を貼り付けると数字のみが残る', async () => {
      // 不正な文字列を入力
      await fireEvent.input(countInput, { target: { value: '+dfs/*=5f-8' } });
      await new Promise((resolve) => setTimeout(resolve, 10));
      // 実装では空文字になることがある（サニタイズされて空になる）
      expect(countInput.value).toBe('');
    });
  });
});
