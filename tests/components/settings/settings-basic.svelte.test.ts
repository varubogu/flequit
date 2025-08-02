import { describe, test, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import SettingsBasic from '$lib/components/settings/settings-basic.svelte';
import { settingsStore } from '$lib/stores/settings.svelte';
import { getTranslationService } from '$lib/stores/locale.svelte';
import { createUnitTestTranslationService } from '../../unit-translation-mock';

// getTranslationServiceのモック化
vi.mock('$lib/stores/locale.svelte', async () => {
  const actual = await vi.importActual('$lib/stores/locale.svelte');
  return {
    ...actual,
    getTranslationService: vi.fn(() => createUnitTestTranslationService()),
    reactiveMessage: (fn: () => string) => fn
  };
});

// Mock settings store
vi.mock('$lib/stores/settings.svelte', async (importOriginal) => {
  const original = (await importOriginal()) as Record<string, unknown>;
  return {
    ...original,
    settingsStore: {
      setTimezone: vi.fn(),
      effectiveTimezone: 'UTC'
    },
    getAvailableTimezones: vi.fn(() => [
      { value: 'UTC', label: 'UTC' },
      { value: 'America/New_York', label: 'Eastern Time' },
      { value: 'Asia/Tokyo', label: 'Japan Time' }
    ])
  };
});

const mockSettingsStore = vi.mocked(settingsStore);
const mockedGetTranslationService = vi.mocked(getTranslationService);

// モック関数として作成
const mockSetLocale = vi.fn();
const mockTranslationService = {
  ...createUnitTestTranslationService(),
  setLocale: mockSetLocale
};

describe('SettingsBasic Component', () => {
  const defaultSettings = {
    weekStart: 'sunday',
    timezone: 'UTC',
    dateFormat: 'yyyy年MM月dd日(E) HH:mm:ss',
    customDueDays: []
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockSetLocale.mockClear();
    mockedGetTranslationService.mockReturnValue(mockTranslationService);
  });

  test('should render general settings section', () => {
    render(SettingsBasic, { settings: defaultSettings });

    expect(screen.getByText('TEST_GENERAL_SETTINGS')).toBeInTheDocument();
    expect(screen.getByLabelText('TEST_LANGUAGE')).toBeInTheDocument();
    expect(screen.getByLabelText('TEST_WEEK_STARTS_ON')).toBeInTheDocument();
    expect(screen.getByLabelText('TEST_TIMEZONE')).toBeInTheDocument();
  });

  test('should display week start options', () => {
    render(SettingsBasic, { settings: defaultSettings });

    const weekStartSelect = screen.getByLabelText('Week starts on');
    expect(weekStartSelect).toBeInTheDocument();

    const options = weekStartSelect.querySelectorAll('option');
    expect(options[0]).toHaveTextContent('Sunday');
    expect(options[1]).toHaveTextContent('Monday');
  });

  test('should display available timezones', () => {
    render(SettingsBasic, { settings: defaultSettings });

    const timezoneSelect = screen.getByLabelText('Timezone');
    expect(timezoneSelect).toBeInTheDocument();

    expect(screen.getByText('UTC')).toBeInTheDocument();
    expect(screen.getByText('Eastern Time')).toBeInTheDocument();
    expect(screen.getByText('Japan Time')).toBeInTheDocument();
  });

  test('should show effective timezone info', () => {
    render(SettingsBasic, { settings: defaultSettings });

    expect(screen.getByText(/Current effective timezone: UTC/)).toBeInTheDocument();
  });

  test('should render week start select with correct value', () => {
    const settings = { ...defaultSettings, weekStart: 'monday' };
    render(SettingsBasic, { settings });

    const weekStartSelect = screen.getByLabelText('Week starts on') as HTMLSelectElement;
    expect(weekStartSelect.value).toBe('monday');
  });

  test('should render timezone select with correct value', () => {
    const settings = { ...defaultSettings, timezone: 'Asia/Tokyo' };
    render(SettingsBasic, { settings });

    const timezoneSelect = screen.getByLabelText('Timezone') as HTMLSelectElement;
    expect(timezoneSelect.value).toBe('Asia/Tokyo');
  });

  test('should call settingsStore.setTimezone when timezone changes', async () => {
    const settings = { ...defaultSettings, timezone: 'America/New_York' };
    render(SettingsBasic, { settings });

    expect(mockSettingsStore.setTimezone).toHaveBeenCalledWith('America/New_York');
  });

  test('should render custom due date section', () => {
    render(SettingsBasic, { settings: defaultSettings });

    expect(screen.getByRole('button', { name: 'Add custom due date' })).toBeInTheDocument();
  });

  test('should handle add custom due day click', async () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    render(SettingsBasic, { settings: defaultSettings });

    const addButton = screen.getByRole('button', { name: 'Add custom due date' });
    await fireEvent.click(addButton);

    expect(consoleSpy).toHaveBeenCalledWith('Add custom due day');
    consoleSpy.mockRestore();
  });

  test('should have correct default values', () => {
    render(SettingsBasic, { settings: defaultSettings });

    const weekStartSelect = screen.getByLabelText('Week starts on') as HTMLSelectElement;
    const timezoneSelect = screen.getByLabelText('Timezone') as HTMLSelectElement;

    expect(weekStartSelect.value).toBe('sunday');
    expect(timezoneSelect.value).toBe('UTC');
  });

  test('should display language options', () => {
    render(SettingsBasic, { settings: defaultSettings });

    const languageSelect = screen.getByLabelText('Language');
    expect(languageSelect).toBeInTheDocument();

    expect(screen.getByText('English')).toBeInTheDocument();
    expect(screen.getByText('日本語')).toBeInTheDocument();
  });

  test('should render language select with current locale', () => {
    // Japanese locale用のモックサービスを作成
    const jaTranslationService = {
      ...mockTranslationService,
      getCurrentLocale: () => 'ja'
    };
    mockedGetTranslationService.mockReturnValue(jaTranslationService);
    render(SettingsBasic, { settings: defaultSettings });

    const languageSelect = screen.getByLabelText('TEST_LANGUAGE') as HTMLSelectElement;
    expect(languageSelect.value).toBe('ja');
  });

  test('should call translationService.setLocale when language changes', async () => {
    render(SettingsBasic, { settings: defaultSettings });

    const languageSelect = screen.getByLabelText('TEST_LANGUAGE') as HTMLSelectElement;
    await fireEvent.change(languageSelect, { target: { value: 'ja' } });

    expect(mockSetLocale).toHaveBeenCalledWith('ja');
  });

  test('should not call translationService.setLocale for invalid locale', async () => {
    render(SettingsBasic, { settings: defaultSettings });

    const languageSelect = screen.getByLabelText('TEST_LANGUAGE') as HTMLSelectElement;
    await fireEvent.change(languageSelect, { target: { value: 'invalid' } });

    expect(mockSetLocale).not.toHaveBeenCalled();
  });
});
