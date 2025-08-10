use crate::errors::RepositoryError;
use crate::types::task_types::Subtask;
use async_trait::async_trait;

#[async_trait]
#[allow(dead_code)]
pub trait SubtaskRepositoryTrait {
    async fn set_subtask(&self, project_id: &str, task_id: &str, subtask: &Subtask) -> Result<(), RepositoryError>;
    
    async fn get_subtask(&self, project_id: &str, task_id: &str, subtask_id: &str) -> Result<Option<Subtask>, RepositoryError>;
    
    async fn list_subtasks(&self, project_id: &str, task_id: &str) -> Result<Vec<Subtask>, RepositoryError>;
    
    async fn delete_subtask(&self, project_id: &str, task_id: &str, subtask_id: &str) -> Result<(), RepositoryError>;

    async fn find_completed_subtasks(&self, project_id: &str, task_id: &str) -> Result<Vec<Subtask>, RepositoryError>;
    
    async fn find_incomplete_subtasks(&self, project_id: &str, task_id: &str) -> Result<Vec<Subtask>, RepositoryError>;
    
    async fn find_subtasks_by_project(&self, project_id: &str) -> Result<Vec<Subtask>, RepositoryError>;

    async fn toggle_completion(&self, project_id: &str, task_id: &str, subtask_id: &str) -> Result<(), RepositoryError>;
    
    async fn mark_completed(&self, project_id: &str, task_id: &str, subtask_id: &str) -> Result<(), RepositoryError>;
    
    async fn mark_incomplete(&self, project_id: &str, task_id: &str, subtask_id: &str) -> Result<(), RepositoryError>;

    async fn validate_subtask_exists(&self, project_id: &str, task_id: &str, subtask_id: &str) -> Result<bool, RepositoryError>;
    
    async fn validate_task_exists(&self, project_id: &str, task_id: &str) -> Result<bool, RepositoryError>;

    async fn get_subtask_count(&self, project_id: &str, task_id: &str) -> Result<u64, RepositoryError>;
    
    async fn get_completed_subtask_count(&self, project_id: &str, task_id: &str) -> Result<u64, RepositoryError>;
    
    async fn get_completion_rate(&self, project_id: &str, task_id: &str) -> Result<f32, RepositoryError>;

    async fn mark_all_completed(&self, project_id: &str, task_id: &str) -> Result<(), RepositoryError>;
    
    async fn mark_all_incomplete(&self, project_id: &str, task_id: &str) -> Result<(), RepositoryError>;
}