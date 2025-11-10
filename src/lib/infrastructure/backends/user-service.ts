import type { User } from '$lib/types/user';

/**
 * ユーザー管理サービスインターフェース
 */
export interface UserService {
  /**
   * ユーザーを作成
   */
  create(user: User, userId: string): Promise<boolean>;

  /**
   * ユーザーを取得
   */
  get(id: string, userId: string): Promise<User | null>;

  /**
   * ユーザーを更新
   */
  update(user: User, userId: string): Promise<boolean>;

  /**
   * ユーザーを削除
   */
  delete(id: string, userId: string): Promise<boolean>;
}
