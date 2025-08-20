use chrono::Utc;

use crate::errors::service_error::ServiceError;
use crate::models::tag::Tag;
use crate::repositories::base_repository_trait::Repository;
use crate::repositories::Repositories;
use crate::types::id_types::TagId;

pub async fn create_tag(tag: &Tag) -> Result<(), ServiceError> {
    let mut new_data = tag.clone();
    let now = Utc::now();
    new_data.created_at = now;
    new_data.updated_at = now;

    let repository = Repositories::new().await?;
    repository.tags.save(&new_data).await?;

    Ok(())
}

pub async fn get_tag(tag_id: &TagId) -> Result<Option<Tag>, ServiceError> {
    let repository: Repositories = Repositories::new().await?;
    Ok(repository.tags.find_by_id(tag_id).await?)
}

pub async fn list_tags() -> Result<Vec<Tag>, ServiceError> {
    let repository = Repositories::new().await?;
    Ok(repository.tags.find_all().await?)
}

pub async fn update_tag(tag: &Tag) -> Result<(), ServiceError> {
    let repository = Repositories::new().await?;
    repository.tags.save(tag).await?;
    Ok(())
}

pub async fn delete_tag(tag_id: &TagId) -> Result<(), ServiceError> {
    let repository = Repositories::new().await?;
    repository.tags.delete(tag_id).await?;
    Ok(())
}

pub async fn search_tags_by_name(name: &str) -> Result<Vec<Tag>, ServiceError> {
    if name.trim().is_empty() {
        return Ok(Vec::new());
    }
    
    let repository = Repositories::new().await?;
    let all_tags = repository.tags.find_all().await?;
    
    let name_lower = name.to_lowercase();
    let filtered_tags = all_tags
        .into_iter()
        .filter(|tag| tag.name.to_lowercase().contains(&name_lower))
        .collect();
    
    Ok(filtered_tags)
}

pub async fn get_tag_usage_count(tag_id: &TagId) -> Result<u32, ServiceError> {
    let repository = Repositories::new().await?;
    let mut count = 0u32;
    
    // タスクでの使用回数をカウント
    let tasks = repository.tasks.find_all().await?;
    for task in tasks {
        if task.tag_ids.contains(tag_id) {
            count += 1;
        }
    }
    
    // サブタスクでの使用回数をカウント
    let subtasks = repository.sub_tasks.find_all().await?;
    for subtask in subtasks {
        if subtask.tag_ids.contains(tag_id) {
            count += 1;
        }
    }
    
    Ok(count)
}

pub async fn is_tag_name_exists(
    name: &str,
    exclude_id: Option<&str>,
) -> Result<bool, ServiceError> {
    let repository = Repositories::new().await?;
    let all_tags = repository.tags.find_all().await?;
    
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

pub async fn list_popular_tags(limit: u32) -> Result<Vec<Tag>, ServiceError> {
    let repository = Repositories::new().await?;
    let all_tags = repository.tags.find_all().await?;
    
    if all_tags.is_empty() {
        return Ok(Vec::new());
    }
    
    // 各タグの使用回数を計算
    let mut tag_usage_counts: Vec<(Tag, u32)> = Vec::new();
    
    for tag in all_tags {
        let count = get_tag_usage_count(&tag.id).await?;
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
