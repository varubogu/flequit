use std::sync::Arc;
use crate::repositories::automerge::project_repository::{ProjectRepository, ProjectRepositoryTrait};
use crate::types::{Project, ProjectStatus};
use crate::errors::ServiceError;
use chrono::Utc;

pub struct ProjectService {
    project_repo: Arc<ProjectRepository>,
}

impl ProjectService {
    pub fn new(project_repo: Arc<ProjectRepository>) -> Self {
        Self { project_repo }
    }
    
    pub async fn create_project(
        &self,
        name: String,
        description: Option<String>
    ) -> Result<Project, ServiceError> {
        // 入力検証
        if name.trim().is_empty() {
            return Err(ServiceError::ValidationError("Project name cannot be empty".to_string()));
        }
        
        if name.len() > 100 {
            return Err(ServiceError::ValidationError("Project name too long".to_string()));
        }
        
        // プロジェクト構造体作成
        let project = Project {
            id: uuid::Uuid::new_v4().to_string(),
            name: name.trim().to_string(),
            description,
            status: ProjectStatus::Planning,
            created_at: Utc::now().timestamp_millis(),
            updated_at: Utc::now().timestamp_millis(),
        };
        
        // リポジトリ経由で保存
        self.project_repo.create(&project).await?;
        
        Ok(project)
    }
    
    pub async fn get_project(&self, project_id: &str) -> Result<Option<Project>, ServiceError> {
        // 入力検証
        if project_id.trim().is_empty() {
            return Err(ServiceError::ValidationError("Project ID cannot be empty".to_string()));
        }
        
        self.project_repo.get(project_id).await
    }
    
    pub async fn list_projects(&self) -> Result<Vec<Project>, ServiceError> {
        self.project_repo.list().await
    }
    
    pub async fn update_project_status(
        &self,
        project_id: &str,
        status: ProjectStatus
    ) -> Result<Project, ServiceError> {
        let mut project = self.project_repo.get(project_id).await?
            .ok_or_else(|| ServiceError::NotFound("Project not found".to_string()))?;
        
        project.status = status;
        project.updated_at = Utc::now().timestamp_millis();
        
        self.project_repo.update(&project).await?;
        
        Ok(project)
    }
    
    pub async fn update_project(
        &self,
        project_id: &str,
        name: Option<String>,
        description: Option<String>,
        status: Option<ProjectStatus>
    ) -> Result<Project, ServiceError> {
        let mut project = self.project_repo.get(project_id).await?
            .ok_or_else(|| ServiceError::NotFound("Project not found".to_string()))?;
        
        // 更新フィールドの検証と適用
        if let Some(new_name) = name {
            if new_name.trim().is_empty() {
                return Err(ServiceError::ValidationError("Project name cannot be empty".to_string()));
            }
            if new_name.len() > 100 {
                return Err(ServiceError::ValidationError("Project name too long".to_string()));
            }
            project.name = new_name.trim().to_string();
        }
        
        if let Some(new_description) = description {
            project.description = Some(new_description);
        }
        
        if let Some(new_status) = status {
            project.status = new_status;
        }
        
        project.updated_at = Utc::now().timestamp_millis();
        
        self.project_repo.update(&project).await?;
        
        Ok(project)
    }
    
    pub async fn delete_project(&self, project_id: &str) -> Result<(), ServiceError> {
        // プロジェクト存在確認
        self.project_repo.get(project_id).await?
            .ok_or_else(|| ServiceError::NotFound("Project not found".to_string()))?;
        
        // TODO: 関連データ（タスク、サブタスクなど）の削除も検討
        
        self.project_repo.delete(project_id).await?;
        
        Ok(())
    }
}