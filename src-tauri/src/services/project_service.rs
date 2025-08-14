use crate::models::project::{Project};
use crate::errors::service_error::ServiceError;
use crate::models::command::project::ProjectSearchRequest;
use crate::repositories::local_automerge::projects_repository::ProjectsRepository;
use crate::services::path_service::PathService;
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

        let data_dir = PathService::get_default_data_dir().unwrap_or_else(|_| std::path::PathBuf::from("./flequit"));
        let mut repository = ProjectsRepository::new(data_dir)?;
        repository.save_project(&new_project).await?;

        Ok(new_project)
    }

    pub async fn get_project(
        &self,
        project_id: &str,
    ) -> Result<Option<Project>, ServiceError> {
        if project_id.trim().is_empty() {
            return Err(ServiceError::ValidationError("Project ID cannot be empty".to_string()));
        }
        let data_dir = PathService::get_default_data_dir().unwrap_or_else(|_| std::path::PathBuf::from("./flequit"));
        let mut repository = ProjectsRepository::new(data_dir)?;
        Ok(repository.get_project(project_id).await?)
    }

    pub async fn list_projects(
        &self,
    ) -> Result<Vec<Project>, ServiceError> {
        // ProjectsRepositoryにはlist_projectsメソッドがないため、一時的に空のVecを返す
        Ok(Vec::new())
    }

    pub async fn update_project(
        &self,
        project: &Project,
    ) -> Result<Project, ServiceError> {
        let mut updated_project = project.clone();
        updated_project.updated_at = Utc::now();

        let data_dir = PathService::get_default_data_dir().unwrap_or_else(|_| std::path::PathBuf::from("./flequit"));
        let mut repository = ProjectsRepository::new(data_dir)?;
        repository.save_project(&updated_project).await?;
        Ok(updated_project)
    }

    pub async fn delete_project(
        &self,
        project_id: &str,
    ) -> Result<(), ServiceError> {
        if project_id.trim().is_empty() {
            return Err(ServiceError::ValidationError("Project ID cannot be empty".to_string()));
        }
        // ProjectsRepositoryにはdelete_projectメソッドがないため、一時的に何もしない
        let _ = project_id;
        Ok(())
    }

    pub async fn search_projects(
        &self,
        request: &ProjectSearchRequest,
    ) -> Result<(Vec<Project>, usize), ServiceError> {
        // NOTE: Ideally, filtering should be done in the repository layer.
        // ProjectsRepositoryにはlist_projectsメソッドがないため、一時的に空のVecを使用
        let projects: Vec<Project> = Vec::new();

        // フィルタリングは空のVecには意味がないため、requestのパラメータを使用するだけ
        let _ = (&request.name, &request.description, &request.status, &request.owner_id);

        let total_count = projects.len();
        let offset = request.offset.unwrap_or(0);
        let limit = request.limit.unwrap_or(50);

        let paginated_projects = projects.into_iter().skip(offset).take(limit).collect();

        Ok((paginated_projects, total_count))
    }
}
