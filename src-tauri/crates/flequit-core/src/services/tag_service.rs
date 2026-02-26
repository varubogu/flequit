use chrono::Utc;

use crate::ports::infrastructure_repositories::TagRepositoryExt;
use crate::InfrastructureRepositoriesTrait;
use flequit_model::models::task_projects::tag::{PartialTag, Tag};
use flequit_model::types::id_types::{ProjectId, TagId, UserId};
use flequit_repository::repositories::project_repository_trait::ProjectRepository;
use flequit_types::errors::service_error::ServiceError;

pub async fn create_tag<R>(
    repositories: &R,
    project_id: &ProjectId,
    tag: &Tag,
    user_id: &UserId,
) -> Result<(), ServiceError>
where
    R: InfrastructureRepositoriesTrait + Send + Sync,
{
    let mut new_data = tag.clone();
    let now = Utc::now();
    new_data.created_at = now;
    new_data.updated_at = now;

    let repository = repositories;
    repository.tags().save(project_id, &new_data, user_id, &now).await?;

    Ok(())
}

pub async fn get_tag<R>(
    repositories: &R,
    project_id: &ProjectId,
    tag_id: &TagId,
) -> Result<Option<Tag>, ServiceError>
where
    R: InfrastructureRepositoriesTrait + Send + Sync,
{
    let repository = repositories;
    Ok(repository.tags().find_by_id(project_id, tag_id).await?)
}

pub async fn list_tags<R>(
    repositories: &R,
    project_id: &ProjectId,
) -> Result<Vec<Tag>, ServiceError>
where
    R: InfrastructureRepositoriesTrait + Send + Sync,
{
    let repository = repositories;
    Ok(repository.tags().find_all(project_id).await?)
}

pub async fn update_tag<R>(
    repositories: &R,
    project_id: &ProjectId,
    tag_id: &TagId,
    patch: &PartialTag,
    user_id: &UserId,
) -> Result<bool, ServiceError>
where
    R: InfrastructureRepositoriesTrait + Send + Sync,
{
    // 既存のタグを取得
    if let Some(mut tag) = repositories.tags().find_by_id(project_id, tag_id).await? {
        // パッチデータで更新
        if let Some(name) = &patch.name {
            tag.name = name.clone();
        }
        if let Some(color) = &patch.color {
            tag.color = color.clone();
        }
        if let Some(order_index) = patch.order_index {
            tag.order_index = order_index;
        }

        // 更新日時を設定
        tag.updated_at = Utc::now();

        // 保存
        let now = Utc::now();
        repositories.tags().save(project_id, &tag, user_id, &now).await?;
        Ok(true)
    } else {
        Ok(false)
    }
}

pub async fn delete_tag<R>(
    repositories: &R,
    project_id: &ProjectId,
    tag_id: &TagId,
) -> Result<(), ServiceError>
where
    R: InfrastructureRepositoriesTrait + Send + Sync,
{
    // タグを関連データと共にトランザクション内で削除
    // (タグブックマーク、タスクタグ、サブタスクタグ、タグ本体)
    // SQLiteは単一トランザクションで全削除、Automergeも削除
    repositories
        .tags()
        .delete_with_relations(project_id, tag_id)
        .await?;

    Ok(())
}

pub async fn search_tags_by_name<R>(
    repositories: &R,
    project_id: &ProjectId,
    name: &str,
) -> Result<Vec<Tag>, ServiceError>
where
    R: InfrastructureRepositoriesTrait + Send + Sync,
{
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

pub async fn get_tag_usage_count<R>(
    repositories: &R,
    project_id: &ProjectId,
    tag_id: &TagId,
) -> Result<u32, ServiceError>
where
    R: InfrastructureRepositoriesTrait + Send + Sync,
{
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

pub async fn is_tag_name_exists<R>(
    repositories: &R,
    project_id: &ProjectId,
    name: &str,
    exclude_id: Option<&str>,
) -> Result<bool, ServiceError>
where
    R: InfrastructureRepositoriesTrait + Send + Sync,
{
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

pub async fn list_popular_tags<R>(
    repositories: &R,
    project_id: &ProjectId,
    limit: u32,
) -> Result<Vec<Tag>, ServiceError>
where
    R: InfrastructureRepositoriesTrait + Send + Sync,
{
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
