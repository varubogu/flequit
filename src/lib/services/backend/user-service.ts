import type { User } from '$lib/types/user';

/**
 * ユーザー管理サービスインターフェース
 */
export interface UserService {
  /**
   * ユーザーを作成
   */
  create(user: User): Promise<boolean>;

  /**
   * ユーザーを取得
   */
  get(id: string): Promise<User | null>;

  /**
   * ユーザーを更新
   */
  update(user: User): Promise<boolean>;

  /**
   * ユーザーを削除
   */
  delete(userId: string): Promise<boolean>;
}
