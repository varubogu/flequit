use async_trait::async_trait;
use std::sync::Arc;
use crate::infrastructure::automerge_service::AutomergeRepoService;
use crate::types::{Project, ProjectMember};
use crate::errors::RepositoryError;

#[async_trait]
pub trait ProjectRepositoryTrait {
    async fn create(&self, project: &Project) -> Result<(), RepositoryError>;
    async fn get(&self, project_id: &str) -> Result<Option<Project>, RepositoryError>;
    async fn list(&self) -> Result<Vec<Project>, RepositoryError>;
    async fn update(&self, project: &Project) -> Result<(), RepositoryError>;
    async fn delete(&self, project_id: &str) -> Result<(), RepositoryError>;
    
    // プロジェクトメンバー関連
    async fn add_member(&self, project_id: &str, member: &ProjectMember) -> Result<(), RepositoryError>;
    async fn remove_member(&self, project_id: &str, user_id: &str) -> Result<(), RepositoryError>;
    async fn list_members(&self, project_id: &str) -> Result<Vec<ProjectMember>, RepositoryError>;
}

pub struct ProjectRepository {
    automerge_service: Arc<AutomergeRepoService>,
}

impl ProjectRepository {
    pub fn new(automerge_service: Arc<AutomergeRepoService>) -> Self {
        Self { automerge_service }
    }
}

#[async_trait]
impl ProjectRepositoryTrait for ProjectRepository {
    async fn create(&self, project: &Project) -> Result<(), RepositoryError> {
        self.automerge_service.set_project(project).await
            .map_err(|e| RepositoryError::AutomergeError(e))
    }
    
    async fn get(&self, project_id: &str) -> Result<Option<Project>, RepositoryError> {
        self.automerge_service.get_project(project_id).await
            .map_err(|e| RepositoryError::AutomergeError(e))
    }
    
    async fn list(&self) -> Result<Vec<Project>, RepositoryError> {
        self.automerge_service.list_projects().await
            .map_err(|e| RepositoryError::AutomergeError(e))
    }
    
    async fn update(&self, project: &Project) -> Result<(), RepositoryError> {
        self.automerge_service.set_project(project).await
            .map_err(|e| RepositoryError::AutomergeError(e))
    }
    
    async fn delete(&self, project_id: &str) -> Result<(), RepositoryError> {
        self.automerge_service.delete_project(project_id).await
            .map_err(|e| RepositoryError::AutomergeError(e))
    }
    
    async fn add_member(&self, _project_id: &str, _member: &ProjectMember) -> Result<(), RepositoryError> {
        // TODO: プロジェクトメンバー機能の実装
        Ok(())
    }
    
    async fn remove_member(&self, _project_id: &str, _user_id: &str) -> Result<(), RepositoryError> {
        // TODO: プロジェクトメンバー機能の実装
        Ok(())
    }
    
    async fn list_members(&self, _project_id: &str) -> Result<Vec<ProjectMember>, RepositoryError> {
        // TODO: プロジェクトメンバー機能の実装
        Ok(vec![])
    }
}