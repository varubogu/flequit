/**
 * User Documentを表現するインターフェース（Automergeドキュメント）
 * 複数のユーザーを配列として管理し、追加・更新のみ可能で削除は不可
 */
export interface UserDocument {
  /** ユーザー情報配列（追加・更新のみ、削除不可） */
  users: User[];
}

/**
 * ユーザー（ユーザー情報・全情報が公開想定）
 */
export interface User {
  /** ユーザーの公開識別子（他者から参照可能、プロジェクト共有用） */
  id: string;
  /** ユニークユーザー名（必須、@mention等で使用） */
  handle_id: string;
  /** 表示名（UI表示用、必須） */
  display_name: string;
  /** メールアドレス（任意、通知や連絡で使用） */
  email?: string;
  /** アバターURL（外部サービス由来） */
  avatar_url?: string;
  /** 自己紹介文（任意） */
  bio?: string;
  /** タイムゾーン（任意） */
  timezone?: string;
  /** アクティブ状態（必須） */
  is_active: boolean;
  /** 作成日時 */
  created_at: string;
  /** 更新日時 */
  updated_at: string;
}

