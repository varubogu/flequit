use crate::errors::RepositoryError;
use crate::models::project_models::{Project, ProjectMember};
use crate::types::project_types::ProjectStatus;
use async_trait::async_trait;

#[async_trait]
#[allow(dead_code)]
pub trait ProjectRepositoryTrait {
    async fn set_project(&self, project: &Project) -> Result<(), RepositoryError>;
    
    async fn get_project(&self, project_id: &str) -> Result<Option<Project>, RepositoryError>;
    
    async fn list_projects(&self) -> Result<Vec<Project>, RepositoryError>;
    
    async fn delete_project(&self, project_id: &str) -> Result<(), RepositoryError>;

    async fn set_member(&self, project_id: &str, member: &ProjectMember) -> Result<(), RepositoryError>;
    
    async fn get_member(&self, project_id: &str, user_id: &str) -> Result<Option<ProjectMember>, RepositoryError>;
    
    async fn list_members(&self, project_id: &str) -> Result<Vec<ProjectMember>, RepositoryError>;
    
    async fn remove_member(&self, project_id: &str, user_id: &str) -> Result<(), RepositoryError>;

    async fn find_projects_by_status(&self, status: ProjectStatus) -> Result<Vec<Project>, RepositoryError>;
    
    async fn find_projects_by_member(&self, user_id: &str) -> Result<Vec<Project>, RepositoryError>;

    async fn validate_project_exists(&self, project_id: &str) -> Result<bool, RepositoryError>;
    
    async fn validate_member_exists(&self, project_id: &str, user_id: &str) -> Result<bool, RepositoryError>;

    async fn get_project_count(&self) -> Result<u64, RepositoryError>;
    
    async fn get_member_count(&self, project_id: &str) -> Result<u64, RepositoryError>;
}