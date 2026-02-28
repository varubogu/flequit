import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/svelte';
import SettingsGeneralSection from '$lib/components/settings/basic/settings-general-section.svelte';
import { createUnitTestTranslationService } from '../../../unit-translation-mock';
import {
  getTranslationService,
  localeStore,
  setTranslationService
} from '$lib/stores/locale.svelte';

function createSettingsStoreMock() {
  return {
    effectiveTimezone: 'UTC',
    setLanguage: vi.fn(),
    setWeekStart: vi.fn(),
    setTimezone: vi.fn()
  };
}

vi.mock('$lib/stores/settings.svelte', () => ({
  settingsStore: createSettingsStoreMock(),
  getAvailableTimezones: vi.fn(() => [
    { value: 'UTC', label: 'UTC' },
    { value: 'Asia/Tokyo', label: 'Japan Time' }
  ])
}));

const { settingsStore, getAvailableTimezones } = await import('$lib/stores/settings.svelte');
const mockSettingsStore = vi.mocked(settingsStore);
const getAvailableTimezonesMock = vi.mocked(getAvailableTimezones);

const originalTranslationService = getTranslationService();

describe('SettingsGeneralSection', () => {
  beforeEach(() => {
    setTranslationService(createUnitTestTranslationService());
    mockSettingsStore.effectiveTimezone = 'UTC';
    mockSettingsStore.setLanguage.mockClear();
    mockSettingsStore.setWeekStart.mockClear();
    mockSettingsStore.setTimezone.mockClear();
    getAvailableTimezonesMock.mockClear();
  });

  afterAll(() => {
    setTranslationService(originalTranslationService);
  });

  it('言語・週開始・タイムゾーンの設定項目を表示する', () => {
    render(SettingsGeneralSection, {
      props: {
        weekStart: 'sunday',
        timezone: 'UTC'
      }
    });

    expect(screen.getByLabelText('TEST_LANGUAGE')).toBeInTheDocument();
    expect(screen.getByLabelText('TEST_WEEK_STARTS_ON')).toBeInTheDocument();
    expect(screen.getByLabelText('TEST_TIMEZONE')).toBeInTheDocument();
    expect(screen.getByText(/TEST_CURRENT_EFFECTIVE_TIMEZONE: UTC/)).toBeInTheDocument();
    expect(getAvailableTimezonesMock).toHaveBeenCalled();
  });

  it('言語変更時に localeStore と settingsStore を更新する', async () => {
    const localeSpy = vi.spyOn(localeStore, 'setLocale');
    render(SettingsGeneralSection, {
      props: {
        weekStart: 'sunday',
        timezone: 'UTC'
      }
    });

    await fireEvent.change(screen.getByLabelText('TEST_LANGUAGE'), { target: { value: 'ja' } });

    expect(localeSpy).toHaveBeenCalledWith('ja');
    expect(mockSettingsStore.setLanguage).toHaveBeenCalledWith('ja');
    localeSpy.mockRestore();
  });

  it('週開始とタイムゾーン変更時にコールバックと settingsStore を更新する', async () => {
    const onWeekStartChange = vi.fn();
    const onTimezoneChange = vi.fn();

    render(SettingsGeneralSection, {
      props: {
        weekStart: 'sunday',
        timezone: 'UTC',
        onWeekStartChange,
        onTimezoneChange
      }
    });

    await fireEvent.change(screen.getByLabelText('TEST_WEEK_STARTS_ON'), {
      target: { value: 'monday' }
    });
    await fireEvent.change(screen.getByLabelText('TEST_TIMEZONE'), {
      target: { value: 'Asia/Tokyo' }
    });

    expect(onWeekStartChange).toHaveBeenCalledWith('monday');
    expect(mockSettingsStore.setWeekStart).toHaveBeenCalledWith('monday');
    expect(onTimezoneChange).toHaveBeenCalledWith('Asia/Tokyo');
    expect(mockSettingsStore.setTimezone).toHaveBeenCalledWith('Asia/Tokyo');
  });
});
