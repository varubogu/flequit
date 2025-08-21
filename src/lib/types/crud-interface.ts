/**
 * 基本的なCRUD操作インターフェース
 */
export interface CrudInterface<T, TPatch = Partial<T>> {
  /**
   * 新規作成
   */
  create(item: T): Promise<boolean>;

  /**
   * 部分更新
   */
  update(id: string, patch: TPatch): Promise<boolean>;

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
   * 全ての設定を一括取得
   */
  getAll(): Promise<T[]>;

  /**
   * 設定を更新
   */
  update(item: T): Promise<boolean>;
}

/**
 * アカウント用の特別なインターフェース（CRUD操作）
 */
export interface AccountInterface<T, TPatch = Partial<T>> {
  /**
   * 新規作成
   */
  create(item: T): Promise<boolean>;

  /**
   * IDでアカウントを取得
   */
  get(id: string): Promise<T | null>;

  /**
   * アカウントの部分更新
   */
  update(id: string, patch: TPatch): Promise<boolean>;

  /**
   * アカウントを削除
   */
  delete(id: string): Promise<boolean>;
}
