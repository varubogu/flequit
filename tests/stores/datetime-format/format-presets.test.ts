import { describe, it, expect, vi } from 'vitest';
import { getDefaultFormat, getPresetFormats, getCustomEntry } from '$lib/stores/datetime-format/format-presets';

// paraglideモジュールのモック
vi.mock('$paraglide/runtime', () => ({
	getLocale: vi.fn(() => 'ja')
}));

describe('format-presets', () => {
	describe('getDefaultFormat', () => {
		it('デフォルトフォーマットを返す', () => {
			const format = getDefaultFormat();

			expect(format.id).toBe(-1);
			expect(format.name).toBe('デフォルト');
			expect(format.format).toBe('');
			expect(format.group).toBe('デフォルト');
			expect(format.order).toBe(0);
		});
	});

	describe('getPresetFormats', () => {
		it('日本語ロケールの場合、日本語プリセットを返す', async () => {
			const { getLocale } = await import('$paraglide/runtime');
			vi.mocked(getLocale).mockReturnValue('ja');

			const formats = getPresetFormats();

			expect(formats).toHaveLength(6);
			expect(formats[0].name).toBe('日本（西暦、24時間表記）');
			expect(formats[0].format).toBe('yyyy年MM月dd日 HH:mm:ss');
			expect(formats[1].name).toBe('日本（和暦、12時間表記）');
		});

		it('英語ロケールの場合、英語プリセットを返す', async () => {
			const { getLocale } = await import('$paraglide/runtime');
			vi.mocked(getLocale).mockReturnValue('en');

			const formats = getPresetFormats();

			expect(formats).toHaveLength(6);
			expect(formats[0].name).toBe('America');
			expect(formats[0].format).toBe('MM/dd/yyyy HH:mm:ss');
			expect(formats[1].name).toBe('Europe');
		});

		it('すべてのプリセットにIDが割り当てられている', () => {
			const formats = getPresetFormats();

			formats.forEach((format) => {
				expect(format.id).toBeLessThan(0);
				expect(format.group).toBe('プリセット');
			});
		});
	});

	describe('getCustomEntry', () => {
		it('カスタムエントリを返す', () => {
			const entry = getCustomEntry();

			expect(entry.id).toBe(-10);
			expect(entry.name).toBe('カスタム');
			expect(entry.format).toBe('');
			expect(entry.group).toBe('カスタム');
			expect(entry.order).toBe(0);
		});
	});
});
