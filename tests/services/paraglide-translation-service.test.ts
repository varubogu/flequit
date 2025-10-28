import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ITranslationServiceWithNotification } from '$lib/services/translation-service';

const { runtimeState } = vi.hoisted(() => {
	let currentLocale = 'en';
	return {
		runtimeState: {
			getLocale: () => currentLocale,
			setLocale: (locale: string) => {
				currentLocale = locale;
			}
		}
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

vi.mock('$paraglide/messages.js', () => ({
	__esModule: true,
	test_message: () => (runtimeState.getLocale() === 'en' ? 'Test Message' : 'テストメッセージ'),
	hello: ({ name }: { name: string }) =>
		runtimeState.getLocale() === 'en' ? `Hello ${name}` : `こんにちは ${name}`
}));

describe('ParaglideTranslationService (mocked singleton)', () => {
	let service: ITranslationServiceWithNotification;

	beforeEach(async () => {
		await vi.resetModules();
	const module = await import('$lib/services/paraglide-translation-service.svelte');
	service = module.translationService;
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

	it('provides memoised reactive messages', () => {
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

	it('fetches message by key via getMessage', () => {
		const getter = service.getMessage('test_message');
		expect(getter()).toBe('Test Message');
	});

	it('returns key when message is missing', () => {
		const getter = service.getMessage('unknown_key');
		expect(getter()).toBe('unknown_key');
	});

	it('handles parameterised messages', () => {
		const getter = service.getMessage('hello', { name: 'John' });
		expect(getter()).toBe('Hello John');

		service.setLocale('ja');
		expect(getter()).toBe('こんにちは John');
	});

	it('lists available locales', () => {
		expect(service.getAvailableLocales()).toEqual(['en', 'ja']);
	});
});
