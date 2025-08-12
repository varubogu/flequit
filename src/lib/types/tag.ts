
export interface Tag {
  id: string;
  name: string;
  color?: string;
  order_index?: number;
  created_at: Date;
  updated_at: Date;
}

export interface TagSearchCondition {
  name?: string;
}
