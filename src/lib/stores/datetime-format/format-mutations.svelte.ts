import type { CustomDateTimeFormat } from '$lib/types/datetime-format';
import type { CustomDateFormat } from '$lib/types/settings';
import { CustomDateFormatTauriService } from '$lib/infrastructure/backends/tauri/custom-date-format-tauri-service';

/**
 * カスタムフォーマットのCRUD操作
 *
 * 責務: カスタムフォーマットの追加、更新、削除
 */
export class FormatMutations {
	private customDateFormatService = new CustomDateFormatTauriService();

	constructor(private customFormatsRef: () => CustomDateTimeFormat[]) {}

	/**
	 * カスタムフォーマットを追加
	 */
	async addCustomFormat(name: string, format: string): Promise<string> {
		const uuid = this.generateUUID();
		let attempts = 0;
		let finalUuid = uuid;

		// 衝突回避（最大10回試行）
		while (attempts < 10 && this.customFormatsRef().some((f) => f.id === finalUuid)) {
			finalUuid = this.generateUUID();
			attempts++;
		}

		if (attempts >= 10) {
			throw new Error('Failed to generate unique UUID after 10 attempts');
		}

		const newFormatForTauri: CustomDateFormat = {
			id: finalUuid,
			name,
			format
		};

		try {
			const savedFormat = await this.customDateFormatService.create(newFormatForTauri);
			if (savedFormat) {
				const newFormat: CustomDateTimeFormat = {
					id: savedFormat.id,
					name: savedFormat.name,
					format: savedFormat.format,
					group: 'カスタムフォーマット',
					order: this.customFormatsRef().length
				};
				this.customFormatsRef().push(newFormat);
				return finalUuid;
			} else {
				throw new Error('Failed to save custom format to Tauri');
			}
		} catch (error) {
			console.error('Failed to add custom format:', error);
			throw error;
		}
	}

	/**
	 * カスタムフォーマットを更新
	 */
	async updateCustomFormat(
		id: string,
		updates: Partial<Pick<CustomDateTimeFormat, 'name' | 'format'>>
	): Promise<void> {
		const index = this.customFormatsRef().findIndex((f) => f.id === id);
		if (index === -1) {
			throw new Error(`Format with id ${id} not found`);
		}

		const currentFormat = this.customFormatsRef()[index];
		const updatedFormatForTauri: CustomDateFormat = {
			id: currentFormat.id,
			name: updates.name ?? currentFormat.name,
			format: updates.format ?? currentFormat.format
		};

		try {
			const savedFormat = await this.customDateFormatService.update(updatedFormatForTauri);
			if (savedFormat) {
				this.customFormatsRef()[index] = { ...this.customFormatsRef()[index], ...updates };
			} else {
				throw new Error('Failed to update custom format in Tauri');
			}
		} catch (error) {
			console.error('Failed to update custom format:', error);
			throw error;
		}
	}

	/**
	 * カスタムフォーマットを削除
	 */
	async removeCustomFormat(id: string): Promise<void> {
		const index = this.customFormatsRef().findIndex((f) => f.id === id);
		if (index === -1) {
			throw new Error(`Format with id ${id} not found`);
		}

		try {
			const success = await this.customDateFormatService.delete(id);
			if (success) {
				this.customFormatsRef().splice(index, 1);
			} else {
				throw new Error('Failed to delete custom format from Tauri');
			}
		} catch (error) {
			console.error('Failed to remove custom format:', error);
			throw error;
		}
	}

	/**
	 * UUID生成
	 */
	private generateUUID(): string {
		return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
			const r = (Math.random() * 16) | 0;
			const v = c == 'x' ? r : (r & 0x3) | 0x8;
			return v.toString(16);
		});
	}
}
