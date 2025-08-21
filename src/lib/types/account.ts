/**
 * アカウント
 */
export interface Account {
  /** アカウントID */
  id: string;
  /** ユーザー名 */
  username: string;
  /** 表示名 */
  display_name?: string;
  /** メールアドレス */
  email?: string;
  /** アバター画像URL */
  avatar_url?: string;
  /** アクティブ状態 */
  is_active: boolean;
  /** 作成日時 */
  created_at: Date;
  /** 更新日時 */
  updated_at: Date;
}

/**
 * アカウント部分更新用のパッチインターフェース
 */
export interface AccountPatch {
  /** ユーザー名 */
  username?: string;
  /** 表示名 */
  display_name?: string | null;
  /** メールアドレス */
  email?: string | null;
  /** アバター画像URL */
  avatar_url?: string | null;
  /** アクティブ状態 */
  is_active?: boolean;
}