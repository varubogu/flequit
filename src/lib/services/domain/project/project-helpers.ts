import { taskStore } from '$lib/stores/tasks.svelte';

/**
 * プロジェクトヘルパー関数
 *
 * 責務:
 * 1. カウント系処理
 * 2. データ変換処理
 */
export const ProjectHelpers = {
	/**
	 * プロジェクトのタスク数を取得
	 */
	getTaskCountByProjectId(projectId: string): number {
		const project = taskStore.projects.find((p) => p.id === projectId);
		if (!project) return 0;

		return project.taskLists.reduce((total, list) => total + list.tasks.length, 0);
	}
};
