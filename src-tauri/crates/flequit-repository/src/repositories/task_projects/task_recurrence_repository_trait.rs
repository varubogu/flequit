use async_trait::async_trait;
use flequit_model::models::task_projects::task_recurrence::{TaskRecurrence, RecurrenceRuleId};
use flequit_model::types::id_types::TaskId;
use flequit_types::errors::repository_error::RepositoryError;

/// タスク繰り返しルール関連付けリポジトリのトレイト
///
/// タスクと繰り返しルール間の関連付けを管理するリポジトリ。
/// Service層はこのトレイトを直接使用し、内部でSQLiteとAutomergeを統合的に処理する。
///
/// # 設計思想
///
/// - **関連管理**: タスクIDと繰り返しルールIDの組み合わせで管理
/// - **一対一関係**: 一つのタスクに一つの繰り返しルール
/// - **日時管理**: 関連付けの作成日時を記録
#[async_trait]
pub trait TaskRecurrenceRepositoryTrait: Send + Sync {
    /// タスクIDによる繰り返しルール関連付けを取得します。
    ///
    /// # 引数
    ///
    /// * `task_id` - タスクID
    ///
    /// # 戻り値
    ///
    /// 関連付けが存在する場合は`Ok(Some(TaskRecurrence))`、
    /// 存在しない場合は`Ok(None)`、
    /// エラー時は`Err(RepositoryError)`
    async fn find_by_task_id(&self, task_id: &TaskId) -> Result<Option<TaskRecurrence>, RepositoryError>;

    /// 繰り返しルールIDによる関連付け一覧を取得します。
    ///
    /// # 引数
    ///
    /// * `recurrence_rule_id` - 繰り返しルールID
    ///
    /// # 戻り値
    ///
    /// 関連付けのベクター、失敗時は`Err(RepositoryError)`
    async fn find_by_recurrence_rule_id(&self, recurrence_rule_id: &RecurrenceRuleId) -> Result<Vec<TaskRecurrence>, RepositoryError>;

    /// すべてのタスク繰り返しルール関連付けを取得します。
    ///
    /// # 戻り値
    ///
    /// 関連付けのベクター、失敗時は`Err(RepositoryError)`
    async fn find_all(&self) -> Result<Vec<TaskRecurrence>, RepositoryError>;

    /// タスク繰り返しルール関連付けを保存します。
    ///
    /// # 引数
    ///
    /// * `recurrence` - 保存する関連付け
    ///
    /// # 戻り値
    ///
    /// 成功時は`Ok(())`、失敗時は`Err(RepositoryError)`
    async fn save(&self, recurrence: &TaskRecurrence) -> Result<(), RepositoryError>;

    /// タスクIDによる繰り返しルール関連付けを削除します。
    ///
    /// # 引数
    ///
    /// * `task_id` - タスクID
    ///
    /// # 戻り値
    ///
    /// 成功時は`Ok(())`、失敗時は`Err(RepositoryError)`
    async fn delete_by_task_id(&self, task_id: &TaskId) -> Result<(), RepositoryError>;

    /// 繰り返しルールIDによるすべての関連付けを削除します。
    ///
    /// # 引数
    ///
    /// * `recurrence_rule_id` - 繰り返しルールID
    ///
    /// # 戽り値
    ///
    /// 成功時は`Ok(())`、失敗時は`Err(RepositoryError)`
    async fn delete_by_recurrence_rule_id(&self, recurrence_rule_id: &RecurrenceRuleId) -> Result<(), RepositoryError>;

    /// 特定のタスクに繰り返しルールが関連付けられているか確認します。
    ///
    /// # 引数
    ///
    /// * `task_id` - タスクID
    ///
    /// # 戻り値
    ///
    /// 関連付けが存在する場合は`Ok(true)`、存在しない場合は`Ok(false)`、
    /// エラー時は`Err(RepositoryError)`
    async fn exists_by_task_id(&self, task_id: &TaskId) -> Result<bool, RepositoryError>;
}
