import type { TagBookmark } from '$lib/types/tag-bookmark';
import { TagBookmarkBackendService } from '$lib/services/backend/tag-bookmark';
import { tagBookmarkStore } from '$lib/stores/tags/tag-bookmark-store.svelte';
import { errorHandler } from '$lib/stores/error-handler.svelte';
import { accountStore } from '$lib/stores/account-store.svelte';

/**
 * TagBookmarkドメインサービス
 *
 * 責務:
 * 1. バックエンドへの登録 (TagBookmarkBackendService経由)
 * 2. Storeへの登録 (tagBookmarkStore経由)
 */
export const TagBookmarkService = {
	/**
	 * ブックマークを作成
	 */
	async create(projectId: string, tagId: string): Promise<TagBookmark | null> {
		console.log('[TagBookmarkService.create] accountStore.currentAccount:', accountStore.currentAccount);
		console.log('[TagBookmarkService.create] accountStore.currentUserId:', accountStore.currentUserId);

		const userId = accountStore.currentUserId;
		if (!userId) {
			console.error('[TagBookmarkService.create] No current user - account:', accountStore.currentAccount);
			return null;
		}

		console.log('[TagBookmarkService.create] Starting - userId:', userId, 'projectId:', projectId, 'tagId:', tagId);
		try {
			// 1. バックエンドに作成
			console.log('[TagBookmarkService.create] Calling TagBookmarkBackendService.create...');
			const bookmark = await TagBookmarkBackendService.create({
				userId,
				projectId,
				tagId
			});
			console.log('[TagBookmarkService.create] Backend returned bookmark:', bookmark);

			// 2. Storeに追加
			console.log('[TagBookmarkService.create] Adding to store...');
			tagBookmarkStore.addBookmark(bookmark);
			console.log('[TagBookmarkService.create] Successfully added to store');

			return bookmark;
		} catch (error) {
			console.error('[TagBookmarkService.create] Failed to create tag bookmark:', error);
			errorHandler.addSyncError('ブックマーク作成', 'tag_bookmark', tagId, error);
			return null;
		}
	},

	/**
	 * プロジェクトのブックマーク一覧を読み込み
	 */
	async loadBookmarksByProject(projectId: string): Promise<void> {
		try {
			const bookmarks = await TagBookmarkBackendService.listByProject(projectId);
			tagBookmarkStore.setBookmarks(bookmarks);
		} catch (error) {
			console.error('Failed to load tag bookmarks:', error);
			errorHandler.addSyncError('ブックマーク読み込み', 'tag_bookmark', projectId, error);
		}
	},

	/**
	 * ユーザーの全ブックマークを読み込み
	 */
	async loadAllBookmarks(): Promise<void> {
		console.log('[TagBookmarkService.loadAllBookmarks] accountStore.currentAccount:', accountStore.currentAccount);
		console.log('[TagBookmarkService.loadAllBookmarks] accountStore.currentUserId:', accountStore.currentUserId);

		const userId = accountStore.currentUserId;
		if (!userId) {
			console.error('[TagBookmarkService.loadAllBookmarks] No current user - account:', accountStore.currentAccount);
			return;
		}

		console.log('[TagBookmarkService.loadAllBookmarks] Loading bookmarks for user:', userId);
		try {
			const bookmarks = await TagBookmarkBackendService.listByUser(userId);
			console.log('[TagBookmarkService.loadAllBookmarks] Loaded', bookmarks.length, 'bookmarks');
			tagBookmarkStore.setBookmarks(bookmarks);
		} catch (error) {
			console.error('[TagBookmarkService.loadAllBookmarks] Failed to load all tag bookmarks:', error);
			errorHandler.addSyncError('全ブックマーク読み込み', 'tag_bookmark', 'all', error);
		}
	},

	/**
	 * ブックマークを削除
	 */
	async delete(bookmarkId: string, tagId: string): Promise<void> {
		// バックアップ
		const bookmark = tagBookmarkStore.findBookmarkById(bookmarkId);
		if (!bookmark) {
			return;
		}

		try {
			// 1. Storeから削除
			tagBookmarkStore.removeBookmark(bookmarkId);

			// 2. バックエンドから削除
			await TagBookmarkBackendService.delete(bookmarkId);
		} catch (error) {
			console.error('Failed to delete tag bookmark:', error);
			errorHandler.addSyncError('ブックマーク削除', 'tag_bookmark', tagId, error);
			// エラー時は復元
			tagBookmarkStore.addBookmark(bookmark);
		}
	},

	/**
	 * ブックマークを並び替え
	 */
	async reorder(projectId: string, fromIndex: number, toIndex: number): Promise<void> {
		// バックアップ
		const bookmarksBackup = [...tagBookmarkStore.bookmarks];

		try {
			// 1. Storeを更新（楽観的更新）
			tagBookmarkStore.reorderBookmarks(fromIndex, toIndex);

			// 2. バックエンドに同期
			await TagBookmarkBackendService.reorder({
				projectId,
				fromIndex,
				toIndex
			});
		} catch (error) {
			console.error('Failed to reorder tag bookmarks:', error);
			errorHandler.addSyncError('ブックマーク並び替え', 'tag_bookmark', projectId, error);
			// エラー時は復元
			tagBookmarkStore.setBookmarks(bookmarksBackup);
		}
	},

	/**
	 * タグがブックマーク済みかチェック
	 */
	isBookmarked(tagId: string): boolean {
		return tagBookmarkStore.isBookmarked(tagId);
	},

	/**
	 * タグのブックマーク状態をトグル
	 */
	async toggleBookmark(projectId: string, tagId: string): Promise<void> {
		console.log('[TagBookmarkService] toggleBookmark called - projectId:', projectId, 'tagId:', tagId);
		const bookmark = tagBookmarkStore.findBookmarkByTagId(tagId);
		console.log('[TagBookmarkService] Existing bookmark:', bookmark);

		if (bookmark) {
			// ブックマーク済みなら削除
			console.log('[TagBookmarkService] Deleting existing bookmark:', bookmark.id);
			await this.delete(bookmark.id, tagId);
		} else {
			// ブックマークされていなければ作成
			console.log('[TagBookmarkService] Creating new bookmark');
			await this.create(projectId, tagId);
		}
		console.log('[TagBookmarkService] toggleBookmark completed');
	}
};
