use async_trait::async_trait;
use crate::errors::RepositoryError;
use crate::models::task::Task;
use crate::types::task_types::TaskStatus;
use crate::repositories::web::WebRepository;
use crate::repositories::task_repository_trait::TaskRepositoryTrait;


#[async_trait]
impl TaskRepositoryTrait for WebRepository {
    async fn set_task(&self, _project_id: &str, _task: &Task) -> Result<(), RepositoryError> {
        todo!("WebAPIでのタスク保存実装")
    }

    async fn get_task(&self, _project_id: &str, _task_id: &str) -> Result<Option<Task>, RepositoryError> {
        todo!("WebAPIでのタスク取得実装")
    }

    async fn list_tasks(&self, _project_id: &str) -> Result<Vec<Task>, RepositoryError> {
        todo!("WebAPIでのタスク一覧実装")
    }

    async fn delete_task(&self, _project_id: &str, _task_id: &str) -> Result<(), RepositoryError> {
        todo!("WebAPIでのタスク削除実装")
    }

    async fn find_tasks_by_assignee(&self, _project_id: &str, _assignee_id: &str) -> Result<Vec<Task>, RepositoryError> {
        todo!("WebAPIでの担当者別タスク検索実装")
    }

    async fn find_tasks_by_status(&self, _project_id: &str, _status: TaskStatus) -> Result<Vec<Task>, RepositoryError> {
        todo!("WebAPIでのステータス別タスク検索実装")
    }

    async fn find_tasks_by_priority(&self, _project_id: &str, _priority: i32) -> Result<Vec<Task>, RepositoryError> {
        todo!("WebAPIでの優先度別タスク検索実装")
    }

    async fn find_tasks_by_tag(&self, _project_id: &str, _tag_id: &str) -> Result<Vec<Task>, RepositoryError> {
        todo!("WebAPIでのタグ別タスク検索実装")
    }

    async fn find_overdue_tasks(&self, _project_id: &str, _current_time: i64) -> Result<Vec<Task>, RepositoryError> {
        todo!("WebAPIでの期限超過タスク検索実装")
    }

    async fn update_task_status(&self, _project_id: &str, _task_id: &str, _status: TaskStatus) -> Result<(), RepositoryError> {
        todo!("WebAPIでのタスクステータス更新実装")
    }

    async fn update_task_priority(&self, _project_id: &str, _task_id: &str, _priority: i32) -> Result<(), RepositoryError> {
        todo!("WebAPIでのタスク優先度更新実装")
    }

    async fn assign_task(&self, _project_id: &str, _task_id: &str, _assignee_id: Option<String>) -> Result<(), RepositoryError> {
        todo!("WebAPIでのタスク担当者設定実装")
    }

    async fn add_tag_to_task(&self, _project_id: &str, _task_id: &str, _tag_id: &str) -> Result<(), RepositoryError> {
        todo!("WebAPIでのタスクタグ追加実装")
    }

    async fn remove_tag_from_task(&self, _project_id: &str, _task_id: &str, _tag_id: &str) -> Result<(), RepositoryError> {
        todo!("WebAPIでのタスクタグ削除実装")
    }

    async fn validate_task_exists(&self, _project_id: &str, _task_id: &str) -> Result<bool, RepositoryError> {
        todo!("WebAPIでのタスク存在検証実装")
    }

    async fn validate_project_exists(&self, _project_id: &str) -> Result<bool, RepositoryError> {
        todo!("WebAPIでのプロジェクト存在検証実装")
    }

    async fn get_task_count(&self, _project_id: &str) -> Result<u64, RepositoryError> {
        todo!("WebAPIでのタスク数取得実装")
    }

    async fn get_task_count_by_status(&self, _project_id: &str, _status: TaskStatus) -> Result<u64, RepositoryError> {
        todo!("WebAPIでのステータス別タスク数取得実装")
    }

    async fn get_completion_rate(&self, _project_id: &str) -> Result<f32, RepositoryError> {
        todo!("WebAPIでのタスク完了率取得実装")
    }
}
