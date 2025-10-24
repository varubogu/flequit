import type { CustomDateTimeFormat } from '$lib/types/datetime-format';
import type { CustomDateFormat } from '$lib/types/settings';
import { CustomDateFormatTauriService } from '$lib/infrastructure/backends/tauri/custom-date-format-tauri-service';

const STORAGE_KEY = 'flequit-datetime-format';

/**
 * フォーマット設定の永続化
 *
 * 責務: localStorageとTauriバックエンドからのフォーマット読み書き
 */
export class FormatStorage {
	private customDateFormatService = new CustomDateFormatTauriService();

	/**
	 * 現在のフォーマットをlocalStorageに保存
	 */
	saveCurrentFormat(format: string): void {
		if (typeof localStorage !== 'undefined') {
			const data = { currentFormat: format };
			localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
		}
	}

	/**
	 * localStorageから現在のフォーマットを読み込み
	 */
	loadCurrentFormat(defaultFormat: string): string {
		if (typeof localStorage !== 'undefined') {
			const stored = localStorage.getItem(STORAGE_KEY);
			if (stored) {
				try {
					const data = JSON.parse(stored);
					if (data.currentFormat) {
						return data.currentFormat;
					}
				} catch (error) {
					console.error('Failed to load datetime format settings:', error);
				}
			}
		}
		return defaultFormat;
	}

	/**
	 * Tauriバックエンドからカスタムフォーマット一覧を読み込み
	 */
	async loadCustomFormatsFromTauri(): Promise<CustomDateTimeFormat[]> {
		try {
			const tauriFormats = await this.customDateFormatService.getAll();
			return tauriFormats.map((f) => this.convertFromTauri(f));
		} catch (error) {
			console.error('Failed to load custom formats from Tauri:', error);
			return [];
		}
	}

	/**
	 * Tauriから取得したデータをフロントエンド形式に変換
	 */
	private convertFromTauri(tauriFormat: CustomDateFormat): CustomDateTimeFormat {
		return {
			id: tauriFormat.id,
			name: tauriFormat.name,
			format: tauriFormat.format,
			group: 'カスタムフォーマット',
			order: 0
		};
	}
}
