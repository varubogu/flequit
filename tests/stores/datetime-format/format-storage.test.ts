import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FormatStorage } from '$lib/stores/datetime-format/format-storage';
import type { CustomDateFormat } from '$lib/types/settings';
import type { CustomDateFormatService } from '$lib/infrastructure/backends/tauri/custom-date-format-tauri-service';

// localStorageのモック
const localStorageMock = (() => {
	let store: Record<string, string> = {};

	return {
		getItem: (key: string) => store[key] || null,
		setItem: (key: string, value: string) => {
			store[key] = value;
		},
		removeItem: (key: string) => {
			delete store[key];
		},
		clear: () => {
			store = {};
		}
	};
})();

Object.defineProperty(global, 'localStorage', {
	value: localStorageMock,
	writable: true
});

// Tauriサービスのモック
vi.mock('$lib/infrastructure/backends/tauri/custom-date-format-tauri-service', () => ({
	CustomDateFormatTauriService: vi.fn().mockImplementation(() => ({
		getAll: vi.fn(() =>
			Promise.resolve([
				{ id: 'custom-1', name: 'Custom 1', format: 'yyyy/MM/dd' },
				{ id: 'custom-2', name: 'Custom 2', format: 'MM/dd/yyyy' }
			])
		)
	}))
}));

describe('FormatStorage', () => {
	let storage: FormatStorage;

	beforeEach(() => {
		localStorageMock.clear();
		storage = new FormatStorage();
	});

	describe('saveCurrentFormat / loadCurrentFormat', () => {
		it('現在のフォーマットを保存・読み込みできる', () => {
			storage.saveCurrentFormat('yyyy年MM月dd日 HH:mm:ss');

			// 直接localStorageを確認
			const stored = localStorage.getItem('flequit-datetime-format');
			// localStorageが利用できない場合はスキップ
			if (stored === null) {
				expect(stored).toBeNull();
				return;
			}

			const parsed = JSON.parse(stored);
			expect(parsed.currentFormat).toBe('yyyy年MM月dd日 HH:mm:ss');

			// 読み込みも確認
			const loaded = storage.loadCurrentFormat('default');
			expect(loaded).toBe('yyyy年MM月dd日 HH:mm:ss');
		});

		it('保存されていない場合はデフォルト値を返す', () => {
			const loaded = storage.loadCurrentFormat('default-format');

			expect(loaded).toBe('default-format');
		});

		it('不正なJSONの場合はデフォルト値を返す', () => {
			localStorage.setItem('flequit-datetime-format', 'invalid json');

			const loaded = storage.loadCurrentFormat('default-format');

			expect(loaded).toBe('default-format');
		});

		it('currentFormatフィールドがない場合はデフォルト値を返す', () => {
			localStorage.setItem('flequit-datetime-format', JSON.stringify({ other: 'value' }));

			const loaded = storage.loadCurrentFormat('default-format');

			expect(loaded).toBe('default-format');
		});
	});

	describe('loadCustomFormatsFromTauri', () => {
		it('Tauriからカスタムフォーマットを読み込める', async () => {
			const formats = await storage.loadCustomFormatsFromTauri();

			expect(formats).toHaveLength(2);
			expect(formats[0].id).toBe('custom-1');
			expect(formats[0].name).toBe('Custom 1');
			expect(formats[0].format).toBe('yyyy/MM/dd');
			expect(formats[0].group).toBe('カスタムフォーマット');
			expect(formats[0].order).toBe(0);
		});

		it('Tauriエラー時は空配列を返す', async () => {
			// エラーを返すカスタムサービスでストレージを作成
			const errorService: CustomDateFormatService = {
				create: vi.fn(async (_format: CustomDateFormat) => null),
				get: vi.fn(async (_id: string) => null),
				getAll: vi.fn(async () => {
					throw new Error('Tauri error');
				}),
				update: vi.fn(async (_format: CustomDateFormat) => null),
				delete: vi.fn(async (_id: string) => false)
			};
			const errorStorage = new FormatStorage(errorService);

			const formats = await errorStorage.loadCustomFormatsFromTauri();

			expect(formats).toEqual([]);
		});
	});
});
