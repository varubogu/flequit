import { describe, test, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import SettingsBasic from '$lib/components/settings/settings-basic.svelte';
import { settingsStore, AVAILABLE_TIMEZONES } from '$lib/stores/settings.svelte';
import { getLocale, setLocale } from '$paraglide/runtime';
import { localeStore } from '$lib/stores/locale.svelte';

// Mock Paraglide runtime
vi.mock('$paraglide/runtime', () => ({
  getLocale: vi.fn(() => 'en'),
  setLocale: vi.fn(),
  locales: ['en', 'ja'],
  experimentalMiddlewareLocaleSplitting: false,
  trackMessageCall: vi.fn()
}));

// Mock locale store
vi.mock('$lib/stores/locale.svelte', () => ({
  localeStore: {
    locale: 'en',
    setLocale: vi.fn()
  },
  reactiveMessage: (fn: any) => fn
}));

// Mock settings store
vi.mock('$lib/stores/settings.svelte', async (importOriginal) => {
  const original = await importOriginal() as any;
  return {
    ...original,
    settingsStore: {
      setTimezone: vi.fn(),
      effectiveTimezone: 'UTC'
    },
    AVAILABLE_TIMEZONES: [
      { value: 'UTC', label: 'UTC' },
      { value: 'America/New_York', label: 'Eastern Time' },
      { value: 'Asia/Tokyo', label: 'Japan Time' }
    ]
  };
});

const mockSettingsStore = vi.mocked(settingsStore);
const mockGetLocale = vi.mocked(getLocale);
const mockSetLocale = vi.mocked(setLocale);
const mockLocaleStore = vi.mocked(localeStore);

describe('SettingsBasic Component', () => {
  const defaultSettings = {
    weekStart: 'sunday',
    timezone: 'UTC',
    customDueDays: []
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockGetLocale.mockReturnValue('en');
  });

  test('should render general settings section', () => {
    render(SettingsBasic, { settings: defaultSettings });
    
    expect(screen.getByText('General Settings')).toBeInTheDocument();
    expect(screen.getByLabelText('Language')).toBeInTheDocument();
    expect(screen.getByLabelText('Week starts on')).toBeInTheDocument();
    expect(screen.getByLabelText('Timezone')).toBeInTheDocument();
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
    mockLocaleStore.locale = 'ja';
    render(SettingsBasic, { settings: defaultSettings });
    
    const languageSelect = screen.getByLabelText('Language') as HTMLSelectElement;
    expect(languageSelect.value).toBe('ja');
  });

  test('should call localeStore.setLocale when language changes', async () => {
    render(SettingsBasic, { settings: defaultSettings });
    
    const languageSelect = screen.getByLabelText('Language') as HTMLSelectElement;
    await fireEvent.change(languageSelect, { target: { value: 'ja' } });
    
    expect(mockLocaleStore.setLocale).toHaveBeenCalledWith('ja');
  });

  test('should not call localeStore.setLocale for invalid locale', async () => {
    render(SettingsBasic, { settings: defaultSettings });
    
    const languageSelect = screen.getByLabelText('Language') as HTMLSelectElement;
    await fireEvent.change(languageSelect, { target: { value: 'invalid' } });
    
    expect(mockLocaleStore.setLocale).not.toHaveBeenCalled();
  });
});