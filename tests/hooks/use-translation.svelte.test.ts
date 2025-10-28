import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useTranslation } from '$lib/hooks/use-translation.svelte';
import type { ITranslationService } from '$lib/services/translation-service';

// Mock getTranslationService
vi.mock('$lib/stores/locale.svelte', () => ({
	getTranslationService: vi.fn(() => ({
		getMessage: vi.fn((key: string) => `translated_${key}`),
		getCurrentLocale: vi.fn(() => 'ja'),
		setLocale: vi.fn(),
		reactiveMessage: vi.fn(<T extends (...args: unknown[]) => string>(fn: T) => fn),
		getAvailableLocales: vi.fn(() => ['ja', 'en'] as const)
	}))
}));

describe('useTranslation', () => {
	let translationService: ITranslationService;

	beforeEach(() => {
		translationService = useTranslation();
	});

	describe('基本機能', () => {
		it('TranslationServiceを返す', () => {
			expect(translationService).toBeDefined();
			expect(translationService.getMessage).toBeDefined();
			expect(translationService.getCurrentLocale).toBeDefined();
		});

		it('getMessageを呼び出せる', () => {
			const message = translationService.getMessage('test_key');

			expect(message).toBe('translated_test_key');
			expect(translationService.getMessage).toHaveBeenCalledWith('test_key');
		});

		it('getCurrentLocaleを呼び出せる', () => {
			const locale = translationService.getCurrentLocale();

			expect(locale).toBe('ja');
			expect(translationService.getCurrentLocale).toHaveBeenCalled();
		});
	});

	describe('統合', () => {
		it('実際のコンポーネントで使用できる形式', () => {
			const t = useTranslation();

			// よくある使用パターン
			const editTask = t.getMessage('edit_task');
			const deleteTask = t.getMessage('delete_task');

			expect(editTask).toBe('translated_edit_task');
			expect(deleteTask).toBe('translated_delete_task');
		});
	});
});
