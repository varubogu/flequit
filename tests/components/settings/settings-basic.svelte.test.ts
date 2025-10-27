import { beforeEach, afterAll, describe, expect, test, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import SettingsBasic from '$lib/components/settings/basic/settings-basic.svelte';
import type {
  ITranslationServiceWithNotification
} from '$lib/services/translation-service';
import { setTranslationService, getTranslationService, localeStore } from '$lib/stores/locale.svelte';
import { createUnitTestTranslationService } from '../../unit-translation-mock';
import type { WeekStart } from '$lib/types/settings';

type SupportedLocale = 'en' | 'ja';

const supportedLocales: readonly SupportedLocale[] = ['en', 'ja'];

type SettingsSnapshot = {
  language: SupportedLocale;
  weekStart: WeekStart;
  timezone: string;
  dateFormat: string;
  effectiveTimezone: string;
};

function createInitialSettingsState(): SettingsSnapshot {
  return {
    language: 'en',
    weekStart: 'sunday',
    timezone: 'UTC',
    dateFormat: 'yyyy年MM月dd日(E) HH:mm:ss',
    effectiveTimezone: 'UTC'
  } satisfies SettingsSnapshot;
}

function getDefaultAvailableTimezones() {
  return [
    { value: 'UTC', label: 'UTC' },
    { value: 'America/New_York', label: 'Eastern Time' },
    { value: 'Asia/Tokyo', label: 'Japan Time' }
  ] as const;
}

function createSettingsStoreMock() {
  const initialState = createInitialSettingsState();
  const availableTimezones = getDefaultAvailableTimezones();
  const store = {
    ...initialState,
    customDateFormats: [] as { id: string; name: string; format: string }[],
    timeLabels: [] as { id: string; name: string; time: string }[],
    setLanguage: vi.fn((language: SupportedLocale) => {
      store.language = language;
    }),
    setWeekStart: vi.fn((weekStart: WeekStart) => {
      store.weekStart = weekStart;
    }),
    setTimezone: vi.fn((timezone: string) => {
      store.timezone = timezone;
      store.effectiveTimezone = timezone === 'system' ? 'UTC' : timezone;
    }),
    setDateFormat: vi.fn((format: string) => {
      store.dateFormat = format;
    }),
    addTimeLabel: vi.fn((name: string, time: string) => {
      const id = crypto.randomUUID();
      store.timeLabels.push({ id, name, time });
      return id;
    }),
    updateTimeLabel: vi.fn((id: string, updates: Partial<{ name: string; time: string }>) => {
      store.timeLabels = store.timeLabels.map((label) =>
        label.id === id ? { ...label, ...updates } : label
      );
    }),
    removeTimeLabel: vi.fn((id: string) => {
      store.timeLabels = store.timeLabels.filter((label) => label.id !== id);
    })
  };
  return store;
}

vi.mock('$lib/stores/settings.svelte', () => ({
  settingsStore: createSettingsStoreMock(),
  getAvailableTimezones: vi.fn(() => getDefaultAvailableTimezones())
}));

const { settingsStore, getAvailableTimezones } = await import('$lib/stores/settings.svelte');
const mockSettingsStore = vi.mocked(settingsStore);
const getAvailableTimezonesMock = vi.mocked(getAvailableTimezones);

const resetSettingsStore = () => {
  const initialState = createInitialSettingsState();
  mockSettingsStore.language = initialState.language;
  mockSettingsStore.weekStart = initialState.weekStart;
  mockSettingsStore.timezone = initialState.timezone;
  mockSettingsStore.dateFormat = initialState.dateFormat;
  mockSettingsStore.effectiveTimezone = initialState.effectiveTimezone;
  mockSettingsStore.customDateFormats = [];
  mockSettingsStore.timeLabels = [];
  mockSettingsStore.setLanguage.mockClear();
  mockSettingsStore.setWeekStart.mockClear();
  mockSettingsStore.setTimezone.mockClear();
  mockSettingsStore.setDateFormat.mockClear();
  mockSettingsStore.addTimeLabel.mockClear();
  mockSettingsStore.updateTimeLabel.mockClear();
  mockSettingsStore.removeTimeLabel.mockClear();
};

const unitTranslationService = createUnitTestTranslationService();

let currentLocale: SupportedLocale = 'en';

const getCurrentLocaleMock = vi.fn(() => currentLocale);
const setLocaleMock = vi.fn((locale: string) => {
    if (supportedLocales.includes(locale as SupportedLocale)) {
      currentLocale = locale as SupportedLocale;
    }
  });
const getAvailableLocalesMock = vi.fn(() => supportedLocales);
const subscribeMock = vi.fn(() => () => {});

const mockTranslationService: ITranslationServiceWithNotification = {
  getCurrentLocale: getCurrentLocaleMock,
  setLocale: setLocaleMock,
  getAvailableLocales: getAvailableLocalesMock,
  reactiveMessage: unitTranslationService.reactiveMessage,
  getMessage: unitTranslationService.getMessage,
  subscribe: subscribeMock
};

const originalTranslationService = getTranslationService();

const defaultSettings = {
  weekStart: 'sunday',
  timezone: 'UTC',
  dateFormat: 'yyyy年MM月dd日(E) HH:mm:ss',
  customDueDays: [] as number[]
};

beforeEach(() => {
  resetSettingsStore();
  currentLocale = 'en';
  getCurrentLocaleMock.mockClear();
  setLocaleMock.mockClear();
  getAvailableLocalesMock.mockClear();
  subscribeMock.mockClear();
  getAvailableTimezonesMock.mockClear();
  setTranslationService(mockTranslationService);
});

afterAll(() => {
  setTranslationService(originalTranslationService);
});

describe('SettingsBasic Component', () => {
  test('should render general settings section', () => {
    render(SettingsBasic, { settings: defaultSettings });

    expect(screen.getByText('TEST_GENERAL_SETTINGS')).toBeInTheDocument();
    expect(screen.getByLabelText('TEST_LANGUAGE')).toBeInTheDocument();
    expect(screen.getByLabelText('TEST_WEEK_STARTS_ON')).toBeInTheDocument();
    expect(screen.getByLabelText('TEST_TIMEZONE')).toBeInTheDocument();
  });

  test('should display week start options', () => {
    render(SettingsBasic, { settings: defaultSettings });

    const weekStartSelect = screen.getByLabelText('TEST_WEEK_STARTS_ON');
    expect(weekStartSelect).toBeInTheDocument();

    const options = weekStartSelect.querySelectorAll('option');
    expect(options[0]).toHaveTextContent('TEST_SUNDAY');
    expect(options[1]).toHaveTextContent('TEST_MONDAY');
  });

  test('should display available timezones', () => {
    render(SettingsBasic, { settings: defaultSettings });

    const timezoneSelect = screen.getByLabelText('TEST_TIMEZONE');
    expect(timezoneSelect).toBeInTheDocument();

    expect(screen.getByText('UTC')).toBeInTheDocument();
    expect(screen.getByText('Eastern Time')).toBeInTheDocument();
    expect(screen.getByText('Japan Time')).toBeInTheDocument();
    expect(getAvailableTimezonesMock).toHaveBeenCalled();
  });

  test('should show effective timezone info', () => {
    render(SettingsBasic, { settings: defaultSettings });

    expect(screen.getByText(/TEST_CURRENT_EFFECTIVE_TIMEZONE: UTC/)).toBeInTheDocument();
  });

  test('should render week start select with correct value', () => {
    const settings = { ...defaultSettings, weekStart: 'monday' };
    mockSettingsStore.weekStart = 'monday';
    render(SettingsBasic, { settings });

    const weekStartSelect = screen.getByLabelText('TEST_WEEK_STARTS_ON') as HTMLSelectElement;
    expect(weekStartSelect.value).toBe('monday');
  });

  test('should render timezone select with correct value', () => {
    const settings = { ...defaultSettings, timezone: 'Asia/Tokyo' };
    mockSettingsStore.timezone = 'Asia/Tokyo';
    mockSettingsStore.effectiveTimezone = 'Asia/Tokyo';
    render(SettingsBasic, { settings });

    const timezoneSelect = screen.getByLabelText('TEST_TIMEZONE') as HTMLSelectElement;
    expect(timezoneSelect.value).toBe('Asia/Tokyo');
  });

  test('should call settingsStore.setWeekStart when week start changes', async () => {
    render(SettingsBasic, { settings: defaultSettings });

    const weekStartSelect = screen.getByLabelText('TEST_WEEK_STARTS_ON') as HTMLSelectElement;
    await fireEvent.change(weekStartSelect, { target: { value: 'monday' } });

    expect(mockSettingsStore.setWeekStart).toHaveBeenCalledWith('monday');
    expect(mockSettingsStore.weekStart).toBe('monday');
  });

  test('should call settingsStore.setTimezone when timezone changes', async () => {
    render(SettingsBasic, { settings: defaultSettings });

    const timezoneSelect = screen.getByLabelText('TEST_TIMEZONE') as HTMLSelectElement;
    await fireEvent.change(timezoneSelect, { target: { value: 'Asia/Tokyo' } });

    expect(mockSettingsStore.setTimezone).toHaveBeenCalledWith('Asia/Tokyo');
    expect(mockSettingsStore.timezone).toBe('Asia/Tokyo');
    expect(mockSettingsStore.effectiveTimezone).toBe('Asia/Tokyo');
  });

  test('should call settingsStore.setDateFormat when date format changes', async () => {
    render(SettingsBasic, { settings: defaultSettings });

    const dateFormatInput = screen.getByLabelText('TEST_DATE_FORMAT') as HTMLInputElement;
    await fireEvent.input(dateFormatInput, { target: { value: 'yyyy-MM-dd' } });

    expect(mockSettingsStore.setDateFormat).toHaveBeenCalledWith('yyyy-MM-dd');
    expect(mockSettingsStore.dateFormat).toBe('yyyy-MM-dd');
  });

  test('should render custom due date section', () => {
    render(SettingsBasic, { settings: defaultSettings });

    expect(screen.getByRole('button', { name: 'TEST_ADD_CUSTOM_DUE_DATE' })).toBeInTheDocument();
  });

  test('should have correct default values', () => {
    render(SettingsBasic, { settings: defaultSettings });

    const weekStartSelect = screen.getByLabelText('TEST_WEEK_STARTS_ON') as HTMLSelectElement;
    const timezoneSelect = screen.getByLabelText('TEST_TIMEZONE') as HTMLSelectElement;

    expect(weekStartSelect.value).toBe('sunday');
    expect(timezoneSelect.value).toBe('UTC');
  });

  test('should display language options', () => {
    render(SettingsBasic, { settings: defaultSettings });

    const languageSelect = screen.getByLabelText('TEST_LANGUAGE');
    expect(languageSelect).toBeInTheDocument();

    expect(screen.getByText('English')).toBeInTheDocument();
    expect(screen.getByText('日本語')).toBeInTheDocument();
  });

  test('should render language select with default locale', () => {
    render(SettingsBasic, { settings: defaultSettings });

    const languageSelect = screen.getByLabelText('TEST_LANGUAGE') as HTMLSelectElement;
    expect(languageSelect.value).toBe('en');
  });

  test('should call localeStore.setLocale and settingsStore.setLanguage when language changes', async () => {
    render(SettingsBasic, { settings: defaultSettings });

    const languageSelect = screen.getByLabelText('TEST_LANGUAGE') as HTMLSelectElement;
    const localeSpy = vi.spyOn(localeStore, 'setLocale');

    await fireEvent.change(languageSelect, { target: { value: 'ja' } });

    expect(localeSpy).toHaveBeenCalledWith('ja');
    expect(mockSettingsStore.setLanguage).toHaveBeenCalledWith('ja');
    expect(mockTranslationService.setLocale).toHaveBeenCalledWith('ja');
    expect(currentLocale).toBe('ja');

    localeSpy.mockRestore();
  });

  test('should not update locale for unsupported language', async () => {
    render(SettingsBasic, { settings: defaultSettings });

    const languageSelect = screen.getByLabelText('TEST_LANGUAGE') as HTMLSelectElement;
    const localeSpy = vi.spyOn(localeStore, 'setLocale');

    await fireEvent.change(languageSelect, { target: { value: 'invalid' } });

    expect(localeSpy).not.toHaveBeenCalled();
    expect(mockSettingsStore.setLanguage).not.toHaveBeenCalled();
    expect(mockTranslationService.setLocale).not.toHaveBeenCalled();
    expect(currentLocale).toBe('en');

    localeSpy.mockRestore();
  });
});
