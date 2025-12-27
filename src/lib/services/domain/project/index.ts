/**
 * プロジェクトドメインサービス
 *
 * プロジェクトに関連する全ての操作を提供します
 *
 * 使い方:
 * - バックエンド通信: ProjectBackend
 * - データ取得・検索: ProjectQueryService
 * - ヘルパー関数: ProjectHelpers
 */

// ===== バックエンド通信 =====
export { ProjectBackend } from './project-backend';

// ===== その他のサービス =====
export { ProjectQueryService } from './project-query';
export { ProjectHelpers } from './project-helpers';
