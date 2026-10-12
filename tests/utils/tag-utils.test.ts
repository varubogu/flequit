import { describe, expect, it } from 'vitest';
import { getTagDisplayInfo, getTagFromId, getTagsFromIds, validateTagIds } from '$lib/utils/tag-utils';
import type { Tag } from '$lib/types/tag';

const tags: Tag[] = [
  {
    id: 'tag-1',
    name: 'milk',
    color: '#fff',
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-01T00:00:00Z')
  },
  {
    id: 'tag-2',
    name: 'bread',
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-01T00:00:00Z')
  }
];

describe('tag utils', () => {
  it('returns matching tags and drops unknown ids', () => {
    expect(getTagsFromIds([], tags)).toEqual([]);
    expect(getTagsFromIds(undefined as unknown as string[], tags)).toEqual([]);
    expect(getTagsFromIds(['tag-2', 'missing', 'tag-1'], tags).map((tag) => tag.id)).toEqual([
      'tag-2',
      'tag-1'
    ]);
  });

  it('finds one tag by id', () => {
    expect(getTagFromId('tag-1', tags)?.name).toBe('milk');
    expect(getTagFromId('missing', tags)).toBeUndefined();
  });

  it('accepts an empty id list and rejects an unknown id', () => {
    expect(validateTagIds([], tags)).toBe(true);
    expect(validateTagIds(undefined as unknown as string[], tags)).toBe(true);
    expect(validateTagIds(['tag-1', 'tag-2'], tags)).toBe(true);
    expect(validateTagIds(['tag-1', 'missing'], tags)).toBe(false);
  });

  it('includes a style only when the tag has a color', () => {
    expect(getTagDisplayInfo(tags[0])).toEqual({
      name: 'milk',
      color: '#fff',
      style: 'background-color: #fff'
    });
    expect(getTagDisplayInfo(tags[1]).style).toBeUndefined();
  });
});
