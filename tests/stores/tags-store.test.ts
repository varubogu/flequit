import { beforeEach, describe, expect, it } from 'vitest';
import { TagStoreFacade } from '$lib/stores/tags.svelte';

function createTagStore() {
  const store = new TagStoreFacade();
  store.setTags([]);
  return store;
}

describe('TagStoreFacade (ローカル動作)', () => {
  let tagStore: TagStoreFacade;

  beforeEach(() => {
    tagStore = createTagStore();
  });

  const addTag = (name: string, color?: string) => tagStore.addTag({ name, color });

  describe('addTag', () => {
    it('タグを追加できる', async () => {
      const tag = await addTag('urgent');

      expect(tagStore.tags).toHaveLength(1);
      expect(tag).not.toBeNull();
      expect(tag!.name).toBe('urgent');
      expect(tag!.id).toBeDefined();
    });

    it('重複するタグは追加しない', async () => {
      await addTag('urgent');
      await addTag('urgent');

      expect(tagStore.tags).toHaveLength(1);
    });

    it('大文字小文字を区別せず重複を判定する', async () => {
      await addTag('Urgent');
      await addTag('urgent');

      expect(tagStore.tags).toHaveLength(1);
      expect(tagStore.tags[0].name).toBe('Urgent');
    });

    it('color付きのタグを追加できる', async () => {
      const tag = await addTag('important', '#ff0000');

      expect(tag).not.toBeNull();
      expect(tag!.color).toBe('#ff0000');
    });

    it('空のタグ名は追加しない', async () => {
      const initialCount = tagStore.tags.length;
      const tag1 = await addTag('');
      const tag2 = await addTag('   ');

      expect(tag1).toBeNull();
      expect(tag2).toBeNull();
      expect(tagStore.tags).toHaveLength(initialCount);
    });
  });

  describe('searchTags', () => {
    beforeEach(async () => {
      await addTag('urgent');
      await addTag('important');
      await addTag('work');
      await addTag('personal');
    });

    it('空文字列で全件を返す', () => {
      const results = tagStore.searchTags('');
      expect(results).toHaveLength(4);
      expect(results.map((tag) => tag.name)).toEqual(['urgent', 'important', 'work', 'personal']);
    });

    it('部分一致で検索できる', () => {
      const results = tagStore.searchTags('ur');
      expect(results).toHaveLength(1);
      expect(results[0].name).toBe('urgent');
    });

    it('大文字小文字を区別しない', () => {
      const results = tagStore.searchTags('WORK');
      expect(results).toHaveLength(1);
      expect(results[0].name).toBe('work');
    });

    it('複数ヒットを返す', () => {
      const results = tagStore.searchTags('r');
      expect(results.length).toBeGreaterThan(1);
      expect(results.some((tag) => tag.name === 'urgent')).toBe(true);
      expect(results.some((tag) => tag.name === 'important')).toBe(true);
      expect(results.some((tag) => tag.name === 'personal')).toBe(true);
    });
  });

  describe('getOrCreateTag', () => {
    it('既存タグを返す', async () => {
      await addTag('existing');
      const tag = await tagStore.getOrCreateTag('existing');

      expect(tagStore.tags).toHaveLength(1);
      expect(tag).not.toBeNull();
      expect(tag!.name).toBe('existing');
    });

    it('存在しないタグは新規作成する', async () => {
      const tag = await tagStore.getOrCreateTag('new-tag');

      expect(tagStore.tags).toHaveLength(1);
      expect(tag).not.toBeNull();
      expect(tag!.name).toBe('new-tag');
    });

    it('既存タグ検索は大文字小文字を区別しない', async () => {
      await addTag('ExistingTag');
      const tag = await tagStore.getOrCreateTag('existingtag');

      expect(tagStore.tags).toHaveLength(1);
      expect(tag).not.toBeNull();
      expect(tag!.name).toBe('ExistingTag');
    });

    it('空文字列はnullを返す', async () => {
      const tag1 = await tagStore.getOrCreateTag('');
      const tag2 = await tagStore.getOrCreateTag('   ');

      expect(tag1).toBeNull();
      expect(tag2).toBeNull();
      expect(tagStore.tags).toHaveLength(0);
    });
  });

  describe('deleteTag', () => {
    let tagId: string;

    beforeEach(async () => {
      const tag = await addTag('to-remove');
      tagId = tag!.id;
    });

    it('ID指定で削除できる', async () => {
      await tagStore.deleteTag(tagId);
      expect(tagStore.tags).toHaveLength(0);
    });

    it('他のタグには影響しない', async () => {
      await addTag('keep-this');
      await tagStore.deleteTag(tagId);

      expect(tagStore.tags).toHaveLength(1);
      expect(tagStore.tags[0].name).toBe('keep-this');
    });

    it('存在しないIDでも落ちない', async () => {
      await tagStore.deleteTag('non-existent-id');
      expect(tagStore.tags).toHaveLength(1);
    });
  });

  describe('findTagByName', () => {
    beforeEach(async () => {
      await addTag('FindMe');
      await addTag('AnotherTag');
    });

    it('完全一致で取得できる', () => {
      const tag = tagStore.findTagByName('FindMe');
      expect(tag).toBeDefined();
      expect(tag?.name).toBe('FindMe');
    });

    it('大文字小文字を区別しない', () => {
      const tag = tagStore.findTagByName('findme');
      expect(tag).toBeDefined();
      expect(tag?.name).toBe('FindMe');
    });

    it('存在しない場合はundefined', () => {
      const tag = tagStore.findTagByName('NonExistent');
      expect(tag).toBeUndefined();
    });
  });

  describe('タグ名の扱い', () => {
    it('特殊文字を含むタグ名を扱える', async () => {
      const tag1 = await addTag('normal');
      const tag2 = await addTag('with-dash');
      const tag3 = await addTag('with_underscore');

      expect(tag1).not.toBeNull();
      expect(tag2).not.toBeNull();
      expect(tag3).not.toBeNull();
      expect(tag1!.name).toBe('normal');
      expect(tag2!.name).toBe('with-dash');
      expect(tag3!.name).toBe('with_underscore');
      expect(tagStore.tags).toHaveLength(3);
    });
  });
});
