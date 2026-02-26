import type { ProjectStore } from '$lib/stores/project-store.svelte';
import {
  resolveProjectStore,
  provideProjectStore,
  resetProjectStoreOverride
} from '$lib/stores/providers/project-store-provider';

/**
 * useProjectStore - プロジェクトストアを取得するComposable
 *
 * 責務: プロジェクト関連の状態/操作を依存注入パターンで提供する。
 * 利点:
 * - コントローラーやコンポーネントからストア依存を一元取得できる
 * - テスト時に `$lib/stores/project-store.svelte` をモックすればよく、依存箇所を最小化できる
 * - Svelte 5 の runes パターンと相性が良い
 */
export { provideProjectStore, resetProjectStoreOverride };

export function useProjectStore(): ProjectStore {
  return resolveProjectStore();
}
