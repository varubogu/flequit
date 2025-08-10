use crate::types::project_types::{Project};
use crate::repositories::core::CoreRepositoryTrait;
use crate::errors::service_error::ServiceError;
use crate::commands::project_commands::ProjectSearchRequest;
use chrono::Utc;

pub struct ProjectService;

impl ProjectService {
    pub async fn create_project(
        &self,
        repositories: &mut [Box<dyn CoreRepositoryTrait>],
        project: &Project,
    ) -> Result<Project, ServiceError> {
        if project.name.trim().is_empty() {
            return Err(ServiceError::ValidationError("Project name cannot be empty".to_string()));
        }

        let mut new_project = project.clone();
        let now = Utc::now();
        new_project.created_at = now;
        new_project.updated_at = now;

        if new_project.id.trim().is_empty() {
            new_project.id = format!("project_{}", now.timestamp_nanos_opt().unwrap_or(now.timestamp() * 1_000_000_000));
        }

        for repo in repositories {
            repo.set_project(&new_project).await?;
        }

        Ok(new_project)
    }

    pub async fn get_project(
        &self,
        repository: &dyn CoreRepositoryTrait,
        project_id: &str,
    ) -> Result<Option<Project>, ServiceError> {
        if project_id.trim().is_empty() {
            return Err(ServiceError::ValidationError("Project ID cannot be empty".to_string()));
        }
        Ok(repository.get_project(project_id).await?)
    }

    pub async fn list_projects(
        &self,
        repository: &dyn CoreRepositoryTrait,
    ) -> Result<Vec<Project>, ServiceError> {
        let projects = repository.list_projects().await?;
        let active_projects: Vec<Project> = projects
            .into_iter()
            .filter(|project| !project.is_archived)
            .collect();
        Ok(active_projects)
    }

    pub async fn update_project(
        &self,
        repositories: &mut [Box<dyn CoreRepositoryTrait>],
        project: &Project,
    ) -> Result<Project, ServiceError> {
        let mut updated_project = project.clone();
        updated_project.updated_at = Utc::now();

        for repo in repositories {
            repo.set_project(&updated_project).await?;
        }
        Ok(updated_project)
    }

    pub async fn delete_project(
        &self,
        repositories: &mut [Box<dyn CoreRepositoryTrait>],
        project_id: &str,
    ) -> Result<(), ServiceError> {
        if project_id.trim().is_empty() {
            return Err(ServiceError::ValidationError("Project ID cannot be empty".to_string()));
        }
        for repo in repositories {
            repo.delete_project(project_id).await?;
        }
        Ok(())
    }

    pub async fn search_projects(
        &self,
        repository: &dyn CoreRepositoryTrait,
        request: &ProjectSearchRequest,
    ) -> Result<(Vec<Project>, usize), ServiceError> {
        // NOTE: Ideally, filtering should be done in the repository layer.
        let mut projects = repository.list_projects().await?;

        if let Some(ref name) = request.name {
            projects.retain(|project| project.name.to_lowercase().contains(&name.to_lowercase()));
        }
        if let Some(ref description) = request.description {
            projects.retain(|project| {
                project.description.as_ref().map_or(false, |d| d.to_lowercase().contains(&description.to_lowercase()))
            });
        }
        if let Some(status) = &request.status {
            projects.retain(|project| project.status.as_ref() == Some(status));
        }
        if let Some(ref owner_id) = request.owner_id {
            projects.retain(|project| project.owner_id.as_ref() == Some(owner_id));
        }

        let total_count = projects.len();
        let offset = request.offset.unwrap_or(0);
        let limit = request.limit.unwrap_or(50);

        let paginated_projects = projects.into_iter().skip(offset).take(limit).collect();

        Ok((paginated_projects, total_count))
    }
}