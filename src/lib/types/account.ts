/**
 * アカウント（認証情報）
 */
export interface Account {
  /** アカウント内部ID（機密、外部公開禁止） */
  id: string;
  /** 公開ユーザーID（他者から参照可能、プロジェクト共有用） */
  user_id: string;
  /** メールアドレス */
  email?: string;
  /** プロバイダー提供の表示名 */
  display_name?: string;
  /** アバター画像URL */
  avatar_url?: string;
  /** 認証プロバイダー名 */
  provider: string;
  /** プロバイダー側ユーザーID */
  provider_id?: string;
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
  /** メールアドレス */
  email?: string | null;
  /** プロバイダー提供の表示名 */
  display_name?: string | null;
  /** アバター画像URL */
  avatar_url?: string | null;
  /** 認証プロバイダー名 */
  provider?: string;
  /** プロバイダー側ユーザーID */
  provider_id?: string | null;
  /** アクティブ状態 */
  is_active?: boolean;
}