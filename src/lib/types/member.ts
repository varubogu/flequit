/**
 * プロジェクトメンバー
 */
export interface Member {
  /** メンバーのユーザーID */
  user_id: string;
  /** 権限役割 */
  role: 'Owner' | 'Admin' | 'Member' | 'Viewer';
  /** 参加日時 */
  joined_at: Date;
  /** 更新日時 */
  updated_at: Date;
}

/**
 * メンバー検索条件
 */
export interface MemberSearchCondition {
  /** ユーザーID */
  user_id?: string;
  /** 権限役割 */
  role?: 'Owner' | 'Admin' | 'Member' | 'Viewer';
}

