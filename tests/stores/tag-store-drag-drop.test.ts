import { describe, it, expect, beforeEach } from 'vitest';
import { tagStore } from '$lib/stores/tags.svelte';
import type { Tag } from '$lib/types/task';

describe('TagStore - ドラッグ&ドロップ機能', () => {
  beforeEach(() => {
    // テスト前にタグストアをリセット
    tagStore.tags = [];
    tagStore.bookmarkedTags = new Set();
  });

  describe('ブックマークされたタグの並び替え', () => {
    it('ブックマークされたタグを正しく並び替えできる', () => {
      // テストデータを設定
      const tag1 = tagStore.addTag({ name: 'タグ1', color: '#ff0000' });
      const tag2 = tagStore.addTag({ name: 'タグ2', color: '#00ff00' });
      const tag3 = tagStore.addTag({ name: 'タグ3', color: '#0000ff' });

      expect(tag1 && tag2 && tag3).toBeTruthy();

      // タグをブックマークに追加
      tagStore.addBookmark(tag1!.id);
      tagStore.addBookmark(tag2!.id);
      tagStore.addBookmark(tag3!.id);

      // 初期順序を確認
      expect(tagStore.bookmarkedTagList.map((t) => t.name)).toEqual(['タグ1', 'タグ2', 'タグ3']);

      // タグ3を先頭に移動
      tagStore.moveBookmarkedTagToPosition(tag3!.id, 0);

      expect(tagStore.bookmarkedTagList.map((t) => t.name)).toEqual(['タグ3', 'タグ1', 'タグ2']);

      // order_indexが正しく設定されているか確認
      const reorderedTags = tagStore.bookmarkedTagList;
      expect(reorderedTags[0].order_index).toBe(0);
      expect(reorderedTags[1].order_index).toBe(1);
      expect(reorderedTags[2].order_index).toBe(2);
    });

    it('複数回の並び替えが正しく動作する', () => {
      const tagA = tagStore.addTag({ name: 'A', color: '#ff0000' });
      const tagB = tagStore.addTag({ name: 'B', color: '#00ff00' });
      const tagC = tagStore.addTag({ name: 'C', color: '#0000ff' });
      const tagD = tagStore.addTag({ name: 'D', color: '#ffff00' });

      expect(tagA && tagB && tagC && tagD).toBeTruthy();

      // 全てブックマークに追加
      tagStore.addBookmark(tagA!.id);
      tagStore.addBookmark(tagB!.id);
      tagStore.addBookmark(tagC!.id);
      tagStore.addBookmark(tagD!.id);

      // B を最後に移動
      tagStore.moveBookmarkedTagToPosition(tagB!.id, 3);
      expect(tagStore.bookmarkedTagList.map((t) => t.name)).toEqual(['A', 'C', 'D', 'B']);

      // D を先頭に移動
      tagStore.moveBookmarkedTagToPosition(tagD!.id, 0);
      expect(tagStore.bookmarkedTagList.map((t) => t.name)).toEqual(['D', 'A', 'C', 'B']);

      // C を A の前に移動
      tagStore.moveBookmarkedTagToPosition(tagC!.id, 1);
      expect(tagStore.bookmarkedTagList.map((t) => t.name)).toEqual(['D', 'C', 'A', 'B']);
    });

    it('reorderBookmarkedTagsメソッドが正しく動作する', () => {
      const tag1 = tagStore.addTag({ name: 'タグ1' });
      const tag2 = tagStore.addTag({ name: 'タグ2' });
      const tag3 = tagStore.addTag({ name: 'タグ3' });

      expect(tag1 && tag2 && tag3).toBeTruthy();

      tagStore.addBookmark(tag1!.id);
      tagStore.addBookmark(tag2!.id);
      tagStore.addBookmark(tag3!.id);

      // インデックス2をインデックス0に移動
      tagStore.reorderBookmarkedTags(2, 0);

      expect(tagStore.bookmarkedTagList.map((t) => t.name)).toEqual(['タグ3', 'タグ1', 'タグ2']);
    });

    it('新しくブックマークされたタグには適切なorder_indexが設定される', () => {
      const tag1 = tagStore.addTag({ name: 'タグ1' });
      const tag2 = tagStore.addTag({ name: 'タグ2' });

      expect(tag1 && tag2).toBeTruthy();

      // 最初のタグをブックマーク
      tagStore.addBookmark(tag1!.id);
      expect(tagStore.tags.find((t) => t.id === tag1!.id)?.order_index).toBe(0);

      // 2番目のタグをブックマーク
      tagStore.addBookmark(tag2!.id);
      expect(tagStore.tags.find((t) => t.id === tag2!.id)?.order_index).toBe(1);
    });

    it('ブックマークされていないタグは並び替え対象にならない', () => {
      const tag1 = tagStore.addTag({ name: 'ブックマーク1' });
      const tag2 = tagStore.addTag({ name: 'ブックマーク2' });
      const tag3 = tagStore.addTag({ name: '非ブックマーク' });

      expect(tag1 && tag2 && tag3).toBeTruthy();

      // 2つだけブックマーク
      tagStore.addBookmark(tag1!.id);
      tagStore.addBookmark(tag2!.id);

      expect(tagStore.bookmarkedTagList.length).toBe(2);
      expect(tagStore.bookmarkedTagList.map((t) => t.name)).toEqual([
        'ブックマーク1',
        'ブックマーク2'
      ]);

      // 非ブックマークタグの移動を試行（何も起こらない）
      tagStore.moveBookmarkedTagToPosition(tag3!.id, 0);
      expect(tagStore.bookmarkedTagList.map((t) => t.name)).toEqual([
        'ブックマーク1',
        'ブックマーク2'
      ]);
    });
  });

  describe('エラーケース', () => {
    it('存在しないタグIDで移動操作をしても例外が発生しない', () => {
      const tag1 = tagStore.addTag({ name: 'テストタグ' });
      expect(tag1).toBeTruthy();

      tagStore.addBookmark(tag1!.id);

      expect(() => {
        tagStore.moveBookmarkedTagToPosition('non-existent-id', 0);
      }).not.toThrow();

      // タグの状態は変わらない
      expect(tagStore.bookmarkedTagList.length).toBe(1);
      expect(tagStore.bookmarkedTagList[0].name).toBe('テストタグ');
    });

    it('範囲外のインデックスで移動しても安全に処理される', () => {
      const tag1 = tagStore.addTag({ name: 'タグ1' });
      const tag2 = tagStore.addTag({ name: 'タグ2' });

      expect(tag1 && tag2).toBeTruthy();

      tagStore.addBookmark(tag1!.id);
      tagStore.addBookmark(tag2!.id);

      // 範囲外のインデックス（負の値）
      tagStore.reorderBookmarkedTags(-1, 0);
      expect(tagStore.bookmarkedTagList.map((t) => t.name)).toEqual(['タグ1', 'タグ2']);

      // 範囲外のインデックス（配列長より大きい値）
      tagStore.reorderBookmarkedTags(0, 10);
      expect(tagStore.bookmarkedTagList.map((t) => t.name)).toEqual(['タグ1', 'タグ2']);
    });

    it('同じ位置への移動は状態を変更しない', () => {
      const tag1 = tagStore.addTag({ name: 'タグ1' });
      const tag2 = tagStore.addTag({ name: 'タグ2' });

      expect(tag1 && tag2).toBeTruthy();

      tagStore.addBookmark(tag1!.id);
      tagStore.addBookmark(tag2!.id);

      const initialOrder = tagStore.bookmarkedTagList.map((t) => ({ ...t }));

      // タグ1を現在の位置（0）に移動
      tagStore.moveBookmarkedTagToPosition(tag1!.id, 0);

      expect(tagStore.bookmarkedTagList.map((t) => t.name)).toEqual(['タグ1', 'タグ2']);
      // order_indexは変更されない（同じ位置への移動のため）
      expect(tagStore.bookmarkedTagList[0].order_index).toBe(initialOrder[0].order_index);
    });
  });

  describe('initializeTagOrderIndices', () => {
    it('既存のブックマークされたタグにorder_indexを正しく設定する', () => {
      // order_indexなしでタグを作成
      const tag1: Tag = {
        id: 'tag-1',
        name: 'タグ1',
        created_at: new Date(),
        updated_at: new Date()
      };
      const tag2: Tag = {
        id: 'tag-2',
        name: 'タグ2',
        created_at: new Date(),
        updated_at: new Date()
      };

      tagStore.addTagWithId(tag1);
      tagStore.addTagWithId(tag2);
      tagStore.addBookmark(tag1.id);
      tagStore.addBookmark(tag2.id);

      // order_indexが未設定であることを確認
      expect(tag1.order_index).toBeUndefined();
      expect(tag2.order_index).toBeUndefined();

      // 初期化を実行
      tagStore.initializeTagOrderIndices();

      // order_indexが設定されていることを確認
      const updatedTag1 = tagStore.tags.find((t) => t.id === tag1.id);
      const updatedTag2 = tagStore.tags.find((t) => t.id === tag2.id);

      expect(updatedTag1?.order_index).toBe(0);
      expect(updatedTag2?.order_index).toBe(1);
    });

    it('既にorder_indexが設定されているタグには影響しない', () => {
      const tag1 = tagStore.addTag({ name: 'タグ1' });
      expect(tag1).toBeTruthy();

      tagStore.addBookmark(tag1!.id);

      // 手動でorder_indexを設定
      tagStore.updateTag(tag1!.id, { order_index: 5 });

      tagStore.initializeTagOrderIndices();

      // order_indexが変更されていないことを確認
      const updatedTag = tagStore.tags.find((t) => t.id === tag1!.id);
      expect(updatedTag?.order_index).toBe(5);
    });
  });

  describe('データ整合性', () => {
    it('タグ削除後も並び順が保持される', () => {
      const tag1 = tagStore.addTag({ name: 'タグ1' });
      const tag2 = tagStore.addTag({ name: 'タグ2' });
      const tag3 = tagStore.addTag({ name: 'タグ3' });

      expect(tag1 && tag2 && tag3).toBeTruthy();

      // 全てブックマーク
      tagStore.addBookmark(tag1!.id);
      tagStore.addBookmark(tag2!.id);
      tagStore.addBookmark(tag3!.id);

      // 中間のタグを削除
      tagStore.deleteTag(tag2!.id);

      // 残りのタグの並び順が保持されている
      expect(tagStore.bookmarkedTagList.map((t) => t.name)).toEqual(['タグ1', 'タグ3']);
    });

    it('ブックマーク解除後に並び替えが正しく動作する', () => {
      const tag1 = tagStore.addTag({ name: 'タグ1' });
      const tag2 = tagStore.addTag({ name: 'タグ2' });
      const tag3 = tagStore.addTag({ name: 'タグ3' });

      expect(tag1 && tag2 && tag3).toBeTruthy();

      // 全てブックマーク
      tagStore.addBookmark(tag1!.id);
      tagStore.addBookmark(tag2!.id);
      tagStore.addBookmark(tag3!.id);

      // 中間のタグのブックマークを解除
      tagStore.removeBookmark(tag2!.id);

      expect(tagStore.bookmarkedTagList.map((t) => t.name)).toEqual(['タグ1', 'タグ3']);

      // 残りのタグの並び替えができる
      tagStore.moveBookmarkedTagToPosition(tag3!.id, 0);
      expect(tagStore.bookmarkedTagList.map((t) => t.name)).toEqual(['タグ3', 'タグ1']);
    });

    it('並び替え操作後にupdated_atが正しく更新される', () => {
      const tag1 = tagStore.addTag({ name: 'タグ1' });
      const tag2 = tagStore.addTag({ name: 'タグ2' });

      expect(tag1 && tag2).toBeTruthy();

      tagStore.addBookmark(tag1!.id);
      tagStore.addBookmark(tag2!.id);

      const initialDate = new Date('2023-01-01');
      tagStore.updateTag(tag1!.id, { updated_at: initialDate });
      tagStore.updateTag(tag2!.id, { updated_at: initialDate });

      // 並び替え実行
      tagStore.moveBookmarkedTagToPosition(tag2!.id, 0);

      // updated_atが更新されている
      const updatedTag1 = tagStore.tags.find((t) => t.id === tag1!.id);
      const updatedTag2 = tagStore.tags.find((t) => t.id === tag2!.id);

      expect(updatedTag1?.updated_at.getTime()).toBeGreaterThan(initialDate.getTime());
      expect(updatedTag2?.updated_at.getTime()).toBeGreaterThan(initialDate.getTime());
    });
  });
});
