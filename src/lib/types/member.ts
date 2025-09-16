/**
 * プロジェクトメンバー
 */
export interface Member {
  /** メンバーのユーザーID */
  userId: string;
  /** 権限役割 */
  role: 'Owner' | 'Admin' | 'Member' | 'Viewer';
  /** 参加日時 */
  joinedAt: Date;
  /** 更新日時 */
  updatedAt: Date;
}

/**
 * メンバー検索条件
 */
export interface MemberSearchCondition {
  /** ユーザーID */
  userId?: string;
  /** 権限役割 */
  role?: 'Owner' | 'Admin' | 'Member' | 'Viewer';
}
