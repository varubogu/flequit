use chrono::Utc;

use flequit_types::errors::service_error::ServiceError;
use flequit_model::models::task_projects::tag::{PartialTag, Tag};
use flequit_repository::repositories::base_repository_trait::Repository;
use flequit_repository::repositories::project_repository_trait::ProjectRepository;
use flequit_infrastructure::InfrastructureRepositoriesTrait;
use flequit_model::types::id_types::{TagId, ProjectId};

#[tracing::instrument(level = "trace")]
pub async fn create_tag(repositories: &dyn InfrastructureRepositoriesTrait, project_id: &ProjectId, tag: &Tag) -> Result<(), ServiceError> {
    let mut new_data = tag.clone();
    let now = Utc::now();
    new_data.created_at = now;
    new_data.updated_at = now;

    let repository = repositories;
    repository.tags().save(project_id, &new_data).await?;

    Ok(())
}

#[tracing::instrument(level = "trace")]
pub async fn get_tag(repositories: &dyn InfrastructureRepositoriesTrait, project_id: &ProjectId, tag_id: &TagId) -> Result<Option<Tag>, ServiceError> {
    let repository = repositories;
    Ok(repository.tags().find_by_id(project_id, tag_id).await?)
}

#[tracing::instrument(level = "trace")]
pub async fn list_tags(repositories: &dyn InfrastructureRepositoriesTrait, project_id: &ProjectId) -> Result<Vec<Tag>, ServiceError> {
    let repository = repositories;
    Ok(repository.tags().find_all(project_id).await?)
}

#[tracing::instrument(level = "trace")]
pub async fn update_tag(_repositories: &dyn InfrastructureRepositoriesTrait, _project_id: &ProjectId, _tag_id: &TagId, _patch: &PartialTag) -> Result<bool, ServiceError> {
    // TODO: Infrastructure層にpatchメソッドが実装されたら有効化
    Err(ServiceError::InternalError("Tag patch method is not implemented".to_string()))
}

#[tracing::instrument(level = "trace")]
pub async fn delete_tag(repositories: &dyn InfrastructureRepositoriesTrait, project_id: &ProjectId, tag_id: &TagId) -> Result<(), ServiceError> {
    let repository = repositories;
    repository.tags().delete(project_id, tag_id).await?;
    Ok(())
}

#[tracing::instrument(level = "trace")]
pub async fn search_tags_by_name(repositories: &dyn InfrastructureRepositoriesTrait, project_id: &ProjectId, name: &str) -> Result<Vec<Tag>, ServiceError> {
    if name.trim().is_empty() {
        return Ok(Vec::new());
    }

    let repository = repositories;
    let all_tags = repository.tags().find_all(project_id).await?;

    let name_lower = name.to_lowercase();
    let filtered_tags = all_tags
        .into_iter()
        .filter(|tag| tag.name.to_lowercase().contains(&name_lower))
        .collect();

    Ok(filtered_tags)
}

#[tracing::instrument(level = "trace")]
pub async fn get_tag_usage_count(repositories: &dyn InfrastructureRepositoriesTrait, project_id: &ProjectId, tag_id: &TagId) -> Result<u32, ServiceError> {
    let repository = repositories;
    let mut count = 0u32;

    // タスクでの使用回数をカウント
    let tasks = repository.tasks().find_all(project_id).await?;
    for task in tasks {
        if task.tag_ids.contains(tag_id) {
            count += 1;
        }
    }

    // サブタスクでの使用回数をカウント
    let subtasks = repository.sub_tasks().find_all(project_id).await?;
    for subtask in subtasks {
        if subtask.tag_ids.contains(tag_id) {
            count += 1;
        }
    }

    Ok(count)
}

#[tracing::instrument(level = "trace")]
pub async fn is_tag_name_exists(
    repositories: &dyn InfrastructureRepositoriesTrait,
    project_id: &ProjectId,
    name: &str,
    exclude_id: Option<&str>,
) -> Result<bool, ServiceError> {
    let repository = repositories;
    let all_tags = repository.tags().find_all(project_id).await?;

    let name_lower = name.to_lowercase();

    for tag in all_tags {
        // 除外IDが指定されている場合、そのIDのタグは除外
        if let Some(exclude_id) = exclude_id {
            if tag.id.to_string() == exclude_id {
                continue;
            }
        }

        // 名前が一致するかチェック
        if tag.name.to_lowercase() == name_lower {
            return Ok(true);
        }
    }

    Ok(false)
}

#[tracing::instrument(level = "trace")]
pub async fn list_popular_tags(repositories: &dyn InfrastructureRepositoriesTrait, project_id: &ProjectId, limit: u32) -> Result<Vec<Tag>, ServiceError> {
    let repository = repositories;
    let all_tags = repository.tags().find_all(project_id).await?;

    if all_tags.is_empty() {
        return Ok(Vec::new());
    }

    // 各タグの使用回数を計算
    let mut tag_usage_counts: Vec<(Tag, u32)> = Vec::new();

    for tag in all_tags {
        let count = get_tag_usage_count(repositories, project_id, &tag.id).await?;
        tag_usage_counts.push((tag, count));
    }

    // 使用回数の降順でソート
    tag_usage_counts.sort_by(|a, b| b.1.cmp(&a.1));

    // 指定された限界数まで取得
    let popular_tags = tag_usage_counts
        .into_iter()
        .take(limit as usize)
        .map(|(tag, _)| tag)
        .collect();

    Ok(popular_tags)
}
