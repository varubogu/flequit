import { SvelteDate } from 'svelte/reactivity';
import { autoSaveService } from '$lib/services/auto-save-service';

let autoSaveTimer: number | null = null;
const AUTO_SAVE_INTERVAL = 30000; // 30秒間隔で自動保存

export class AutoSaveManager {
  private isAutoSaveEnabled = $state(true);
  private lastSaveTime = $state<SvelteDate | null>(null);
  private isSaving = $state(false);

  get isEnabled() {
    return this.isAutoSaveEnabled;
  }

  get lastSave() {
    return this.lastSaveTime;
  }

  get saving() {
    return this.isSaving;
  }

  start() {
    if (autoSaveTimer) {
      this.stop();
    }

    autoSaveTimer = window.setInterval(() => {
      this.performAutoSave();
    }, AUTO_SAVE_INTERVAL);
  }

  stop() {
    if (autoSaveTimer) {
      window.clearInterval(autoSaveTimer);
      autoSaveTimer = null;
    }
  }

  async performAutoSave() {
    if (!this.isAutoSaveEnabled || this.isSaving) {
      return;
    }

    this.isSaving = true;

    try {
      await autoSaveService.performAutoSave();
      this.lastSaveTime = new SvelteDate();
    } catch (error) {
      console.error('Auto-save failed:', error);
    } finally {
      this.isSaving = false;
    }
  }

  async forceSave() {
    return this.performAutoSave();
  }

  enable() {
    this.isAutoSaveEnabled = true;
  }

  disable() {
    this.isAutoSaveEnabled = false;
  }

  destroy() {
    this.stop();
  }
}

export const autoSaveManager = new AutoSaveManager();

// ブラウザの離脱時に自動保存を実行
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    autoSaveManager.forceSave();
  });

  // ページがアクティブになったら自動保存を開始
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && autoSaveManager.isEnabled) {
      autoSaveManager.start();
    } else {
      autoSaveManager.stop();
    }
  });

  // ページロード時に自動保存を開始
  window.addEventListener('load', () => {
    if (autoSaveManager.isEnabled) {
      autoSaveManager.start();
    }
  });
}
