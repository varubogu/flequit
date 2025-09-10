import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { ITranslationServiceWithNotification } from '$lib/services/translation-service';

// Mock external dependencies
const mockGetLocale = vi.fn(() => 'en');
const mockSetLocale = vi.fn();
const mockLocales = ['en', 'ja'];

vi.mock('$paraglide/runtime', () => ({
  getLocale: mockGetLocale,
  setLocale: mockSetLocale,
  locales: mockLocales
}));

vi.mock('$paraglide/messages.js', () => ({
  test_message: vi.fn(() => 'Test Message'),
  hello: vi.fn((params: { name?: string } = {}) => `Hello ${params.name || 'World'}`),
  // Add unknown_key as undefined to test error handling
  unknown_key: undefined
}));

vi.mock('./backend', () => ({
  getBackendService: vi.fn(() =>
    Promise.resolve({
      setting: {
        update: vi.fn(() => Promise.resolve(true))
      }
    })
  )
}));

vi.mock('./settings-init-service', () => ({
  settingsInitService: {
    getAllSettings: vi.fn(() => Promise.resolve([])),
    getSettingByKey: vi.fn(() => null)
  }
}));

// localStorage mock
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn()
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

describe('ParaglideTranslationService (Singleton)', () => {
  let service: ITranslationServiceWithNotification;

  beforeEach(async () => {
    vi.clearAllMocks();

    // Reset all mocks
    mockGetLocale.mockReturnValue('en');
    mockSetLocale.mockImplementation(() => {});
    localStorageMock.getItem.mockReturnValue(null);

    // Import the singleton instance
    const module = await import('$lib/services/paraglide-translation-service.svelte');
    service = module.translationService;
  });

  describe('basic functionality', () => {
    it('should be defined and have required methods', () => {
      expect(service).toBeDefined();
      expect(typeof service.getCurrentLocale).toBe('function');
      expect(typeof service.setLocale).toBe('function');
      expect(typeof service.reactiveMessage).toBe('function');
      expect(typeof service.getMessage).toBe('function');
      expect(typeof service.getAvailableLocales).toBe('function');
      expect(typeof service.subscribe).toBe('function');
    });

    it('should return current locale from paraglide', () => {
      mockGetLocale.mockReturnValue('ja');

      const locale = service.getCurrentLocale();

      expect(locale).toBe('ja');
      expect(mockGetLocale).toHaveBeenCalled();
    });

    it('should set locale using paraglide', () => {
      mockGetLocale.mockReturnValue('en');

      service.setLocale('ja');

      expect(mockSetLocale).toHaveBeenCalledWith('ja', { reload: false });
    });

    it('should return available locales', () => {
      const locales = service.getAvailableLocales();

      expect(locales).toEqual(['en', 'ja']);
    });

    it('should handle subscriber management', () => {
      const callback = vi.fn();

      const unsubscribe = service.subscribe(callback);

      expect(typeof unsubscribe).toBe('function');

      // Test subscription works
      mockGetLocale.mockReturnValue('en');
      service.setLocale('ja');
      expect(callback).toHaveBeenCalledWith('ja');

      // Test unsubscribe works
      callback.mockClear();
      unsubscribe();
      service.setLocale('en');
      expect(callback).not.toHaveBeenCalled();
    });

    it('should create reactive message function', () => {
      const messageFn = vi.fn(() => 'Test');

      const reactiveMessageFn = service.reactiveMessage(messageFn);
      const result = reactiveMessageFn();

      expect(result).toBe('Test');
      expect(messageFn).toHaveBeenCalled();
    });

    it('should handle getMessage for known keys', () => {
      const messageGetter = service.getMessage('test_message');

      expect(typeof messageGetter).toBe('function');
    });

    it('should handle getMessage for known keys correctly', () => {
      const messageGetter = service.getMessage('test_message');
      const result = messageGetter();

      expect(result).toBe('Test Message');
    });

    it('should work without initialization errors', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => service.getCurrentLocale()).not.toThrow();

      consoleErrorSpy.mockRestore();
    });
  });

  describe('error handling', () => {
    it('should handle unknown message keys', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const messageGetter = service.getMessage('unknown_key');
      const result = messageGetter();

      expect(result).toBe('unknown_key');
      expect(consoleSpy).toHaveBeenCalledWith('Translation key not found: unknown_key');

      consoleSpy.mockRestore();
    });

    it('should not notify subscribers when locale is the same', () => {
      const callback = vi.fn();
      service.subscribe(callback);

      mockGetLocale.mockReturnValue('ja');
      service.setLocale('ja'); // Same locale

      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe('reactive behavior', () => {
    it('should call getCurrentLocale in reactive message', () => {
      const messageFn = vi.fn(() => 'Test');

      const reactiveMessageFn = service.reactiveMessage(messageFn);
      reactiveMessageFn();

      expect(mockGetLocale).toHaveBeenCalled();
    });

    it('should call getCurrentLocale in getMessage', () => {
      const messageGetter = service.getMessage('test_message');

      messageGetter();

      expect(mockGetLocale).toHaveBeenCalled();
    });
  });

  describe('parameter handling', () => {
    it('should handle message parameters correctly', () => {
      const messageGetter = service.getMessage('hello', { name: 'John' });

      expect(typeof messageGetter).toBe('function');
      // The actual parameter handling is done by paraglide mock
    });

    it('should handle empty parameters', () => {
      const messageGetter = service.getMessage('hello', {});

      expect(typeof messageGetter).toBe('function');
    });

    it('should handle no parameters', () => {
      const messageGetter = service.getMessage('test_message');

      expect(typeof messageGetter).toBe('function');
    });
  });
});
