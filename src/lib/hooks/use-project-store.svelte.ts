import { projectStore, type ProjectStore } from '$lib/stores/project-store.svelte';

let projectStoreOverride: ProjectStore | null = null;

/**
 * useProjectStore - プロジェクトストアを取得するComposable
 *
 * 責務: プロジェクト関連の状態/操作を依存注入パターンで提供する。
 * 利点:
 * - コントローラーやコンポーネントからストア依存を一元取得できる
 * - テスト時に `$lib/stores/project-store.svelte` をモックすればよく、依存箇所を最小化できる
 * - Svelte 5 の runes パターンと相性が良い
 */
export function useProjectStore(): ProjectStore {
	return projectStoreOverride ?? projectStore;
}

/**
 * テストやStorybook等でカスタムストアを注入するためのヘルパー。
 */
export function provideProjectStore(store: ProjectStore | null) {
	projectStoreOverride = store;
}

/**
 * ストアの上書きをリセットする。
 */
export function resetProjectStoreOverride() {
	projectStoreOverride = null;
}
