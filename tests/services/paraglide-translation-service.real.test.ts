import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.unmock('$lib/services/paraglide-translation-service.svelte');

const { runtimeState, settingsInitService, backendApi, resolveBackend } = vi.hoisted(() => {
  let currentLocale = 'en';
  const settings = {
    getAllSettings: vi.fn(async () => ({}) as Record<string, unknown>),
    getSettingByKey: vi.fn((_settings: unknown, _key: string) => null as { value: string } | null)
  };
  const backend = {
    updateSettingsPartially: vi.fn(async () => undefined)
  };
  return {
    runtimeState: {
      getLocale: () => currentLocale,
      setLocale: (locale: string) => {
        currentLocale = locale;
      }
    },
    settingsInitService: settings,
    backendApi: backend,
    resolveBackend: vi.fn(async () => ({ settingsManagement: backend }) as { settingsManagement: typeof backend } | null)
  };
});

vi.mock('$paraglide/runtime', () => ({
  getLocale: () => runtimeState.getLocale(),
  setLocale: (locale: string) => {
    runtimeState.setLocale(locale);
  },
  locales: ['en', 'ja']
}));

vi.mock('$paraglide/messages.js', () => ({
  test_message: () => 'Test Message'
}));

vi.mock('$lib/services/domain/settings', () => ({
  settingsInitService
}));

vi.mock('$lib/infrastructure/backend-client', () => ({
  resolveBackend
}));

describe('ParaglideTranslationService', () => {
  type Service = {
    getCurrentLocale: () => string;
    setLocale: (locale: string) => void;
    reactiveMessage: <T extends (...args: unknown[]) => string>(messageFn: T) => T;
    getMessage: (key: string, params?: Record<string, unknown>) => () => string;
    getAvailableLocales: () => readonly string[];
    subscribe: (callback: (locale: string) => void) => () => void;
    init: () => Promise<void>;
    isInitialized: boolean;
    backendPromise: Promise<unknown> | null;
    messageMap: Record<string, (...args: unknown[]) => string>;
    loadLocale: () => Promise<void>;
    saveLocale: (locale: string) => Promise<void>;
  };

  let service: Service;

  beforeEach(async () => {
    vi.clearAllMocks();
    runtimeState.setLocale('en');
    const entries = new Map<string, string>();
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => entries.get(key) ?? null,
      setItem: (key: string, value: string) => {
        entries.set(key, String(value));
      },
      removeItem: (key: string) => {
        entries.delete(key);
      },
      clear: () => {
        entries.clear();
      }
    });
    localStorage.clear();
    settingsInitService.getAllSettings.mockResolvedValue({});
    settingsInitService.getSettingByKey.mockReturnValue(null);
    resolveBackend.mockResolvedValue({ settingsManagement: backendApi });
    backendApi.updateSettingsPartially.mockResolvedValue(undefined);
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});

    const module = await import('$lib/services/paraglide-translation-service.svelte');
    service = module.translationService as unknown as Service;
    await service.init();
  });

  it('reads the locale, lists locales, and wraps reactive messages', () => {
    expect(service.getCurrentLocale()).toBe('en');
    expect(service.getAvailableLocales()).toEqual(['en', 'ja']);

    const messageFn = vi.fn(() => 'hello');
    const reactive = service.reactiveMessage(messageFn);
    expect(reactive()).toBe('hello');
    expect(messageFn).toHaveBeenCalledOnce();
  });

  it('notifies subscribers only when the locale changes and persists it', async () => {
    const callback = vi.fn();
    const unsubscribe = service.subscribe(callback);

    service.setLocale('ja');
    await vi.waitFor(() => {
      expect(backendApi.updateSettingsPartially).toHaveBeenCalledWith({ language: 'ja' });
    });
    expect(service.getCurrentLocale()).toBe('ja');
    expect(callback).toHaveBeenCalledWith('ja');

    backendApi.updateSettingsPartially.mockClear();
    service.setLocale('ja');
    expect(callback).toHaveBeenCalledTimes(1);
    expect(backendApi.updateSettingsPartially).not.toHaveBeenCalled();

    unsubscribe();
    service.setLocale('en');
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('returns a translated message, the key when missing, and the key when translation throws', () => {
    service.messageMap = {
      hello: (...args: unknown[]) => {
        const name = (args[0] as { name?: string } | undefined)?.name;
        return `Hello ${name}`;
      },
      boom: () => {
        throw new Error('bad message');
      }
    };

    expect(service.getMessage('hello', { name: 'Ada' })()).toBe('Hello Ada');
    expect(service.getMessage('hello')()).toBe('Hello undefined');
    expect(service.getMessage('missing')()).toBe('missing');
    expect(service.getMessage('boom')()).toBe('boom');
  });

  it('skips persistence until initialization finishes', async () => {
    service.isInitialized = false;
    backendApi.updateSettingsPartially.mockClear();

    await service.saveLocale('ja');

    expect(backendApi.updateSettingsPartially).not.toHaveBeenCalled();
    service.isInitialized = true;
  });

  it('falls back to localStorage when persistence fails or the backend is missing', async () => {
    service.backendPromise = null;
    backendApi.updateSettingsPartially.mockImplementation(() => Promise.reject(new Error('offline')));

    await service.saveLocale('ja');
    expect(localStorage.getItem('flequit-locale')).toBe('ja');

    service.backendPromise = null;
    resolveBackend.mockImplementationOnce(async () => null);
    await service.saveLocale('en');
    expect(localStorage.getItem('flequit-locale')).toBe('en');
  });

  it('loads a stored language and ignores a missing language setting', async () => {
    settingsInitService.getSettingByKey.mockReturnValueOnce({ value: 'ja' });
    await service.loadLocale();
    expect(service.getCurrentLocale()).toBe('ja');

    settingsInitService.getSettingByKey.mockReturnValueOnce(null);
    runtimeState.setLocale('en');
    await service.loadLocale();
    expect(service.getCurrentLocale()).toBe('en');
  });

  it('restores a valid locale from localStorage when settings cannot be loaded', async () => {
    settingsInitService.getAllSettings.mockImplementation(() => Promise.reject(new Error('settings down')));
    localStorage.setItem('flequit-locale', 'ja');

    await service.loadLocale();
    expect(service.getCurrentLocale()).toBe('ja');

    localStorage.setItem('flequit-locale', 'fr');
    runtimeState.setLocale('en');
    await service.loadLocale();
    expect(service.getCurrentLocale()).toBe('en');

    localStorage.removeItem('flequit-locale');
    await service.loadLocale();
    expect(service.getCurrentLocale()).toBe('en');
  });
});
