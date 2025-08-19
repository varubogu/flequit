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
  order_index?: number;
  /** 作成日時 */
  created_at: Date;
  /** 更新日時 */
  updated_at: Date;
}

/**
 * タグ検索条件
 */
export interface TagSearchCondition {
  /** タグ名 */
  name?: string;
}
