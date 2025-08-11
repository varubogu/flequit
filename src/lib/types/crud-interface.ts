/**
 * 基本的なCRUD操作インターフェース
 */
export interface CrudInterface<T> {
  /**
   * 新規作成
   */
  create(item: T): Promise<boolean>;

  /**
   * 更新
   */
  update(item: T): Promise<boolean>;

  /**
   * 削除
   */
  delete(id: string): Promise<boolean>;

  /**
   * 1件取得
   */
  get(id: string): Promise<T | null>;
}

/**
 * 検索操作インターフェース
 */
export interface SearchInterface<T, TSearchCondition> {
  /**
   * 検索（複数件）
   */
  search(condition: TSearchCondition): Promise<T[]>;
}

/**
 * 設定用の特別なインターフェース（キーベースでの取得）
 */
export interface SettingInterface<T> {
  /**
   * キーで設定を取得
   */
  get(key: string): Promise<T | null>;

  /**
   * 設定を更新
   */
  update(item: T): Promise<boolean>;
}

/**
 * アカウント用の特別なインターフェース（IDベースでの取得・更新のみ）
 */
export interface AccountInterface<T> {
  /**
   * IDでアカウントを取得
   */
  get(id: string): Promise<T | null>;

  /**
   * アカウントを更新
   */
  update(item: T): Promise<boolean>;
}
