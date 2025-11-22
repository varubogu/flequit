import { beforeEach, describe, expect, it } from 'vitest';
import { tagStore } from '$lib/stores/tags.svelte';
import type { Tag } from '$lib/types/tag';
import { SvelteSet } from 'svelte/reactivity';

async function createTag(name: string, color?: string) {
  const tag = await tagStore.addTag({ name, color });
  if (!tag) {
    throw new Error('Tag creation failed');
  }
  return tag;
}

describe('TagStore - ドラッグ&ドロップ機能', () => {
  beforeEach(() => {
    tagStore.tags = [];
    tagStore.bookmarkedTags = new SvelteSet<string>();
  });

  describe('ブックマークされたタグの並び替え', () => {
    it('ブックマークされたタグを正しく並び替えできる', async () => {
      const tag1 = await createTag('タグ1', '#ff0000');
      const tag2 = await createTag('タグ2', '#00ff00');
      const tag3 = await createTag('タグ3', '#0000ff');

      await tagStore.addBookmark(tag1.id);
      await tagStore.addBookmark(tag2.id);
      await tagStore.addBookmark(tag3.id);

      expect(tagStore.bookmarkedTagList.map((t) => t.name)).toEqual(['タグ1', 'タグ2', 'タグ3']);

      await tagStore.moveBookmarkedTagToPosition(tag3.id, 0);

      expect(tagStore.bookmarkedTagList.map((t) => t.name)).toEqual(['タグ3', 'タグ1', 'タグ2']);

      const reorderedTags = tagStore.bookmarkedTagList;
      expect(reorderedTags[0].orderIndex).toBe(0);
      expect(reorderedTags[1].orderIndex).toBe(1);
      expect(reorderedTags[2].orderIndex).toBe(2);
    });

    it('複数回の並び替えが正しく動作する', async () => {
      const tagA = await createTag('A', '#ff0000');
      const tagB = await createTag('B', '#00ff00');
      const tagC = await createTag('C', '#0000ff');
      const tagD = await createTag('D', '#ffff00');

      await tagStore.addBookmark(tagA.id);
      await tagStore.addBookmark(tagB.id);
      await tagStore.addBookmark(tagC.id);
      await tagStore.addBookmark(tagD.id);

      await tagStore.moveBookmarkedTagToPosition(tagB.id, 3);
      expect(tagStore.bookmarkedTagList.map((t) => t.name)).toEqual(['A', 'C', 'D', 'B']);

      await tagStore.moveBookmarkedTagToPosition(tagD.id, 0);
      expect(tagStore.bookmarkedTagList.map((t) => t.name)).toEqual(['D', 'A', 'C', 'B']);

      await tagStore.moveBookmarkedTagToPosition(tagC.id, 1);
      expect(tagStore.bookmarkedTagList.map((t) => t.name)).toEqual(['D', 'C', 'A', 'B']);
    });

    it('reorderBookmarkedTagsメソッドが正しく動作する', async () => {
      const tag1 = await createTag('タグ1');
      const tag2 = await createTag('タグ2');
      const tag3 = await createTag('タグ3');

      await tagStore.addBookmark(tag1.id);
      await tagStore.addBookmark(tag2.id);
      await tagStore.addBookmark(tag3.id);

      await tagStore.reorderBookmarkedTags(2, 0);

      expect(tagStore.bookmarkedTagList.map((t) => t.name)).toEqual(['タグ3', 'タグ1', 'タグ2']);
    });

    it('新しくブックマークされたタグには適切なorder_indexが設定される', async () => {
      const tag1 = await createTag('タグ1');
      const tag2 = await createTag('タグ2');

      await tagStore.addBookmark(tag1.id);
      expect(tagStore.tags.find((t) => t.id === tag1.id)?.orderIndex).toBe(0);

      await tagStore.addBookmark(tag2.id);
      expect(tagStore.tags.find((t) => t.id === tag2.id)?.orderIndex).toBe(1);
    });

    it('ブックマークされていないタグは並び替え対象にならない', async () => {
      const tag1 = await createTag('ブックマーク1');
      const tag2 = await createTag('ブックマーク2');
      const tag3 = await createTag('非ブックマーク');

      await tagStore.addBookmark(tag1.id);
      await tagStore.addBookmark(tag2.id);

      expect(tagStore.bookmarkedTagList.length).toBe(2);

      await tagStore.moveBookmarkedTagToPosition(tag3.id, 0);
      expect(tagStore.bookmarkedTagList.map((t) => t.name)).toEqual(['ブックマーク1', 'ブックマーク2']);
    });
  });

  describe('エラーケース', () => {
    it('存在しないタグIDで移動操作をしても例外が発生しない', async () => {
      const tag1 = await createTag('テストタグ');
      await tagStore.addBookmark(tag1.id);

      await expect(tagStore.moveBookmarkedTagToPosition('non-existent-id', 0)).resolves.toBeUndefined();

      expect(tagStore.bookmarkedTagList.length).toBe(1);
      expect(tagStore.bookmarkedTagList[0].name).toBe('テストタグ');
    });

    it('範囲外のインデックスで移動しても安全に処理される', async () => {
      const tag1 = await createTag('タグ1');
      const tag2 = await createTag('タグ2');

      await tagStore.addBookmark(tag1.id);
      await tagStore.addBookmark(tag2.id);

      await tagStore.reorderBookmarkedTags(-1, 0);
      expect(tagStore.bookmarkedTagList.map((t) => t.name)).toEqual(['タグ1', 'タグ2']);

      await tagStore.reorderBookmarkedTags(0, 10);
      expect(tagStore.bookmarkedTagList.map((t) => t.name)).toEqual(['タグ1', 'タグ2']);
    });

    it('同じ位置への移動は状態を変更しない', async () => {
      const tag1 = await createTag('タグ1');
      const tag2 = await createTag('タグ2');

      await tagStore.addBookmark(tag1.id);
      await tagStore.addBookmark(tag2.id);

      const initialOrder = tagStore.bookmarkedTagList.map((t) => ({ ...t }));

      await tagStore.moveBookmarkedTagToPosition(tag1.id, 0);

      expect(tagStore.bookmarkedTagList.map((t) => t.name)).toEqual(['タグ1', 'タグ2']);
      expect(tagStore.bookmarkedTagList[0].orderIndex).toBe(initialOrder[0].orderIndex);
    });
  });

  describe('initializeTagOrderIndices', () => {
    it('既存のブックマークされたタグにorder_indexを正しく設定する', async () => {
      const tag1: Tag = {
        id: 'tag-1',
        name: 'タグ1',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const tag2: Tag = {
        id: 'tag-2',
        name: 'タグ2',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      tagStore.addTagWithId(tag1);
      tagStore.addTagWithId(tag2);
      await tagStore.addBookmark(tag1.id);
      await tagStore.addBookmark(tag2.id);

      await tagStore.initializeTagOrderIndices();

      expect(tagStore.tags.find((t) => t.id === tag1.id)?.orderIndex).toBe(0);
      expect(tagStore.tags.find((t) => t.id === tag2.id)?.orderIndex).toBe(1);
    });
  });
});
