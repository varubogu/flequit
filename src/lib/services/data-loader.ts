/**
 * データローディングサービス
 *
 * プロジェクトデータの読み込みと変換を担当します。
 * TaskStore分割の一環として、データローディングロジックを分離しています。
 */

import type { ProjectTree } from '$lib/types/project';
import type { Tag } from '$lib/types/tag';
import { SvelteMap } from 'svelte/reactivity';
import { getTagsFromIds } from '$lib/utils/tag-utils';

/**
 * プロジェクトデータ読み込み結果
 */
export interface LoadedProjectData {
	/** 変換済みプロジェクトデータ */
	projects: ProjectTree[];
	/** 抽出されたタグマップ */
	tags: Map<string, Tag>;
	/** 初期ブックマークすべきタグ名 */
	initialBookmarkTags: string[];
}

/**
 * プロジェクトツリーからタグ情報を抽出
 */
function extractTags(projects: ProjectTree[]): Map<string, Tag> {
	const allTags = new SvelteMap<string, Tag>();

	projects.forEach((project) => {
		// プロジェクトのallTagsフィールドからタグを収集
		if (project.allTags) {
			project.allTags.forEach((tag) => {
				allTags.set(tag.id, tag);
			});
		}
	});

	return allTags;
}

/**
 * タグIDをタグオブジェクトに変換してプロジェクトデータを変換
 */
function convertProjectData(projects: ProjectTree[], tagMap: Map<string, Tag>): ProjectTree[] {
	const tags = Array.from(tagMap.values());

	return projects.map((project) => ({
		...project,
		taskLists: project.taskLists.map((list) => ({
			...list,
			tasks: list.tasks.map((task) => ({
				...task,
				tags: getTagsFromIds(task.tagIds || [], tags),
				subTasks:
					task.subTasks?.map((subTask) => ({
						...subTask,
						tags: getTagsFromIds(subTask.tagIds || [], tags)
					})) || []
			}))
		}))
	}));
}

/**
 * プロジェクトデータを読み込み、タグ情報を抽出して変換
 *
 * @param projects バックエンドから取得した生のプロジェクトデータ
 * @returns 変換済みプロジェクトデータとタグ情報
 */
export function loadProjectsData(projects: ProjectTree[]): LoadedProjectData {
	// 1. タグ情報を抽出
	const tags = extractTags(projects);

	// 2. プロジェクトデータを変換（tagIds → tags）
	const convertedProjects = convertProjectData(projects, tags);

	// 3. 初期ブックマーク対象のタグ名を返す
	const initialBookmarkTags = ['work', 'personal'];

	return {
		projects: convertedProjects,
		tags,
		initialBookmarkTags
	};
}

/**
 * タグストアにタグを登録し、初期ブックマークを設定
 *
 * @param tagStore タグストアインスタンス
 * @param loadedData 読み込み済みデータ
 */
export function registerTagsToStore(
	tagStore: {
		addTagWithId: (tag: Tag) => void;
		tags: Tag[];
		isBookmarked: (tagId: string) => boolean;
		setBookmarkForInitialization: (tagId: string) => void;
	},
	loadedData: LoadedProjectData
): void {
	// タグをtagStoreに登録
	loadedData.tags.forEach((tag) => {
		tagStore.addTagWithId(tag);
	});

	// 初期ブックマークを設定
	loadedData.initialBookmarkTags.forEach((tagName) => {
		const tag = tagStore.tags.find((t) => t.name === tagName);
		if (tag && !tagStore.isBookmarked(tag.id)) {
			tagStore.setBookmarkForInitialization(tag.id);
		}
	});
}
