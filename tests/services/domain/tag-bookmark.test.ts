import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { TagBookmark } from '$lib/types/tag-bookmark';

// ---------- モック ----------

const tagBookmarkBackendMock = {
  create: vi.fn(),
  listByProject: vi.fn(),
  listByUser: vi.fn(),
  delete: vi.fn(),
  reorder: vi.fn()
};

vi.mock('$lib/infrastructure/backends/tauri/tag-bookmark-tauri-service', () => ({
  TagBookmarkTauriService: tagBookmarkBackendMock
}));

const tagBookmarkStoreMock = {
  bookmarks: [] as TagBookmark[],
  addBookmark: vi.fn(),
  setBookmarks: vi.fn(),
  removeBookmark: vi.fn(),
  reorderBookmarks: vi.fn(),
  findBookmarkById: vi.fn(),
  findBookmarkByTagId: vi.fn(),
  isBookmarked: vi.fn()
};

vi.mock('$lib/stores/tags/tag-bookmark-store.svelte', () => ({
  tagBookmarkStore: tagBookmarkStoreMock
}));

const errorHandlerMock = {
  addSyncError: vi.fn()
};

vi.mock('$lib/stores/error-handler.svelte', () => ({
  errorHandler: errorHandlerMock
}));

const accountStoreMock = {
  currentUserId: 'user-1',
  currentAccount: null
};

vi.mock('$lib/stores/account-store.svelte', () => ({
  accountStore: accountStoreMock
}));

// ---------- ヘルパー ----------

const now = '2025-01-01T00:00:00.000Z';

const buildBookmark = (overrides: Partial<TagBookmark> = {}): TagBookmark => ({
  id: 'bookmark-1',
  userId: 'user-1',
  projectId: 'project-1',
  tagId: 'tag-1',
  orderIndex: 0,
  createdAt: now,
  updatedAt: now,
  ...overrides
});

// ---------- テスト ----------

const { TagBookmarkService } = await import('$lib/services/domain/tag-bookmark');

describe('TagBookmarkService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    accountStoreMock.currentUserId = 'user-1';
    tagBookmarkStoreMock.bookmarks = [];
  });

  describe('create', () => {
    it('バックエンドでブックマークを作成しストアに追加する', async () => {
      const bookmark = buildBookmark();
      tagBookmarkBackendMock.create.mockResolvedValue(bookmark);

      const result = await TagBookmarkService.create('project-1', 'tag-1');

      expect(tagBookmarkBackendMock.create).toHaveBeenCalledWith({
        userId: 'user-1',
        projectId: 'project-1',
        tagId: 'tag-1'
      });
      expect(tagBookmarkStoreMock.addBookmark).toHaveBeenCalledWith(bookmark);
      expect(result).toEqual(bookmark);
    });

    it('ユーザーIDがない場合はnullを返す', async () => {
      accountStoreMock.currentUserId = null as unknown as string;

      const result = await TagBookmarkService.create('project-1', 'tag-1');

      expect(result).toBeNull();
      expect(tagBookmarkBackendMock.create).not.toHaveBeenCalled();
    });

    it('バックエンドエラー時はnullを返しエラーを記録する', async () => {
      const error = new Error('Backend error');
      tagBookmarkBackendMock.create.mockRejectedValue(error);

      const result = await TagBookmarkService.create('project-1', 'tag-1');

      expect(result).toBeNull();
      expect(errorHandlerMock.addSyncError).toHaveBeenCalledWith(
        'ブックマーク作成',
        'tag_bookmark',
        'tag-1',
        error
      );
    });
  });

  describe('loadBookmarksByProject', () => {
    it('プロジェクトのブックマークを読み込みストアにセットする', async () => {
      const bookmarks = [buildBookmark(), buildBookmark({ id: 'bookmark-2', tagId: 'tag-2' })];
      tagBookmarkBackendMock.listByProject.mockResolvedValue(bookmarks);

      await TagBookmarkService.loadBookmarksByProject('project-1');

      expect(tagBookmarkBackendMock.listByProject).toHaveBeenCalledWith('project-1');
      expect(tagBookmarkStoreMock.setBookmarks).toHaveBeenCalledWith(bookmarks);
    });

    it('バックエンドエラー時はエラーを記録する', async () => {
      const error = new Error('Backend error');
      tagBookmarkBackendMock.listByProject.mockRejectedValue(error);

      await TagBookmarkService.loadBookmarksByProject('project-1');

      expect(errorHandlerMock.addSyncError).toHaveBeenCalledWith(
        'ブックマーク読み込み',
        'tag_bookmark',
        'project-1',
        error
      );
    });
  });

  describe('loadAllBookmarks', () => {
    it('ユーザーの全ブックマークを読み込む', async () => {
      const bookmarks = [buildBookmark()];
      tagBookmarkBackendMock.listByUser.mockResolvedValue(bookmarks);

      await TagBookmarkService.loadAllBookmarks();

      expect(tagBookmarkBackendMock.listByUser).toHaveBeenCalledWith('user-1');
      expect(tagBookmarkStoreMock.setBookmarks).toHaveBeenCalledWith(bookmarks);
    });

    it('ユーザーIDがない場合は早期リターンする', async () => {
      accountStoreMock.currentUserId = null as unknown as string;

      await TagBookmarkService.loadAllBookmarks();

      expect(tagBookmarkBackendMock.listByUser).not.toHaveBeenCalled();
    });

    it('バックエンドエラー時はエラーを記録する', async () => {
      const error = new Error('Backend error');
      tagBookmarkBackendMock.listByUser.mockRejectedValue(error);

      await TagBookmarkService.loadAllBookmarks();

      expect(errorHandlerMock.addSyncError).toHaveBeenCalledWith(
        '全ブックマーク読み込み',
        'tag_bookmark',
        'all',
        error
      );
    });
  });

  describe('delete', () => {
    it('ストアとバックエンドからブックマークを削除する', async () => {
      const bookmark = buildBookmark();
      tagBookmarkStoreMock.findBookmarkById.mockReturnValue(bookmark);
      tagBookmarkBackendMock.delete.mockResolvedValue(undefined);

      await TagBookmarkService.delete('bookmark-1', 'tag-1');

      expect(tagBookmarkStoreMock.removeBookmark).toHaveBeenCalledWith('bookmark-1');
      expect(tagBookmarkBackendMock.delete).toHaveBeenCalledWith('bookmark-1');
    });

    it('ブックマークが存在しない場合は何もしない', async () => {
      tagBookmarkStoreMock.findBookmarkById.mockReturnValue(undefined);

      await TagBookmarkService.delete('non-existent', 'tag-1');

      expect(tagBookmarkStoreMock.removeBookmark).not.toHaveBeenCalled();
      expect(tagBookmarkBackendMock.delete).not.toHaveBeenCalled();
    });

    it('バックエンドエラー時はストアに復元する', async () => {
      const bookmark = buildBookmark();
      tagBookmarkStoreMock.findBookmarkById.mockReturnValue(bookmark);
      const error = new Error('Backend error');
      tagBookmarkBackendMock.delete.mockRejectedValue(error);

      await TagBookmarkService.delete('bookmark-1', 'tag-1');

      expect(tagBookmarkStoreMock.removeBookmark).toHaveBeenCalledWith('bookmark-1');
      expect(tagBookmarkStoreMock.addBookmark).toHaveBeenCalledWith(bookmark);
      expect(errorHandlerMock.addSyncError).toHaveBeenCalledWith(
        'ブックマーク削除',
        'tag_bookmark',
        'tag-1',
        error
      );
    });
  });

  describe('reorder', () => {
    it('ストアを楽観的更新してバックエンドに同期する', async () => {
      tagBookmarkBackendMock.reorder.mockResolvedValue(undefined);

      await TagBookmarkService.reorder('project-1', 0, 2);

      expect(tagBookmarkStoreMock.reorderBookmarks).toHaveBeenCalledWith(0, 2);
      expect(tagBookmarkBackendMock.reorder).toHaveBeenCalledWith({
        projectId: 'project-1',
        fromIndex: 0,
        toIndex: 2
      });
    });

    it('バックエンドエラー時はストアを復元する', async () => {
      const backup = [buildBookmark()];
      tagBookmarkStoreMock.bookmarks = [...backup];
      const error = new Error('Backend error');
      tagBookmarkBackendMock.reorder.mockRejectedValue(error);

      await TagBookmarkService.reorder('project-1', 0, 2);

      expect(tagBookmarkStoreMock.reorderBookmarks).toHaveBeenCalled();
      expect(tagBookmarkStoreMock.setBookmarks).toHaveBeenCalled();
      expect(errorHandlerMock.addSyncError).toHaveBeenCalledWith(
        'ブックマーク並び替え',
        'tag_bookmark',
        'project-1',
        error
      );
    });
  });

  describe('isBookmarked', () => {
    it('ブックマーク済みかどうかを返す', () => {
      tagBookmarkStoreMock.isBookmarked.mockReturnValue(true);

      const result = TagBookmarkService.isBookmarked('tag-1');

      expect(tagBookmarkStoreMock.isBookmarked).toHaveBeenCalledWith('tag-1');
      expect(result).toBe(true);
    });

    it('ブックマークされていない場合はfalseを返す', () => {
      tagBookmarkStoreMock.isBookmarked.mockReturnValue(false);

      const result = TagBookmarkService.isBookmarked('tag-2');

      expect(result).toBe(false);
    });
  });

  describe('toggleBookmark', () => {
    it('ブックマーク済みの場合は削除する', async () => {
      const bookmark = buildBookmark();
      tagBookmarkStoreMock.findBookmarkByTagId.mockReturnValue(bookmark);
      tagBookmarkStoreMock.findBookmarkById.mockReturnValue(bookmark);
      tagBookmarkBackendMock.delete.mockResolvedValue(undefined);

      await TagBookmarkService.toggleBookmark('project-1', 'tag-1');

      expect(tagBookmarkStoreMock.removeBookmark).toHaveBeenCalledWith('bookmark-1');
    });

    it('ブックマークされていない場合は作成する', async () => {
      tagBookmarkStoreMock.findBookmarkByTagId.mockReturnValue(undefined);
      const newBookmark = buildBookmark();
      tagBookmarkBackendMock.create.mockResolvedValue(newBookmark);

      await TagBookmarkService.toggleBookmark('project-1', 'tag-1');

      expect(tagBookmarkBackendMock.create).toHaveBeenCalledWith({
        userId: 'user-1',
        projectId: 'project-1',
        tagId: 'tag-1'
      });
    });
  });
});
