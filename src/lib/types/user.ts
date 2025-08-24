/**
 * ユーザー（ユーザー情報・全情報が公開想定）
 */
export interface User {
  /** ユーザーの公開識別子（他者から参照可能、プロジェクト共有用） */
  id: string;
  /** ユーザー名 */
  username: string;
  /** 表示名 */
  display_name?: string;
  /** メールアドレス */
  email?: string;
  /** アバターURL */
  avatar_url?: string;
  /** ローカル保存アバター */
  avatar?: string;
  /** 自己紹介 */
  bio?: string;
  /** タイムゾーン */
  timezone?: string;
  /** アクティブ状態 */
  is_active: boolean;
  /** 作成日時 */
  created_at: Date;
  /** 更新日時 */
  updated_at: Date;
}

/**
 * ユーザー部分更新用のパッチインターフェース
 */
export interface UserPatch {
  /** ユーザー名 */
  username?: string;
  /** 表示名 */
  display_name?: string | null;
  /** メールアドレス */
  email?: string | null;
  /** アバターURL */
  avatar_url?: string | null;
  /** ローカル保存アバター */
  avatar?: string | null;
  /** 自己紹介 */
  bio?: string | null;
  /** タイムゾーン */
  timezone?: string | null;
  /** アクティブ状態 */
  is_active?: boolean;
}