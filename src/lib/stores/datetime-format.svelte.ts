import { getLocale } from '$paraglide/runtime';
import type {
	DateTimeFormat,
	AppPresetFormat,
	CustomDateTimeFormat
} from '$lib/types/datetime-format';
import { getDefaultFormat, getPresetFormats, getCustomEntry } from './datetime-format/format-presets';
import { FormatMutations } from './datetime-format/format-mutations.svelte';
import { FormatStorage } from './datetime-format/format-storage';

/**
 * DateTimeFormatStore - 日時フォーマット管理のFacadeストア
 *
 * 責務: フォーマット設定の統合管理（プリセット、カスタム、永続化）
 */
class DateTimeFormatStore {
	// 現在の日時フォーマット（ストア管理、即座反映）
	currentFormat = $state('yyyy年MM月dd日 HH:mm:ss');

	// ユーザー定義カスタムフォーマット（ストア管理、即座反映）
	customFormats = $state<CustomDateTimeFormat[]>([]);

	// サブモジュール
	private mutations: FormatMutations;
	private storage: FormatStorage;

	constructor() {
		this.mutations = new FormatMutations(() => this.customFormats);
		this.storage = new FormatStorage();

		// 初期化
		this.loadFromStorage();
		this.loadCustomFormatsFromTauri().catch(console.error);
	}

	// 全フォーマットの統合リスト（$derived）
	allFormats = $derived(() => {
		const defaultFormat = getDefaultFormat();
		const presetFormats = getPresetFormats();
		const customEntry = getCustomEntry();

		return [defaultFormat, ...presetFormats, ...this.customFormats, customEntry] as DateTimeFormat[];
	});

	/**
	 * デフォルトフォーマット文字列を取得
	 */
	getDefaultFormatString(locale: string = getLocale()): string {
		if (locale.startsWith('ja')) {
			return 'yyyy年MM月dd日(E) HH:mm:ss';
		} else {
			return 'EEEE, MMMM do, yyyy HH:mm:ss';
		}
	}

	/**
	 * 現在フォーマットを設定
	 */
	setCurrentFormat(format: string): void {
		this.currentFormat = format;
		this.storage.saveCurrentFormat(format);
	}

	/**
	 * カスタムフォーマットを追加
	 */
	async addCustomFormat(name: string, format: string): Promise<string> {
		const id = await this.mutations.addCustomFormat(name, format);
		this.storage.saveCurrentFormat(this.currentFormat);
		return id;
	}

	/**
	 * カスタムフォーマットを更新
	 */
	async updateCustomFormat(
		id: string,
		updates: Partial<Pick<CustomDateTimeFormat, 'name' | 'format'>>
	): Promise<void> {
		await this.mutations.updateCustomFormat(id, updates);
		this.storage.saveCurrentFormat(this.currentFormat);
	}

	/**
	 * カスタムフォーマットを削除
	 */
	async removeCustomFormat(id: string): Promise<void> {
		await this.mutations.removeCustomFormat(id);
		this.storage.saveCurrentFormat(this.currentFormat);
	}

	/**
	 * localStorageから設定を読み込み
	 */
	private loadFromStorage(): void {
		const defaultFormat = this.getDefaultFormatString();
		this.currentFormat = this.storage.loadCurrentFormat(defaultFormat);
	}

	/**
	 * Tauriバックエンドからカスタムフォーマットを読み込み
	 */
	private async loadCustomFormatsFromTauri(): Promise<void> {
		this.customFormats = await this.storage.loadCustomFormatsFromTauri();
	}
}

export const dateTimeFormatStore = new DateTimeFormatStore();
