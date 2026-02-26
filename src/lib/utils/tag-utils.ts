import type { Tag } from '$lib/types/tag';

/**
 * タグIDの配列からタグオブジェクトの配列を生成する
 * @param tagIds タグIDの配列
 * @param allTags プロジェクト内の全タグ
 * @returns タグオブジェクトの配列
 */
export function getTagsFromIds(tagIds: string[], allTags: Tag[]): Tag[] {
  if (!tagIds || tagIds.length === 0) return [];

  const tagMap = new Map(allTags.map((tag) => [tag.id, tag]));

  return tagIds.map((id) => tagMap.get(id)).filter((tag): tag is Tag => tag !== undefined);
}

/**
 * 単一のタグIDからタグオブジェクトを取得する
 * @param tagId タグID
 * @param allTags プロジェクト内の全タグ
 * @returns タグオブジェクト（見つからない場合はundefined）
 */
export function getTagFromId(tagId: string, allTags: Tag[]): Tag | undefined {
  return allTags.find((tag) => tag.id === tagId);
}

/**
 * タグIDの配列が有効かどうかチェックする
 * @param tagIds タグIDの配列
 * @param allTags プロジェクト内の全タグ
 * @returns 全てのタグIDが存在する場合true、そうでなければfalse
 */
export function validateTagIds(tagIds: string[], allTags: Tag[]): boolean {
  if (!tagIds || tagIds.length === 0) return true;

  const tagIdSet = new Set(allTags.map((tag) => tag.id));
  return tagIds.every((id) => tagIdSet.has(id));
}

/**
 * タグの表示名を取得する（色情報付き）
 * @param tag タグオブジェクト
 * @returns タグの表示用情報
 */
export function getTagDisplayInfo(tag: Tag): { name: string; color?: string; style?: string } {
  return {
    name: tag.name,
    color: tag.color,
    style: tag.color ? `background-color: ${tag.color}` : undefined
  };
}
