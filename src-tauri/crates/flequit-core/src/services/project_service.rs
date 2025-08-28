use crate::errors::service_error::ServiceError;
use flequit_model::models::project::{PartialProject, Project};
use crate::repositories::base_repository_trait::{Patchable, Repository};
use crate::repositories::Repositories;
use flequit_model::types::id_types::ProjectId;
use chrono::Utc;

#[tracing::instrument(level = "trace")]
pub async fn create_project(project: &Project) -> Result<Project, ServiceError> {
    let mut new_project = project.clone();
    let now = Utc::now();
    new_project.created_at = now;
    new_project.updated_at = now;

    if new_project.id.to_string().trim().is_empty() {
        new_project.id = ProjectId::new();
    }

    let repository = Repositories::new().await?;
    repository.projects.save(&new_project).await?;

    Ok(new_project)
}

#[tracing::instrument(level = "trace")]
pub async fn get_project(project_id: &ProjectId) -> Result<Option<Project>, ServiceError> {
    let repository = Repositories::new().await?;
    Ok(repository.projects.find_by_id(project_id).await?)
}

#[tracing::instrument(level = "trace")]
pub async fn list_projects() -> Result<Vec<Project>, ServiceError> {
    let repository = Repositories::new().await?;
    Ok(repository.projects.find_all().await?)
}

#[tracing::instrument(level = "trace")]
pub async fn update_project(
    project_id: &ProjectId,
    patch: &PartialProject,
) -> Result<bool, ServiceError> {
    let repository = Repositories::new().await?;

    // updated_atフィールドを自動設定したパッチを作成
    let mut updated_patch = patch.clone();
    updated_patch.updated_at = Some(Utc::now());

    let changed = repository
        .projects
        .patch(project_id, &updated_patch)
        .await?;

    if !changed {
        // パッチ適用で変更がなかった場合、エンティティが存在するかチェック
        if repository.projects.find_by_id(project_id).await?.is_none() {
            return Err(ServiceError::NotFound("Project not found".to_string()));
        }
    }

    Ok(changed)
}

#[tracing::instrument(level = "trace")]
pub async fn delete_project(project_id: &ProjectId) -> Result<(), ServiceError> {
    let repository = Repositories::new().await?;
    repository.projects.delete(project_id).await?;
    Ok(())
}
