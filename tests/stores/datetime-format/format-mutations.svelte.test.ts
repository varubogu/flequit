import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FormatMutations } from '$lib/stores/datetime-format/format-mutations.svelte';
import type { CustomDateTimeFormat } from '$lib/types/datetime-format';

// Tauriサービスのモック
vi.mock('$lib/infrastructure/backends/tauri/custom-date-format-tauri-service', () => ({
	CustomDateFormatTauriService: vi.fn().mockImplementation(() => ({
		create: vi.fn((format) => Promise.resolve(format)),
		update: vi.fn((format) => Promise.resolve(format)),
		delete: vi.fn(() => Promise.resolve(true)),
		getAll: vi.fn(() => Promise.resolve([]))
	}))
}));

describe('FormatMutations', () => {
	let customFormats: CustomDateTimeFormat[];
	let mutations: FormatMutations;

	beforeEach(() => {
		customFormats = [];
		mutations = new FormatMutations(() => customFormats);
	});

	describe('addCustomFormat', () => {
		it('新しいカスタムフォーマットを追加できる', async () => {
			const id = await mutations.addCustomFormat('Test Format', 'yyyy/MM/dd');

			expect(customFormats).toHaveLength(1);
			expect(customFormats[0].id).toBe(id);
			expect(customFormats[0].name).toBe('Test Format');
			expect(customFormats[0].format).toBe('yyyy/MM/dd');
			expect(customFormats[0].group).toBe('カスタムフォーマット');
		});

		it('追加されたフォーマットのorderは配列の長さになる', async () => {
			await mutations.addCustomFormat('Format 1', 'yyyy/MM/dd');
			await mutations.addCustomFormat('Format 2', 'MM/dd/yyyy');

			expect(customFormats[0].order).toBe(0);
			expect(customFormats[1].order).toBe(1);
		});

		it('UUID衝突時に再生成する', async () => {
			// 最初のフォーマットを追加
			await mutations.addCustomFormat('Format 1', 'yyyy/MM/dd');
			const firstId = customFormats[0].id;

			// UUIDをモック（最初は衝突、2回目は新しいID）
			let callCount = 0;
			vi.spyOn(mutations as any, 'generateUUID').mockImplementation(() => {
				callCount++;
				return callCount === 1 ? firstId : 'new-unique-id';
			});

			await mutations.addCustomFormat('Format 2', 'MM/dd/yyyy');

			expect(customFormats).toHaveLength(2);
			expect(customFormats[1].id).toBe('new-unique-id');
		});
	});

	describe('updateCustomFormat', () => {
		beforeEach(async () => {
			await mutations.addCustomFormat('Original', 'yyyy/MM/dd');
		});

		it('フォーマット名を更新できる', async () => {
			const id = customFormats[0].id;

			await mutations.updateCustomFormat(id, { name: 'Updated Name' });

			expect(customFormats[0].name).toBe('Updated Name');
			expect(customFormats[0].format).toBe('yyyy/MM/dd');
		});

		it('フォーマット文字列を更新できる', async () => {
			const id = customFormats[0].id;

			await mutations.updateCustomFormat(id, { format: 'MM/dd/yyyy' });

			expect(customFormats[0].name).toBe('Original');
			expect(customFormats[0].format).toBe('MM/dd/yyyy');
		});

		it('名前とフォーマットを同時に更新できる', async () => {
			const id = customFormats[0].id;

			await mutations.updateCustomFormat(id, { name: 'Updated', format: 'dd/MM/yyyy' });

			expect(customFormats[0].name).toBe('Updated');
			expect(customFormats[0].format).toBe('dd/MM/yyyy');
		});

		it('存在しないIDの更新はエラーになる', async () => {
			await expect(
				mutations.updateCustomFormat('non-existent-id', { name: 'Test' })
			).rejects.toThrow('Format with id non-existent-id not found');
		});
	});

	describe('removeCustomFormat', () => {
		beforeEach(async () => {
			await mutations.addCustomFormat('Format 1', 'yyyy/MM/dd');
			await mutations.addCustomFormat('Format 2', 'MM/dd/yyyy');
		});

		it('指定したIDのフォーマットを削除できる', async () => {
			const id = customFormats[0].id;

			await mutations.removeCustomFormat(id);

			expect(customFormats).toHaveLength(1);
			expect(customFormats[0].name).toBe('Format 2');
		});

		it('存在しないIDの削除はエラーになる', async () => {
			await expect(mutations.removeCustomFormat('non-existent-id')).rejects.toThrow(
				'Format with id non-existent-id not found'
			);
		});
	});
});
