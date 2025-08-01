import { describe, it, expect, beforeEach } from 'vitest';
import { TagStore } from '$lib/stores/tags.svelte';

describe('TagStore', () => {
  let tagStore: TagStore;

  beforeEach(() => {
    tagStore = new TagStore();
  });

  describe('addTag', () => {
    it('should add a new tag', () => {
      const tagName = 'urgent';
      const tag = tagStore.addTag({ name: tagName });

      expect(tagStore.tags).toHaveLength(1);
      expect(tag).not.toBeNull();
      expect(tag!.name).toBe(tagName);
      expect(tag!.id).toBeDefined();
    });

    it('should not add duplicate tags', () => {
      const tagName = 'urgent';
      tagStore.addTag({ name: tagName });
      tagStore.addTag({ name: tagName });

      expect(tagStore.tags).toHaveLength(1);
    });

    it('should be case insensitive for duplicates', () => {
      tagStore.addTag({ name: 'Urgent' });
      tagStore.addTag({ name: 'urgent' });

      expect(tagStore.tags).toHaveLength(1);
      expect(tagStore.tags[0].name).toBe('Urgent');
    });

    it('should handle tag with color', () => {
      const tag = tagStore.addTag({ name: 'important', color: '#ff0000' });

      expect(tag).not.toBeNull();
      expect(tag!.name).toBe('important');
      expect(tag!.color).toBe('#ff0000');
    });

    it('should not add empty tag names', () => {
      const initialCount = tagStore.tags.length;
      const tag1 = tagStore.addTag({ name: '' });
      const tag2 = tagStore.addTag({ name: '   ' });

      expect(tag1).toBeNull();
      expect(tag2).toBeNull();
      expect(tagStore.tags).toHaveLength(initialCount);
    });
  });

  describe('searchTags', () => {
    beforeEach(() => {
      tagStore.addTag({ name: 'urgent' });
      tagStore.addTag({ name: 'important' });
      tagStore.addTag({ name: 'work' });
      tagStore.addTag({ name: 'personal' });
    });

    it('should return all tags for empty search', () => {
      const results = tagStore.searchTags('');
      expect(results).toHaveLength(4);
      expect(results.map((tag) => tag.name)).toEqual(['urgent', 'important', 'work', 'personal']);
    });

    it('should return partial matches', () => {
      const results = tagStore.searchTags('ur');
      expect(results).toHaveLength(1);
      expect(results[0].name).toBe('urgent');
    });

    it('should be case insensitive', () => {
      const results = tagStore.searchTags('WORK');
      expect(results).toHaveLength(1);
      expect(results[0].name).toBe('work');
    });

    it('should return multiple matches', () => {
      const results = tagStore.searchTags('r');
      expect(results.length).toBeGreaterThan(1);
      expect(results.some((tag) => tag.name === 'urgent')).toBe(true);
      expect(results.some((tag) => tag.name === 'important')).toBe(true);
      expect(results.some((tag) => tag.name === 'personal')).toBe(true);
    });
  });

  describe('getOrCreateTag', () => {
    it('should return existing tag if found', () => {
      tagStore.addTag({ name: 'existing' });
      const tag = tagStore.getOrCreateTag('existing');

      expect(tagStore.tags).toHaveLength(1);
      expect(tag).not.toBeNull();
      expect(tag!.name).toBe('existing');
    });

    it('should create new tag if not found', () => {
      const tag = tagStore.getOrCreateTag('new-tag');

      expect(tagStore.tags).toHaveLength(1);
      expect(tag).not.toBeNull();
      expect(tag!.name).toBe('new-tag');
    });

    it('should be case insensitive when finding existing tags', () => {
      tagStore.addTag({ name: 'ExistingTag' });
      const tag = tagStore.getOrCreateTag('existingtag');

      expect(tagStore.tags).toHaveLength(1);
      expect(tag).not.toBeNull();
      expect(tag!.name).toBe('ExistingTag'); // Should return the original case
    });

    it('should return null for empty tag names', () => {
      const tag1 = tagStore.getOrCreateTag('');
      const tag2 = tagStore.getOrCreateTag('   ');

      expect(tag1).toBeNull();
      expect(tag2).toBeNull();
      expect(tagStore.tags).toHaveLength(0);
    });
  });

  describe('deleteTag', () => {
    let tagId: string;

    beforeEach(() => {
      const tag = tagStore.addTag({ name: 'to-remove' });
      tagId = tag!.id;
    });

    it('should remove tag by id', () => {
      tagStore.deleteTag(tagId);
      expect(tagStore.tags).toHaveLength(0);
    });

    it('should not affect other tags', () => {
      tagStore.addTag({ name: 'keep-this' });
      tagStore.deleteTag(tagId);

      expect(tagStore.tags).toHaveLength(1);
      expect(tagStore.tags[0].name).toBe('keep-this');
    });

    it('should handle non-existent tag id gracefully', () => {
      tagStore.deleteTag('non-existent-id');
      expect(tagStore.tags).toHaveLength(1);
    });
  });

  describe('findTagByName', () => {
    beforeEach(() => {
      tagStore.addTag({ name: 'FindMe' });
      tagStore.addTag({ name: 'AnotherTag' });
    });

    it('should find tag by exact name', () => {
      const tag = tagStore.findTagByName('FindMe');
      expect(tag).toBeDefined();
      expect(tag?.name).toBe('FindMe');
    });

    it('should be case insensitive', () => {
      const tag = tagStore.findTagByName('findme');
      expect(tag).toBeDefined();
      expect(tag?.name).toBe('FindMe');
    });

    it('should return undefined for non-existent tag', () => {
      const tag = tagStore.findTagByName('NonExistent');
      expect(tag).toBeUndefined();
    });
  });

  describe('tag name validation', () => {
    it('should handle tags with special characters correctly', () => {
      // TagStore itself doesn't clean tag names, but components should
      // This test ensures the store can handle various tag names
      const tag1 = tagStore.addTag({ name: 'normal' });
      const tag2 = tagStore.addTag({ name: 'with-dash' });
      const tag3 = tagStore.addTag({ name: 'with_underscore' });

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
