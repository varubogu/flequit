import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ITranslationServiceWithNotification } from '$lib/services/translation-service';

describe('ParaglideTranslationService (mocked singleton)', () => {
	let service: ITranslationServiceWithNotification & {
		setMessages(locale: string, messages: Record<string, string>): void;
		getSubscriberCount(): number;
	};

	beforeEach(async () => {
		await vi.resetModules();
		const module = await import('$lib/services/paraglide-translation-service.svelte');
		service = module.translationService as typeof service;
		service.setLocale('en');
		service.setMessages('en', {
			test_message: 'Test Message',
			hello: 'Hello {name}'
		});
		service.setMessages('ja', {
			test_message: 'テストメッセージ',
			hello: 'こんにちは {name}'
		});
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
		expect(service.getSubscriberCount()).toBe(0);
	});

	it('provides memoised reactive messages', () => {
		const messageFn = vi.fn(() => 'test_message');
		const reactive = service.reactiveMessage(messageFn);

		expect(reactive()).toBe('Test Message');
		expect(messageFn).toHaveBeenCalled();

		service.setLocale('ja');
		expect(reactive()).toBe('テストメッセージ');
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
