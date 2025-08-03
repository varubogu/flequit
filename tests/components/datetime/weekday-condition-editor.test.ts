import { render, screen, fireEvent } from '@testing-library/svelte';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import WeekdayConditionEditor from '$lib/components/datetime/weekday-condition-editor.svelte';
import type { WeekdayCondition } from '$lib/types/task';
import { setTranslationService } from '$lib/stores/locale.svelte';
import {
  createJapaneseTestTranslationService,
  createUnitTestTranslationService,
  unitTestTranslations
} from '../../unit-translation-mock';

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
    // 日本語モードでテストを実行
    setTranslationService(createJapaneseTestTranslationService());
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
    // 英語モードでテストを実行
    setTranslationService(createUnitTestTranslationService('en'));

    render(WeekdayConditionEditor, {
      props: {
        condition: mockCondition,
        onUpdate: mockOnUpdate,
        onRemove: mockOnRemove
      }
    });

    // 英語モードでは: If [条件], move to [方向] [対象]
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
    const directionSelect = selects.find((select) => {
      const options = select.querySelectorAll('option');
      return Array.from(options).some(
        (option) =>
          option.textContent === unitTestTranslations.previous ||
          option.textContent === unitTestTranslations.next
      );
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
