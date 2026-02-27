import type { ProjectTree } from '$lib/types/project';
import { resolveBackend } from '$lib/infrastructure/backend-client';
import { errorHandler } from '$lib/stores/error-handler.svelte';

/**
 * 初期化ドメインサービス
 *
 * 責務:
 * 1. バックエンドの初期化
 * 2. プロジェクトデータの読み込み
 */
export const InitializationService = {
  /**
   * プロジェクトデータを読み込みます
   */
  async loadProjectData(): Promise<ProjectTree[]> {
    try {
      const backend = await resolveBackend();
      return await backend.initialization.loadProjectData();
    } catch (error) {
      errorHandler.addSyncError(
        'プロジェクトデータ読み込み',
        'initialization',
        'project_data',
        error
      );
      throw error;
    }
  },

  /**
   * 完全な初期化を実行します
   */
  async initializeAll() {
    try {
      const backend = await resolveBackend();
      return await backend.initialization.initializeAll();
    } catch (error) {
      errorHandler.addSyncError('完全初期化', 'initialization', 'all', error);
      throw error;
    }
  }
};
