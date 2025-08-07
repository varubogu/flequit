use std::sync::Arc;
use crate::repositories::automerge::{
    subtask_repository::{SubtaskRepository, SubtaskRepositoryTrait},
    task_repository::{TaskRepository, TaskRepositoryTrait}
};
use crate::types::Subtask;
use crate::errors::ServiceError;
use chrono::Utc;

pub struct SubtaskService {
    subtask_repo: Arc<SubtaskRepository>,
    task_repo: Arc<TaskRepository>,
}

impl SubtaskService {
    pub fn new(
        subtask_repo: Arc<SubtaskRepository>,
        task_repo: Arc<TaskRepository>
    ) -> Self {
        Self { subtask_repo, task_repo }
    }
    
    pub async fn create_subtask(
        &self,
        project_id: String,
        task_id: String,
        title: String,
    ) -> Result<Subtask, ServiceError> {
        // タスク存在確認
        self.task_repo.get(&project_id, &task_id).await?
            .ok_or_else(|| ServiceError::NotFound("Task not found".to_string()))?;
        
        // 入力検証
        if title.trim().is_empty() {
            return Err(ServiceError::ValidationError("Subtask title cannot be empty".to_string()));
        }
        
        if title.len() > 200 {
            return Err(ServiceError::ValidationError("Subtask title too long".to_string()));
        }
        
        let subtask = Subtask {
            id: uuid::Uuid::new_v4().to_string(),
            task_id: task_id.clone(),
            title: title.trim().to_string(),
            completed: false,
            created_at: Utc::now().timestamp_millis(),
            updated_at: Utc::now().timestamp_millis(),
        };
        
        self.subtask_repo.create(&project_id, &task_id, &subtask).await?;
        
        Ok(subtask)
    }
    
    pub async fn get_subtask(&self, project_id: &str, task_id: &str, subtask_id: &str) -> Result<Option<Subtask>, ServiceError> {
        self.subtask_repo.get(project_id, task_id, subtask_id).await
    }
    
    pub async fn list_subtasks(&self, project_id: &str, task_id: &str) -> Result<Vec<Subtask>, ServiceError> {
        // タスク存在確認
        self.task_repo.get(project_id, task_id).await?
            .ok_or_else(|| ServiceError::NotFound("Task not found".to_string()))?;
        
        self.subtask_repo.list(project_id, task_id).await
    }
    
    pub async fn toggle_subtask_completion(&self, project_id: &str, task_id: &str, subtask_id: &str) -> Result<Subtask, ServiceError> {
        let mut subtask = self.subtask_repo.get(project_id, task_id, subtask_id).await?
            .ok_or_else(|| ServiceError::NotFound("Subtask not found".to_string()))?;
        
        subtask.completed = !subtask.completed;
        subtask.updated_at = Utc::now().timestamp_millis();
        
        self.subtask_repo.update(project_id, task_id, &subtask).await?;
        
        Ok(subtask)
    }
    
    pub async fn update_subtask(
        &self,
        project_id: &str,
        task_id: &str,
        subtask: &Subtask
    ) -> Result<Subtask, ServiceError> {
        // 入力検証
        if subtask.title.trim().is_empty() {
            return Err(ServiceError::ValidationError("Subtask title cannot be empty".to_string()));
        }
        
        if subtask.title.len() > 200 {
            return Err(ServiceError::ValidationError("Subtask title too long".to_string()));
        }
        
        // タスク存在確認
        self.task_repo.get(project_id, task_id).await?
            .ok_or_else(|| ServiceError::NotFound("Task not found".to_string()))?;
        
        let mut updated_subtask = subtask.clone();
        updated_subtask.updated_at = Utc::now().timestamp_millis();
        
        self.subtask_repo.update(project_id, task_id, &updated_subtask).await?;
        
        Ok(updated_subtask)
    }
    
    pub async fn delete_subtask(&self, project_id: &str, task_id: &str, subtask_id: &str) -> Result<(), ServiceError> {
        // サブタスク存在確認
        self.subtask_repo.get(project_id, task_id, subtask_id).await?
            .ok_or_else(|| ServiceError::NotFound("Subtask not found".to_string()))?;
        
        self.subtask_repo.delete(project_id, task_id, subtask_id).await?;
        
        Ok(())
    }
}