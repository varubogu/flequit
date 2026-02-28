import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/svelte';
import SettingsDateFormatSection from '$lib/components/settings/basic/settings-date-format-section.svelte';
import { createUnitTestTranslationService } from '../../../unit-translation-mock';
import { getTranslationService, setTranslationService } from '$lib/stores/locale.svelte';

function createSettingsStoreMock() {
  return {
    setDateFormat: vi.fn()
  };
}

vi.mock('$lib/stores/settings.svelte', () => ({
  settingsStore: createSettingsStoreMock(),
  getAvailableTimezones: vi.fn(() => [])
}));

const { settingsStore } = await import('$lib/stores/settings.svelte');
const mockSettingsStore = vi.mocked(settingsStore);

const originalTranslationService = getTranslationService();

describe('SettingsDateFormatSection', () => {
  beforeEach(() => {
    setTranslationService(createUnitTestTranslationService());
    mockSettingsStore.setDateFormat.mockClear();
  });

  afterAll(() => {
    setTranslationService(originalTranslationService);
  });

  it('日付フォーマット入力とプレビューを表示する', () => {
    render(SettingsDateFormatSection, {
      props: {
        dateFormat: 'yyyy-MM-dd HH:mm:ss'
      }
    });

    expect(screen.getByLabelText('TEST_DATE_FORMAT')).toBeInTheDocument();
    expect(screen.getByText('TEST_PREVIEW:')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'TEST_EDIT_DATE_FORMAT' })).toBeInTheDocument();
    expect(screen.queryByText('Invalid format')).not.toBeInTheDocument();
  });

  it('入力変更時に settingsStore.setDateFormat を呼ぶ', async () => {
    render(SettingsDateFormatSection, {
      props: {
        dateFormat: 'yyyy-MM-dd'
      }
    });

    await fireEvent.input(screen.getByLabelText('TEST_DATE_FORMAT'), {
      target: { value: 'yyyy/MM/dd' }
    });

    expect(mockSettingsStore.setDateFormat).toHaveBeenCalledWith('yyyy/MM/dd');
  });

  it('編集ボタンを表示する', () => {
    render(SettingsDateFormatSection, {
      props: {
        dateFormat: 'yyyy-MM-dd'
      }
    });

    expect(screen.getByRole('button', { name: 'TEST_EDIT_DATE_FORMAT' })).toBeInTheDocument();
  });
});
