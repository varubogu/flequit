use crate::models::project::{Project};
use crate::errors::service_error::ServiceError;
use crate::models::command::project::ProjectSearchRequest;
use crate::repositories::local_automerge::projects_repository::ProjectsRepository;
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

        let mut repository = ProjectsRepository::with_default_path()?;
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
        let mut repository = ProjectsRepository::with_default_path()?;
        Ok(repository.get_project(project_id).await?)
    }

    pub async fn list_projects(
        &self,
    ) -> Result<Vec<Project>, ServiceError> {
        // ProjectsRepositoryにはlist_projectsメソッドがないため、一時的に空のVecを返す
        // 将来的には複数のプロジェクトを管理するためのメソッドが必要
        Ok(Vec::new())
    }

    pub async fn update_project(
        &self,
        project: &Project,
    ) -> Result<Project, ServiceError> {
        let mut updated_project = project.clone();
        updated_project.updated_at = Utc::now();

        let mut repository = ProjectsRepository::with_default_path()?;
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
        // 将来的にはプロジェクトデータの削除処理が必要
        let _ = project_id;
        Ok(())
    }

    pub async fn restore_project(
        &self,
        backup_path: &str,
    ) -> Result<String, ServiceError> {
        let mut repository = ProjectsRepository::with_default_path()?;
        Ok(repository.restore_project(backup_path).await?)
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
