use crate::errors::service_error::ServiceError;
use crate::models::command::task_list::TaskListSearchRequest;
use crate::models::task_list::{PartialTaskList, TaskList};
use crate::repositories::base_repository_trait::{Patchable, Repository};
use crate::repositories::Repositories;
use crate::types::id_types::TaskListId;

pub async fn create_task_list(task_list: &TaskList) -> Result<(), ServiceError> {
    let repository: Repositories = Repositories::new().await?;
    repository.task_lists.save(task_list).await?;
    Ok(())
}

pub async fn get_task_list(list_id: &TaskListId) -> Result<Option<TaskList>, ServiceError> {
    let repository = Repositories::new().await?;
    Ok(repository.task_lists.find_by_id(list_id).await?)
}

pub async fn update_task_list(
    task_list_id: &TaskListId,
    patch: &PartialTaskList,
) -> Result<bool, ServiceError> {
    let repository = Repositories::new().await?;

    // updated_atフィールドを自動設定したパッチを作成
    let mut updated_patch = patch.clone();
    updated_patch.updated_at = Some(chrono::Utc::now());

    let changed = repository
        .task_lists
        .patch(task_list_id, &updated_patch)
        .await?;

    if !changed {
        // パッチ適用で変更がなかった場合、エンティティが存在するかチェック
        if repository
            .task_lists
            .find_by_id(task_list_id)
            .await?
            .is_none()
        {
            return Err(ServiceError::NotFound("TaskList not found".to_string()));
        }
    }

    Ok(changed)
}

pub async fn delete_task_list(id: &TaskListId) -> Result<(), ServiceError> {
    let repository = Repositories::new().await?;
    repository.task_lists.delete(id).await?;
    Ok(())
}

pub async fn search_task_lists(
    condition: &TaskListSearchRequest,
) -> Result<Vec<TaskList>, ServiceError> {
    let repository = Repositories::new().await?;
    let mut task_lists = repository.task_lists.find_all().await?;

    // project_idでのフィルタリング
    if let Some(project_id) = &condition.project_id {
        if !project_id.trim().is_empty() {
            task_lists = task_lists
                .into_iter()
                .filter(|tl| tl.project_id.to_string() == *project_id)
                .collect();
        }
    }

    // 名前でのフィルタリング
    if let Some(name) = &condition.name {
        if !name.trim().is_empty() {
            let name_lower = name.to_lowercase();
            task_lists = task_lists
                .into_iter()
                .filter(|tl| tl.name.to_lowercase().contains(&name_lower))
                .collect();
        }
    }

    // 作成日時の範囲フィルタリング
    if let Some(created_from) = &condition.created_from {
        if let Ok(from_date) = chrono::DateTime::parse_from_rfc3339(created_from) {
            let from_utc = from_date.with_timezone(&chrono::Utc);
            task_lists = task_lists
                .into_iter()
                .filter(|tl| tl.created_at >= from_utc)
                .collect();
        }
    }

    if let Some(created_to) = &condition.created_to {
        if let Ok(to_date) = chrono::DateTime::parse_from_rfc3339(created_to) {
            let to_utc = to_date.with_timezone(&chrono::Utc);
            task_lists = task_lists
                .into_iter()
                .filter(|tl| tl.created_at <= to_utc)
                .collect();
        }
    }

    // order_indexでソート
    task_lists.sort_by(|a, b| a.order_index.cmp(&b.order_index));

    // ページネーション
    let offset = condition.offset.unwrap_or(0);
    let limit = condition.limit.unwrap_or(50);

    let paginated_lists = task_lists.into_iter().skip(offset).take(limit).collect();

    Ok(paginated_lists)
}

pub async fn list_task_lists(project_id: &str) -> Result<Vec<TaskList>, ServiceError> {
    let repository = Repositories::new().await?;
    let all_task_lists = repository.task_lists.find_all().await?;

    // project_idでフィルタリング
    let mut filtered_lists = all_task_lists
        .into_iter()
        .filter(|tl| tl.project_id.to_string() == project_id)
        .collect::<Vec<_>>();

    // order_indexでソート
    filtered_lists.sort_by(|a, b| a.order_index.cmp(&b.order_index));

    Ok(filtered_lists)
}
