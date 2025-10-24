import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useTranslation } from '$lib/hooks/use-translation.svelte';
import type { ITranslationService } from '$lib/services/translation-service';

// Mock getTranslationService
vi.mock('$lib/stores/locale.svelte', () => ({
	getTranslationService: vi.fn(() => ({
		getMessage: vi.fn((key: string) => `translated_${key}`),
		getLanguage: vi.fn(() => 'ja'),
		setLanguage: vi.fn()
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
			expect(translationService.getLanguage).toBeDefined();
		});

		it('getMessageを呼び出せる', () => {
			const message = translationService.getMessage('test_key');

			expect(message).toBe('translated_test_key');
			expect(translationService.getMessage).toHaveBeenCalledWith('test_key');
		});

		it('getLanguageを呼び出せる', () => {
			const language = translationService.getLanguage();

			expect(language).toBe('ja');
			expect(translationService.getLanguage).toHaveBeenCalled();
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
