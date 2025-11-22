/**
 * タグブックマーク型定義
 * サイドバーにピン留めするタグの情報
 */
export type TagBookmark = {
	/** ブックマークの一意識別子 */
	id: string;
	/** ユーザーID（現在は固定値 "local_user"） */
	userId: string;
	/** タグの所属プロジェクトID */
	projectId: string;
	/** ブックマークするタグID */
	tagId: string;
	/** サイドバー内での表示順序 */
	orderIndex: number;
	/** ブックマーク追加日時 */
	createdAt: string;
	/** ブックマーク更新日時 */
	updatedAt: string;
};

/**
 * タグブックマーク作成用の型
 */
export type CreateTagBookmarkInput = {
	/** ユーザーID */
	userId: string;
	/** タグの所属プロジェクトID */
	projectId: string;
	/** ブックマークするタグID */
	tagId: string;
};

/**
 * タグブックマーク更新用の型
 */
export type UpdateTagBookmarkInput = {
	/** ブックマークID */
	id: string;
	/** 新しい表示順序 */
	orderIndex: number;
};

/**
 * タグブックマーク並び替え用の型
 */
export type ReorderTagBookmarksInput = {
	/** プロジェクトID */
	projectId: string;
	/** 移動元のインデックス */
	fromIndex: number;
	/** 移動先のインデックス */
	toIndex: number;
};
