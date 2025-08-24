use crate::errors::service_error::ServiceError;
use crate::models::command::task::TaskSearchRequest;
use crate::models::task::{PartialTask, Task};
use crate::repositories::base_repository_trait::{Patchable, Repository};
use crate::repositories::Repositories;
use crate::types::id_types::{ProjectId, TaskId};
use crate::types::task_types::TaskStatus;
use chrono::Utc;

#[tracing::instrument(level = "trace")]
pub async fn create_task(task: &Task) -> Result<(), ServiceError> {
    let repository = Repositories::new().await?;
    repository.tasks.save(task).await?;
    Ok(())
}

#[tracing::instrument]
pub async fn get_task(task_id: &TaskId) -> Result<Option<Task>, ServiceError> {
    let repository = Repositories::new().await?;
    Ok(repository.tasks.find_by_id(task_id).await?)
}

#[tracing::instrument]
pub async fn list_tasks(project_id: &ProjectId) -> Result<Vec<Task>, ServiceError> {
    let _ = project_id;
    let repository = Repositories::new().await?;
    Ok(repository.tasks.find_all().await?)
}

#[tracing::instrument]
pub async fn update_task(task_id: &TaskId, patch: &PartialTask) -> Result<bool, ServiceError> {
    let repository = Repositories::new().await?;

    // updated_atフィールドを自動設定したパッチを作成
    let mut updated_patch = patch.clone();
    updated_patch.updated_at = Some(Utc::now());

    let changed = repository.tasks.patch(task_id, &updated_patch).await?;

    if !changed {
        // パッチ適用で変更がなかった場合、エンティティが存在するかチェック
        if repository.tasks.find_by_id(task_id).await?.is_none() {
            return Err(ServiceError::NotFound("Task not found".to_string()));
        }
    }

    Ok(changed)
}

#[tracing::instrument]
pub async fn delete_task(task_id: &TaskId) -> Result<(), ServiceError> {
    let repository = Repositories::new().await?;
    repository.tasks.delete(task_id).await?;
    Ok(())
}

#[tracing::instrument]
pub async fn list_tasks_by_assignee(
    project_id: &str,
    user_id: &str,
) -> Result<Vec<Task>, ServiceError> {
    let repository = Repositories::new().await?;
    let all_tasks = repository.tasks.find_all().await?;

    // user_idでフィルタリング
    let filtered_tasks = all_tasks
        .into_iter()
        .filter(|task| {
            task
                .assigned_user_ids
                .iter()
                .any(|id| id.to_string() == user_id)
        })
        .collect();

    Ok(filtered_tasks)
}

#[tracing::instrument]
pub async fn list_tasks_by_status(
    project_id: &str,
    status: &TaskStatus,
) -> Result<Vec<Task>, ServiceError> {
    let repository = Repositories::new().await?;
    let all_tasks = repository.tasks.find_all().await?;

    // statusでフィルタリング
    let filtered_tasks = all_tasks
        .into_iter()
        .filter(|task| task.status == *status)
        .collect();

    Ok(filtered_tasks)
}

#[tracing::instrument]
pub async fn assign_task(
    project_id: &str,
    task_id: &str,
    assignee_id: Option<String>,
) -> Result<(), ServiceError> {
    let repository = Repositories::new().await?;

    // タスクIDから TaskId 型に変換
    use crate::types::id_types::{TaskId, UserId};
    let task_id_typed = TaskId::from(task_id.to_string());

    if let Some(mut task) = repository.tasks.find_by_id(&task_id_typed).await? {
        // プロジェクトIDが一致するかチェック
        // project_idチェックをコメントアウト
        /*if task.project_id.to_string() != project_id {
            return Err(ServiceError::InternalError(
                "Task does not belong to the specified project".to_string(),
            ));
        }*/

        // assignee_idがある場合は追加、ない場合は全てクリア
        if let Some(assignee_id) = assignee_id {
            let user_id = UserId::from(assignee_id);
            // 既に含まれていない場合のみ追加
            if !task.assigned_user_ids.contains(&user_id) {
                task.assigned_user_ids.push(user_id);
            }
        } else {
            // assignee_idがNoneの場合は全てクリア
            task.assigned_user_ids.clear();
        }

        // 更新日時を設定
        task.updated_at = Utc::now();

        // 保存
        repository.tasks.save(&task).await?;
    }

    Ok(())
}

#[tracing::instrument]
pub async fn update_task_status(
    project_id: &str,
    task_id: &str,
    status: &TaskStatus,
) -> Result<(), ServiceError> {
    let repository = Repositories::new().await?;

    // タスクIDから TaskId 型に変換
    use crate::types::id_types::TaskId;
    let task_id_typed = TaskId::from(task_id.to_string());

    if let Some(mut task) = repository.tasks.find_by_id(&task_id_typed).await? {
        // プロジェクトIDが一致するかチェック
        // project_idチェックをコメントアウト
        /*if task.project_id.to_string() != project_id {
            return Err(ServiceError::InternalError(
                "Task does not belong to the specified project".to_string(),
            ));
        }*/

        // ステータス更新
        task.status = status.clone();

        // 更新日時を設定
        task.updated_at = Utc::now();

        // 保存
        repository.tasks.save(&task).await?;
    }

    Ok(())
}

#[tracing::instrument]
pub async fn update_task_priority(
    project_id: &str,
    task_id: &str,
    priority: i32,
) -> Result<(), ServiceError> {
    let repository = Repositories::new().await?;

    // タスクIDから TaskId 型に変換
    use crate::types::id_types::TaskId;
    let task_id_typed = TaskId::from(task_id.to_string());

    if let Some(mut task) = repository.tasks.find_by_id(&task_id_typed).await? {
        // プロジェクトIDが一致するかチェック
        // project_idチェックをコメントアウト
        /*if task.project_id.to_string() != project_id {
            return Err(ServiceError::InternalError(
                "Task does not belong to the specified project".to_string(),
            ));
        }*/

        // 優先度更新
        task.priority = priority;

        // 更新日時を設定
        task.updated_at = Utc::now();

        // 保存
        repository.tasks.save(&task).await?;
    }

    Ok(())
}

#[tracing::instrument]
pub async fn search_tasks(request: &TaskSearchRequest) -> Result<(Vec<Task>, usize), ServiceError> {
    let repository = Repositories::new().await?;
    let mut tasks = repository.tasks.find_all().await?;

    // project_idでフィルタリング
    if let Some(project_id) = &request.project_id {
        if !project_id.trim().is_empty() {
            tasks = tasks
                .into_iter()
                // .filter(|task| task.project_id.to_string() == *project_id)
                .collect();
        }
    }

    // タイトルでフィルタリング
    if let Some(title) = &request.title {
        if !title.trim().is_empty() {
            let title_lower = title.to_lowercase();
            tasks = tasks
                .into_iter()
                .filter(|task| task.title.to_lowercase().contains(&title_lower))
                .collect();
        }
    }

    // ステータスでフィルタリング
    if let Some(status) = &request.status {
        tasks = tasks
            .into_iter()
            .filter(|task| &task.status == status)
            .collect();
    }

    // 担当者でフィルタリング
    if let Some(assignee_id) = &request.assignee_id {
        if !assignee_id.trim().is_empty() {
            tasks = tasks
                .into_iter()
                .filter(|task| {
                    task.assigned_user_ids
                        .iter()
                        .any(|id| id.to_string() == *assignee_id)
                })
                .collect();
        }
    }

    // 優先度でフィルタリング
    if let Some(priority_min) = request.priority_min {
        tasks = tasks
            .into_iter()
            .filter(|task| task.priority >= priority_min)
            .collect();
    }

    if let Some(priority_max) = request.priority_max {
        tasks = tasks
            .into_iter()
            .filter(|task| task.priority <= priority_max)
            .collect();
    }

    let total_count = tasks.len();
    let offset = request.offset.unwrap_or(0);
    let limit = request.limit.unwrap_or(50);

    let paginated_tasks = tasks.into_iter().skip(offset).take(limit).collect();

    Ok((paginated_tasks, total_count))
}
