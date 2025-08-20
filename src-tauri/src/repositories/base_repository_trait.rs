use crate::errors::repository_error::RepositoryError;
use async_trait::async_trait;

/// 汎用的なリポジトリトレイト
///
/// 全てのドメインリポジトリが継承すべき基底トレイト。
/// CRUD操作の基本インターフェースを提供する。
///
/// # 型パラメータ
///
/// * `T` - 管理するエンティティの型
///
/// # 設計思想
///
/// - **統一性**: 全てのリポジトリで一貫したインターフェース
/// - **抽象化**: 具象実装から独立したビジネスロジック
/// - **拡張性**: ドメイン固有のメソッドを追加可能
/// - **テスタビリティ**: モック実装を容易にする
///
/// # 使用例
///
/// ```rust
/// #[async_trait]
/// impl Repository<Project> for LocalSqliteProjectRepository {
///     async fn save(&self, entity: &Project) -> Result<(), RepositoryError> {
///         // SQLite実装
///     }
/// }
/// ```
#[async_trait]
pub trait Repository<T, TId>: Send + Sync {
    /// エンティティを保存または更新
    ///
    /// # 引数
    ///
    /// * `entity` - 保存するエンティティ
    ///
    /// # 戻り値
    ///
    /// 成功時は`Ok(())`、失敗時は`Err(RepositoryError)`
    async fn save(&self, entity: &T) -> Result<(), RepositoryError>;

    /// IDでエンティティを取得
    ///
    /// # 引数
    ///
    /// * `id` - エンティティのID
    ///
    /// # 戻り値
    ///
    /// エンティティが存在する場合は`Ok(Some(T))`、
    /// 存在しない場合は`Ok(None)`、
    /// エラー時は`Err(RepositoryError)`
    async fn find_by_id(&self, id: &TId) -> Result<Option<T>, RepositoryError>;

    /// 全てのエンティティを取得
    ///
    /// # 戻り値
    ///
    /// エンティティのベクター、失敗時は`Err(RepositoryError)`
    async fn find_all(&self) -> Result<Vec<T>, RepositoryError>;

    /// エンティティを削除
    ///
    /// # 引数
    ///
    /// * `id` - 削除するエンティティのID
    ///
    /// # 戻り値
    ///
    /// 成功時は`Ok(())`、失敗時は`Err(RepositoryError)`
    async fn delete(&self, id: &TId) -> Result<(), RepositoryError>;

    /// エンティティの存在確認
    ///
    /// # 引数
    ///
    /// * `id` - 確認するエンティティのID
    ///
    /// # 戻り値
    ///
    /// 存在する場合は`Ok(true)`、存在しない場合は`Ok(false)`、
    /// エラー時は`Err(RepositoryError)`
    async fn exists(&self, id: &TId) -> Result<bool, RepositoryError>;

    /// エンティティの総数を取得
    ///
    /// # 戻り値
    ///
    /// エンティティの総数、失敗時は`Err(RepositoryError)`
    async fn count(&self) -> Result<u64, RepositoryError>;

    // TODO: パッチによる部分更新（段階的実装のため後で全Repository実装に追加）
    // async fn patch<P>(&self, id: &TId, patch: &P) -> Result<bool, RepositoryError>
    // where
    //     P: Partial + Send + Sync;
}
