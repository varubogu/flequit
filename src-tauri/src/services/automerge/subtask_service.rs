use crate::errors::ServiceError;
use crate::types::task_types::Subtask;
use crate::repositories::automerge::SubtaskRepository;
use tauri::State;

pub struct SubtaskService;

impl SubtaskService {
    pub fn new() -> Self {
        Self
    }

    // サブタスク操作
    pub async fn create_subtask(&self, subtask_repository: State<'_, SubtaskRepository>, project_id: &str, subtask: &Subtask) -> Result<(), ServiceError> {
        // サブタスクの妥当性を検証
        self.validate_subtask(subtask).await?;

        // repositoryを使用してサブタスクを作成
        subtask_repository.set_subtask(project_id, &subtask.task_id, subtask)
            .await
            .map_err(ServiceError::Repository)
    }

    pub async fn get_subtask(&self, subtask_repository: State<'_, SubtaskRepository>, project_id: &str, task_id: &str, subtask_id: &str) -> Result<Option<Subtask>, ServiceError> {
        subtask_repository.get_subtask(project_id, task_id, subtask_id)
            .await
            .map_err(ServiceError::Repository)
    }

    pub async fn update_subtask(&self, subtask_repository: State<'_, SubtaskRepository>, project_id: &str, subtask: &Subtask) -> Result<(), ServiceError> {
        // サブタスクの妥当性を検証
        self.validate_subtask(subtask).await?;

        // repositoryを使用してサブタスクを更新
        subtask_repository.set_subtask(project_id, &subtask.task_id, subtask)
            .await
            .map_err(ServiceError::Repository)
    }

    pub async fn delete_subtask(&self, subtask_repository: State<'_, SubtaskRepository>, project_id: &str, task_id: &str, subtask_id: &str) -> Result<(), ServiceError> {
        subtask_repository.delete_subtask(project_id, task_id, subtask_id)
            .await
            .map_err(ServiceError::Repository)
    }

    pub async fn list_subtasks(&self, subtask_repository: State<'_, SubtaskRepository>, project_id: &str, task_id: &str) -> Result<Vec<Subtask>, ServiceError> {
        subtask_repository.list_subtasks(project_id, task_id)
            .await
            .map_err(ServiceError::Repository)
    }

    // ビジネスロジック
    pub async fn validate_subtask(&self, subtask: &Subtask) -> Result<(), ServiceError> {
        if subtask.title.trim().is_empty() {
            return Err(ServiceError::ValidationError("Subtask title cannot be empty".to_string()));
        }

        if subtask.title.len() > 255 {
            return Err(ServiceError::ValidationError("Subtask title too long".to_string()));
        }

        if subtask.task_id.trim().is_empty() {
            return Err(ServiceError::ValidationError("Task ID cannot be empty".to_string()));
        }

        Ok(())
    }

    pub async fn toggle_completion(&self, subtask_repository: State<'_, SubtaskRepository>, project_id: &str, task_id: &str, subtask_id: &str) -> Result<(), ServiceError> {
        subtask_repository.toggle_completion(project_id, task_id, subtask_id)
            .await
            .map_err(ServiceError::Repository)
    }

    // pub async fn mark_completed(&self, subtask_repository: State<'_, SubtaskRepository>, project_id: &str, task_id: &str, subtask_id: &str) -> Result<(), ServiceError> {
    //     subtask_repository.mark_completed(project_id, task_id, subtask_id)
    //         .await
    //         .map_err(ServiceError::Repository)
    // }

    // pub async fn mark_incomplete(&self, subtask_repository: State<'_, SubtaskRepository>, project_id: &str, task_id: &str, subtask_id: &str) -> Result<(), ServiceError> {
    //     subtask_repository.mark_incomplete(project_id, task_id, subtask_id)
    //         .await
    //         .map_err(ServiceError::Repository)
    // }

    // pub async fn get_completion_rate(&self, subtask_repository: State<'_, SubtaskRepository>, project_id: &str, task_id: &str) -> Result<f32, ServiceError> {
    //     subtask_repository.get_completion_rate(project_id, task_id)
    //         .await
    //         .map_err(ServiceError::Repository)
    // }
}
