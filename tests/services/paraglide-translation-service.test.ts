import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ITranslationServiceWithNotification } from '$lib/services/translation-service';

const { runtimeState, messageHandlers } = vi.hoisted(() => {
  let currentLocale = 'en';

  const state = {
    getLocale: () => currentLocale,
    setLocale: (locale: string) => {
      currentLocale = locale;
    }
  };

  const handlers = {
    test_message: () => (state.getLocale() === 'en' ? 'Test Message' : 'テストメッセージ'),
    hello: ({ name }: { name: string }) =>
      state.getLocale() === 'en' ? `Hello ${name}` : `こんにちは ${name}`
  };

  return {
    runtimeState: state,
    messageHandlers: handlers
  };
});

vi.mock('$paraglide/runtime', () => ({
  __esModule: true,
  getLocale: runtimeState.getLocale,
  setLocale: (locale: string, _options?: { reload?: boolean }) => {
    runtimeState.setLocale(locale);
  },
  locales: ['en', 'ja']
}));

// $paraglide/messages.jsのモックは名前空間インポートとして動作する必要がある
vi.mock('$paraglide/messages.js', () => ({
  __esModule: true,
  test_message: messageHandlers.test_message,
  hello: messageHandlers.hello
}));

// settingsInitServiceのモックを追加
vi.mock('$lib/services/domain/settings', () => ({
  settingsInitService: {
    getAllSettings: vi.fn(() => Promise.resolve({})),
    getSettingByKey: vi.fn(() => null)
  }
}));

// resolveBackendのモック
vi.mock('$lib/infrastructure/backend-client', () => ({
  resolveBackend: vi.fn(() =>
    Promise.resolve({
      settingsManagement: {
        updateSettingsPartially: vi.fn(() => Promise.resolve())
      }
    })
  )
}));

const { translationService } = await import('$lib/services/paraglide-translation-service.svelte');

describe('ParaglideTranslationService (mocked singleton)', () => {
  let service: ITranslationServiceWithNotification;

  beforeEach(() => {
    service = translationService;
    service.setLocale('en');
  });

  it('exposes required API surface', () => {
    expect(typeof service.getCurrentLocale).toBe('function');
    expect(typeof service.setLocale).toBe('function');
    expect(typeof service.reactiveMessage).toBe('function');
    expect(typeof service.getMessage).toBe('function');
    expect(typeof service.getAvailableLocales).toBe('function');
    expect(typeof service.subscribe).toBe('function');
  });

  it('returns current locale and allows switching', () => {
    expect(service.getCurrentLocale()).toBe('en');
    service.setLocale('ja');
    expect(service.getCurrentLocale()).toBe('ja');
  });

  it('notifies subscribers only when locale actually changes', () => {
    const callback = vi.fn();
    const unsubscribe = service.subscribe(callback);

    service.setLocale('ja');
    expect(callback).toHaveBeenCalledWith('ja');

    callback.mockClear();
    service.setLocale('ja');
    expect(callback).not.toHaveBeenCalled();

    unsubscribe();
  });

  // FIXME: `import * as m` をVitestで正しくモックできないため、一時的にスキップ
  // reactiveMessage は getCurrentLocale() を参照して依存関係を作成するが、
  // テスト内で定義された messageFn は runtimeState を直接参照しており、
  // サービスの localeChangeCounter とは無関係なため正しく動作しない
  it.skip('provides memoised reactive messages', () => {
    const messageFn = vi.fn(() =>
      runtimeState.getLocale() === 'en' ? 'Test Message' : 'テストメッセージ'
    );
    const reactive = service.reactiveMessage(messageFn);

    expect(reactive()).toBe('Test Message');
    expect(messageFn).toHaveBeenCalledTimes(1);

    service.setLocale('ja');
    expect(reactive()).toBe('テストメッセージ');
    expect(messageFn).toHaveBeenCalledTimes(2);
  });

  // FIXME: `import * as m` をVitestで正しくモックできないため、一時的にスキップ
  // 参照: https://github.com/vitest-dev/vitest/issues/1852
  it.skip('fetches message by key via getMessage', () => {
    const getter = service.getMessage('test_message');
    expect(getter()).toBe('Test Message');
  });

  it('returns key when message is missing', () => {
    const getter = service.getMessage('unknown_key');
    expect(getter()).toBe('unknown_key');
  });

  // FIXME: `import * as m` をVitestで正しくモックできないため、一時的にスキップ
  // 参照: https://github.com/vitest-dev/vitest/issues/1852
  it.skip('handles parameterised messages', () => {
    const getter = service.getMessage('hello', { name: 'John' });
    expect(getter()).toBe('Hello John');

    service.setLocale('ja');
    expect(getter()).toBe('こんにちは John');
  });

  it('lists available locales', () => {
    expect(service.getAvailableLocales()).toEqual(['en', 'ja']);
  });
});
