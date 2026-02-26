use async_trait::async_trait;
use chrono::{DateTime, Utc};
use flequit_model::types::id_types::UserId;
use flequit_types::errors::repository_error::RepositoryError;

/// 汎用的なリポジトリトレイト
///
/// 全てのドメインリポジトリが継承すべき基底トレイト。
/// CRUD操作の基本インターフェースを提供する。
///
/// # 型パラメータ
///
/// * `T` - 管理するエンティティの型
/// * `TId` - エンティティのID型
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
/// ```rust,no_run
/// # use async_trait::async_trait;
/// # use chrono::{DateTime, Utc};
/// # use flequit_model::types::id_types::UserId;
/// # use flequit_repository::repositories::base_repository_trait::Repository;
/// # use flequit_types::errors::repository_error::RepositoryError;
/// # struct Project;
/// # struct ProjectId;
/// # struct LocalSqliteProjectRepository;
/// #[async_trait]
/// impl Repository<Project, ProjectId> for LocalSqliteProjectRepository {
///     async fn save(
///         &self,
///         _entity: &Project,
///         _user_id: &UserId,
///         _timestamp: &DateTime<Utc>,
///     ) -> Result<(), RepositoryError> {
///         // SQLite実装
/// #       unimplemented!()
///     }
/// #   async fn find_by_id(&self, _id: &ProjectId) -> Result<Option<Project>, RepositoryError> { unimplemented!() }
/// #   async fn find_all(&self) -> Result<Vec<Project>, RepositoryError> { unimplemented!() }
/// #   async fn delete(&self, _id: &ProjectId) -> Result<(), RepositoryError> { unimplemented!() }
/// #   async fn exists(&self, _id: &ProjectId) -> Result<bool, RepositoryError> { unimplemented!() }
/// #   async fn count(&self) -> Result<u64, RepositoryError> { unimplemented!() }
/// }
/// ```
#[async_trait]
pub trait Repository<T, TId>: Send + Sync
where
    T: Send + Sync,
    TId: Send + Sync,
{
    /// エンティティを保存または更新
    ///
    /// # 引数
    ///
    /// * `entity` - 保存するエンティティ
    /// * `user_id` - 操作を実行するユーザーのID
    /// * `timestamp` - 操作のタイムスタンプ
    ///
    /// # 戻り値
    ///
    /// 成功時は`Ok(())`、失敗時は`Err(RepositoryError)`
    async fn save(&self, entity: &T, user_id: &UserId, timestamp: &DateTime<Utc>) -> Result<(), RepositoryError>;

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
}
