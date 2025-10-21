import { beforeEach, describe, expect, test, vi } from 'vitest';
import {
	createLayoutPreferencesStore,
	LayoutPreferencesStore
} from '../../src/lib/services/ui/layout';

const STORAGE_KEY = 'flequit-layout-preferences';

type MockStorage = {
	getItem: ReturnType<typeof vi.fn>;
	setItem: ReturnType<typeof vi.fn>;
};

const toPlain = (prefs: unknown) => {
	const candidate = prefs as
		| { taskListPaneSize?: number; taskDetailPaneSize?: number; v?: { taskListPaneSize: number; taskDetailPaneSize: number } }
		| undefined;
	const source = typeof candidate?.taskListPaneSize === 'number' ? candidate : candidate?.v;
	return {
		taskListPaneSize: source?.taskListPaneSize,
		taskDetailPaneSize: source?.taskDetailPaneSize
	};
};

function createMockStorage(): MockStorage {
	const backing = new Map<string, string>();
	return {
		getItem: vi.fn((key: string) => backing.get(key) ?? null),
		setItem: vi.fn((key: string, value: string) => {
			backing.set(key, value);
		})
	};
}

describe('LayoutPreferencesStore', () => {
	let storage: MockStorage;
	let store: LayoutPreferencesStore;
	let consoleWarnSpy: ReturnType<typeof vi.spyOn>;

	beforeEach(() => {
		vi.resetAllMocks();
		storage = createMockStorage();
		consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
		store = createLayoutPreferencesStore({ storage });
	});

test('初期値としてデフォルトプリファレンスを提供し、ストレージからの読み込みを試みる', () => {
	expect(toPlain(store.value)).toEqual({
		taskListPaneSize: 30,
		taskDetailPaneSize: 70
	});
	expect(storage.getItem).toHaveBeenCalledWith(STORAGE_KEY);
});

	test('保存済みプリファレンスをデフォルトとマージする', () => {
		storage.getItem.mockReturnValueOnce(JSON.stringify({ taskListPaneSize: 45 }));

	const reloaded = store.loadPreferences();

	expect(toPlain(reloaded)).toEqual({ taskListPaneSize: 45, taskDetailPaneSize: 70 });
});

	test('壊れたJSONは警告を出し、デフォルトにフォールバックする', () => {
		storage.getItem.mockReturnValueOnce('not-json');

	const result = store.loadPreferences();

	expect(consoleWarnSpy).toHaveBeenCalledWith(
		'Failed to parse layout preferences:',
		expect.any(Error)
	);
	expect(toPlain(result)).toEqual({ taskListPaneSize: 30, taskDetailPaneSize: 70 });
});

	test('ストレージ例外は捕捉されデフォルトに戻る', () => {
		storage.getItem.mockImplementationOnce(() => {
			throw new Error('storage down');
		});

	const result = store.loadPreferences();

	expect(consoleWarnSpy).toHaveBeenCalledWith(
		'Failed to load layout preferences:',
		expect.any(Error)
	);
	expect(toPlain(result)).toEqual({ taskListPaneSize: 30, taskDetailPaneSize: 70 });
});

	test('プリファレンスを保存する際にJSON化された値が書き込まれる', () => {
		store.savePreferences({ taskListPaneSize: 40, taskDetailPaneSize: 60 });

		expect(storage.setItem).toHaveBeenCalledWith(
			STORAGE_KEY,
			JSON.stringify({ taskListPaneSize: 40, taskDetailPaneSize: 60 })
		);
	});

	test('保存時のエラーは警告に記録される', () => {
		storage.setItem.mockImplementationOnce(() => {
			throw new Error('quota exceeded');
		});

		store.savePreferences({ taskListPaneSize: 40, taskDetailPaneSize: 60 });

		expect(consoleWarnSpy).toHaveBeenCalledWith(
			'Failed to save layout preferences:',
			expect.any(Error)
		);
	});

test('updatePreferencesで部分更新と保存を行う', () => {
	store.updatePreferences({ taskListPaneSize: 55 });

	const snapshot = toPlain(store.value);
	expect(snapshot.taskListPaneSize).toBe(55);
	expect(snapshot.taskDetailPaneSize ?? 70).toBe(70);
	const [key, payload] = storage.setItem.mock.calls.at(-1)!;
	expect(key).toBe(STORAGE_KEY);
	const stored = JSON.parse(payload as string);
	expect(stored.taskListPaneSize ?? stored.v?.taskListPaneSize).toBe(55);
	expect(stored.taskDetailPaneSize ?? stored.v?.taskDetailPaneSize).toBe(70);
});

test('updatePaneSizesで両方のサイズを更新する', () => {
	const updated = store.updatePaneSizes(20, 80);

	expect(toPlain(updated)).toEqual({ taskListPaneSize: 20, taskDetailPaneSize: 80 });
	const [key, payload] = storage.setItem.mock.calls.at(-1)!;
	expect(key).toBe(STORAGE_KEY);
	const stored = JSON.parse(payload as string);
	expect(stored.taskListPaneSize ?? stored.v?.taskListPaneSize).toBe(20);
	expect(stored.taskDetailPaneSize ?? stored.v?.taskDetailPaneSize).toBe(80);
});

test('ストレージがnullでも更新処理が例外なく完了する', () => {
	const noStorageStore = createLayoutPreferencesStore({ storage: null });

	expect(() => {
		noStorageStore.updatePaneSizes(10, 90);
	}).not.toThrow();
	expect(toPlain(noStorageStore.value)).toEqual({ taskListPaneSize: 10, taskDetailPaneSize: 90 });
});
});
