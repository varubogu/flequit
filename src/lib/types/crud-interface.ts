/**
 * 基本的なCRUD操作インターフェース
 */
export interface CrudInterface<T, TPatch = Partial<T>> {
  /**
   * 新規作成
   */
  create(item: T, userId: string): Promise<boolean>;

  /**
   * 部分更新
   */
  update(id: string, patch: TPatch, userId: string): Promise<boolean>;

  /**
   * 削除
   */
  delete(id: string, userId: string): Promise<boolean>;

  /**
   * 1件取得
   */
  get(id: string, userId: string): Promise<T | null>;
}

/**
 * 検索操作インターフェース
 */
export interface SearchInterface<T, TSearchCondition> {
  /**
   * 検索（複数件）
   */
  search(condition: TSearchCondition, userId: string): Promise<T[]>;
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
  create(item: T, userId: string): Promise<boolean>;

  /**
   * IDでアカウントを取得
   */
  get(id: string, userId: string): Promise<T | null>;

  /**
   * アカウントの部分更新
   */
  update(id: string, patch: TPatch, userId: string): Promise<boolean>;

  /**
   * アカウントを削除
   */
  delete(id: string, userId: string): Promise<boolean>;
}

/**
 * プロジェクト固有のCRUD操作インターフェース
 */
export interface ProjectCrudInterface<T, TPatch = Partial<T>> {
  /**
   * 新規作成
   */
  create(projectId: string, item: T, userId: string): Promise<boolean>;

  /**
   * 部分更新
   */
  update(projectId: string, id: string, patch: TPatch, userId: string): Promise<boolean>;

  /**
   * 削除
   */
  delete(projectId: string, id: string, userId: string): Promise<boolean>;

  /**
   * 1件取得
   */
  get(projectId: string, id: string, userId: string): Promise<T | null>;
}

/**
 * プロジェクト固有の検索操作インターフェース
 */
export interface ProjectSearchInterface<T, TSearchCondition> {
  /**
   * 検索（複数件）
   */
  search(projectId: string, condition: TSearchCondition, userId: string): Promise<T[]>;
}

/**
 * 復元操作インターフェース（プロジェクト用・projectId不要）
 */
export interface RestorableInterface {
  /**
   * 論理削除されたエンティティを復元
   */
  restore(id: string, userId: string): Promise<boolean>;
}

/**
 * プロジェクト固有の復元操作インターフェース
 */
export interface RestorableProjectInterface {
  /**
   * 論理削除されたエンティティを復元
   */
  restore(projectId: string, id: string, userId: string): Promise<boolean>;
}
