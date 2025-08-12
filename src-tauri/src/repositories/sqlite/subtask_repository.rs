#[allow(dead_code)]
use async_trait::async_trait;
use crate::errors::RepositoryError;
use crate::types::sub_task_types::Subtask;
use crate::repositories::sqlite::SqliteRepository;
use crate::repositories::core::subtask_repository_trait::SubtaskRepositoryTrait;



#[async_trait]
impl SubtaskRepositoryTrait for SqliteRepository {
    async fn set_subtask(&self, _project_id: &str, _task_id: &str, _subtask: &Subtask) -> Result<(), RepositoryError> {
        todo!("SQLiteでのサブタスク保存実装")
    }

    async fn get_subtask(&self, _project_id: &str, _task_id: &str, _subtask_id: &str) -> Result<Option<Subtask>, RepositoryError> {
        todo!("SQLiteでのサブタスク取得実装")
    }

    async fn list_subtasks(&self, _project_id: &str, _task_id: &str) -> Result<Vec<Subtask>, RepositoryError> {
        todo!("SQLiteでのサブタスク一覧実装")
    }

    async fn delete_subtask(&self, _project_id: &str, _task_id: &str, _subtask_id: &str) -> Result<(), RepositoryError> {
        todo!("SQLiteでのサブタスク削除実装")
    }

    async fn find_completed_subtasks(&self, _project_id: &str, _task_id: &str) -> Result<Vec<Subtask>, RepositoryError> {
        todo!("SQLiteでの完了サブタスク検索実装")
    }

    async fn find_incomplete_subtasks(&self, _project_id: &str, _task_id: &str) -> Result<Vec<Subtask>, RepositoryError> {
        todo!("SQLiteでの未完了サブタスク検索実装")
    }

    async fn find_subtasks_by_project(&self, _project_id: &str) -> Result<Vec<Subtask>, RepositoryError> {
        todo!("SQLiteでのプロジェクト別サブタスク検索実装")
    }

    async fn toggle_completion(&self, _project_id: &str, _task_id: &str, _subtask_id: &str) -> Result<(), RepositoryError> {
        todo!("SQLiteでのサブタスク完了状態切り替え実装")
    }

    async fn mark_completed(&self, _project_id: &str, _task_id: &str, _subtask_id: &str) -> Result<(), RepositoryError> {
        todo!("SQLiteでのサブタスク完了設定実装")
    }

    async fn mark_incomplete(&self, _project_id: &str, _task_id: &str, _subtask_id: &str) -> Result<(), RepositoryError> {
        todo!("SQLiteでのサブタスク未完了設定実装")
    }

    async fn validate_subtask_exists(&self, _project_id: &str, _task_id: &str, _subtask_id: &str) -> Result<bool, RepositoryError> {
        todo!("SQLiteでのサブタスク存在検証実装")
    }

    async fn validate_task_exists(&self, _project_id: &str, _task_id: &str) -> Result<bool, RepositoryError> {
        todo!("SQLiteでのタスク存在検証実装")
    }

    async fn get_subtask_count(&self, _project_id: &str, _task_id: &str) -> Result<u64, RepositoryError> {
        todo!("SQLiteでのサブタスク数取得実装")
    }

    async fn get_completed_subtask_count(&self, _project_id: &str, _task_id: &str) -> Result<u64, RepositoryError> {
        todo!("SQLiteでの完了サブタスク数取得実装")
    }

    async fn get_completion_rate(&self, _project_id: &str, _task_id: &str) -> Result<f32, RepositoryError> {
        todo!("SQLiteでのサブタスク完了率取得実装")
    }

    async fn mark_all_completed(&self, _project_id: &str, _task_id: &str) -> Result<(), RepositoryError> {
        todo!("SQLiteでの全サブタスク完了設定実装")
    }

    async fn mark_all_incomplete(&self, _project_id: &str, _task_id: &str) -> Result<(), RepositoryError> {
        todo!("SQLiteでの全サブタスク未完了設定実装")
    }
}
