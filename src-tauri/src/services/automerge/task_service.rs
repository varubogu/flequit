use std::sync::Arc;
use crate::repositories::automerge::{
    task_repository::{TaskRepository, TaskRepositoryTrait},
    project_repository::{ProjectRepository, ProjectRepositoryTrait}
};
use crate::types::{Task, TaskStatus, Priority};
use crate::errors::ServiceError;
use chrono::Utc;

pub struct TaskService {
    task_repo: Arc<TaskRepository>,
    project_repo: Arc<ProjectRepository>,
}

impl TaskService {
    pub fn new(
        task_repo: Arc<TaskRepository>,
        project_repo: Arc<ProjectRepository>
    ) -> Self {
        Self { task_repo, project_repo }
    }
    
    pub async fn create_task(
        &self,
        project_id: String,
        title: String,
        description: Option<String>,
        priority: Priority,
        assigned_to: Option<String>,
    ) -> Result<Task, ServiceError> {
        // プロジェクト存在確認
        self.project_repo.get(&project_id).await?
            .ok_or_else(|| ServiceError::NotFound("Project not found".to_string()))?;
        
        // 入力検証
        if title.trim().is_empty() {
            return Err(ServiceError::ValidationError("Task title cannot be empty".to_string()));
        }
        
        if title.len() > 200 {
            return Err(ServiceError::ValidationError("Task title too long".to_string()));
        }
        
        let task = Task {
            id: uuid::Uuid::new_v4().to_string(),
            project_id,
            title: title.trim().to_string(),
            description,
            status: TaskStatus::Todo,
            priority,
            assigned_to,
            tags: vec![],
            due_date: None,
            created_at: Utc::now().timestamp_millis(),
            updated_at: Utc::now().timestamp_millis(),
        };
        
        self.task_repo.create(&task).await?;
        
        Ok(task)
    }
    
    pub async fn get_task(&self, project_id: &str, task_id: &str) -> Result<Option<Task>, ServiceError> {
        self.task_repo.get(project_id, task_id).await
    }
    
    pub async fn list_tasks(&self, project_id: &str) -> Result<Vec<Task>, ServiceError> {
        // プロジェクト存在確認
        self.project_repo.get(project_id).await?
            .ok_or_else(|| ServiceError::NotFound("Project not found".to_string()))?;
        
        self.task_repo.list(project_id).await
    }
    
    pub async fn update_task_status(
        &self,
        project_id: &str,
        task_id: &str,
        status: TaskStatus
    ) -> Result<Task, ServiceError> {
        let mut task = self.task_repo.get(project_id, task_id).await?
            .ok_or_else(|| ServiceError::NotFound("Task not found".to_string()))?;
        
        task.status = status;
        task.updated_at = Utc::now().timestamp_millis();
        
        self.task_repo.update(&task).await?;
        
        Ok(task)
    }
    
    pub async fn update_task(
        &self,
        task: &Task
    ) -> Result<Task, ServiceError> {
        // 入力検証
        if task.title.trim().is_empty() {
            return Err(ServiceError::ValidationError("Task title cannot be empty".to_string()));
        }
        
        if task.title.len() > 200 {
            return Err(ServiceError::ValidationError("Task title too long".to_string()));
        }
        
        // プロジェクト存在確認
        self.project_repo.get(&task.project_id).await?
            .ok_or_else(|| ServiceError::NotFound("Project not found".to_string()))?;
        
        let mut updated_task = task.clone();
        updated_task.updated_at = Utc::now().timestamp_millis();
        
        self.task_repo.update(&updated_task).await?;
        
        Ok(updated_task)
    }
    
    pub async fn delete_task(&self, project_id: &str, task_id: &str) -> Result<(), ServiceError> {
        // タスク存在確認
        self.task_repo.get(project_id, task_id).await?
            .ok_or_else(|| ServiceError::NotFound("Task not found".to_string()))?;
        
        // TODO: 関連データ（サブタスクなど）の削除も検討
        
        self.task_repo.delete(project_id, task_id).await?;
        
        Ok(())
    }
    
    pub async fn assign_task(
        &self,
        project_id: &str,
        task_id: &str,
        user_id: &str
    ) -> Result<Task, ServiceError> {
        let mut task = self.task_repo.get(project_id, task_id).await?
            .ok_or_else(|| ServiceError::NotFound("Task not found".to_string()))?;
        
        task.assigned_to = Some(user_id.to_string());
        task.updated_at = Utc::now().timestamp_millis();
        
        self.task_repo.update(&task).await?;
        
        Ok(task)
    }
    
    pub async fn set_due_date(
        &self,
        project_id: &str,
        task_id: &str,
        due_date: Option<i64>
    ) -> Result<Task, ServiceError> {
        let mut task = self.task_repo.get(project_id, task_id).await?
            .ok_or_else(|| ServiceError::NotFound("Task not found".to_string()))?;
        
        task.due_date = due_date;
        task.updated_at = Utc::now().timestamp_millis();
        
        self.task_repo.update(&task).await?;
        
        Ok(task)
    }
}