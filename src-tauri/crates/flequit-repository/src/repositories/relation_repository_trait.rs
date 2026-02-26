use async_trait::async_trait;
use chrono::{DateTime, Utc};
use flequit_model::types::id_types::UserId;
use flequit_types::errors::repository_error::RepositoryError;

/// 関係性管理リポジトリトレイト
///
/// 2つのエンティティ間の関係（リレーション）を管理するトレイト。
/// 多対多の関係を表現する中間テーブルの操作を提供する。
///
/// # 型パラメータ
///
/// * `TRelation` - リレーションエンティティの型
/// * `TParentId` - 親エンティティのID型
/// * `TChildId` - 子エンティティのID型
///
/// # 使用例
///
/// ```rust,no_run
/// # use async_trait::async_trait;
/// # use chrono::{DateTime, Utc};
/// # use flequit_model::types::id_types::UserId;
/// # use flequit_repository::repositories::relation_repository_trait::RelationRepository;
/// # use flequit_types::errors::repository_error::RepositoryError;
/// # struct TaskAssignment;
/// # struct TaskId;
/// # struct TaskAssignmentRepository;
/// #[async_trait]
/// impl RelationRepository<TaskAssignment, TaskId, UserId> for TaskAssignmentRepository {
///     async fn add(
///         &self,
///         _parent_id: &TaskId,
///         _child_id: &UserId,
///         _user_id: &UserId,
///         _timestamp: &DateTime<Utc>,
///     ) -> Result<(), RepositoryError> {
///         // タスクにユーザーを割り当て
/// #       unimplemented!()
///     }
/// #   async fn remove(&self, _parent_id: &TaskId, _child_id: &UserId) -> Result<(), RepositoryError> { unimplemented!() }
/// #   async fn remove_all(&self, _parent_id: &TaskId) -> Result<(), RepositoryError> { unimplemented!() }
/// #   async fn find_relations(&self, _parent_id: &TaskId) -> Result<Vec<TaskAssignment>, RepositoryError> { unimplemented!() }
/// #   async fn exists(&self, _parent_id: &TaskId) -> Result<bool, RepositoryError> { unimplemented!() }
/// #   async fn count(&self, _parent_id: &TaskId) -> Result<u64, RepositoryError> { unimplemented!() }
/// }
/// ```
#[async_trait]
pub trait RelationRepository<TRelation, TParentId, TChildId>: Send + Sync
where
    TRelation: Send + Sync,
    TParentId: Send + Sync,
    TChildId: Send + Sync,
{
    /// 紐づけを追加
    ///
    /// # 引数
    ///
    /// * `parent_id` - 親エンティティのID
    /// * `child_id` - 子エンティティのID
    ///
    /// # 戻り値
    ///
    /// 成功時は`Ok(())`、失敗時は`Err(RepositoryError)`
    async fn add(&self, parent_id: &TParentId, child_id: &TChildId, user_id: &UserId, timestamp: &DateTime<Utc>) -> Result<(), RepositoryError>;

    /// 紐づけを削除
    ///
    /// # 引数
    ///
    /// * `parent_id` - 親エンティティのID
    /// * `child_id` - 子エンティティのID
    ///
    /// # 戻り値
    ///
    /// 成功時は`Ok(())`、失敗時は`Err(RepositoryError)`
    async fn remove(
        &self,
        parent_id: &TParentId,
        child_id: &TChildId,
    ) -> Result<(), RepositoryError>;

    /// 紐づけを全て削除
    ///
    /// # 引数
    ///
    /// * `parent_id` - 親エンティティのID
    ///
    /// # 戻り値
    ///
    /// 成功時は`Ok(())`、失敗時は`Err(RepositoryError)`
    async fn remove_all(&self, parent_id: &TParentId) -> Result<(), RepositoryError>;

    /// 紐づけ一覧を取得
    ///
    /// # 引数
    ///
    /// * `parent_id` - 親エンティティのID
    ///
    /// # 戻り値
    ///
    /// リレーションエンティティのベクター、失敗時は`Err(RepositoryError)`
    async fn find_relations(
        &self,
        parent_id: &TParentId,
    ) -> Result<Vec<TRelation>, RepositoryError>;

    /// 紐づけが存在するかチェック
    ///
    /// # 引数
    ///
    /// * `parent_id` - 親エンティティのID
    ///
    /// # 戻り値
    ///
    /// 紐づけが存在する場合は`Ok(true)`、存在しない場合は`Ok(false)`、
    /// エラー時は`Err(RepositoryError)`
    async fn exists(&self, parent_id: &TParentId) -> Result<bool, RepositoryError>;

    /// 紐づけの総数を取得
    ///
    /// # 引数
    ///
    /// * `parent_id` - 親エンティティのID
    ///
    /// # 戻り値
    ///
    /// 紐づけの総数、失敗時は`Err(RepositoryError)`
    async fn count(&self, parent_id: &TParentId) -> Result<u64, RepositoryError>;
}
