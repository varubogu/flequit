import { dataService } from './data-service';

/**
 * 自動保存機能の管理サービス
 * UIコンポーネントから直接バックエンドに依存せず、中間レイヤーを経由する
 */
export class AutoSaveService {
  private isAutoSaveEnabled = true;
  private lastSaveTime: Date | null = null;
  private isSaving = false;

  get isEnabled(): boolean {
    return this.isAutoSaveEnabled;
  }

  get lastSave(): Date | null {
    return this.lastSaveTime;
  }

  get saving(): boolean {
    return this.isSaving;
  }

  async performAutoSave(): Promise<void> {
    if (!this.isAutoSaveEnabled || this.isSaving) {
      return;
    }

    this.isSaving = true;

    try {
      await dataService.autoSave();
      this.lastSaveTime = new Date();
      console.log('Auto-save completed at:', this.lastSaveTime.toISOString());
    } catch (error) {
      console.error('Auto-save failed:', error);
      throw error;
    } finally {
      this.isSaving = false;
    }
  }

  async forceSave(): Promise<void> {
    return this.performAutoSave();
  }

  enable(): void {
    this.isAutoSaveEnabled = true;
  }

  disable(): void {
    this.isAutoSaveEnabled = false;
  }
}

// シングルトンインスタンス
export const autoSaveService = new AutoSaveService();
