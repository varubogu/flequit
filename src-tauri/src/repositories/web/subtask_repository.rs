use async_trait::async_trait;
use crate::errors::RepositoryError;
use crate::models::subtask::Subtask;
use crate::repositories::web::WebRepository;
use crate::repositories::core::subtask_repository_trait::SubtaskRepositoryTrait;


#[async_trait]
impl SubtaskRepositoryTrait for WebRepository {
    async fn set_subtask(&self, _project_id: &str, _task_id: &str, _subtask: &Subtask) -> Result<(), RepositoryError> {
        todo!("WebAPIでのサブタスク保存実装")
    }

    async fn get_subtask(&self, _project_id: &str, _task_id: &str, _subtask_id: &str) -> Result<Option<Subtask>, RepositoryError> {
        todo!("WebAPIでのサブタスク取得実装")
    }

    async fn list_subtasks(&self, _project_id: &str, _task_id: &str) -> Result<Vec<Subtask>, RepositoryError> {
        todo!("WebAPIでのサブタスク一覧実装")
    }

    async fn delete_subtask(&self, _project_id: &str, _task_id: &str, _subtask_id: &str) -> Result<(), RepositoryError> {
        todo!("WebAPIでのサブタスク削除実装")
    }

    async fn find_completed_subtasks(&self, _project_id: &str, _task_id: &str) -> Result<Vec<Subtask>, RepositoryError> {
        todo!("WebAPIでの完了サブタスク検索実装")
    }

    async fn find_incomplete_subtasks(&self, _project_id: &str, _task_id: &str) -> Result<Vec<Subtask>, RepositoryError> {
        todo!("WebAPIでの未完了サブタスク検索実装")
    }

    async fn find_subtasks_by_project(&self, _project_id: &str) -> Result<Vec<Subtask>, RepositoryError> {
        todo!("WebAPIでのプロジェクト別サブタスク検索実装")
    }

    async fn toggle_completion(&self, _project_id: &str, _task_id: &str, _subtask_id: &str) -> Result<(), RepositoryError> {
        todo!("WebAPIでのサブタスク完了状態切り替え実装")
    }

    async fn mark_completed(&self, _project_id: &str, _task_id: &str, _subtask_id: &str) -> Result<(), RepositoryError> {
        todo!("WebAPIでのサブタスク完了設定実装")
    }

    async fn mark_incomplete(&self, _project_id: &str, _task_id: &str, _subtask_id: &str) -> Result<(), RepositoryError> {
        todo!("WebAPIでのサブタスク未完了設定実装")
    }

    async fn validate_subtask_exists(&self, _project_id: &str, _task_id: &str, _subtask_id: &str) -> Result<bool, RepositoryError> {
        todo!("WebAPIでのサブタスク存在検証実装")
    }

    async fn validate_task_exists(&self, _project_id: &str, _task_id: &str) -> Result<bool, RepositoryError> {
        todo!("WebAPIでのタスク存在検証実装")
    }

    async fn get_subtask_count(&self, _project_id: &str, _task_id: &str) -> Result<u64, RepositoryError> {
        todo!("WebAPIでのサブタスク数取得実装")
    }

    async fn get_completed_subtask_count(&self, _project_id: &str, _task_id: &str) -> Result<u64, RepositoryError> {
        todo!("WebAPIでの完了サブタスク数取得実装")
    }

    async fn get_completion_rate(&self, _project_id: &str, _task_id: &str) -> Result<f32, RepositoryError> {
        todo!("WebAPIでのサブタスク完了率取得実装")
    }

    async fn mark_all_completed(&self, _project_id: &str, _task_id: &str) -> Result<(), RepositoryError> {
        todo!("WebAPIでの全サブタスク完了設定実装")
    }

    async fn mark_all_incomplete(&self, _project_id: &str, _task_id: &str) -> Result<(), RepositoryError> {
        todo!("WebAPIでの全サブタスク未完了設定実装")
    }
}
