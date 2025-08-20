use crate::errors::service_error::ServiceError;
use crate::models::command::project::ProjectSearchRequest;
use crate::models::project::{PartialProject, Project};
use crate::repositories::base_repository_trait::{Patchable, Repository};
use crate::repositories::Repositories;
use crate::types::id_types::ProjectId;
use chrono::Utc;

pub async fn create_project(project: &Project) -> Result<Project, ServiceError> {
    let mut new_project = project.clone();
    let now = Utc::now();
    new_project.created_at = now;
    new_project.updated_at = now;

    if new_project.id.to_string().trim().is_empty() {
        new_project.id = crate::types::id_types::ProjectId::new();
    }

    let repository = Repositories::new().await?;
    repository.projects.save(&new_project).await?;

    Ok(new_project)
}

pub async fn get_project(project_id: &ProjectId) -> Result<Option<Project>, ServiceError> {
    let repository = Repositories::new().await?;
    Ok(repository.projects.find_by_id(project_id).await?)
}

pub async fn list_projects() -> Result<Vec<Project>, ServiceError> {
    let repository = Repositories::new().await?;
    Ok(repository.projects.find_all().await?)
}

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

pub async fn delete_project(project_id: &ProjectId) -> Result<(), ServiceError> {
    let repository = Repositories::new().await?;
    repository.projects.delete(project_id).await?;
    Ok(())
}

pub async fn search_projects(
    request: &ProjectSearchRequest,
) -> Result<(Vec<Project>, usize), ServiceError> {
    let repository = Repositories::new().await?;
    let mut projects = repository.projects.find_all().await?;

    // 名前でのフィルタリング
    if let Some(name) = &request.name {
        if !name.trim().is_empty() {
            let name_lower = name.to_lowercase();
            projects = projects
                .into_iter()
                .filter(|p| p.name.to_lowercase().contains(&name_lower))
                .collect();
        }
    }

    // 説明でのフィルタリング
    if let Some(description) = &request.description {
        if !description.trim().is_empty() {
            let desc_lower = description.to_lowercase();
            projects = projects
                .into_iter()
                .filter(|p| {
                    p.description
                        .as_ref()
                        .map(|d| d.to_lowercase().contains(&desc_lower))
                        .unwrap_or(false)
                })
                .collect();
        }
    }

    // ステータスでのフィルタリング
    if let Some(status) = &request.status {
        projects = projects
            .into_iter()
            .filter(|p| p.status.as_ref() == Some(status))
            .collect();
    }

    // オーナーIDでのフィルタリング
    if let Some(owner_id) = &request.owner_id {
        projects = projects
            .into_iter()
            .filter(|p| {
                p.owner_id
                    .as_ref()
                    .map(|o| o.to_string() == *owner_id)
                    .unwrap_or(false)
            })
            .collect();
    }

    let total_count = projects.len();
    let offset = request.offset.unwrap_or(0);
    let limit = request.limit.unwrap_or(50);

    let paginated_projects = projects.into_iter().skip(offset).take(limit).collect();

    Ok((paginated_projects, total_count))
}
