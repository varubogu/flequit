use async_trait::async_trait;
use flequit_model::models::tagging::{TaskTag, SubtaskTag};
use flequit_model::types::id_types::{TaskId, SubTaskId, TagId};
use crate::errors::repository_error::RepositoryError;

/// タスクとタグの関連付けリポジトリトレイト
///
/// TaskTagの関連付け操作を提供する。
/// 標準的なCRUD操作に加えて、関連付け特有の操作を含む。
#[async_trait]
pub trait TaskTagRepositoryTrait: Send + Sync {
    /// 指定タスクのタグIDリストを取得
    async fn find_tag_ids_by_task_id(&self, task_id: &TaskId) -> Result<Vec<TagId>, RepositoryError>;

    /// 指定タグに関連するタスクIDリストを取得
    async fn find_task_ids_by_tag_id(&self, tag_id: &TagId) -> Result<Vec<TaskId>, RepositoryError>;

    /// タスクとタグの関連付けを追加
    async fn add_relation(&self, task_id: &TaskId, tag_id: &TagId) -> Result<(), RepositoryError>;

    /// タスクとタグの関連付けを削除
    async fn remove_relation(&self, task_id: &TaskId, tag_id: &TagId) -> Result<(), RepositoryError>;

    /// 指定タスクの全ての関連付けを削除
    async fn remove_all_relations_by_task_id(&self, task_id: &TaskId) -> Result<(), RepositoryError>;

    /// 指定タグの全ての関連付けを削除
    async fn remove_all_relations_by_tag_id(&self, tag_id: &TagId) -> Result<(), RepositoryError>;

    /// タスクのタグ関連付けを一括更新（既存をすべて削除して新しい関連を追加）
    async fn update_task_tag_relations(&self, task_id: &TaskId, tag_ids: &[TagId]) -> Result<(), RepositoryError>;

    /// TaskTagエンティティを直接取得（デバッグ・管理用）
    async fn get_all_task_tags(&self) -> Result<Vec<TaskTag>, RepositoryError>;
}

/// サブタスクとタグの関連付けリポジトリトレイト
///
/// SubtaskTagの関連付け操作を提供する。
/// 標準的なCRUD操作に加えて、関連付け特有の操作を含む。
#[async_trait]
pub trait SubtaskTagRepositoryTrait: Send + Sync {
    /// 指定サブタスクのタグIDリストを取得
    async fn find_tag_ids_by_subtask_id(&self, subtask_id: &SubTaskId) -> Result<Vec<TagId>, RepositoryError>;

    /// 指定タグに関連するサブタスクIDリストを取得
    async fn find_subtask_ids_by_tag_id(&self, tag_id: &TagId) -> Result<Vec<SubTaskId>, RepositoryError>;

    /// サブタスクとタグの関連付けを追加
    async fn add_relation(&self, subtask_id: &SubTaskId, tag_id: &TagId) -> Result<(), RepositoryError>;

    /// サブタスクとタグの関連付けを削除
    async fn remove_relation(&self, subtask_id: &SubTaskId, tag_id: &TagId) -> Result<(), RepositoryError>;

    /// 指定サブタスクの全ての関連付けを削除
    async fn remove_all_relations_by_subtask_id(&self, subtask_id: &SubTaskId) -> Result<(), RepositoryError>;

    /// 指定タグの全ての関連付けを削除
    async fn remove_all_relations_by_tag_id(&self, tag_id: &TagId) -> Result<(), RepositoryError>;

    /// サブタスクのタグ関連付けを一括更新（既存をすべて削除して新しい関連を追加）
    async fn update_subtask_tag_relations(&self, subtask_id: &SubTaskId, tag_ids: &[TagId]) -> Result<(), RepositoryError>;

    /// SubtaskTagエンティティを直接取得（デバッグ・管理用）
    async fn get_all_subtask_tags(&self) -> Result<Vec<SubtaskTag>, RepositoryError>;
}