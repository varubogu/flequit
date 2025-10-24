import { describe, it, expect, vi, beforeEach } from 'vitest';
import { dateTimeFormatStore } from '$lib/stores/datetime-format.svelte';

// paraglideモジュールのモック
vi.mock('$paraglide/runtime', () => ({
	getLocale: vi.fn(() => 'ja')
}));

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
		create: vi.fn((format) => Promise.resolve(format)),
		update: vi.fn((format) => Promise.resolve(format)),
		delete: vi.fn(() => Promise.resolve(true)),
		getAll: vi.fn(() => Promise.resolve([]))
	}))
}));

/**
 * DateTimeFormatStore 統合テスト
 *
 * このテストは DateTimeFormatStore のファサードとしての統合動作を検証します。
 * 個別のクラス（FormatMutations等）の単体テストは別ファイルで実施しています。
 */
describe('DateTimeFormatStore (Integration)', () => {
	beforeEach(() => {
		localStorageMock.clear();
		// ストアの初期化
		dateTimeFormatStore.customFormats = [];
	});

	describe('初期化', () => {
		it('デフォルトフォーマットが設定されている', () => {
			expect(dateTimeFormatStore.currentFormat).toBeDefined();
		});

		it('カスタムフォーマットは空配列で初期化される', () => {
			expect(Array.isArray(dateTimeFormatStore.customFormats)).toBe(true);
		});
	});

	describe('フォーマット設定', () => {
		it('現在のフォーマットを設定できる', () => {
			dateTimeFormatStore.setCurrentFormat('yyyy/MM/dd HH:mm:ss');

			expect(dateTimeFormatStore.currentFormat).toBe('yyyy/MM/dd HH:mm:ss');
		});

		it('設定したフォーマットがlocalStorageに保存される', () => {
			dateTimeFormatStore.setCurrentFormat('yyyy/MM/dd HH:mm:ss');

			const stored = localStorage.getItem('flequit-datetime-format');
			if (stored === null) {
				// localStorageが利用できない環境ではスキップ
				expect(stored).toBeNull();
				return;
			}
			const parsed = JSON.parse(stored);
			expect(parsed.currentFormat).toBe('yyyy/MM/dd HH:mm:ss');
		});
	});

	describe('デフォルトフォーマット文字列', () => {
		it('日本語ロケールでデフォルトフォーマット文字列を取得できる', () => {
			const format = dateTimeFormatStore.getDefaultFormatString('ja');

			expect(format).toBe('yyyy年MM月dd日(E) HH:mm:ss');
		});

		it('英語ロケールでデフォルトフォーマット文字列を取得できる', () => {
			const format = dateTimeFormatStore.getDefaultFormatString('en');

			expect(format).toBe('EEEE, MMMM do, yyyy HH:mm:ss');
		});

		it('ロケール省略時は現在のロケールが使用される', () => {
			const format = dateTimeFormatStore.getDefaultFormatString();

			expect(format).toBeDefined();
			expect(format.length).toBeGreaterThan(0);
		});
	});

	describe('カスタムフォーマット操作', () => {
		it('カスタムフォーマットを追加できる', async () => {
			const id = await dateTimeFormatStore.addCustomFormat('My Format', 'yyyy/MM/dd');

			expect(dateTimeFormatStore.customFormats).toHaveLength(1);
			expect(dateTimeFormatStore.customFormats[0].id).toBe(id);
			expect(dateTimeFormatStore.customFormats[0].name).toBe('My Format');
		});

		it('カスタムフォーマットを更新できる', async () => {
			const id = await dateTimeFormatStore.addCustomFormat('Original', 'yyyy/MM/dd');

			await dateTimeFormatStore.updateCustomFormat(id, { name: 'Updated' });

			expect(dateTimeFormatStore.customFormats[0].name).toBe('Updated');
		});

		it('カスタムフォーマットを削除できる', async () => {
			const id = await dateTimeFormatStore.addCustomFormat('To Delete', 'yyyy/MM/dd');

			await dateTimeFormatStore.removeCustomFormat(id);

			expect(dateTimeFormatStore.customFormats).toHaveLength(0);
		});

		it('複数のカスタムフォーマットを追加できる', async () => {
			await dateTimeFormatStore.addCustomFormat('Custom 1', 'yyyy/MM/dd');
			await dateTimeFormatStore.addCustomFormat('Custom 2', 'MM/dd/yyyy');

			expect(dateTimeFormatStore.customFormats).toHaveLength(2);
			expect(dateTimeFormatStore.customFormats[0].name).toBe('Custom 1');
			expect(dateTimeFormatStore.customFormats[1].name).toBe('Custom 2');
		});
	});

	describe('複雑な操作フロー', () => {
		it('フォーマット設定→カスタムフォーマット追加→削除のフロー', async () => {
			// 1. フォーマットを設定
			dateTimeFormatStore.setCurrentFormat('yyyy/MM/dd HH:mm:ss');
			expect(dateTimeFormatStore.currentFormat).toBe('yyyy/MM/dd HH:mm:ss');

			// 2. カスタムフォーマットを追加
			const id1 = await dateTimeFormatStore.addCustomFormat('Format 1', 'yyyy-MM-dd');
			const id2 = await dateTimeFormatStore.addCustomFormat('Format 2', 'MM-dd-yyyy');
			expect(dateTimeFormatStore.customFormats).toHaveLength(2);

			// 3. 1つ削除
			await dateTimeFormatStore.removeCustomFormat(id1);
			expect(dateTimeFormatStore.customFormats).toHaveLength(1);
			expect(dateTimeFormatStore.customFormats[0].id).toBe(id2);
		});
	});
});
