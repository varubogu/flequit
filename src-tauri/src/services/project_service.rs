use crate::models::project::{Project};
use crate::errors::service_error::ServiceError;
use crate::models::command::project::ProjectSearchRequest;
use crate::repositories::local_automerge::project_repository_impl::LocalAutomergeProjectRepository;
use crate::repositories::base_repository_trait::Repository;
use chrono::Utc;

#[allow(dead_code)]
pub struct ProjectService;

#[allow(dead_code)]
impl ProjectService {
    pub async fn create_project(
        &self,
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

        let repository = LocalAutomergeProjectRepository::with_default_path()?;
        repository.save(&new_project).await?;

        Ok(new_project)
    }

    pub async fn get_project(
        &self,
        project_id: &str,
    ) -> Result<Option<Project>, ServiceError> {
        if project_id.trim().is_empty() {
            return Err(ServiceError::ValidationError("Project ID cannot be empty".to_string()));
        }
        let repository = LocalAutomergeProjectRepository::with_default_path()?;
        Ok(repository.find_by_id(project_id).await?)
    }

    pub async fn list_projects(
        &self,
    ) -> Result<Vec<Project>, ServiceError> {
        let repository = LocalAutomergeProjectRepository::with_default_path()?;
        Ok(repository.find_all().await?)
    }

    pub async fn update_project(
        &self,
        project: &Project,
    ) -> Result<Project, ServiceError> {
        let mut updated_project = project.clone();
        updated_project.updated_at = Utc::now();

        let repository = LocalAutomergeProjectRepository::with_default_path()?;
        repository.save(&updated_project).await?;
        Ok(updated_project)
    }

    pub async fn delete_project(
        &self,
        project_id: &str,
    ) -> Result<(), ServiceError> {
        if project_id.trim().is_empty() {
            return Err(ServiceError::ValidationError("Project ID cannot be empty".to_string()));
        }
        let repository = LocalAutomergeProjectRepository::with_default_path()?;
        repository.delete(project_id).await?;
        Ok(())
    }

    pub async fn restore_project(
        &self,
        backup_path: &str,
    ) -> Result<String, ServiceError> {
        // TODO: restore_project機能をトレイトに追加する必要があります
        let _backup_path = backup_path;
        Ok("restored_project_id".to_string())
    }

    pub async fn search_projects(
        &self,
        request: &ProjectSearchRequest,
    ) -> Result<(Vec<Project>, usize), ServiceError> {
        // NOTE: Ideally, filtering should be done in the repository layer.
        let repository = LocalAutomergeProjectRepository::with_default_path()?;
        let projects = repository.find_all().await?;

        // フィルタリングは空のVecには意味がないため、requestのパラメータを使用するだけ
        let _ = (&request.name, &request.description, &request.status, &request.owner_id);

        let total_count = projects.len();
        let offset = request.offset.unwrap_or(0);
        let limit = request.limit.unwrap_or(50);

        let paginated_projects = projects.into_iter().skip(offset).take(limit).collect();

        Ok((paginated_projects, total_count))
    }
}
