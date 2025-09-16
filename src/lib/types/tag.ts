/**
 * タグ
 */
export interface Tag {
  /** タグID */
  id: string;
  /** タグ名 */
  name: string;
  /** タグの色 */
  color?: string;
  /** 表示順序 */
  orderIndex?: number;
  /** 作成日時 */
  createdAt: Date;
  /** 更新日時 */
  updatedAt: Date;
}

/**
 * タグ検索条件
 */
export interface TagSearchCondition {
  /** タグ名 */
  name?: string;
}
