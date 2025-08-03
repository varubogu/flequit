import { render, screen, fireEvent } from '@testing-library/svelte';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import DayTargetSelector from '$lib/components/datetime/day-target-selector.svelte';
import type { DayOfWeek, AdjustmentTarget } from '$lib/types/task';
import { setTranslationService } from '$lib/stores/locale.svelte';
import {
  createUnitTestTranslationService,
  unitTestTranslations
} from '../../unit-translation-mock';

describe('DayTargetSelector', () => {
  const mockOnChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    setTranslationService(createUnitTestTranslationService());
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

    expect(optionTexts).toContain(unitTestTranslations.monday);
    expect(optionTexts).toContain(unitTestTranslations.tuesday);
    expect(optionTexts).toContain(unitTestTranslations.wednesday);
    expect(optionTexts).toContain(unitTestTranslations.thursday);
    expect(optionTexts).toContain(unitTestTranslations.friday);
    expect(optionTexts).toContain(unitTestTranslations.saturday);
    expect(optionTexts).toContain(unitTestTranslations.sunday);
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

    expect(optionTexts).toContain(unitTestTranslations.weekday);
    expect(optionTexts).toContain(unitTestTranslations.weekend);
    expect(optionTexts).toContain(unitTestTranslations.weekend_only);
    expect(optionTexts).toContain(unitTestTranslations.non_weekend);
    expect(optionTexts).toContain(unitTestTranslations.holiday);
    expect(optionTexts).toContain(unitTestTranslations.non_holiday);
    expect(optionTexts).toContain(unitTestTranslations.weekend_holiday);
    expect(optionTexts).toContain(unitTestTranslations.non_weekend_holiday);
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
        value: 'invalid_value' as unknown as DayOfWeek | AdjustmentTarget,
        onchange: mockOnChange
      }
    });

    const select = screen.getByRole('combobox') as HTMLSelectElement;
    // selectは無効な値の場合空文字になることを確認
    expect(select.value).toBe('');
  });
});
