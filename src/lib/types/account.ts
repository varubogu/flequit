/**
 * アカウント（認証情報）
 */
export interface Account {
  /** アカウント内部ID（機密、外部公開禁止） */
  id: string;
  /** 公開ユーザーID（他者から参照可能、プロジェクト共有用） */
  userId: string;
  /** プロバイダー提供の表示名 */
  displayName?: string;
  /** メールアドレス */
  email?: string;
  /** アバター画像URL */
  avatarUrl?: string;
  /** 認証プロバイダー名 */
  provider: string;
  /** プロバイダー側ユーザーID */
  providerId?: string;
  /** アクティブ状態 */
  isActive: boolean;
  /** 作成日時 */
  createdAt: string;
  /** 更新日時 */
  updatedAt: string;
  /** 削除フラグ（論理削除） */
  deleted?: boolean;
  /** 最終更新者のユーザーID */
  updatedBy?: string;
}
