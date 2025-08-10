use crate::errors::RepositoryError;
use crate::types::task_types::{Task, TaskStatus};
use async_trait::async_trait;

#[async_trait]
#[allow(dead_code)]
pub trait TaskRepositoryTrait {
    async fn set_task(&self, project_id: &str, task: &Task) -> Result<(), RepositoryError>;
    
    async fn get_task(&self, project_id: &str, task_id: &str) -> Result<Option<Task>, RepositoryError>;
    
    async fn list_tasks(&self, project_id: &str) -> Result<Vec<Task>, RepositoryError>;
    
    async fn delete_task(&self, project_id: &str, task_id: &str) -> Result<(), RepositoryError>;

    async fn find_tasks_by_assignee(&self, project_id: &str, assignee_id: &str) -> Result<Vec<Task>, RepositoryError>;
    
    async fn find_tasks_by_status(&self, project_id: &str, status: TaskStatus) -> Result<Vec<Task>, RepositoryError>;
    
    async fn find_tasks_by_priority(&self, project_id: &str, priority: i32) -> Result<Vec<Task>, RepositoryError>;
    
    async fn find_tasks_by_tag(&self, project_id: &str, tag_id: &str) -> Result<Vec<Task>, RepositoryError>;
    
    async fn find_overdue_tasks(&self, project_id: &str, current_time: i64) -> Result<Vec<Task>, RepositoryError>;

    async fn update_task_status(&self, project_id: &str, task_id: &str, status: TaskStatus) -> Result<(), RepositoryError>;
    
    async fn update_task_priority(&self, project_id: &str, task_id: &str, priority: i32) -> Result<(), RepositoryError>;
    
    async fn assign_task(&self, project_id: &str, task_id: &str, assignee_id: Option<String>) -> Result<(), RepositoryError>;
    
    async fn add_tag_to_task(&self, project_id: &str, task_id: &str, tag_id: &str) -> Result<(), RepositoryError>;
    
    async fn remove_tag_from_task(&self, project_id: &str, task_id: &str, tag_id: &str) -> Result<(), RepositoryError>;

    async fn validate_task_exists(&self, project_id: &str, task_id: &str) -> Result<bool, RepositoryError>;
    
    async fn validate_project_exists(&self, project_id: &str) -> Result<bool, RepositoryError>;

    async fn get_task_count(&self, project_id: &str) -> Result<u64, RepositoryError>;
    
    async fn get_task_count_by_status(&self, project_id: &str, status: TaskStatus) -> Result<u64, RepositoryError>;
    
    async fn get_completion_rate(&self, project_id: &str) -> Result<f32, RepositoryError>;
}